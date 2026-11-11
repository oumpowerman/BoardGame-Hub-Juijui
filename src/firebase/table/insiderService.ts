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
  getRandomInsiderWord,
  InsiderWordCategoryId,
} from '../../data/insiderWords';
import { FirestoreRoom, FirestorePlayer, PlayerRoleCard } from './types';
import {
  ensureMinimumPlayersWithBots,
  isAutoControlledSeat,
} from './roomHelpers';
import { recordGameEloUpdates } from './leaderboardService';

// I-1. Configure Insider Category & Sand Timer Duration in Lobby
export async function updateInsiderLobbySettings(
  roomId: string,
  wordCategory: InsiderWordCategoryId,
  quizDurationSeconds: number
): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      wordCategory,
      quizDurationSeconds,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// I-2. Start Insider Game & Deal Roles (1 Master, 1 Insider, N-2 Commons)
export async function startInsiderGameAndDealRoles(
  roomId: string
): Promise<void> {
  const user = await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    const roomData = roomSnap.data() as FirestoreRoom | undefined;
    const players = await ensureMinimumPlayersWithBots(roomId, 4);

    const totalPlayers = players.length;
    // Prefer human player as Master so a real person can answer Yes/No questions
    const humanIndices = players
      .map((p, idx) => ({ p, idx }))
      .filter(({ p }) => !isAutoControlledSeat(p, user.uid));

    const roles: PlayerRoleCard[] = new Array(totalPlayers).fill(
      'insider_common'
    );

    const masterIdx =
      humanIndices.length > 0
        ? humanIndices[Math.floor(Math.random() * humanIndices.length)].idx
        : Math.floor(Math.random() * totalPlayers);
    roles[masterIdx] = 'insider_master';

    const remainingIndices = Array.from(
      { length: totalPlayers },
      (_, i) => i
    ).filter((i) => i !== masterIdx);
    const insiderIdx =
      remainingIndices[Math.floor(Math.random() * remainingIndices.length)];
    roles[insiderIdx] = 'insider_traitor';

    const catId = roomData?.wordCategory || 'all';
    const pickedWord = getRandomInsiderWord(catId);

    for (let i = 0; i < players.length; i++) {
      const isBotOrPulledFriend = isAutoControlledSeat(players[i], user.uid);

      await updateDoc(doc(db, 'rooms', roomId, 'players', players[i].id), {
        role: roles[i],
        isFollower: false,
        roleAcknowledged: isBotOrPulledFriend,
        guesserJudgmentVote: '',
        voteTargetId: '',
      });
    }

    // Create randomized question-asking order for non-Master players (Fisher-Yates shuffle)
    const nonMasterPlayerIds = players
      .filter((_, idx) => roles[idx] !== 'insider_master')
      .map((p) => p.id);
    for (let i = nonMasterPlayerIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nonMasterPlayerIds[i], nonMasterPlayerIds[j]] = [
        nonMasterPlayerIds[j],
        nonMasterPlayerIds[i],
      ];
    }

    await updateDoc(roomRef, {
      status: 'role_deal',
      secretWord: pickedWord.word,
      wordCategoryLabel: pickedWord.categoryLabel,
      insiderEyesOpen: false,
      insiderTurnOrderIds: nonMasterPlayerIds,
      elapsedQuizSeconds: 0,
      guesserPlayerId: '',
      guesserPlayerName: '',
      masterLastSignal: '',
      masterSignalCount: 0,
      guesserVoteResult: '',
      guesserYesVotes: 0,
      guesserNoVotes: 0,
      winnerTeam: 'in_progress',
      accusedPlayerId: '',
      playerCount: totalPlayers,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// I-3. Player Acknowledges Role in Insider (Step 2 -> Step 3: Word Reveal)
export async function acknowledgeInsiderRole(roomId: string): Promise<void> {
  const user = await ensureAuthUser();
  const playerRef = doc(db, 'rooms', roomId, 'players', user.uid);
  try {
    await updateDoc(playerRef, {
      roleAcknowledged: true,
    });

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const allAcknowledged = playersSnap.docs.every(
      (d) =>
        d.id === user.uid ||
        (d.data() as FirestorePlayer).roleAcknowledged === true
    );

    if (allAcknowledged) {
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'word_reveal',
        insiderEyesOpen: false,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `rooms/${roomId}/players/${user.uid}`
    );
  }
}

// I-3.5 Host Force Acknowledge All Roles in Insider
export async function forceAcknowledgeAllInsiderRoles(
  roomId: string
): Promise<void> {
  await ensureAuthUser();
  try {
    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    for (const d of playersSnap.docs) {
      const p = d.data() as FirestorePlayer;
      if (!p.roleAcknowledged) {
        await updateDoc(doc(db, 'rooms', roomId, 'players', d.id), {
          roleAcknowledged: true,
        });
      }
    }
    await updateDoc(doc(db, 'rooms', roomId), {
      status: 'word_reveal',
      insiderEyesOpen: false,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// I-4. Master / Host Customizes or Re-rolls Secret Word during Step 3
export async function updateInsiderSecretWord(
  roomId: string,
  secretWord: string,
  wordCategoryLabel?: string
): Promise<void> {
  const cleanWord = secretWord.trim().slice(0, 60);
  if (!cleanWord) return;
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      secretWord: cleanWord,
      ...(wordCategoryLabel ? { wordCategoryLabel } : {}),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// I-5. Trigger Insider Wake Up to Peek at Secret Word (Step 3B)
export async function triggerInsiderWakeReveal(
  roomId: string,
  eyesOpen: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      insiderEyesOpen: eyesOpen,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// I-6. Start Insider Question / Quiz Phase (Step 3 -> Step 4)
export async function startInsiderQuizPhase(roomId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      status: 'question_phase',
      insiderEyesOpen: false,
      masterLastSignal: '',
      masterSignalCount: 0,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// I-7. Master Sends Quick Answer Signal ("ใช่ ✅" / "ไม่ใช่ ❌" / "ไม่แน่ใจ ❓")
export async function sendMasterQuickSignal(
  roomId: string,
  signal: 'yes' | 'no' | 'unsure',
  currentCount: number = 0
): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      masterLastSignal: signal,
      masterSignalCount: currentCount + 1,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// I-8. Master Confirms a Player Guessed the Secret Word -> Flip Sand Timer to Stage 1 Vote
export async function confirmWordGuessedByPlayer(
  roomId: string,
  guesserPlayerId: string,
  guesserPlayerName: string,
  elapsedQuizSeconds: number
): Promise<void> {
  try {
    const safeElapsed = Math.max(
      20,
      Math.min(300, Math.round(elapsedQuizSeconds))
    );
    await updateDoc(doc(db, 'rooms', roomId), {
      status: 'discussion_guesser_vote',
      guesserPlayerId,
      guesserPlayerName,
      elapsedQuizSeconds: safeElapsed,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// I-9. Quiz Timer Ran Out Before Anyone Guessed -> Everyone Loses!
export async function triggerInsiderQuizTimeout(roomId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      status: 'game_over',
      guesserVoteResult: 'timeout_loss',
      winnerTeam: 'nobody',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// I-10. Stage 1 Official Vote: Is the Guesser the Insider?
export async function castGuesserJudgmentVote(
  roomId: string,
  judgment: 'yes_insider' | 'no_innocent'
): Promise<void> {
  const user = await ensureAuthUser();
  const playerRef = doc(db, 'rooms', roomId, 'players', user.uid);
  const roomRef = doc(db, 'rooms', roomId);

  try {
    await updateDoc(playerRef, {
      guesserJudgmentVote: judgment,
    });

    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data() as FirestoreRoom;

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const players = playersSnap.docs.map((d) => d.data() as FirestorePlayer);

    for (const p of players) {
      if (p.id === roomData.guesserPlayerId) continue;
      if (isAutoControlledSeat(p, user.uid) && !p.guesserJudgmentVote) {
        const botChoice: 'yes_insider' | 'no_innocent' =
          Math.random() < 0.4 ? 'yes_insider' : 'no_innocent';
        p.guesserJudgmentVote = botChoice;
        await updateDoc(doc(db, 'rooms', roomId, 'players', p.id), {
          guesserJudgmentVote: botChoice,
        });
      }
    }

    const eligibleVoters = players.filter(
      (p) => p.id !== roomData.guesserPlayerId
    );
    const allVoted = eligibleVoters.every((p) =>
      p.id === user.uid ? Boolean(judgment) : Boolean(p.guesserJudgmentVote)
    );

    if (allVoted) {
      let yesCount = 0;
      let noCount = 0;
      eligibleVoters.forEach((p) => {
        const v = p.id === user.uid ? judgment : p.guesserJudgmentVote;
        if (v === 'yes_insider') yesCount++;
        else noCount++;
      });

      const guesserPlayer = players.find(
        (p) => p.id === roomData.guesserPlayerId
      );

      if (yesCount > noCount) {
        const guesserIsInsider = guesserPlayer?.role === 'insider_traitor';
        const winnerTeam: 'commons' | 'insider' = guesserIsInsider
          ? 'commons'
          : 'insider';

        await updateDoc(roomRef, {
          status: 'game_over',
          guesserVoteResult: 'accused_guesser',
          guesserYesVotes: yesCount,
          guesserNoVotes: noCount,
          accusedPlayerId: roomData.guesserPlayerId || '',
          winnerTeam,
          updatedAt: new Date().toISOString(),
        });

        await recordGameEloUpdates(
          players,
          'จอมบงการคำใบ้ (Insider)',
          (p) =>
            (winnerTeam === 'commons' &&
              (p.role === 'insider_master' || p.role === 'insider_common')) ||
            (winnerTeam === 'insider' && p.role === 'insider_traitor')
        );
      } else {
        await updateDoc(roomRef, {
          status: 'general_vote',
          guesserVoteResult: 'spared_guesser',
          guesserYesVotes: yesCount,
          guesserNoVotes: noCount,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// I-11. Stage 2 Official Vote: General Accusation Vote (Master's vote breaks ties)
export async function castInsiderGeneralVote(
  roomId: string,
  targetPlayerId: string
): Promise<void> {
  const user = await ensureAuthUser();
  const playerRef = doc(db, 'rooms', roomId, 'players', user.uid);
  const roomRef = doc(db, 'rooms', roomId);

  try {
    await updateDoc(playerRef, {
      voteTargetId: targetPlayerId,
    });

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const players = playersSnap.docs.map((d) => d.data() as FirestorePlayer);

    for (const p of players) {
      if (isAutoControlledSeat(p, user.uid) && !p.voteTargetId) {
        const candidates = players.filter(
          (other) => other.id !== p.id && other.role !== 'insider_master'
        );
        const randomTarget =
          candidates[Math.floor(Math.random() * candidates.length)] ||
          players[0];
        if (randomTarget) {
          p.voteTargetId = randomTarget.id;
          await updateDoc(doc(db, 'rooms', roomId, 'players', p.id), {
            voteTargetId: randomTarget.id,
          });
        }
      }
    }

    const allVoted = players.every((p) =>
      p.id === user.uid ? Boolean(targetPlayerId) : Boolean(p.voteTargetId)
    );

    if (allVoted) {
      const voteCounts: Record<string, number> = {};
      const masterPlayer = players.find((p) => p.role === 'insider_master');
      const masterVoteId =
        masterPlayer?.id === user.uid
          ? targetPlayerId
          : masterPlayer?.voteTargetId;

      players.forEach((p) => {
        const target = p.id === user.uid ? targetPlayerId : p.voteTargetId;
        if (target) {
          voteCounts[target] = (voteCounts[target] || 0) + 1;
        }
      });

      let maxVotes = -1;
      let accusedId = '';
      Object.entries(voteCounts).forEach(([pid, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          accusedId = pid;
        } else if (count === maxVotes && pid === masterVoteId) {
          accusedId = pid;
        }
      });

      const accusedPlayer = players.find((p) => p.id === accusedId);
      const caughtInsider = accusedPlayer?.role === 'insider_traitor';
      const winnerTeam: 'commons' | 'insider' = caughtInsider
        ? 'commons'
        : 'insider';

      await updateDoc(roomRef, {
        status: 'game_over',
        winnerTeam,
        accusedPlayerId: accusedId,
        updatedAt: new Date().toISOString(),
      });

      await recordGameEloUpdates(
        players,
        'จอมบงการคำใบ้ (Insider)',
        (p) =>
          (winnerTeam === 'commons' &&
            (p.role === 'insider_master' || p.role === 'insider_common')) ||
          (winnerTeam === 'insider' && p.role === 'insider_traitor')
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}
