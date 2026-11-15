import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
  ensureAuthUser,
} from '../config';
import {
  generateDoraemonDeck,
  DoraemonCard,
  DEFAULT_DORAEMON_RULES,
  KING_COMMAND_PRESETS,
} from '../../data/doraemonRules';
import {
  FirestoreRoom,
  DoraemonPlayerEntry,
  DoraemonDrawHistoryItem,
} from './types';

// Helper to generate a friendly 4-digit room code (e.g., '4829')
function generateRoomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// 1. Create a new Doraemon Game Room in Firestore
export async function createDoraemonRoom(
  roomName: string,
  initialKingCommand: string,
  setupPlayers: { name: string; avatarEmoji?: string }[]
): Promise<string> {
  const user = await ensureAuthUser();
  const roomRef = doc(collection(db, 'rooms'));
  const roomId = roomRef.id;

  const validPlayers =
    setupPlayers.length >= 2
      ? setupPlayers
      : [
          { name: 'ผู้เล่น 1', avatarEmoji: '🐱' },
          { name: 'ผู้เล่น 2', avatarEmoji: '🤖' },
          { name: 'ผู้เล่น 3', avatarEmoji: '🐼' },
          { name: 'ผู้เล่น 4', avatarEmoji: '🦊' },
        ];

  const players: DoraemonPlayerEntry[] = validPlayers.map((p, idx) => ({
    id: `p_${idx + 1}_${Math.random().toString(36).slice(2, 6)}`,
    name: p.name.trim(),
    avatarEmoji: p.avatarEmoji || '🐱',
    order: idx + 1,
    cardsDrawnCount: 0,
  }));

  const deck = generateDoraemonDeck();
  const deckIds = deck.map((c) => c.id);

  const defaultCommand =
    initialKingCommand.trim() ||
    KING_COMMAND_PRESETS[Math.floor(Math.random() * KING_COMMAND_PRESETS.length)];

  const roomData: Partial<FirestoreRoom> = {
    id: roomId,
    roomCode: generateRoomCode(),
    roomName: roomName.trim() || 'วงไพ่โดเรม่อนปาร์ตี้',
    gameId: 'doraemon',
    hostId: user.uid,
    hostName: players[0]?.name || 'Host',
    status: 'doraemon_setup',
    doraemonPlayers: players,
    doraemonTurnIndex: 0,
    doraemonCurrentPlayerId: players[0]?.id || '',
    doraemonCurrentPlayerName: players[0]?.name || '',
    doraemonDeck: deckIds,
    doraemonCurrentCardId: '',
    doraemonDrawHistory: [],
    doraemonInitialKingCommand: defaultCommand,
    doraemonPinnedKing: null,
    doraemonPinnedQueen: null,
    doraemonPinnedJack: null,
    doraemonCustomRules: {},
    doraemonTotalDrawnCount: 0,
    nightHour: 0,
    stolenHour: 0,
    playerCount: players.length,
    maxPlayers: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(roomRef, roomData);
    return roomId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `rooms/${roomId}`);
    throw error;
  }
}

// 2. Listen to Doraemon Room Document in real-time
export function listenToDoraemonRoom(
  roomId: string,
  onUpdate: (room: FirestoreRoom | null) => void
): Unsubscribe {
  const roomRef = doc(db, 'rooms', roomId);
  return onSnapshot(
    roomRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as FirestoreRoom);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `rooms/${roomId}`);
    }
  );
}

