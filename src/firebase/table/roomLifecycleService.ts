import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
  ensureAuthUser,
} from '../config';
import { UserProfile } from '../userService';
import { FirestoreRoom, FirestorePlayer } from './types';
import {
  BOT_NAMES,
  generate4DigitCode,
  syncRoomPlayerCount,
} from './roomHelpers';

// 0. Clean up any existing rooms hosted by this user (Enforce 1 Room per Host)
export async function cleanupHostPreviousRooms(
  hostId: string,
  keepRoomId?: string
): Promise<void> {
  if (!hostId) return;
  try {
    const q = query(collection(db, 'rooms'), where('hostId', '==', hostId));
    const snap = await getDocs(q);
    for (const roomDoc of snap.docs) {
      if (keepRoomId && roomDoc.id === keepRoomId) continue;
      await deleteTableRoom(roomDoc.id);
    }
  } catch (error) {
    console.warn('Error cleaning up previous host rooms:', error);
  }
}

// 0.5 Leave Room (Guest removes seat; Host closes & deletes the room)
export async function leaveOrCloseTableRoom(
  roomId: string,
  hostId: string
): Promise<void> {
  const user = await ensureAuthUser();
  if (user.uid === hostId) {
    await deleteTableRoom(roomId);
    await cleanupHostPreviousRooms(user.uid);
  } else {
    await removePlayer(roomId, user.uid);
  }
}

// 1. Create a Table Room (Supports 4-10 players across Cheese Thief, Insider, Detective Club, Hues & Cues, Dying Message, etc.)
export async function createTableRoom(
  hostName: string,
  gameId:
    | 'cheese-thief'
    | 'insider'
    | 'undercover'
    | 'detective-club'
    | 'avalon'
    | 'hues-cues'
    | 'dying-message' = 'cheese-thief',
  customRoomName?: string,
  maxPlayers: number = 8
): Promise<FirestoreRoom> {
  const user = await ensureAuthUser();

  // Enforce 1 active room per host: remove any older rooms created by this host
  await cleanupHostPreviousRooms(user.uid);

  const roomCode = generate4DigitCode();
  const roomId = `room_${Date.now()}_${roomCode}`;
  const roomPath = `rooms/${roomId}`;
  const cleanHost = hostName.trim() || 'โฮสต์โต๊ะ';
  const clampedMax = Math.min(12, Math.max(3, maxPlayers));

  const defaultName =
    gameId === 'dying-message'
      ? `โต๊ะเบาะแสมรณะ (Dying Message) ของ ${cleanHost}`
      : gameId === 'hues-cues'
      ? `โต๊ะทายสีจากคำใบ้ (Hues & Cues) ของ ${cleanHost}`
      : gameId === 'avalon'
      ? `โต๊ะศึกอัศวินโต๊ะกลม (Avalon) ของ ${cleanHost}`
      : gameId === 'detective-club'
      ? `โต๊ะสมาคมนักสืบ (Detective Club) ของ ${cleanHost}`
      : gameId === 'undercover'
      ? `โต๊ะสายลับสลับคำ (Undercover) ของ ${cleanHost}`
      : gameId === 'insider'
      ? `โต๊ะจอมบงการคำใบ้ (Insider) ของ ${cleanHost}`
      : `โต๊ะชีสหนูอยู่ไหนของ ${cleanHost}`;

  const roomData: Omit<FirestoreRoom, 'id'> = {
    roomCode,
    roomName: customRoomName?.trim() || defaultName,
    gameId,
    hostId: user.uid,
    hostName: cleanHost,
    status: 'lobby',
    nightHour: 0,
    stolenHour: 0,
    cheeseStolen: false,
    enableFallMouse: false,
    followerIds: [],
    ctIpadConnected: false,
    ctRoundNumber: 0,
    ctScores: { [user.uid]: 0 },
    ctRoundScores: {},
    ctWinsCount: { [user.uid]: 0 },
    ctThiefCount: { [user.uid]: 0 },
    ctSessionSummaryOpen: false,
    hcIpadConnected: false,
    hcRoundNumber: 0,
    hcGuesses: {},
    hcScores: { [user.uid]: 0 },
    hcRoundScores: {},
    dmIpadConnected: false,
    dmRoundNumber: 1,
    dmCategory: 'all',
    dmEnableDetective: true,
    dmEnableDoctor: true,
    dmEnableAccomplice: true,
    dmDebateDurationSeconds: 180,
    dmEvidenceRounds: [],
    dmDoctorSkillUsed: false,
    dmScores: { [user.uid]: 0 },
    wordCategory: 'all',
    wordCategoryLabel: 'สุ่มทุกหมวดหมู่',
    secretWord: '',
    insiderEyesOpen: false,
    quizDurationSeconds: 180,
    elapsedQuizSeconds: 0,
    guesserPlayerId: '',
    guesserPlayerName: '',
    masterLastSignal: '',
    masterSignalCount: 0,
    guesserVoteResult: '',
    guesserYesVotes: 0,
    guesserNoVotes: 0,
    winnerTeam: 'in_progress',
    playerCount: 1,
    maxPlayers: clampedMax,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'rooms', roomId), roomData);

    const storedAvatar = typeof window !== 'undefined' ? localStorage.getItem('tabletop_player_avatar') || undefined : undefined;
    const playerData: FirestorePlayer = {
      id: user.uid,
      name: cleanHost,
      ...(storedAvatar ? { avatarUrl: storedAvatar } : {}),
      isHost: true,
      isReady: true,
      joinedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'rooms', roomId, 'players', user.uid), playerData);

    return { id: roomId, ...roomData };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, roomPath);
  }
}

