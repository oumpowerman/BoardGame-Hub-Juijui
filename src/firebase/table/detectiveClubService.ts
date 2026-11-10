import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import {
  db,
  ensureAuthUser,
  handleFirestoreError,
  OperationType,
} from '../config';
import { FirestoreRoom, FirestorePlayer, PlayerRoleCard } from './types';
import {
  ensureMinimumPlayersWithBots,
  isAutoControlledSeat,
} from './roomHelpers';
import { recordGameEloUpdates } from './leaderboardService';

/**
 * Helper: Build turn order starting with the Active Player (Informer) at index 0,
 * followed by the remaining players in a randomized table order.
 */
function buildDetectiveTurnOrder(
  players: FirestorePlayer[],
  activePlayerId: string
): string[] {
  const others = players
    .filter((p) => p.id !== activePlayerId)
    .map((p) => p.id)
    .sort(() => Math.random() - 0.5);
  return [activePlayerId, ...others];
}

/**
 * Helper: Auto-advance through any bot/auto-controlled seats in dcTurnOrderIds
 * so human players never get stuck waiting for a bot to place a physical card.
 */
function resolveNextHumanCardTurn(
  turnOrderIds: string[],
  initialPlacedIds: string[],
  players: FirestorePlayer[],
  actorUid: string
): { placedIds: string[]; nextTurnIndex: number; allPlaced: boolean } {
  const placedSet = new Set(initialPlacedIds);

  let nextIdx = turnOrderIds.findIndex((id) => !placedSet.has(id));
  while (nextIdx !== -1 && nextIdx < turnOrderIds.length) {
    const candidateId = turnOrderIds[nextIdx];
    const candidatePlayer = players.find((p) => p.id === candidateId);
    if (
      candidatePlayer &&
      candidateId !== actorUid &&
      isAutoControlledSeat(candidatePlayer, actorUid)
    ) {
      placedSet.add(candidateId);
      nextIdx = turnOrderIds.findIndex((id) => !placedSet.has(id));
    } else {
      break;
    }
  }

  const placedIds = Array.from(placedSet);
  const allPlaced =
    turnOrderIds.length > 0 && turnOrderIds.every((id) => placedSet.has(id));

  return {
    placedIds,
    nextTurnIndex: allPlaced ? turnOrderIds.length - 1 : Math.max(0, nextIdx),
    allPlaced,
  };
}

/**
 * STEP 1: Start Detective Club Game
 * - Ensures minimum 4 players (fills with bots if needed)
 * - Elects Active Player (prioritizing human players so they can type the secret word)
 * - Elects 1 Conspirator secretly from the remaining players
 * - Designates remaining players as Detectives
 * - Builds turn order with Active Player first
 * - Advances room status to 'dc_word_entry'
 */
