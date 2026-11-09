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
import { AVALON_QUEST_MATRIX } from '../../data/avalonRules';
import { recordGameEloUpdates } from './leaderboardService';

export interface AvalonSettingsPayload {
  targetPlayers?: number;
  roleMode?: 'auto' | 'manual';
  enableMerlin?: boolean;
  enableAssassin?: boolean;
  enablePercival?: boolean;
  enableMorgana?: boolean;
  enableMordred?: boolean;
  enableOberon?: boolean;
}

/**
 * A-1. Update Lobby Configuration
 */
export async function updateAvalonLobbySettings(
  roomId: string,
  settings: AvalonSettingsPayload
): Promise<void> {
  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (settings.targetPlayers !== undefined) updateData.avalonTargetPlayers = settings.targetPlayers;
    if (settings.roleMode !== undefined) updateData.avalonRoleMode = settings.roleMode;
    if (settings.enableMerlin !== undefined) updateData.avalonEnableMerlin = settings.enableMerlin;
    if (settings.enableAssassin !== undefined) updateData.avalonEnableAssassin = settings.enableAssassin;
    if (settings.enablePercival !== undefined) updateData.avalonEnablePercival = settings.enablePercival;
    if (settings.enableMorgana !== undefined) updateData.avalonEnableMorgana = settings.enableMorgana;
    if (settings.enableMordred !== undefined) updateData.avalonEnableMordred = settings.enableMordred;
    if (settings.enableOberon !== undefined) updateData.avalonEnableOberon = settings.enableOberon;

    await updateDoc(doc(db, 'rooms', roomId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

/**
 * A-1.5. Set or claim manual role for a player
 */
export async function setPlayerAvalonRole(
  roomId: string,
  playerId: string,
  role: PlayerRoleCard
): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId, 'players', playerId), {
      role,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}/players/${playerId}`);
  }
}

/**
 * A-2. Start Avalon Game & Assign Secret Roles (supports auto & manual modes)
 */
export async function startAvalonGame(roomId: string): Promise<void> {
  const user = await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');
    const room = roomSnap.data() as FirestoreRoom;

    // Minimum 5 players, maximum 10
    const players = await ensureMinimumPlayersWithBots(roomId, 5);
    const totalPlayers = Math.min(10, players.length);
    const matrix = AVALON_QUEST_MATRIX[totalPlayers] || AVALON_QUEST_MATRIX[5];

    const roleMode = room.avalonRoleMode || 'auto';
    const enableMerlin = room.avalonEnableMerlin ?? true;
    const enableAssassin = room.avalonEnableAssassin ?? true;
    const enablePercival = room.avalonEnablePercival ?? true;
    const enableMorgana = room.avalonEnableMorgana ?? true;
    const enableMordred = room.avalonEnableMordred ?? false;
    const enableOberon = room.avalonEnableOberon ?? false;

    // Build Good and Evil role pools
    const goodPool: PlayerRoleCard[] = [];
    if (enableMerlin) goodPool.push('avalon_merlin');
    if (enablePercival && goodPool.length < matrix.goodCount) {
      goodPool.push('avalon_percival');
    }
    while (goodPool.length < matrix.goodCount) {
      goodPool.push('avalon_loyal_servant');
    }

    const evilPool: PlayerRoleCard[] = [];
    if (enableAssassin) evilPool.push('avalon_assassin');
    if (enableMorgana && evilPool.length < matrix.evilCount) {
      evilPool.push('avalon_morgana');
    }
    if (enableMordred && evilPool.length < matrix.evilCount) {
      evilPool.push('avalon_mordred');
    }
    if (enableOberon && evilPool.length < matrix.evilCount) {
      evilPool.push('avalon_oberon');
    }
    while (evilPool.length < matrix.evilCount) {
      evilPool.push('avalon_minion');
    }

    const combinedRoles = [...goodPool, ...evilPool];
    // Fisher-Yates shuffle
    for (let i = combinedRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combinedRoles[i], combinedRoles[j]] = [combinedRoles[j], combinedRoles[i]];
    }

    // Pick starting leader (rotate to a human player if available)
    const humanPlayers = players.filter((p) => !isAutoControlledSeat(p, user.uid));
    const leaderPool = humanPlayers.length > 0 ? humanPlayers : players;
    const startingLeader = leaderPool[Math.floor(Math.random() * leaderPool.length)];

    const batch = writeBatch(db);

    batch.update(roomRef, {
      status: 'avalon_role_reveal',
      avalonLeaderId: startingLeader.id,
      avalonCurrentQuestIndex: 0,
      avalonProposedTeamIds: [],
      avalonTeamVotes: {},
      avalonRejectedTeamsCount: 0,
      avalonQuestVotes: {},
      avalonQuestResults: [],
      avalonGoodWinsCount: 0,
      avalonEvilWinsCount: 0,
      avalonAssassinationTargetId: '',
      avalonAssassinationSuccess: false,
      winnerTeam: 'in_progress',
      updatedAt: new Date().toISOString(),
    });

    for (let i = 0; i < players.length; i++) {
      const playerRef = doc(db, 'rooms', roomId, 'players', players[i].id);
      const isBot = isAutoControlledSeat(players[i], user.uid);
      // In auto mode, assign randomly to everyone.
      // In manual mode, assign bot roles automatically from pool so humans can pick their real card.
      const assignedRole = roleMode === 'auto' || isBot ? combinedRoles[i] : (players[i].role || combinedRoles[i]);

      batch.update(playerRef, {
        role: assignedRole,
        avalonTeamVoteChoice: '',
        avalonQuestVoteChoice: '',
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

/**
 * A-3. Confirm Role Revealed & Proceed to Team Selection
 */
export async function confirmRoleRevealedAndStartTeamSelection(
  roomId: string
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    await updateDoc(roomRef, {
      status: 'avalon_team_selection',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

/**
 * A-4. Leader Proposes Quest Team
 */
export async function proposeAvalonTeam(
  roomId: string,
  proposedTeamIds: string[]
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    await updateDoc(roomRef, {
      avalonProposedTeamIds: proposedTeamIds,
      avalonTeamVotes: {},
      status: 'avalon_team_vote',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

/**
 * A-5. Cast Vote on Proposed Team (Approve / Reject)
 */
export async function submitAvalonTeamVote(
  roomId: string,
  voterId: string,
  choice: 'approve' | 'reject'
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');
    const room = roomSnap.data() as FirestoreRoom;

    const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    const players = playersSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as FirestorePlayer[];

    const votes: Record<string, 'approve' | 'reject'> = {
      ...(room.avalonTeamVotes || {}),
      [voterId]: choice,
    };

    // Update voter's player doc
    await updateDoc(doc(db, 'rooms', roomId, 'players', voterId), {
      avalonTeamVoteChoice: choice,
    });

    // Auto-fill votes for practice bots / auto-controlled seats
    for (const p of players) {
      if (!votes[p.id] && isAutoControlledSeat(p, voterId)) {
        // Bots have an 80% chance to approve teams
        const botChoice: 'approve' | 'reject' = Math.random() < 0.8 ? 'approve' : 'reject';
        votes[p.id] = botChoice;
        await updateDoc(doc(db, 'rooms', roomId, 'players', p.id), {
          avalonTeamVoteChoice: botChoice,
        });
      }
    }

    const allVoted = players.every((p) => Boolean(votes[p.id]));

    if (!allVoted) {
      await updateDoc(roomRef, {
        avalonTeamVotes: votes,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    // All voted: Count approves vs rejects
    let approves = 0;
    let rejects = 0;
    Object.values(votes).forEach((v) => {
      if (v === 'approve') approves += 1;
      else if (v === 'reject') rejects += 1;
    });

    const isApproved = approves > rejects; // Strict majority approve
    const currentLeaderIndex = players.findIndex((p) => p.id === room.avalonLeaderId);
    const nextLeaderIndex = (currentLeaderIndex + 1) % players.length;
    const nextLeader = players[nextLeaderIndex];

    if (isApproved) {
      // Team Approved! Proceed to Quest Voting
      await updateDoc(roomRef, {
        avalonTeamVotes: votes,
        avalonRejectedTeamsCount: 0,
        avalonQuestVotes: {},
        status: 'avalon_quest_vote',
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Team Rejected!
      const nextRejectCount = (room.avalonRejectedTeamsCount || 0) + 1;
      if (nextRejectCount >= 5) {
        // 5 consecutive team rejections = Evil wins immediately!
        await updateDoc(roomRef, {
          avalonTeamVotes: votes,
          avalonRejectedTeamsCount: 5,
          status: 'avalon_scoring',
          winnerTeam: 'evil',
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Pass Leader to next player
        await updateDoc(roomRef, {
          avalonTeamVotes: votes,
          avalonRejectedTeamsCount: nextRejectCount,
          avalonLeaderId: nextLeader.id,
          avalonProposedTeamIds: [],
          status: 'avalon_team_selection',
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

/**
 * A-6. Selected Team Members Cast Secret Quest Cards (Success / Fail)
 */
export async function submitAvalonQuestVote(
  roomId: string,
  voterId: string,
  choice: 'success' | 'fail'
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');
    const room = roomSnap.data() as FirestoreRoom;

    const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    const players = playersSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as FirestorePlayer[];

    const teamIds = room.avalonProposedTeamIds || [];
    const teamMembers = players.filter((p) => teamIds.includes(p.id));

    // Enforce rule: Good players CANNOT vote Fail!
    const voter = players.find((p) => p.id === voterId);
    let enforcedChoice = choice;
    if (voter && !voter.role?.startsWith('avalon_minion') && voter.role !== 'avalon_assassin' && voter.role !== 'avalon_morgana' && voter.role !== 'avalon_mordred' && voter.role !== 'avalon_oberon') {
      enforcedChoice = 'success';
    }

    const questVotes: Record<string, 'success' | 'fail'> = {
      ...(room.avalonQuestVotes || {}),
      [voterId]: enforcedChoice,
    };

    await updateDoc(doc(db, 'rooms', roomId, 'players', voterId), {
      avalonQuestVoteChoice: enforcedChoice,
    });

    // Auto-vote for practice bots in the quest team
    for (const member of teamMembers) {
      if (!questVotes[member.id] && isAutoControlledSeat(member, voterId)) {
        const isEvil =
          member.role === 'avalon_assassin' ||
          member.role === 'avalon_morgana' ||
          member.role === 'avalon_mordred' ||
          member.role === 'avalon_oberon' ||
          member.role === 'avalon_minion';
        // Evil bot has an 85% chance to vote 'fail'
        const botQuestChoice: 'success' | 'fail' = isEvil && Math.random() < 0.85 ? 'fail' : 'success';
        questVotes[member.id] = botQuestChoice;
        await updateDoc(doc(db, 'rooms', roomId, 'players', member.id), {
          avalonQuestVoteChoice: botQuestChoice,
        });
      }
    }

    const allTeamVoted = teamMembers.every((m) => Boolean(questVotes[m.id]));

    if (!allTeamVoted) {
      await updateDoc(roomRef, {
        avalonQuestVotes: questVotes,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    // Tally secret quest results
    let successCount = 0;
    let failCount = 0;
    Object.values(questVotes).forEach((val) => {
      if (val === 'success') successCount += 1;
      else if (val === 'fail') failCount += 1;
    });

    const totalPlayers = Math.min(10, players.length);
    const matrix = AVALON_QUEST_MATRIX[totalPlayers] || AVALON_QUEST_MATRIX[5];
    const questIdx = room.avalonCurrentQuestIndex || 0;
    const reqFails = matrix.quests[questIdx]?.requiredFails || 1;

    const questPassed = failCount < reqFails;

    const prevResults = room.avalonQuestResults || [];
    const newResults = [
      ...prevResults,
      {
        questIndex: questIdx,
        teamSize: teamMembers.length,
        successCount,
        failCount,
        passed: questPassed,
      },
    ];

    const goodWins = (room.avalonGoodWinsCount || 0) + (questPassed ? 1 : 0);
    const evilWins = (room.avalonEvilWinsCount || 0) + (!questPassed ? 1 : 0);

    const currentLeaderIndex = players.findIndex((p) => p.id === room.avalonLeaderId);
    const nextLeaderIndex = (currentLeaderIndex + 1) % players.length;
    const nextLeader = players[nextLeaderIndex];

    if (goodWins >= 3) {
      // Good reached 3 Quests! Transition to Assassination Phase
      await updateDoc(roomRef, {
        avalonQuestVotes: questVotes,
        avalonQuestResults: newResults,
        avalonGoodWinsCount: goodWins,
        avalonEvilWinsCount: evilWins,
        status: 'avalon_assassination',
        updatedAt: new Date().toISOString(),
      });
    } else if (evilWins >= 3) {
      // Evil reached 3 Fails! Evil wins game
      await updateDoc(roomRef, {
        avalonQuestVotes: questVotes,
        avalonQuestResults: newResults,
        avalonGoodWinsCount: goodWins,
        avalonEvilWinsCount: evilWins,
        status: 'avalon_scoring',
        winnerTeam: 'evil',
        updatedAt: new Date().toISOString(),
      });

      // Update ELO rankings
      const winningIds = players
        .filter(
          (p) =>
            p.role === 'avalon_assassin' ||
            p.role === 'avalon_morgana' ||
            p.role === 'avalon_mordred' ||
            p.role === 'avalon_oberon' ||
            p.role === 'avalon_minion'
        )
        .map((p) => p.id);
      await recordGameEloUpdates(players, 'ศึกอัศวินโต๊ะกลม (Avalon)', (p) =>
        winningIds.includes(p.id)
      );
    } else {
      // Continue to next Quest
      await updateDoc(roomRef, {
        avalonQuestVotes: questVotes,
        avalonQuestResults: newResults,
        avalonGoodWinsCount: goodWins,
        avalonEvilWinsCount: evilWins,
        avalonCurrentQuestIndex: questIdx + 1,
        avalonLeaderId: nextLeader.id,
        avalonProposedTeamIds: [],
        avalonRejectedTeamsCount: 0,
        status: 'avalon_team_selection',
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

/**
 * A-7. Assassin Attempts to Assassinate Merlin
 */
export async function submitAvalonAssassination(
  roomId: string,
  targetPlayerId: string
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');

    const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    const players = playersSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as FirestorePlayer[];

    const targetPlayer = players.find((p) => p.id === targetPlayerId);
    const isMerlin = targetPlayer?.role === 'avalon_merlin';

    const winnerTeam: 'good' | 'evil' = isMerlin ? 'evil' : 'good';

    await updateDoc(roomRef, {
      avalonAssassinationTargetId: targetPlayerId,
      avalonAssassinationSuccess: isMerlin,
      winnerTeam,
      status: 'avalon_scoring',
      updatedAt: new Date().toISOString(),
    });

    const winningIds = players
      .filter((p) => {
        if (winnerTeam === 'good') {
          return (
            p.role === 'avalon_merlin' ||
            p.role === 'avalon_percival' ||
            p.role === 'avalon_loyal_servant'
          );
        }
        return (
          p.role === 'avalon_assassin' ||
          p.role === 'avalon_morgana' ||
          p.role === 'avalon_mordred' ||
          p.role === 'avalon_oberon' ||
          p.role === 'avalon_minion'
        );
      })
      .map((p) => p.id);

    await recordGameEloUpdates(players, 'ศึกอัศวินโต๊ะกลม (Avalon)', (p) =>
      winningIds.includes(p.id)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

/**
 * A-8. Rematch / Restart Avalon
 */
export async function rematchAvalonGame(roomId: string): Promise<void> {
  await startAvalonGame(roomId);
}
