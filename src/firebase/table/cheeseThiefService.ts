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

    for (let i = 0; i < players.length; i++) {
      const isBotOrPulledFriend = isAutoControlledSeat(players[i], user.uid);

      let preRoll1 = 0;
      let preRoll2 = 0;
      let pair: number[] = [];

      if (isBotOrPulledFriend) {
        preRoll1 = Math.floor(1 + Math.random() * 6);
        if (isFourPlayerDualDice) {
          preRoll2 = Math.floor(1 + Math.random() * 6);
          if (preRoll2 === preRoll1) {
            preRoll2 = (preRoll1 % 6) + 1;
          }
          pair = [preRoll1, preRoll2];
        } else {
          pair = [preRoll1];
        }
        if (roles[i] === 'cheese_thief') {
          initialStolenHour = preRoll1;
        }
      }

      await updateDoc(doc(db, 'rooms', roomId, 'players', players[i].id), {
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

    await updateDoc(roomRef, {
      status: 'role_deal',
      nightHour: 0,
      stolenHour: initialStolenHour,
      cheeseStolen: false,
      followerIds: [],
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

// 5. Cheese Thief Action: Grab & Hide the Cheese on their wake hour
export async function grabCheeseInNight(roomId: string): Promise<void> {
  const user = await ensureAuthUser();
  try {
    await updateDoc(doc(db, 'rooms', roomId, 'players', user.uid), {
      hasGrabbedCheese: true,
    });
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

// 10. Cast Simultaneous Vote ("Who is the Cheese Thief? 3–2–1 VOTE!")
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

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
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

      let winnerTeam: 'mice' | 'thief' | 'fall_mouse' = 'thief';
      if (accusedPlayer?.role === 'fall_mouse') {
        winnerTeam = 'fall_mouse';
      } else if (accusedPlayer?.role === 'cheese_thief') {
        winnerTeam = 'mice';
      } else {
        winnerTeam = 'thief';
      }

      await updateDoc(roomRef, {
        status: 'game_over',
        winnerTeam,
        accusedPlayerId: accusedId,
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
