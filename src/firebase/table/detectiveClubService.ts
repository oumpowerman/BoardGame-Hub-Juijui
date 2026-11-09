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
 * STEP 1: Start Detective Club Game
 * - Ensures minimum 4 players (fills with bots if needed)
 * - Elects Active Player (prioritizing human players so they can type the secret word)
 * - Elects 1 Conspirator secretly from the remaining players
 * - Designates remaining players as Detectives
 * - Advances room status to 'dc_word_entry'
 */
export async function startDetectiveClubGame(roomId: string): Promise<void> {
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

    const batch = writeBatch(db);

    batch.update(roomRef, {
      status: 'dc_word_entry',
      dcActivePlayerId: activePlayer.id,
      dcConspiratorId: conspirator.id,
      dcSecretWord: '',
      dcCardRound: 1,
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
 * STEP 2: Active Player Submits Secret Word
 * - Delivers secret word to Detectives and Active Player
 * - Delivers blank notebook ('') to Conspirator
 * - Transitions room status to 'dc_card_rounds'
 */
export async function submitDetectiveClubSecretWord(
  roomId: string,
  secretWord: string
): Promise<void> {
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
    const batch = writeBatch(db);

    batch.update(roomRef, {
      dcSecretWord: cleanWord,
      status: 'dc_card_rounds',
      dcCardRound: 1,
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
 * STEP 3: Advance Card Placement Rounds on Physical Table
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
        updatedAt: new Date().toISOString(),
      });
    } else {
      await updateDoc(roomRef, {
        status: 'dc_discussion',
        updatedAt: new Date().toISOString(),
      });
    }
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
 * Rotates Active Player to the next human player in order
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

    const batch = writeBatch(db);

    batch.update(roomRef, {
      status: 'dc_word_entry',
      dcActivePlayerId: nextActivePlayer.id,
      dcConspiratorId: nextConspirator.id,
      dcSecretWord: '',
      dcCardRound: 1,
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