// 2. Find Room by 4-Digit Code
export async function findRoomByCode(
  code: string
): Promise<FirestoreRoom | null> {
  await ensureAuthUser();
  const trimmed = code.trim();
  const path = 'rooms';

  try {
    const q = query(
      collection(db, 'rooms'),
      where('roomCode', '==', trimmed),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...(docSnap.data() as Omit<FirestoreRoom, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// 3. Join Table Room by Room ID
export async function joinTableRoom(
  roomId: string,
  playerName: string,
  avatarUrl?: string
): Promise<FirestorePlayer> {
  const user = await ensureAuthUser();
  const playerPath = `rooms/${roomId}/players/${user.uid}`;
  const effectiveAvatar =
    avatarUrl ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('tabletop_player_avatar') || undefined
      : undefined);

  try {
    const playerDoc = await getDoc(
      doc(db, 'rooms', roomId, 'players', user.uid)
    );
    if (playerDoc.exists()) {
      const existing = playerDoc.data() as FirestorePlayer;
      const updatedName = playerName.trim() || existing.name;
      const updates: Partial<FirestorePlayer> = { name: updatedName };
      if (effectiveAvatar) updates.avatarUrl = effectiveAvatar;
      await updateDoc(doc(db, 'rooms', roomId, 'players', user.uid), updates);
      await syncRoomPlayerCount(roomId);
      return { ...existing, name: updatedName, ...(effectiveAvatar ? { avatarUrl: effectiveAvatar } : {}) };
    }

    const playerData: FirestorePlayer = {
      id: user.uid,
      name: playerName.trim() || `ผู้เล่น ${user.uid.slice(0, 4)}`,
      ...(effectiveAvatar ? { avatarUrl: effectiveAvatar } : {}),
      isHost: false,
      isReady: true,
      joinedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'rooms', roomId, 'players', user.uid), playerData);
    await syncRoomPlayerCount(roomId);
    return playerData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, playerPath);
  }
}

// 4. Pull an Accepted Friend directly into the Room (4-8 players)
export async function addFriendToRoomSeat(
  roomId: string,
  friend: UserProfile
): Promise<FirestorePlayer> {
  const playerPath = `rooms/${roomId}/players/${friend.uid}`;
  try {
    const friendPlayer: FirestorePlayer = {
      id: friend.uid,
      name: friend.accountName,
      ...(friend.avatarUrl ? { avatarUrl: friend.avatarUrl } : {}),
      isHost: false,
      isReady: true,
      isFriendSeat: true,
      joinedAt: new Date().toISOString(),
    };
    await setDoc(
      doc(db, 'rooms', roomId, 'players', friend.uid),
      friendPlayer
    );
    await syncRoomPlayerCount(roomId);
    return friendPlayer;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, playerPath);
  }
}