export async function startDetectiveClubGame(
  roomId: string,
  discussionDurationSeconds: number = 90
): Promise<void> {
  const user = await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');

    const players = await ensureMinimumPlayersWithBots(roomId, 4);

    // Prioritize human players for Active Player so a real person sets the secret word
    const humanPlayers = players.filter(
      (p) => !isAutoControlledSeat(p, user.uid)
    );
    const activePool = humanPlayers.length > 0 ? humanPlayers : players;
    const shuffledActivePool = [...activePool].sort(() => Math.random() - 0.5);
    const activePlayer = shuffledActivePool[0];

    const otherPlayers = players.filter((p) => p.id !== activePlayer.id);
    const conspirator =
      otherPlayers[Math.floor(Math.random() * otherPlayers.length)];

    const turnOrderIds = buildDetectiveTurnOrder(players, activePlayer.id);

    const batch = writeBatch(db);

    batch.update(roomRef, {
      status: 'dc_word_entry',
      dcActivePlayerId: activePlayer.id,
      dcConspiratorId: conspirator.id,
      dcSecretWord: '',
      dcRoundNumber: 1,
      dcCardRound: 1,
      dcTurnOrderIds: turnOrderIds,
      dcTurnIndex: 0,
      dcCardPlacedPlayerIds: [],
      dcSpeakerIndex: 0,
      dcDiscussionDurationSeconds: discussionDurationSeconds,
      dcVotes: {},
      winnerTeam: 'in_progress',
      updatedAt: new Date().toISOString(),
    });

    for (const p of players) {
      const playerRef = doc(db, 'rooms', roomId, 'players', p.id);
      let role: PlayerRoleCard = 'dc_detective';
      if (p.id === activePlayer.id) role = 'dc_active_player';
      else if (p.id === conspirator.id) role = 'dc_conspirator';

      batch.update(playerRef, {
        role,
        dcNotebookWord: '',
        dcVoteTargetId: '',
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

/**
 * STEP 2: Active Player Submits Secret Word & Places 1st Physical Card on Table
 * - Delivers secret word to Detectives and Active Player
 * - Delivers blank notebook ('') to Conspirator
 * - Marks Active Player as having placed Card #1 (since they place it while setting the word)
 * - Auto-advances any bot seats and sets turn to the next player for Card Round 1
 * - Transitions room status to 'dc_card_rounds'
 */
export async function submitDetectiveClubSecretWord(
  roomId: string,
  secretWord: string
): Promise<void> {
  const user = await ensureAuthUser();
  const cleanWord = secretWord.trim();
  if (!cleanWord) throw new Error('กรุณาระบุคำศัพท์ลับ');

  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');
    const room = roomSnap.data() as FirestoreRoom;

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const players = playersSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as FirestorePlayer[];

    const activePlayerId = room.dcActivePlayerId || user.uid;
    const turnOrderIds =
      room.dcTurnOrderIds && room.dcTurnOrderIds.length > 0
        ? room.dcTurnOrderIds
        : buildDetectiveTurnOrder(players, activePlayerId);

    // Informer places their 1st card face-up when submitting the word
    const { placedIds, nextTurnIndex } = resolveNextHumanCardTurn(
      turnOrderIds,
      [activePlayerId],
      players,
      user.uid
    );

    const batch = writeBatch(db);

    batch.update(roomRef, {
      dcSecretWord: cleanWord,
      status: 'dc_card_rounds',
      dcCardRound: 1,
      dcTurnOrderIds: turnOrderIds,
      dcCardPlacedPlayerIds: placedIds,
      dcTurnIndex: nextTurnIndex,
      updatedAt: new Date().toISOString(),
    });

    // Distribute digital notebooks:
    // Detectives see word, Conspirator receives empty string (blank page)
    for (const docSnap of playersSnap.docs) {
      const isConspirator = docSnap.id === room.dcConspiratorId;
      batch.update(docSnap.ref, {
        dcNotebookWord: isConspirator ? '' : cleanWord,
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

/**
 * STEP 3A: Player Confirms Placing Their Physical Card on the Table
 * - Adds playerId to dcCardPlacedPlayerIds
 * - Auto-fills any subsequent bot seats
 * - If all players have placed their card for Round 1 -> automatically advances to Card Round 2 (starting at Informer #1)
 * - If all players have placed their card for Round 2 -> automatically transitions to Discussion ('dc_discussion')
 */
export async function confirmDetectiveClubCardPlaced(
  roomId: string,
  playerId: string
): Promise<void> {
  const user = await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');
    const room = roomSnap.data() as FirestoreRoom;

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const players = playersSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as FirestorePlayer[];

    const activePlayerId = room.dcActivePlayerId || '';
    const turnOrderIds =
      room.dcTurnOrderIds && room.dcTurnOrderIds.length > 0
        ? room.dcTurnOrderIds
        : buildDetectiveTurnOrder(players, activePlayerId);

    const currentPlaced = room.dcCardPlacedPlayerIds || [];
    const updatedPlaced = currentPlaced.includes(playerId)
      ? currentPlaced
      : [...currentPlaced, playerId];

    const { placedIds, nextTurnIndex, allPlaced } = resolveNextHumanCardTurn(
      turnOrderIds,
      updatedPlaced,
      players,
      user.uid
    );

    const cardRound = room.dcCardRound || 1;

    if (!allPlaced) {
      await updateDoc(roomRef, {
        dcCardPlacedPlayerIds: placedIds,
        dcTurnIndex: nextTurnIndex,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    // All players have placed their card for the current round!
    if (cardRound === 1) {
      // Move to Card Round 2, starting back at index 0 (Active Player / Informer)
      await updateDoc(roomRef, {
        dcCardRound: 2,
        dcCardPlacedPlayerIds: [],
        dcTurnIndex: 0,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Both Card Rounds 1 and 2 are complete -> Move to Discussion & Explanation Phase
      await updateDoc(roomRef, {
        status: 'dc_discussion',
        dcSpeakerIndex: 0,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

/**
 * STEP 3B: Host / Informer Manual Override to Advance Card Placement Round
 * - From Card Round 1 -> Card Round 2
 * - From Card Round 2 -> Discussion & Explanation Phase ('dc_discussion')
 */
export async function advanceDetectiveClubCardRound(
  roomId: string,
  targetRound: 2 | 'discussion'
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    if (targetRound === 2) {
      await updateDoc(roomRef, {
        dcCardRound: 2,
        dcCardPlacedPlayerIds: [],
        dcTurnIndex: 0,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await updateDoc(roomRef, {
        status: 'dc_discussion',
        dcSpeakerIndex: 0,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

/**
 * STEP 3C: Advance Explanation Speaker in Discussion Phase
 */
export async function advanceDetectiveClubSpeaker(
  roomId: string,
  nextSpeakerIndex: number
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    await updateDoc(roomRef, {
      dcSpeakerIndex: nextSpeakerIndex,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

/**
 * STEP 4: Start Voting Phase
 * - Advances room status to 'dc_voting'
 */
export async function startDetectiveClubVoting(roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    await updateDoc(roomRef, {
      status: 'dc_voting',
      dcVotes: {},
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

/**
 * STEP 5: Cast Secret Accusation Vote
 * - Records vote in room's dcVotes map
 * - Automatically generates votes for any Bot / Auto-controlled seats
 * - When all non-active players have voted, tallies scores, updates ELO leaderboard, and completes round
 */
export async function submitDetectiveClubVote(
  roomId: string,
  voterId: string,
  targetId: string
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');
    const room = roomSnap.data() as FirestoreRoom;

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const players = playersSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as FirestorePlayer[];

    const votes: Record<string, string> = {
      ...(room.dcVotes || {}),
      [voterId]: targetId,
    };

    const voterDoc = doc(db, 'rooms', roomId, 'players', voterId);
    await updateDoc(voterDoc, {
      dcVoteTargetId: targetId,
    });

    const requiredVoters = players.filter(
      (p) => p.id !== room.dcActivePlayerId
    );
    const conspiratorId = room.dcConspiratorId || '';

    // Auto-fill votes for any bot / auto-controlled seats that haven't voted yet
    for (const voter of requiredVoters) {
      if (!votes[voter.id] && isAutoControlledSeat(voter, voterId)) {
        const candidates = players.filter(
          (c) => c.id !== room.dcActivePlayerId && c.id !== voter.id
        );
        if (candidates.length > 0) {
          // If bot is a detective, 55% chance to spot the conspirator; otherwise random candidate
          const canVoteConspirator = candidates.some(
            (c) => c.id === conspiratorId
          );
          const pickConspirator =
            voter.id !== conspiratorId &&
            canVoteConspirator &&
            Math.random() < 0.55;
          const chosenId = pickConspirator
            ? conspiratorId
            : candidates[Math.floor(Math.random() * candidates.length)].id;
          votes[voter.id] = chosenId;
        }
      }
    }

    const allVoted = requiredVoters.every((p) => Boolean(votes[p.id]));

    if (!allVoted) {
      await updateDoc(roomRef, {
        dcVotes: votes,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    // Tally votes against Conspirator (from Detectives)
    const conspiratorPlayer = players.find((p) => p.id === conspiratorId);
    let votesForConspirator = 0;

    for (const v of requiredVoters) {
      if (v.id !== conspiratorId && votes[v.id] === conspiratorId) {
        votesForConspirator += 1;
      }
    }

    // Official Detective Club Rulebook (IGAMES / Blue Orange Games):
    // 1. Every Detective who voted for the Conspirator ALWAYS scores +3 VP.
    // 2. If 0 or 1 Detective voted for the Conspirator (votesForConspirator <= 1):
    //    - The Conspirator successfully bluffed!
    //    - Conspirator scores +5 VP
    //    - Active Player (Informer) scores +4 VP
    // 3. If 2 or more Detectives voted for the Conspirator (votesForConspirator >= 2):
    //    - The Conspirator is caught!
    //    - Conspirator scores 0 VP
    //    - Active Player (Informer) scores 0 VP
    const conspiratorCaught = votesForConspirator >= 2;

    const currentScores: Record<string, number> = { ...(room.dcScores || {}) };
    const roundPoints: Record<string, number> = {};
    const winningPlayerIds: string[] = [];

    // Rule 1: Every Detective who correctly voted for the Conspirator ALWAYS gets +3 VP
    for (const v of requiredVoters) {
      if (v.id === conspiratorId) continue;
      if (votes[v.id] === conspiratorId) {
        roundPoints[v.id] = 3;
        currentScores[v.id] = (currentScores[v.id] || 0) + 3;
        winningPlayerIds.push(v.id);
      } else {
        roundPoints[v.id] = 0;
        currentScores[v.id] = currentScores[v.id] || 0;
      }
    }

    if (conspiratorCaught) {
      // Rule 3: 2 or more Detectives caught the Conspirator -> Conspirator & Active Player get 0 VP
      roundPoints[conspiratorId] = 0;
      currentScores[conspiratorId] = currentScores[conspiratorId] || 0;

      if (room.dcActivePlayerId) {
        roundPoints[room.dcActivePlayerId] = 0;
        currentScores[room.dcActivePlayerId] =
          currentScores[room.dcActivePlayerId] || 0;
      }
    } else {
      // Rule 2: 0 or 1 Detective voted for the Conspirator -> Conspirator (+5 VP) & Active Player (+4 VP)
      roundPoints[conspiratorId] = 5;
      currentScores[conspiratorId] = (currentScores[conspiratorId] || 0) + 5;
      winningPlayerIds.push(conspiratorId);

      if (room.dcActivePlayerId) {
        roundPoints[room.dcActivePlayerId] = 4;
        currentScores[room.dcActivePlayerId] =
          (currentScores[room.dcActivePlayerId] || 0) + 4;
        winningPlayerIds.push(room.dcActivePlayerId);
      }
    }

    const batch = writeBatch(db);

    batch.update(roomRef, {
      dcVotes: votes,
      status: 'dc_scoring',
      winnerTeam: conspiratorCaught ? 'detectives' : 'conspirator',
      dcScores: currentScores,
      dcRoundSummary: {
        caught: conspiratorCaught,
        conspiratorName: conspiratorPlayer?.name || 'คนสมรู้ร่วมคิด',
        secretWord: room.dcSecretWord || '',
        pointsAwarded: roundPoints,
      },
      updatedAt: new Date().toISOString(),
    });

    for (const p of players) {
      const pRef = doc(db, 'rooms', roomId, 'players', p.id);
      batch.update(pRef, {
        dcVoteTargetId: votes[p.id] || '',
        dcTotalScore: currentScores[p.id] || 0,
      });
    }

    await batch.commit();

    // Update persistent Leaderboard ELO in Firestore
    await recordGameEloUpdates(
      players,
      'สมาคมนักสืบ (Detective Club)',
      (player) => winningPlayerIds.includes(player.id)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

/**
 * STEP 6: Rematch / Next Round of Detective Club
 * Rotates Active Player to the next human player in order and increments dcRoundNumber
 */
export async function rematchDetectiveClubGame(roomId: string): Promise<void> {
  const user = await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');
    const room = roomSnap.data() as FirestoreRoom;

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const players = playersSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as FirestorePlayer[];

    const humanPlayers = players.filter(
      (p) => !isAutoControlledSeat(p, user.uid)
    );
    const activePool = humanPlayers.length > 0 ? humanPlayers : players;
    const currentIndex = activePool.findIndex(
      (p) => p.id === room.dcActivePlayerId
    );
    const nextActiveIndex = (currentIndex + 1) % activePool.length;
    const nextActivePlayer = activePool[nextActiveIndex];

    const otherPlayers = players.filter((p) => p.id !== nextActivePlayer.id);
    const nextConspirator =
      otherPlayers[Math.floor(Math.random() * otherPlayers.length)];

    const turnOrderIds = buildDetectiveTurnOrder(players, nextActivePlayer.id);

    const batch = writeBatch(db);

    batch.update(roomRef, {
      status: 'dc_word_entry',
      dcActivePlayerId: nextActivePlayer.id,
      dcConspiratorId: nextConspirator.id,
      dcSecretWord: '',
      dcRoundNumber: (room.dcRoundNumber || 1) + 1,
      dcCardRound: 1,
      dcTurnOrderIds: turnOrderIds,
      dcTurnIndex: 0,
      dcCardPlacedPlayerIds: [],
      dcSpeakerIndex: 0,
      dcVotes: {},
      winnerTeam: 'in_progress',
      updatedAt: new Date().toISOString(),
    });

    for (const p of players) {
      const playerRef = doc(db, 'rooms', roomId, 'players', p.id);
      let role: PlayerRoleCard = 'dc_detective';
      if (p.id === nextActivePlayer.id) role = 'dc_active_player';
      else if (p.id === nextConspirator.id) role = 'dc_conspirator';

      batch.update(playerRef, {
        role,
        dcNotebookWord: '',
        dcVoteTargetId: '',
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}