// 3. Update Roster & Turn Order
export async function updateDoraemonRoster(
  roomId: string,
  players: DoraemonPlayerEntry[],
  initialKingCommand?: string
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    const room = snap.data() as FirestoreRoom;

    const turnIdx = (room.doraemonTurnIndex || 0) % (players.length || 1);
    const curr = players[turnIdx] || players[0];

    const updates: Partial<FirestoreRoom> = {
      doraemonPlayers: players,
      playerCount: players.length,
      doraemonTurnIndex: turnIdx,
      doraemonCurrentPlayerId: curr?.id || '',
      doraemonCurrentPlayerName: curr?.name || '',
      updatedAt: new Date().toISOString(),
    };

    if (initialKingCommand !== undefined) {
      updates.doraemonInitialKingCommand = initialKingCommand;
    }

    await updateDoc(roomRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 4. Start Doraemon Game
export async function startDoraemonGame(roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    const room = snap.data() as FirestoreRoom;

    const deck =
      room.doraemonDeck && room.doraemonDeck.length > 0
        ? room.doraemonDeck
        : generateDoraemonDeck().map((c) => c.id);

    const players = room.doraemonPlayers || [];
    const firstPlayer = players[0];

    await updateDoc(roomRef, {
      status: 'doraemon_playing',
      doraemonDeck: deck,
      doraemonTurnIndex: 0,
      doraemonCurrentPlayerId: firstPlayer?.id || '',
      doraemonCurrentPlayerName: firstPlayer?.name || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 5. Draw Card from the Deck (Pass & Play Turn)
export async function drawDoraemonCard(
  roomId: string
): Promise<{ cardId: string; rank: string; isSpecial: boolean } | null> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return null;
    const room = snap.data() as FirestoreRoom;

    let deck = [...(room.doraemonDeck || [])];
    if (deck.length === 0) {
      // Auto reshuffle if deck somehow ran out
      deck = generateDoraemonDeck().map((c) => c.id);
    }

    const cardId = deck.shift();
    if (!cardId) return null;

    const parts = cardId.split('-');
    const rank = parts[1] || 'A';

    const players = [...(room.doraemonPlayers || [])];
    const turnIndex = room.doraemonTurnIndex || 0;
    const activePlayer =
      players[turnIndex % (players.length || 1)] || {
        id: 'p_1',
        name: 'ผู้เล่น',
        order: 1,
      };

    // Update draw count for player
    const updatedPlayers = players.map((p) =>
      p.id === activePlayer.id
        ? { ...p, cardsDrawnCount: (p.cardsDrawnCount || 0) + 1 }
        : p
    );

    const newHistoryItem: DoraemonDrawHistoryItem = {
      cardId,
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [newHistoryItem, ...(room.doraemonDrawHistory || [])].slice(
      0,
      52
    );

    const nextTurnIndex = (turnIndex + 1) % (players.length || 1);
    const nextPlayer = players[nextTurnIndex];

    const updates: Partial<FirestoreRoom> = {
      doraemonDeck: deck,
      doraemonCurrentCardId: cardId,
      doraemonDrawHistory: updatedHistory,
      doraemonPlayers: updatedPlayers,
      doraemonTurnIndex: nextTurnIndex,
      doraemonCurrentPlayerId: nextPlayer?.id || '',
      doraemonCurrentPlayerName: nextPlayer?.name || '',
      doraemonTotalDrawnCount: (room.doraemonTotalDrawnCount || 0) + 1,
      status: deck.length === 0 ? 'doraemon_game_over' : 'doraemon_playing',
      updatedAt: new Date().toISOString(),
    };

    let isSpecial = false;

    // Handle Pinned Special Cards (J, Q, K)
    if (rank === 'J') {
      isSpecial = true;
      updates.doraemonPinnedJack = {
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        ruleText: 'Rule Master: ผู้ถือแจ็คคุมกฎพิเศษ',
        timestamp: new Date().toISOString(),
      };
    } else if (rank === 'Q') {
      isSpecial = true;
      updates.doraemonPinnedQueen = {
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        timestamp: new Date().toISOString(),
      };
    } else if (rank === 'K') {
      isSpecial = true;
      // Active command that this King must perform
      const activeCommand =
        room.doraemonPinnedKing?.command ||
        room.doraemonInitialKingCommand ||
        'เต้นท่าไก่ 10 วิ หรือดื่มหมดแก้ว!';

      updates.doraemonPinnedKing = {
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        command: activeCommand,
        timestamp: new Date().toISOString(),
      };
    }

    await updateDoc(roomRef, updates);
    return { cardId, rank, isSpecial };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
    return null;
  }
}

// 6. Submit New King Command (when a player draws K, they can update the command for the NEXT King)
export async function submitNextKingCommand(
  roomId: string,
  newCommand: string
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    const room = snap.data() as FirestoreRoom;

    if (!room.doraemonPinnedKing) {
      await updateDoc(roomRef, {
        doraemonInitialKingCommand: newCommand.trim(),
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    await updateDoc(roomRef, {
      doraemonPinnedKing: {
        ...room.doraemonPinnedKing,
        command: newCommand.trim(),
        timestamp: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 7. Update Custom Rule Descriptions for A-K
export async function updateDoraemonCustomRules(
  roomId: string,
  customRules: Record<string, string>
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    await updateDoc(roomRef, {
      doraemonCustomRules: customRules,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 8. Reset Game / Play Again with Fresh Deck
export async function resetDoraemonGame(roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    const room = snap.data() as FirestoreRoom;

    const freshDeck = generateDoraemonDeck().map((c) => c.id);
    const players = (room.doraemonPlayers || []).map((p) => ({
      ...p,
      cardsDrawnCount: 0,
    }));

    await updateDoc(roomRef, {
      status: 'doraemon_playing',
      doraemonDeck: freshDeck,
      doraemonCurrentCardId: '',
      doraemonDrawHistory: [],
      doraemonTurnIndex: 0,
      doraemonCurrentPlayerId: players[0]?.id || '',
      doraemonCurrentPlayerName: players[0]?.name || '',
      doraemonTotalDrawnCount: 0,
      doraemonPlayers: players,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// 9. Back to Setup Screen
export async function backToDoraemonSetup(roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    await updateDoc(roomRef, {
      status: 'doraemon_setup',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}