// 5. Toggle Ready State
export async function togglePlayerReady(
  roomId: string,
  isReady: boolean
): Promise<void> {
  const user = await ensureAuthUser();
  const path = `rooms/${roomId}/players/${user.uid}`;
  try {
    await updateDoc(doc(db, 'rooms', roomId, 'players', user.uid), {
      isReady,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// 6. Add Practice Tablemate (Up to 8 players max)
export async function addPracticeTablemate(
  roomId: string
): Promise<FirestorePlayer> {
  const botId = `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const botData: FirestorePlayer = {
    id: botId,
    name: botName,
    isHost: false,
    isReady: true,
    joinedAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'rooms', roomId, 'players', botId), botData);
    await syncRoomPlayerCount(roomId);
    return botData;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `rooms/${roomId}/players/${botId}`
    );
  }
}

// 7. Remove Player / Bot Tablemate
export async function removePlayer(
  roomId: string,
  playerId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'rooms', roomId, 'players', playerId));
    await syncRoomPlayerCount(roomId);
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.DELETE,
      `rooms/${roomId}/players/${playerId}`
    );
  }
}

// 8. Delete Room completely
export async function deleteTableRoom(roomId: string): Promise<void> {
  try {
    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    for (const d of playersSnap.docs) {
      await deleteDoc(doc(db, 'rooms', roomId, 'players', d.id));
    }
    await deleteDoc(doc(db, 'rooms', roomId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `rooms/${roomId}`);
  }
}

// 9. Reset Room to Play Again (Back to Step 1 Lobby for both Cheese Thief & Insider)
export async function resetRoomToPlayAgain(roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  const playersRef = collection(db, 'rooms', roomId, 'players');

  try {
    const playersSnap = await getDocs(playersRef);
    for (const d of playersSnap.docs) {
      await updateDoc(doc(db, 'rooms', roomId, 'players', d.id), {
        isReady: true,
        isFollower: false,
        roleAcknowledged: false,
        diceHour: 0,
        secondaryDiceHour: 0,
        rolledDicePair: [],
        hasGrabbedCheese: false,
        peekedTargetId: '',
        peekedTargetName: '',
        peekedDiceValue: 0,
        guesserJudgmentVote: '',
        voteTargetId: '',
      });
    }

    await updateDoc(roomRef, {
      status: 'lobby',
      nightHour: 0,
      stolenHour: 0,
      cheeseStolen: false,
      followerIds: [],
      secretWord: '',
      insiderEyesOpen: false,
      elapsedQuizSeconds: 0,
      guesserPlayerId: '',
      guesserPlayerName: '',
      masterLastSignal: '',
      masterSignalCount: 0,
      guesserVoteResult: '',
      guesserYesVotes: 0,
      guesserNoVotes: 0,
      winnerTeam: 'none',
      accusedPlayerId: '',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 10. Real-Time Listener for ALL Active Rooms
export function listenToActiveRooms(
  onUpdate: (rooms: FirestoreRoom[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'rooms'),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FirestoreRoom, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'rooms');
    }
  );
}

// 11. Real-Time Listener for a Single Room
export function listenToRoom(
  roomId: string,
  onUpdate: (room: FirestoreRoom | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'rooms', roomId),
    (snap) => {
      if (snap.exists()) {
        onUpdate({
          id: snap.id,
          ...(snap.data() as Omit<FirestoreRoom, 'id'>),
        });
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `rooms/${roomId}`);
    }
  );
}

// 12. Real-Time Listener for Players in a Room
export function listenToRoomPlayers(
  roomId: string,
  onUpdate: (players: FirestorePlayer[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'rooms', roomId, 'players'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as FirestorePlayer);
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `rooms/${roomId}/players`);
    }
  );
}

// 13. Update Player Avatar in Room Seats
export async function updatePlayerAvatarInRoom(
  roomId: string,
  playerId: string,
  avatarUrl: string
): Promise<void> {
  const playerRef = doc(db, 'rooms', roomId, 'players', playerId);
  try {
    await updateDoc(playerRef, { avatarUrl });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}/players/${playerId}`);
  }
}

