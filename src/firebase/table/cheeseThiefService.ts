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
import { FirestoreRoom, FirestorePlayer, PlayerRoleCard } from './types';
import {
  ensureMinimumPlayersWithBots,
  isAutoControlledSeat,
} from './roomHelpers';
import { recordGameEloUpdates } from './leaderboardService';

// 0. Register or Unregister iPad Central Cheese Table (Optional Companion Board)
export async function registerCheeseThiefIpadBoard(
  roomId: string,
  connected: boolean = true
): Promise<void> {
  const user = await ensureAuthUser();
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      ctIpadConnected: connected,
      ctIpadUid: connected ? user.uid : '',
      ctIpadLastSeen: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 0.1 Open or Close Table Session Scoreboard Summary Modal across devices
export async function toggleCheeseThiefSessionSummary(
  roomId: string,
  isOpen: boolean
): Promise<void> {
  await ensureAuthUser();
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      ctSessionSummaryOpen: isOpen,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 0.2 Reset Cumulative Table Scores to Zero for a New Session
export async function resetCheeseThiefTableScores(
  roomId: string
): Promise<void> {
  await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const freshScores: Record<string, number> = {};
    const freshWins: Record<string, number> = {};
    const freshThief: Record<string, number> = {};
    playersSnap.docs.forEach((d) => {
      freshScores[d.id] = 0;
      freshWins[d.id] = 0;
      freshThief[d.id] = 0;
    });

    await updateDoc(roomRef, {
      ctRoundNumber: 0,
      ctScores: freshScores,
      ctRoundScores: {},
      ctWinsCount: freshWins,
      ctThiefCount: freshThief,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 1. Toggle Fall Mouse Special Mode in Lobby (for 6-8 players)
export async function toggleFallMouseMode(
  roomId: string,
  enableFallMouse: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      enableFallMouse,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 1.1 Set Night Hour Duration (in seconds: 5, 8, 10, 15, 20)
export async function setCheeseNightDuration(
  roomId: string,
  durationSeconds: number
): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      cheeseNightDuration: durationSeconds,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 1.2 Toggle Pause / Resume Night Countdown
export async function toggleCheeseNightPause(
  roomId: string,
  isPaused: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      cheeseNightPaused: isPaused,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 2. Start Game & Deal Official Cheese Thief Cards (Step 1 -> Step 2)
export async function startGameAndDealRoles(roomId: string): Promise<void> {
  const user = await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    const roomData = roomSnap.data() as FirestoreRoom | undefined;
    const players = await ensureMinimumPlayersWithBots(roomId, 4);

    const totalPlayers = players.length;
    const isFourPlayerDualDice = totalPlayers === 4;
    const useFallMouse =
      Boolean(roomData?.enableFallMouse) && totalPlayers >= 6;

    // Build deck: 1 Cheese Thief + (optional 1 Fall Mouse for 6-8p) + remaining Sleepyheads
    const roles: PlayerRoleCard[] = ['cheese_thief'];
    if (useFallMouse) {
      roles.push('fall_mouse');
    }
    while (roles.length < totalPlayers) {
      roles.push('sleepy_mouse');
    }

    // Fisher-Yates Shuffle
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    let initialStolenHour = 0;
    const nextScores: Record<string, number> = { ...(roomData?.ctScores || {}) };
    const nextWins: Record<string, number> = { ...(roomData?.ctWinsCount || {}) };
    const nextThiefCount: Record<string, number> = {
      ...(roomData?.ctThiefCount || {}),
    };

    for (let i = 0; i < players.length; i++) {
      const pid = players[i].id;
      if (nextScores[pid] === undefined) nextScores[pid] = 0;
      if (nextWins[pid] === undefined) nextWins[pid] = 0;
      if (nextThiefCount[pid] === undefined) nextThiefCount[pid] = 0;
      if (roles[i] === 'cheese_thief') {
        nextThiefCount[pid] = (nextThiefCount[pid] || 0) + 1;
      }

      const isBotOrPulledFriend = isAutoControlledSeat(players[i], user.uid);

      let preRoll1 = 0;
      let preRoll2 = 0;
      let pair: number[] = [];

      if (isBotOrPulledFriend) {
        preRoll1 = Math.floor(1 + Math.random() * 6);
        if (isFourPlayerDualDice) {
          preRoll2 = Math.floor(1 + Math.random() * 6);
          while (preRoll2 === preRoll1) {
            preRoll2 = Math.floor(1 + Math.random() * 6);
          }
          pair = [preRoll1, preRoll2];
        } else {
          pair = [preRoll1];
        }
        if (roles[i] === 'cheese_thief') {
          initialStolenHour = preRoll1;
        }
      }

      await updateDoc(doc(db, 'rooms', roomId, 'players', pid), {
        role: roles[i],
        isFollower: false,
        roleAcknowledged: isBotOrPulledFriend,
        diceHour: preRoll1,
        secondaryDiceHour: preRoll2,
        rolledDicePair: pair,
        hasGrabbedCheese: false,
        peekedTargetId: '',
        peekedTargetName: '',
        peekedDiceValue: 0,
        voteTargetId: '',
      });
    }

    const nextRoundNumber = (roomData?.ctRoundNumber || 0) + 1;

    await updateDoc(roomRef, {
      status: 'role_deal',
      nightHour: 0,
      stolenHour: initialStolenHour,
      cheeseStolen: false,
      followerIds: [],
      ctRoundNumber: nextRoundNumber,
      ctScores: nextScores,
      ctRoundScores: {},
      ctWinsCount: nextWins,
      ctThiefCount: nextThiefCount,
      ctSessionSummaryOpen: false,
      winnerTeam: 'in_progress',
      accusedPlayerId: '',
      playerCount: totalPlayers,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 3. Player Acknowledges Role (Step 2 -> Step 3)
export async function acknowledgePlayerRole(roomId: string): Promise<void> {
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
        status: 'dice_roll',
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

// 4. Player Submits Secret Dice Roll in Cup (Step 3 -> Step 4)
export async function submitSecretDiceRoll(
  roomId: string,
  chosenWakeHour: number,
  secondaryHour: number = 0,
  rolledPair?: number[]
): Promise<void> {
  const user = await ensureAuthUser();
  const playerRef = doc(db, 'rooms', roomId, 'players', user.uid);
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const playerSnap = await getDoc(playerRef);
    const playerData = playerSnap.data() as FirestorePlayer;

    await updateDoc(playerRef, {
      diceHour: chosenWakeHour,
      secondaryDiceHour: secondaryHour,
      rolledDicePair:
        rolledPair ||
        (secondaryHour > 0 ? [chosenWakeHour, secondaryHour] : [chosenWakeHour]),
    });

    if (playerData.role === 'cheese_thief') {
      await updateDoc(roomRef, {
        stolenHour: chosenWakeHour,
      });
    }

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const allRolled = playersSnap.docs.every((d) => {
      const p = d.data() as FirestorePlayer;
      return (d.id === user.uid ? chosenWakeHour : p.diceHour || 0) > 0;
    });

    if (allRolled) {
      const thiefDoc = playersSnap.docs.find(
        (d) => (d.data() as FirestorePlayer).role === 'cheese_thief'
      );
      const thiefHour =
        thiefDoc?.id === user.uid
          ? chosenWakeHour
          : (thiefDoc?.data() as FirestorePlayer | undefined)?.diceHour || 3;

      await updateDoc(roomRef, {
        status: 'night_phases',
        nightHour: 1,
        stolenHour: thiefHour,
        cheeseStolen: false,
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

// 4.5 Host / iPad Force Advance from Role Deal or Dice Roll (Bypasses disconnected or stalled seats)
export async function forceAdvanceCheeseThiefPhase(
  roomId: string
): Promise<void> {
  await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const [roomSnap, playersSnap] = await Promise.all([
      getDoc(roomRef),
      getDocs(collection(db, 'rooms', roomId, 'players')),
    ]);
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data() as FirestoreRoom;
    const players = playersSnap.docs.map((d) => d.data() as FirestorePlayer);

    if (roomData.status === 'role_deal') {
      for (const p of players) {
        if (!p.roleAcknowledged) {
          await updateDoc(doc(db, 'rooms', roomId, 'players', p.id), {
            roleAcknowledged: true,
          });
        }
      }
      await updateDoc(roomRef, {
        status: 'dice_roll',
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    if (roomData.status === 'dice_roll') {
      const isFourPlayerDualDice = players.length === 4;
      let thiefHour = roomData.stolenHour || 0;

      for (const p of players) {
        let d1 = p.diceHour || 0;
        let d2 = p.secondaryDiceHour || 0;
        if (d1 <= 0) {
          d1 = Math.floor(1 + Math.random() * 6);
          if (isFourPlayerDualDice) {
            d2 = Math.floor(1 + Math.random() * 6);
            while (d2 === d1) {
              d2 = Math.floor(1 + Math.random() * 6);
            }
          }
          await updateDoc(doc(db, 'rooms', roomId, 'players', p.id), {
            diceHour: d1,
            secondaryDiceHour: d2,
            rolledDicePair: isFourPlayerDualDice ? [d1, d2] : [d1],
          });
        }
        if (p.role === 'cheese_thief') {
          thiefHour = d1;
        }
      }

      await updateDoc(roomRef, {
        status: 'night_phases',
        nightHour: 1,
        stolenHour: thiefHour || 3,
        cheeseStolen: false,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 5. Cheese Thief Action: Grab & Hide the Cheese on their wake hour (Works from Phone OR iPad Central Table)
export async function grabCheeseInNight(roomId: string): Promise<void> {
  const user = await ensureAuthUser();
  try {
    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const thiefDoc = playersSnap.docs.find(
      (d) => (d.data() as FirestorePlayer).role === 'cheese_thief'
    );
    const targetPlayerId = thiefDoc ? thiefDoc.id : user.uid;

    const targetRef = doc(db, 'rooms', roomId, 'players', targetPlayerId);
    const targetSnap = await getDoc(targetRef);
    if (targetSnap.exists()) {
      await updateDoc(targetRef, {
        hasGrabbedCheese: true,
      });
    }

    await updateDoc(doc(db, 'rooms', roomId), {
      cheeseStolen: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 6. Sleepyhead Action: When waking up ALONE in 5-8 player mode, peek under 1 other player's dice cup
export async function peekPlayerDiceCup(
  roomId: string,
  targetPlayerId: string
): Promise<void> {
  const user = await ensureAuthUser();
  try {
    const targetSnap = await getDoc(
      doc(db, 'rooms', roomId, 'players', targetPlayerId)
    );
    if (!targetSnap.exists()) return;
    const targetPlayer = targetSnap.data() as FirestorePlayer;
    const diceVal = targetPlayer.diceHour || 1;

    await updateDoc(doc(db, 'rooms', roomId, 'players', user.uid), {
      peekedTargetId: targetPlayerId,
      peekedTargetName: targetPlayer.name,
      peekedDiceValue: diceVal,
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `rooms/${roomId}/players/${user.uid}`
    );
  }
}

// 7. Advance Night Timeline Hour (1:00 AM - 6:00 AM -> Follower Phase / Morning Voting)
export async function advanceNightHour(
  roomId: string,
  targetHour: number
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data() as FirestoreRoom;

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const players = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
    const totalPlayers = players.length;

    const currentStolen =
      roomData.cheeseStolen || roomData.nightHour >= roomData.stolenHour;

    if (targetHour <= 6) {
      await updateDoc(roomRef, {
        nightHour: targetHour,
        cheeseNightPaused: false,
        cheeseStolen: currentStolen || targetHour > roomData.stolenHour,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    // Completed 6:00 AM! Handle Official Follower Rules based on player count (4 to 8 players):
    if (totalPlayers <= 4) {
      await updateDoc(roomRef, {
        status: 'voting',
        nightHour: 7,
        cheeseStolen: true,
        followerIds: [],
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    if (totalPlayers === 5) {
      const witnesses = players.filter(
        (p) => p.role !== 'cheese_thief' && p.diceHour === roomData.stolenHour
      );
      const followerIds = witnesses.map((w) => w.id);
      for (const w of witnesses) {
        await updateDoc(doc(db, 'rooms', roomId, 'players', w.id), {
          isFollower: true,
        });
      }
      await updateDoc(roomRef, {
        status: 'follower_phase',
        nightHour: 7,
        cheeseStolen: true,
        followerIds,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    // 6, 7, or 8 players: Cheese Thief selects 1 Follower (6p) or 2 Followers (7-8p)
    const thiefPlayer = players.find((p) => p.role === 'cheese_thief');
    const neededFollowers = totalPlayers === 6 ? 1 : 2;
    const isBotThief =
      !thiefPlayer || isAutoControlledSeat(thiefPlayer, roomData.hostId);

    if (isBotThief) {
      const candidates = players.filter((p) => p.role !== 'cheese_thief');
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, neededFollowers);
      const followerIds = chosen.map((c) => c.id);
      for (const c of chosen) {
        await updateDoc(doc(db, 'rooms', roomId, 'players', c.id), {
          isFollower: true,
        });
      }
      await updateDoc(roomRef, {
        status: 'follower_phase',
        nightHour: 7,
        cheeseStolen: true,
        followerIds,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await updateDoc(roomRef, {
        status: 'follower_phase',
        nightHour: 7,
        cheeseStolen: true,
        followerIds: [],
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 8. Cheese Thief Selects Followers in 6-8 Player Mode
export async function selectFollowersByThief(
  roomId: string,
  targetIds: string[]
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    for (const tid of targetIds) {
      await updateDoc(doc(db, 'rooms', roomId, 'players', tid), {
        isFollower: true,
      });
    }
    await updateDoc(roomRef, {
      followerIds: targetIds,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 9. Proceed from Follower Phase to Morning Debate & Simultaneous Voting
export async function confirmFollowerPhaseToMorning(
  roomId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      status: 'voting',
      nightHour: 7,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 10. Cast Simultaneous Vote ("Who is the Cheese Thief? 3–2–1 VOTE!") & Calculate Cumulative Round Points
export async function castAccusationVote(
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

    const [roomSnap, playersSnap] = await Promise.all([
      getDoc(roomRef),
      getDocs(collection(db, 'rooms', roomId, 'players')),
    ]);
    const roomData = roomSnap.data() as FirestoreRoom | undefined;
    const players = playersSnap.docs.map((d) => d.data() as FirestorePlayer);

    for (const p of players) {
      if (isAutoControlledSeat(p, user.uid) && !p.voteTargetId) {
        const otherPlayers = players.filter((other) => other.id !== p.id);
        const randomTarget =
          otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
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
        }
      });

      const accusedPlayer = players.find((p) => p.id === accusedId);
      const thiefPlayer = players.find((p) => p.role === 'cheese_thief');

      let winnerTeam: 'mice' | 'thief' | 'fall_mouse' = 'thief';
      if (accusedPlayer?.role === 'fall_mouse') {
        winnerTeam = 'fall_mouse';
      } else if (accusedPlayer?.role === 'cheese_thief') {
        winnerTeam = 'mice';
      } else {
        winnerTeam = 'thief';
      }

      // Calculate Cumulative Table Points per Player for this Round
      const nextScores: Record<string, number> = {
        ...(roomData?.ctScores || {}),
      };
      const roundScores: Record<string, number> = {};
      const nextWinsCount: Record<string, number> = {
        ...(roomData?.ctWinsCount || {}),
      };

      players.forEach((p) => {
        const effectiveVote = p.id === user.uid ? targetPlayerId : p.voteTargetId;
        let pts = 0;
        let wonRound = false;

        if (winnerTeam === 'fall_mouse') {
          if (p.role === 'fall_mouse') {
            pts = 3; // Solo Victory for Fall Mouse
            wonRound = true;
          }
        } else if (winnerTeam === 'thief') {
          if (p.role === 'cheese_thief') {
            pts = 2; // Master Thief Escaped
            wonRound = true;
          } else if (p.isFollower || roomData?.followerIds?.includes(p.id)) {
            pts = 1; // Follower Accomplice Win
            wonRound = true;
          }
        } else if (winnerTeam === 'mice') {
          const isFollower =
            Boolean(p.isFollower) ||
            Boolean(roomData?.followerIds?.includes(p.id));
          if (p.role === 'sleepy_mouse' && !isFollower) {
            pts = 1; // Sleepy Mouse Team Win
            if (thiefPlayer && effectiveVote === thiefPlayer.id) {
              pts += 1; // +1 Detective Bonus for voting directly on the Thief
            }
            wonRound = true;
          }
        }

        roundScores[p.id] = pts;
        nextScores[p.id] = (nextScores[p.id] || 0) + pts;
        if (wonRound) {
          nextWinsCount[p.id] = (nextWinsCount[p.id] || 0) + 1;
        } else if (nextWinsCount[p.id] === undefined) {
          nextWinsCount[p.id] = 0;
        }
      });

      await updateDoc(roomRef, {
        status: 'game_over',
        winnerTeam,
        accusedPlayerId: accusedId,
        ctScores: nextScores,
        ctRoundScores: roundScores,
        ctWinsCount: nextWinsCount,
        updatedAt: new Date().toISOString(),
      });

      await recordGameEloUpdates(
        players,
        'หนูขโมยชีส (Cheese Thief)',
        (p) =>
          (winnerTeam === 'fall_mouse' && p.role === 'fall_mouse') ||
          (winnerTeam === 'mice' &&
            p.role === 'sleepy_mouse' &&
            !p.isFollower) ||
          (winnerTeam === 'thief' &&
            (p.role === 'cheese_thief' || p.isFollower === true))
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}
