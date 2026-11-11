import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
  ensureAuthUser,
} from '../config';
import {
  drawRandomDyingMessageCards,
  DyingMessageEvidenceCategory,
  DyingMessageEvidenceCard,
} from '../../data/dyingMessageCards';
import {
  FirestoreRoom,
  FirestorePlayer,
  PlayerRoleCard,
  DyingMessageEvidenceRound,
} from './types';
import {
  ensureMinimumPlayersWithBots,
  isAutoControlledSeat,
} from './roomHelpers';
import { recordGameEloUpdates } from './leaderboardService';

// DM-0. Register or Toggle iPad Central Evidence Board Mode
export async function registerDyingMessageIpadBoard(
  roomId: string,
  connected: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      dmIpadConnected: connected,
      dmIpadLastSeen: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// DM-1. Update Lobby Settings (Evidence Category, Special Roles, Debate Duration)
export async function updateDyingMessageLobbySettings(
  roomId: string,
  settings: {
    dmCategory?: DyingMessageEvidenceCategory;
    dmEnableDetective?: boolean;
    dmEnableDoctor?: boolean;
    dmEnableAccomplice?: boolean;
    dmDebateDurationSeconds?: number;
  }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      ...settings,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// DM-2. Start Game & Deal Secret Roles (Killer, Accomplice, Detective, Doctor, Civilians)
export async function startDyingMessageGame(roomId: string): Promise<void> {
  const user = await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    const roomData = roomSnap.data() as FirestoreRoom | undefined;
    const players = await ensureMinimumPlayersWithBots(roomId, 5);

    const totalPlayers = players.length;
    const enableDetective = roomData?.dmEnableDetective ?? true;
    const enableDoctor = roomData?.dmEnableDoctor ?? true;
    const enableAccomplice =
      (roomData?.dmEnableAccomplice ?? true) && totalPlayers >= 6;

    // Shuffle indices for role assignment
    const indices = Array.from({ length: totalPlayers }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const roles: PlayerRoleCard[] = new Array(totalPlayers).fill('dm_civilian');
    let cursor = 0;

    const killerIdx = indices[cursor++];
    roles[killerIdx] = 'dm_killer';

    let accompliceIdx = -1;
    if (enableAccomplice && cursor < totalPlayers) {
      accompliceIdx = indices[cursor++];
      roles[accompliceIdx] = 'dm_accomplice';
    }

    let detectiveIdx = -1;
    if (enableDetective && cursor < totalPlayers) {
      detectiveIdx = indices[cursor++];
      roles[detectiveIdx] = 'dm_detective';
    }

    let doctorIdx = -1;
    if (enableDoctor && cursor < totalPlayers) {
      doctorIdx = indices[cursor++];
      roles[doctorIdx] = 'dm_doctor';
    }

    const killerPlayer = players[killerIdx];
    const accomplicePlayer =
      accompliceIdx >= 0 ? players[accompliceIdx] : undefined;
    const detectivePlayer =
      detectiveIdx >= 0 ? players[detectiveIdx] : undefined;
    const doctorPlayer = doctorIdx >= 0 ? players[doctorIdx] : undefined;

    for (let i = 0; i < totalPlayers; i++) {
      const p = players[i];
      const isBot = isAutoControlledSeat(p, user.uid);
      await updateDoc(doc(db, 'rooms', roomId, 'players', p.id), {
        role: roles[i],
        roleAcknowledged: isBot,
        dmIsAlive: true,
        dmCandidateCards: [],
        dmSelectedCardIds: [],
        dmInspectedTargetId: '',
        dmInspectedTargetName: '',
        dmInspectedIsKiller: false,
        voteTargetId: '',
      });
    }

    await updateDoc(roomRef, {
      status: 'dm_role_deal',
      dmRoundNumber: 1,
      dmKillerId: killerPlayer.id,
      dmKillerName: killerPlayer.name,
      dmAccompliceId: accomplicePlayer?.id || '',
      dmAccompliceName: accomplicePlayer?.name || '',
      dmDetectiveId: detectivePlayer?.id || '',
      dmDoctorId: doctorPlayer?.id || '',
      dmVictimId: '',
      dmVictimName: '',
      dmEvidenceRounds: [],
      dmDoctorSkillUsed: false,
      dmDetectiveSkillDoneRound: 0,
      dmLastEliminatedId: '',
      dmLastEliminatedName: '',
      winnerTeam: 'in_progress',
      accusedPlayerId: '',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// DM-3. Acknowledge Role & Auto-Advance to Night Kill Phase
export async function acknowledgeDyingMessageRole(
  roomId: string,
  playerId?: string
): Promise<void> {
  const user = await ensureAuthUser();
  const targetUid = playerId || user.uid;

  try {
    await updateDoc(doc(db, 'rooms', roomId, 'players', targetUid), {
      roleAcknowledged: true,
    });

    const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    const allPlayers = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
    const allAck = allPlayers.every((p) => Boolean(p.roleAcknowledged));

    if (allAck) {
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'dm_night_kill',
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// DM-4. Killer Selects Victim in Night 1 -> Deal Evidence Hands to Victim & Killer
export async function selectDyingMessageVictim(
  roomId: string,
  victimId: string
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const room = roomSnap.data() as FirestoreRoom;

    const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    const allPlayers = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
    const victim = allPlayers.find((p) => p.id === victimId);
    const killerId = room.dmKillerId;
    if (!victim || !killerId) return;

    const category = room.dmCategory || 'all';
    const usedIds = (room.dmEvidenceRounds || []).flatMap((r) => r.cardIds);

    // Draw 12 distinct cards: 6 for Victim (to pick 1 Real clue), 6 for Killer (to pick 2 Fake clues)
    const drawn12 = drawRandomDyingMessageCards(category, 12, usedIds);
    const victimHand = drawn12.slice(0, 6).map((c: DyingMessageEvidenceCard) => c.id);
    const killerHand = drawn12.slice(6, 12).map((c: DyingMessageEvidenceCard) => c.id);

    await updateDoc(doc(db, 'rooms', roomId, 'players', victim.id), {
      dmIsAlive: false,
      dmCandidateCards: victimHand,
      dmSelectedCardIds: [],
    });

    await updateDoc(doc(db, 'rooms', roomId, 'players', killerId), {
      dmCandidateCards: killerHand,
      dmSelectedCardIds: [],
    });

    await updateDoc(roomRef, {
      status: 'dm_victim_clue',
      dmVictimId: victim.id,
      dmVictimName: victim.name,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// Helper: Check if both Victim (1 card) and Killer (2 cards) have submitted clues
async function checkAndFinalizeNightEvidence(roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) return;
  const room = roomSnap.data() as FirestoreRoom;
  if (room.status !== 'dm_victim_clue') return;

  const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
  const allPlayers = playersSnap.docs.map((d) => d.data() as FirestorePlayer);

  const victim = allPlayers.find((p) => p.id === room.dmVictimId);
  const killer = allPlayers.find((p) => p.id === room.dmKillerId);

  const victimSelected = victim?.dmSelectedCardIds || [];
  const killerSelected = killer?.dmSelectedCardIds || [];

  if (victimSelected.length >= 1 && killerSelected.length >= 2) {
    const realCardId = victimSelected[0];
    const fakeCardIds = killerSelected.slice(0, 2);
    const combined = [realCardId, ...fakeCardIds];
    // Shuffle the 3 cards so no one knows which position is Real
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    const roundNum = room.dmRoundNumber || 1;
    const newEvidenceRound: DyingMessageEvidenceRound = {
      roundNumber: roundNum,
      victimId: victim?.id || '',
      victimName: victim?.name || 'ผู้ตาย',
      ...(victim?.avatarUrl ? { victimAvatar: victim.avatarUrl } : {}),
      cardIds: combined,
      realCardId,
      fakeCardIds,
    };

    const existingRounds = (room.dmEvidenceRounds || []).filter(
      (r) => r.roundNumber !== roundNum
    );
    const updatedRounds = [...existingRounds, newEvidenceRound];

    // Check if Detective is alive and hasn't inspected this round
    const detective = allPlayers.find(
      (p) => p.id === room.dmDetectiveId && p.dmIsAlive !== false
    );
    const nextPhase =
      detective && (room.dmDetectiveSkillDoneRound || 0) < roundNum
        ? 'dm_special_roles'
        : 'dm_day_discussion';

    await updateDoc(roomRef, {
      dmEvidenceRounds: updatedRounds,
      status: nextPhase,
      updatedAt: new Date().toISOString(),
    });
  }
}

// DM-5A. Victim Submits 1 Real Evidence Card
export async function submitVictimRealEvidenceCard(
  roomId: string,
  victimId: string,
  realCardId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId, 'players', victimId), {
      dmSelectedCardIds: [realCardId],
    });
    await checkAndFinalizeNightEvidence(roomId);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// DM-5B. Killer Submits 2 Fake Evidence Cards
export async function submitKillerFakeEvidenceCards(
  roomId: string,
  killerId: string,
  fakeCardIds: string[]
): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId, 'players', killerId), {
      dmSelectedCardIds: fakeCardIds.slice(0, 2),
    });
    await checkAndFinalizeNightEvidence(roomId);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// DM-6. Detective Night Inspection Action
export async function submitDetectiveInspection(
  roomId: string,
  detectiveId: string,
  targetPlayerId: string
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const room = roomSnap.data() as FirestoreRoom;

    const targetSnap = await getDoc(
      doc(db, 'rooms', roomId, 'players', targetPlayerId)
    );
    const targetData = targetSnap.data() as FirestorePlayer | undefined;
    const isKiller = targetPlayerId === room.dmKillerId;

    await updateDoc(doc(db, 'rooms', roomId, 'players', detectiveId), {
      dmInspectedTargetId: targetPlayerId,
      dmInspectedTargetName: targetData?.name || 'ผู้ต้องสงสัย',
      dmInspectedIsKiller: isKiller,
    });

    await updateDoc(roomRef, {
      dmDetectiveSkillDoneRound: room.dmRoundNumber || 1,
      status: 'dm_day_discussion',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// DM-7. Forensic Doctor Daylight Skill: Eliminate 1 Fake Card on the Central Board
export async function useForensicDoctorSkill(roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const room = roomSnap.data() as FirestoreRoom;
    if (room.dmDoctorSkillUsed) return;

    const rounds = [...(room.dmEvidenceRounds || [])];
    if (rounds.length === 0) return;

    const latestIdx = rounds.length - 1;
    const latest = rounds[latestIdx];
    const availableFake = latest.fakeCardIds.filter(
      (id) => id !== latest.eliminatedFakeCardId
    );
    if (availableFake.length === 0) return;

    const pickedFake =
      availableFake[Math.floor(Math.random() * availableFake.length)];

    rounds[latestIdx] = {
      ...latest,
      eliminatedFakeCardId: pickedFake,
    };

    await updateDoc(roomRef, {
      dmEvidenceRounds: rounds,
      dmDoctorSkillUsed: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// DM-8. Transition from Day Discussion to Showdown Voting
export async function startDyingMessageVoting(roomId: string): Promise<void> {
  try {
    const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    for (const d of playersSnap.docs) {
      await updateDoc(doc(db, 'rooms', roomId, 'players', d.id), {
        voteTargetId: '',
      });
    }

    await updateDoc(doc(db, 'rooms', roomId), {
      status: 'dm_voting',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// DM-9A. Cast Vote from Phone & Auto-Resolve When All Alive Players Have Voted
export async function castDyingMessageVote(
  roomId: string,
  targetPlayerId: string,
  voterId?: string
): Promise<void> {
  const user = await ensureAuthUser();
  const activeVoterId = voterId || user.uid;

  try {
    await updateDoc(doc(db, 'rooms', roomId, 'players', activeVoterId), {
      voteTargetId: targetPlayerId,
    });

    const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    const allPlayers = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
    const alivePlayers = allPlayers.filter((p) => p.dmIsAlive !== false);

    const allVoted = alivePlayers.every((p) => Boolean(p.voteTargetId));
    if (allVoted && alivePlayers.length > 0) {
      const tally: Record<string, number> = {};
      for (const p of alivePlayers) {
        if (p.voteTargetId) {
          tally[p.voteTargetId] = (tally[p.voteTargetId] || 0) + 1;
        }
      }
      let topId = alivePlayers[0].id;
      let topCount = -1;
      for (const [candidateId, count] of Object.entries(tally)) {
        if (count > topCount) {
          topCount = count;
          topId = candidateId;
        }
      }
      await resolveDyingMessageVoteOnBoard(roomId, topId);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// DM-9B. Direct Verdict Resolution (Called automatically after votes OR directly tapped on iPad Central Board)
export async function resolveDyingMessageVoteOnBoard(
  roomId: string,
  accusedPlayerId: string
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const room = roomSnap.data() as FirestoreRoom;

    const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    const allPlayers = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
    const accused = allPlayers.find((p) => p.id === accusedPlayerId);
    if (!accused) return;

    // Eliminate the accused player
    await updateDoc(doc(db, 'rooms', roomId, 'players', accused.id), {
      dmIsAlive: false,
    });

    const isKillerCaught = accused.id === room.dmKillerId;
    const remainingAliveNonEvil = allPlayers.filter(
      (p) =>
        p.id !== accused.id &&
        p.dmIsAlive !== false &&
        p.id !== room.dmKillerId &&
        p.id !== room.dmAccompliceId
    );

    const currentScores: Record<string, number> = { ...(room.dmScores || {}) };

    if (isKillerCaught) {
      // Civilians & Special Good Roles Win!
      for (const p of allPlayers) {
        const isGood = p.role !== 'dm_killer' && p.role !== 'dm_accomplice';
        if (isGood) {
          currentScores[p.id] = (currentScores[p.id] || 0) + 3;
        }
      }

      await updateDoc(roomRef, {
        status: 'dm_game_over',
        winnerTeam: 'dm_civilians',
        accusedPlayerId: accused.id,
        dmLastEliminatedId: accused.id,
        dmLastEliminatedName: accused.name,
        dmLastEliminatedRole: accused.role || 'dm_civilian',
        dmScores: currentScores,
        updatedAt: new Date().toISOString(),
      });

      await recordGameEloUpdates(
        allPlayers,
        'เบาะแสมรณะ (Dying Message)',
        (p) => p.role !== 'dm_killer' && p.role !== 'dm_accomplice'
      );
    } else if (remainingAliveNonEvil.length <= 1 || (room.dmRoundNumber || 1) >= 3) {
      // Killer & Accomplice Win!
      for (const p of allPlayers) {
        const isEvil = p.role === 'dm_killer' || p.role === 'dm_accomplice';
        if (isEvil) {
          currentScores[p.id] = (currentScores[p.id] || 0) + 4;
        }
      }

      await updateDoc(roomRef, {
        status: 'dm_game_over',
        winnerTeam: 'dm_killer',
        accusedPlayerId: accused.id,
        dmLastEliminatedId: accused.id,
        dmLastEliminatedName: accused.name,
        dmLastEliminatedRole: accused.role || 'dm_civilian',
        dmScores: currentScores,
        updatedAt: new Date().toISOString(),
      });

      await recordGameEloUpdates(
        allPlayers,
        'เบาะแสมรณะ (Dying Message)',
        (p) => p.role === 'dm_killer' || p.role === 'dm_accomplice'
      );
    } else {
      // Innocent was voted out, game continues to Round Verdict before next Night Clue!
      await updateDoc(roomRef, {
        status: 'dm_round_verdict',
        accusedPlayerId: accused.id,
        dmLastEliminatedId: accused.id,
        dmLastEliminatedName: accused.name,
        dmLastEliminatedRole: accused.role || 'dm_civilian',
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// DM-10. Continue to Next Night Clue (The wrongly accused player leaves the next Dying Message!)
export async function continueToNextDyingMessageNight(
  roomId: string
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const room = roomSnap.data() as FirestoreRoom;

    const nextRound = (room.dmRoundNumber || 1) + 1;
    const newVictimId = room.dmLastEliminatedId || room.dmVictimId || '';
    const newVictimName = room.dmLastEliminatedName || room.dmVictimName || 'ผู้ตาย';
    const killerId = room.dmKillerId || '';

    const category = room.dmCategory || 'all';
    const usedIds = (room.dmEvidenceRounds || []).flatMap((r) => r.cardIds);
    const drawn12 = drawRandomDyingMessageCards(category, 12, usedIds);
    const victimHand = drawn12.slice(0, 6).map((c: DyingMessageEvidenceCard) => c.id);
    const killerHand = drawn12.slice(6, 12).map((c: DyingMessageEvidenceCard) => c.id);

    if (newVictimId) {
      await updateDoc(doc(db, 'rooms', roomId, 'players', newVictimId), {
        dmCandidateCards: victimHand,
        dmSelectedCardIds: [],
      });
    }
    if (killerId) {
      await updateDoc(doc(db, 'rooms', roomId, 'players', killerId), {
        dmCandidateCards: killerHand,
        dmSelectedCardIds: [],
      });
    }

    await updateDoc(roomRef, {
      dmRoundNumber: nextRound,
      dmVictimId: newVictimId,
      dmVictimName: newVictimName,
      status: 'dm_victim_clue',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// DM-11. Reset Room Back to Lobby
export async function resetDyingMessageToLobby(roomId: string): Promise<void> {
  try {
    const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    for (const d of playersSnap.docs) {
      await updateDoc(doc(db, 'rooms', roomId, 'players', d.id), {
        isReady: true,
        roleAcknowledged: false,
        dmIsAlive: true,
        dmCandidateCards: [],
        dmSelectedCardIds: [],
        dmInspectedTargetId: '',
        dmInspectedTargetName: '',
        dmInspectedIsKiller: false,
        voteTargetId: '',
      });
    }

    await updateDoc(doc(db, 'rooms', roomId), {
      status: 'lobby',
      dmRoundNumber: 1,
      dmVictimId: '',
      dmVictimName: '',
      dmEvidenceRounds: [],
      dmDoctorSkillUsed: false,
      dmDetectiveSkillDoneRound: 0,
      dmLastEliminatedId: '',
      dmLastEliminatedName: '',
      winnerTeam: 'none',
      accusedPlayerId: '',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}
