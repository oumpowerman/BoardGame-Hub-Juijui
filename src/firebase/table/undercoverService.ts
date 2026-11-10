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
  getRandomUndercoverWordPair,
  UndercoverWordCategoryId,
  UndercoverWordPair,
} from '../../data/undercoverWords';
import {
  FirestoreRoom,
  FirestorePlayer,
  PlayerRoleCard,
  UndercoverClueEntry,
} from './types';
import {
  ensureMinimumPlayersWithBots,
  isAutoControlledSeat,
} from './roomHelpers';
import { recordGameEloUpdates } from './leaderboardService';

// Helper: Return alive players ordered by randomized undercoverTurnOrderIds
export function getOrderedAlivePlayers(
  allPlayers: FirestorePlayer[],
  turnOrderIds?: string[],
  eliminatedIds: string[] = []
): FirestorePlayer[] {
  const aliveMap = new Map<string, FirestorePlayer>();
  allPlayers.forEach((p) => {
    if (!eliminatedIds.includes(p.id)) {
      aliveMap.set(p.id, p);
    }
  });

  const ordered: FirestorePlayer[] = [];
  if (turnOrderIds && turnOrderIds.length > 0) {
    turnOrderIds.forEach((id) => {
      const found = aliveMap.get(id);
      if (found) {
        ordered.push(found);
        aliveMap.delete(id);
      }
    });
  }

  // Append any remaining alive players not in turnOrderIds
  aliveMap.forEach((p) => ordered.push(p));
  return ordered;
}

// U-1. Update Lobby Configuration (Mr. White toggle, category, clue timer)
export async function updateUndercoverLobbySettings(
  roomId: string,
  enableMrWhite: boolean,
  category: UndercoverWordCategoryId,
  clueDurationSeconds: number = 45
): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      enableMrWhite,
      undercoverCategory: category,
      clueDurationSeconds,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// U-2. Set Custom / AI Generated Word Pair into Room Lobby
export async function setUndercoverWordPair(
  roomId: string,
  pair: UndercoverWordPair
): Promise<void> {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      undercoverCivilianWord: pair.civilianWord,
      undercoverSpyWord: pair.undercoverWord,
      undercoverCategoryLabel: pair.categoryLabel,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// U-3. Start Undercover Game & Deal Roles
export async function startUndercoverGameAndDealRoles(
  roomId: string
): Promise<void> {
  const user = await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    const roomData = roomSnap.data() as FirestoreRoom | undefined;
    const players = await ensureMinimumPlayersWithBots(roomId, 4);

    const totalPlayers = players.length;
    const enableMrWhite = roomData?.enableMrWhite ?? true;

    // Distribution:
    // 4-6 players: 1 Undercover, (1 Mr. White if enabled), rest Civilians
    // 7-10 players: 2 Undercovers, (1 Mr. White if enabled), rest Civilians
    const undercoverCount = totalPlayers >= 7 ? 2 : 1;
    const mrWhiteCount = enableMrWhite ? 1 : 0;

    // Prepare role pool
    const roles: PlayerRoleCard[] = [];
    for (let i = 0; i < undercoverCount; i++) {
      roles.push('undercover_spy');
    }
    for (let i = 0; i < mrWhiteCount; i++) {
      roles.push('undercover_mrwhite');
    }
    while (roles.length < totalPlayers) {
      roles.push('undercover_civilian');
    }

    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // Pick Word Pair (if not already set via AI)
    let pickedPair: UndercoverWordPair;
    if (roomData?.undercoverCivilianWord && roomData?.undercoverSpyWord) {
      pickedPair = {
        id: 'preset',
        civilianWord: roomData.undercoverCivilianWord,
        undercoverWord: roomData.undercoverSpyWord,
        category: (roomData.undercoverCategory as UndercoverWordCategoryId) || 'all',
        categoryLabel: roomData.undercoverCategoryLabel || 'กำหนดเอง',
        hint: '',
      };
    } else {
      pickedPair = getRandomUndercoverWordPair(
        (roomData?.undercoverCategory as UndercoverWordCategoryId) || 'all'
      );
    }

    let mrWhitePlayerId = '';

    for (let i = 0; i < players.length; i++) {
      const isBotOrFriend = isAutoControlledSeat(players[i], user.uid);
      const role = roles[i];
      let assignedWord = '';

      if (role === 'undercover_civilian') {
        assignedWord = pickedPair.civilianWord;
      } else if (role === 'undercover_spy') {
        assignedWord = pickedPair.undercoverWord;
      } else if (role === 'undercover_mrwhite') {
        assignedWord = ''; // Mr. White has no word
        mrWhitePlayerId = players[i].id;
      }

      await updateDoc(doc(db, 'rooms', roomId, 'players', players[i].id), {
        role,
        undercoverWord: assignedWord,
        isUndercoverEliminated: false,
        roleAcknowledged: isBotOrFriend,
        currentRoundClue: '',
        cluesSubmitted: [],
        voteTargetId: '',
      });
    }

    // Randomize speaking turn order (Fisher-Yates shuffle)
    const turnOrderIds = players.map((p) => p.id);
    for (let i = turnOrderIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [turnOrderIds[i], turnOrderIds[j]] = [turnOrderIds[j], turnOrderIds[i]];
    }

    // Rule: Mr. White is NEVER placed as 1st speaker (index 0) so they can hear at least one clue first
    if (
      mrWhitePlayerId &&
      turnOrderIds.length > 1 &&
      turnOrderIds[0] === mrWhitePlayerId
    ) {
      const swapIdx = 1 + Math.floor(Math.random() * (turnOrderIds.length - 1));
      [turnOrderIds[0], turnOrderIds[swapIdx]] = [
        turnOrderIds[swapIdx],
        turnOrderIds[0],
      ];
    }

    const firstSpeakerId = turnOrderIds[0] || players[0].id;
    const duration = roomData?.clueDurationSeconds || 45;
    const deadline = new Date(Date.now() + duration * 1000).toISOString();

    await updateDoc(roomRef, {
      status: 'undercover_deal',
      undercoverCivilianWord: pickedPair.civilianWord,
      undercoverSpyWord: pickedPair.undercoverWord,
      undercoverCategoryLabel: pickedPair.categoryLabel,
      mrWhitePlayerId,
      undercoverTurnOrderIds: turnOrderIds,
      undercoverTurnIndex: 0,
      undercoverRoundNumber: 1,
      undercoverTurnPlayerId: firstSpeakerId,
      undercoverTurnDeadline: deadline,
      clueDurationSeconds: duration,
      undercoverEliminatedIds: [],
      undercoverRoundVerdictPending: false,
      undercoverLastEliminatedId: '',
      undercoverLastEliminatedName: '',
      mrWhiteGuessedWord: '',
      mrWhiteGuessSuccess: false,
      undercoverHistory: [],
      winnerTeam: 'in_progress',
      accusedPlayerId: '',
      playerCount: totalPlayers,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// U-4. Acknowledge Undercover Role (Peek Secret Word)
export async function acknowledgeUndercoverRole(roomId: string): Promise<void> {
  const user = await ensureAuthUser();
  const playerRef = doc(db, 'rooms', roomId, 'players', user.uid);

  try {
    await updateDoc(playerRef, {
      roleAcknowledged: true,
    });

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const allPlayers = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
    const allAcknowledged = allPlayers.every(
      (p) => p.id === user.uid || p.roleAcknowledged === true
    );

    if (allAcknowledged) {
      const roomSnap = await getDoc(doc(db, 'rooms', roomId));
      const roomData = roomSnap.data() as FirestoreRoom | undefined;
      const duration = roomData?.clueDurationSeconds || 45;
      const deadline = new Date(Date.now() + duration * 1000).toISOString();

      const orderedAlive = getOrderedAlivePlayers(
        allPlayers,
        roomData?.undercoverTurnOrderIds,
        roomData?.undercoverEliminatedIds || []
      );
      const firstPlayerData = orderedAlive[0] || allPlayers[0];

      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'undercover_clue',
        undercoverTurnIndex: 0,
        undercoverTurnPlayerId: firstPlayerData.id,
        undercoverTurnDeadline: deadline,
        updatedAt: new Date().toISOString(),
      });

      // If the first player is a bot, simulate their clue automatically
      if (isAutoControlledSeat(firstPlayerData, user.uid)) {
        setTimeout(() => {
          autoSimulateBotClue(roomId, firstPlayerData);
        }, 1200);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// Generate realistic Thai bot clue based on the word or pretend
function generateBotClueText(word: string, isMrWhite: boolean): string {
  if (isMrWhite) {
    const neutralClues = [
      'เป็นสิ่งที่เราทุกคนต้องเคยพบเจอในชีวิต',
      'มีประโยชน์และคนชอบใช้กันเยอะ',
      'สามารถหาซื้อหรือสัมผัสได้ทั่วไป',
      'มีความสำคัญและสร้างความสุขให้เรา',
      'เกี่ยวข้องกับกิจวัตรประจำวันของหลายๆ คน',
    ];
    return neutralClues[Math.floor(Math.random() * neutralClues.length)];
  }

  // Clue based on actual secret word
  const cluesMap: Record<string, string[]> = {
    ชานมไข่มุก: ['เคี้ยวหนุบหนับ สั่งหวานน้อยได้', 'ใส่แก้วพลาสติก มีหลอดขนาดใหญ่'],
    กาแฟเย็น: ['ดื่มตอนเช้าช่วยให้ตื่นสดชื่น', 'มีกลิ่นหอมคั่วบด รสชาติเข้มข้น'],
    หมูกระทะ: ['กลิ่นหอมฟุ้งตอนเย็น ล้อมวงกับเพื่อนๆ', 'มีช่องใส่น้ำซุปและที่ย่างหมู'],
    ชาบู: ['จุ่มเนื้อสไลซ์บางๆ ในน้ำซุปเดือดๆ', 'กินคู่กับน้ำจิ้มพอนสึและงาขาว'],
    ข้าวมันไก่: ['มีไก่ต้มเนื้อนุ่มและน้ำจิ้มเต้าเจี้ยว', 'ข้าวมันหอมกระเทียม มีแตงกวาเคียง'],
    ข้าวหมูกรอบ: ['หนังกรอบฟู ราดน้ำซอสสีแดงเข้มข้น', 'อาหารจานด่วนร้านอาหารตามสั่ง'],
    ส้มตำ: ['ตำในครกดินเผา มีมะละกอสับกรอบๆ', 'รสชาติเปรี้ยวหวานเค็มเผ็ดแซ่บ'],
    ยำวุ้นเส้น: ['เส้นใสนุ่ม คลุกเคล้าหมูสับและกุ้ง', 'รสแซ่บจัดจ้าน โรยขึ้นฉ่ายและถั่ว'],
    พิซซ่า: ['ถาดกลมแบ่งเป็นชิ้นสามเหลี่ยม ชีสเยิ้ม', 'มีขอบกรอบ แป้งหนานุ่มหรือบางกรอบ'],
    แฮมเบอร์เกอร์: ['ประกบด้วยขนมปังสองชิ้น ตรงกลางมีไส้', 'กินคู่กับเฟรนช์ฟรายส์และซอสมะเขือเทศ'],
    แว่นตา: ['มีเลนส์ใสช่วยให้มองภาพชัดเจนขึ้น', 'พับเก็บใส่กล่อง วางไว้ข้างเตียงตอนนอน'],
    แว่นกันแดด: ['เลนส์สีเข้ม ใส่ไปเที่ยวทะเลหรือขับรถ', 'ป้องกันแสงแดดจ้าเข้าตา'],
    แปรงสีฟัน: ['มีขนแปรงเรียวเล็ก ด้ามจับกระชับมือ', 'เปลี่ยนใหม่ทุก 3 เดือน'],
    ยาสีฟัน: ['บีบออกจากหลอด ให้ความรู้สึกเย็นสดชื่น', 'มีฟลูออไรด์ป้องกันฟันผุ'],
    หูฟังบลูทูธ: ['ใส่กระชับกับหู ไม่มีสายเกะกะ', 'มีเคสชาร์จขนาดพกพาได้'],
    ลำโพงพกพา: ['เปิดเสียงดังฟังได้หลายคนพร้อมกัน', 'เชื่อมต่อไร้สาย แบตเตอรี่อึด'],
    พัดลม: ['มีใบพัดหมุนส่ายไปมา ปรับเบอร์ได้', 'เสียบปลั๊กกดสวิตช์ มีลมเย็นเป่าใส่'],
    'เครื่องปรับอากาศ (แอร์)': ['ติดไว้บนผนังห้อง มีรีโมตควบคุม', 'ปล่อยลมเย็นฉ่ำ สบายตัวในวันที่อากาศร้อน'],
    มอเตอร์ไซค์: ['บิดคันเร่ง ซอกแซกบนถนนตอนรถติด', 'ต้องสวมหมวกกันน็อกเพื่อความปลอดภัย'],
    จักรยาน: ['ใช้เท้าออกแรงปั่น มีโซ่และบันได', 'ปั่นออกกำลังกายรับลมตอนเย็น'],
    สุนัข: ['ส่งเสียงเห่า กระดิกหางต้อนรับเจ้าของ', 'เพื่อนผู้ซื่อสัตย์ ชอบวิ่งคาบลูกบอล'],
    แมว: ['ส่งเสียงร้องเหมียวๆ ชอบนอนคลอเคลีย', 'มีขนปุยอุ้งเท้านุ่ม ชอบนอนทั้งวัน'],
    เสือ: ['ลายพาดกลอนสง่างาม คำรามเสียงกึกก้อง', 'นักล่าแห่งป่าดงดิบ ว่องไวและปราดเปรียว'],
    สิงโต: ['เจ้าป่าตัวผู้มีแผงคอสีน้ำตาลหนา', 'อยู่รวมกันเป็นฝูงบนทุ่งหญ้าสะวันนา'],
    โลมา: ['ฉลาดแสนรู้ กระโดดหมุนตัวเหนือน้ำ', 'ใช้คลื่นโซนาร์สื่อสาร เป็นมิตรกับมนุษย์'],
    วาฬ: ['ยักษ์ใหญ่ใจดี พ่นน้ำขึ้นมาจากหลัง', 'ว่ายน้ำอย่างสง่างามในมหาสมุทรลึก'],
    ห้างสรรพสินค้า: ['ติดแอร์เย็นฉ่ำ มีหลายชั้นและบันไดเลื่อน', 'มีโซนร้านอาหาร โรงหนัง และแบรนด์เนม'],
    ตลาดนัดกลางคืน: ['เปิดไฟสว่างตอนค่ำ มีของกินสตรีทฟู้ดเพียบ', 'เดินเบียดคนเยอะ ซื้อของกินเล่นริมทาง'],
    สนามบิน: ['มีรันเวย์ยาว ผู้โดยสารลากกระเป๋าเดินทาง', 'ขึ้นเครื่องบินไปต่างประเทศหรือต่างจังหวัด'],
    โรงภาพยนตร์: ['จอขนาดยักษ์ แอร์หนาว มีป๊อปคอร์นถังใหญ่', 'ก่อนเริ่มหนังต้องปิดเสียงโทรศัพท์'],
    TikTok: ['เลื่อนฟีดดูคลิปสั้นเพลินจนลืมเวลา', 'มีเพลงฮิตและฟิลเตอร์ชาเลนจ์สนุกๆ'],
    YouTube: ['มีคลิปวิดีโอรายการยาวๆ ให้ดูฟรีย้อนหลัง', 'มีปุ่มกด Subscribe และกระดิ่งแจ้งเตือน'],
  };

  const pool = cluesMap[word];
  if (pool && pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return `มีเอกลักษณ์เฉพาะตัวและมักพบในหมวดนี้ (${word.slice(0, 2)}...)`;
}

// Internal Bot Clue Simulator
async function autoSimulateBotClue(
  roomId: string,
  botPlayer: FirestorePlayer
): Promise<void> {
  const isMrWhite = botPlayer.role === 'undercover_mrwhite';
  const clue = generateBotClueText(botPlayer.undercoverWord || '', isMrWhite);
  await submitUndercoverClue(roomId, clue, botPlayer.id);
}

// U-5. Submit Undercover Clue (or Skip)
export async function submitUndercoverClue(
  roomId: string,
  clueText: string,
  asPlayerId?: string
): Promise<void> {
  const user = await ensureAuthUser();
  const activePlayerId = asPlayerId || user.uid;
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    const roomData = roomSnap.data() as FirestoreRoom | undefined;
    if (!roomData || roomData.status !== 'undercover_clue') return;

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const allPlayers = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
    const eliminatedIds = roomData.undercoverEliminatedIds || [];

    // Filter alive players ordered by randomized turn order
    const alivePlayers = getOrderedAlivePlayers(
      allPlayers,
      roomData.undercoverTurnOrderIds,
      eliminatedIds
    );

    const player = allPlayers.find((p) => p.id === activePlayerId);
    if (!player) return;

    // Record clue on player
    const cluesGiven = player.cluesSubmitted || [];
    const formattedClue = (clueText || 'พูดใบ้ต่อหน้าเรียบร้อยแล้ว').trim();
    await updateDoc(doc(db, 'rooms', roomId, 'players', activePlayerId), {
      currentRoundClue: formattedClue,
      cluesSubmitted: [...cluesGiven, formattedClue],
    });

    // Append to room history
    const entry: UndercoverClueEntry = {
      round: roomData.undercoverRoundNumber || 1,
      playerId: activePlayerId,
      playerName: player.name,
      clue: formattedClue,
      timestamp: new Date().toISOString(),
    };
    const history = [...(roomData.undercoverHistory || []), entry];

    // Find current turn index among alive players
    const currentAliveIndex = alivePlayers.findIndex(
      (p) => p.id === activePlayerId
    );
    const nextAliveIndex = currentAliveIndex + 1;

    // Check if this round of clues is finished
    if (nextAliveIndex >= alivePlayers.length) {
      // Transition to Elimination Vote Phase
      // Reset all players' voteTargetId
      for (const p of allPlayers) {
        await updateDoc(doc(db, 'rooms', roomId, 'players', p.id), {
          voteTargetId: '',
        });
      }

      await updateDoc(roomRef, {
        status: 'undercover_vote',
        undercoverHistory: history,
        accusedPlayerId: '',
        updatedAt: new Date().toISOString(),
      });

      // Auto-trigger bot votes after brief discussion delay
      setTimeout(() => {
        simulateBotVotes(roomId);
      }, 1800);
    } else {
      // Advance to next alive player's turn
      const nextPlayer = alivePlayers[nextAliveIndex];
      const duration = roomData.clueDurationSeconds || 45;
      const deadline = new Date(Date.now() + duration * 1000).toISOString();

      await updateDoc(roomRef, {
        undercoverTurnIndex: nextAliveIndex,
        undercoverTurnPlayerId: nextPlayer.id,
        undercoverTurnDeadline: deadline,
        undercoverHistory: history,
        updatedAt: new Date().toISOString(),
      });

      // If next player is auto-controlled bot, trigger their clue
      if (isAutoControlledSeat(nextPlayer, user.uid)) {
        setTimeout(() => {
          autoSimulateBotClue(roomId, nextPlayer);
        }, 1200);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// U-6. Submit Vote for Suspect in Undercover
export async function submitUndercoverVote(
  roomId: string,
  targetPlayerId: string,
  asPlayerId?: string
): Promise<void> {
  const user = await ensureAuthUser();
  const voterId = asPlayerId || user.uid;
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    const roomData = roomSnap.data() as FirestoreRoom | undefined;
    if (!roomData || roomData.status !== 'undercover_vote') return;

    await updateDoc(doc(db, 'rooms', roomId, 'players', voterId), {
      voteTargetId: targetPlayerId,
    });

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const allPlayers = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
    const eliminatedIds = roomData.undercoverEliminatedIds || [];
    const alivePlayers = allPlayers.filter(
      (p) => !eliminatedIds.includes(p.id)
    );

    // Check if all alive players have voted
    const allAliveVoted = alivePlayers.every((p) =>
      p.id === voterId ? Boolean(targetPlayerId) : Boolean(p.voteTargetId)
    );

    if (allAliveVoted) {
      // Tally votes
      const voteCounts: Record<string, number> = {};
      alivePlayers.forEach((p) => {
        const target = p.id === voterId ? targetPlayerId : p.voteTargetId;
        if (target) {
          voteCounts[target] = (voteCounts[target] || 0) + 1;
        }
      });

      let highestVoteCount = -1;
      let eliminatedTargetId = '';
      for (const [pId, count] of Object.entries(voteCounts)) {
        if (count > highestVoteCount) {
          highestVoteCount = count;
          eliminatedTargetId = pId;
        }
      }

      if (!eliminatedTargetId && alivePlayers.length > 0) {
        eliminatedTargetId = alivePlayers[0].id;
      }

      const eliminatedPlayer = allPlayers.find(
        (p) => p.id === eliminatedTargetId
      );
      const isMrWhite = eliminatedPlayer?.role === 'undercover_mrwhite';

      if (isMrWhite) {
        // Mr. White gets 1 chance to guess the Civilians' secret word!
        await updateDoc(roomRef, {
          status: 'undercover_mrwhite_guess',
          accusedPlayerId: eliminatedTargetId,
          updatedAt: new Date().toISOString(),
        });

        // If Mr. White is a bot, auto-guess after 2 seconds
        if (
          eliminatedPlayer &&
          isAutoControlledSeat(eliminatedPlayer, user.uid)
        ) {
          setTimeout(() => {
            simulateBotMrWhiteGuess(roomId, eliminatedPlayer);
          }, 2000);
        }
      } else {
        // Eliminate player and check win conditions
        await processEliminationAndContinue(roomId, eliminatedTargetId);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// U-7. Bot Vote Simulator
async function simulateBotVotes(roomId: string): Promise<void> {
  const user = await ensureAuthUser();
  try {
    const roomSnap = await getDoc(doc(db, 'rooms', roomId));
    const roomData = roomSnap.data() as FirestoreRoom | undefined;
    if (!roomData || roomData.status !== 'undercover_vote') return;

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const allPlayers = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
    const eliminatedIds = roomData.undercoverEliminatedIds || [];
    const alivePlayers = allPlayers.filter(
      (p) => !eliminatedIds.includes(p.id)
    );

    for (const p of alivePlayers) {
      if (isAutoControlledSeat(p, user.uid) && !p.voteTargetId) {
        // Pick random other alive player to vote
        const candidates = alivePlayers.filter((cand) => cand.id !== p.id);
        const target =
          candidates[Math.floor(Math.random() * candidates.length)];
        if (target) {
          await submitUndercoverVote(roomId, target.id, p.id);
        }
      }
    }
  } catch (error) {
    // Ignore transient bot vote error
  }
}

// U-8. Submit Mr. White Word Guess
export async function submitMrWhiteGuess(
  roomId: string,
  guessedWord: string
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    const roomData = roomSnap.data() as FirestoreRoom | undefined;
    if (!roomData || roomData.status !== 'undercover_mrwhite_guess') return;

    const civilianWord = (roomData.undercoverCivilianWord || '').trim().toLowerCase();
    const cleanGuess = (guessedWord || '').trim().toLowerCase();

    // Check match: exact or substring match
    const isCorrect =
      cleanGuess.length > 0 &&
      (cleanGuess === civilianWord ||
        civilianWord.includes(cleanGuess) ||
        cleanGuess.includes(civilianWord));

      if (isCorrect) {
        // Mr. White wins!
        await updateDoc(roomRef, {
          status: 'undercover_game_over',
          mrWhiteGuessedWord: guessedWord,
          mrWhiteGuessSuccess: true,
          winnerTeam: 'mr_white',
          updatedAt: new Date().toISOString(),
        });
        const playersSnap = await getDocs(
          collection(db, 'rooms', roomId, 'players')
        );
        const players = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
        await recordGameEloUpdates(
          players,
          'สายลับสลับคำ (Undercover)',
          (p) => p.role === 'undercover_mrwhite'
        );
      } else {
      // Mr. White guessed wrong -> Mr. White is eliminated, check game conditions
      const mrWhiteId = roomData.accusedPlayerId || roomData.mrWhitePlayerId || '';
      await updateDoc(roomRef, {
        mrWhiteGuessedWord: guessedWord,
        mrWhiteGuessSuccess: false,
        updatedAt: new Date().toISOString(),
      });
      await processEliminationAndContinue(roomId, mrWhiteId);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// Bot Mr. White Guess Simulation
async function simulateBotMrWhiteGuess(
  roomId: string,
  _mrWhitePlayer: FirestorePlayer
): Promise<void> {
  const roomSnap = await getDoc(doc(db, 'rooms', roomId));
  const roomData = roomSnap.data() as FirestoreRoom | undefined;
  if (!roomData) return;

  // Bot has 30% chance to guess right for exciting drama
  const civilianWord = roomData.undercoverCivilianWord || '';
  const guess =
    Math.random() < 0.3 ? civilianWord : 'สิ่งของอะไรบางอย่าง';
  await submitMrWhiteGuess(roomId, guess);
}

// U-9. Process Elimination & Evaluate Win Condition
async function processEliminationAndContinue(
  roomId: string,
  eliminatedPlayerId: string
): Promise<void> {
  const user = await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    const roomData = roomSnap.data() as FirestoreRoom | undefined;
    if (!roomData) return;

    // Mark player eliminated
    if (eliminatedPlayerId) {
      await updateDoc(
        doc(db, 'rooms', roomId, 'players', eliminatedPlayerId),
        {
          isUndercoverEliminated: true,
        }
      );
    }

    const currentEliminated = new Set([
      ...(roomData.undercoverEliminatedIds || []),
      eliminatedPlayerId,
    ]);
    const updatedEliminatedList = Array.from(currentEliminated);

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const allPlayers = playersSnap.docs.map((d) => d.data() as FirestorePlayer);

    const remainingAlive = allPlayers.filter(
      (p) => !currentEliminated.has(p.id)
    );

    const aliveCivilians = remainingAlive.filter(
      (p) => p.role === 'undercover_civilian'
    );
    const aliveSpies = remainingAlive.filter(
      (p) => p.role === 'undercover_spy'
    );
    const aliveMrWhite = remainingAlive.filter(
      (p) => p.role === 'undercover_mrwhite'
    );

    let winnerTeam: FirestoreRoom['winnerTeam'] = 'in_progress';

    // Condition A: All Undercovers and Mr. White eliminated -> Civilians win
    if (aliveSpies.length === 0 && aliveMrWhite.length === 0) {
      winnerTeam = 'civilians';
    }
    // Condition B: Undercovers outnumber or equal Civilians (and Mr. White eliminated) -> Undercover wins
    else if (aliveSpies.length >= aliveCivilians.length && aliveMrWhite.length === 0) {
      winnerTeam = 'undercover';
    }
    // Condition C: Only 2 players remaining and one is Mr. White -> Mr. White or Undercover wins
    else if (remainingAlive.length <= 2) {
      if (aliveMrWhite.length > 0) {
        winnerTeam = 'mr_white';
      } else if (aliveSpies.length > 0) {
        winnerTeam = 'undercover';
      } else {
        winnerTeam = 'civilians';
      }
    }

    const eliminatedPlayer = allPlayers.find(
      (p) => p.id === eliminatedPlayerId
    );

    if (winnerTeam !== 'in_progress') {
      // Game Over
      await updateDoc(roomRef, {
        status: 'undercover_game_over',
        undercoverEliminatedIds: updatedEliminatedList,
        undercoverRoundVerdictPending: false,
        undercoverLastEliminatedId: eliminatedPlayerId,
        undercoverLastEliminatedName: eliminatedPlayer?.name || '',
        ...(eliminatedPlayer?.role
          ? { undercoverLastEliminatedRole: eliminatedPlayer.role }
          : {}),
        winnerTeam,
        updatedAt: new Date().toISOString(),
      });
      await recordGameEloUpdates(
        allPlayers,
        'สายลับสลับคำ (Undercover)',
        (p) =>
          (winnerTeam === 'civilians' && p.role === 'undercover_civilian') ||
          (winnerTeam === 'undercover' && p.role === 'undercover_spy') ||
          (winnerTeam === 'mr_white' && p.role === 'undercover_mrwhite')
      );
    } else {
      // Pause on Round Elimination Verdict Banner so players clearly see who was eliminated,
      // what their role was, and why the game continues to the next round!
      await updateDoc(roomRef, {
        status: 'undercover_vote',
        undercoverRoundVerdictPending: true,
        undercoverLastEliminatedId: eliminatedPlayerId,
        undercoverLastEliminatedName: eliminatedPlayer?.name || '',
        ...(eliminatedPlayer?.role
          ? { undercoverLastEliminatedRole: eliminatedPlayer.role }
          : {}),
        undercoverEliminatedIds: updatedEliminatedList,
        accusedPlayerId: eliminatedPlayerId,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// U-9B. Advance from Round Elimination Verdict to Next Clue Round
export async function advanceToNextUndercoverRound(
  roomId: string
): Promise<void> {
  const user = await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    const roomData = roomSnap.data() as FirestoreRoom | undefined;
    if (!roomData) return;

    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    const allPlayers = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
    const eliminatedIds = roomData.undercoverEliminatedIds || [];

    // Reset currentRoundClue and voteTargetId for next round
    for (const p of allPlayers) {
      await updateDoc(doc(db, 'rooms', roomId, 'players', p.id), {
        currentRoundClue: '',
        voteTargetId: '',
      });
    }

    const orderedAlive = getOrderedAlivePlayers(
      allPlayers,
      roomData.undercoverTurnOrderIds,
      eliminatedIds
    );
    const firstAlivePlayer = orderedAlive[0];
    if (!firstAlivePlayer) return;

    const nextRoundNumber = (roomData.undercoverRoundNumber || 1) + 1;
    const duration = roomData.clueDurationSeconds || 45;
    const deadline = new Date(Date.now() + duration * 1000).toISOString();

    await updateDoc(roomRef, {
      status: 'undercover_clue',
      undercoverRoundVerdictPending: false,
      undercoverRoundNumber: nextRoundNumber,
      undercoverTurnIndex: 0,
      undercoverTurnPlayerId: firstAlivePlayer.id,
      undercoverTurnDeadline: deadline,
      accusedPlayerId: '',
      updatedAt: new Date().toISOString(),
    });

    // If first alive player is bot, trigger clue automatically
    if (isAutoControlledSeat(firstAlivePlayer, user.uid)) {
      setTimeout(() => {
        autoSimulateBotClue(roomId, firstAlivePlayer);
      }, 1200);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// U-10. Rematch Undercover Game
export async function rematchUndercoverGame(roomId: string): Promise<void> {
  await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const playersSnap = await getDocs(
      collection(db, 'rooms', roomId, 'players')
    );
    for (const docSnap of playersSnap.docs) {
      await updateDoc(docSnap.ref, {
        role: undefined,
        undercoverWord: '',
        isUndercoverEliminated: false,
        roleAcknowledged: false,
        currentRoundClue: '',
        cluesSubmitted: [],
        voteTargetId: '',
      });
    }

    await updateDoc(roomRef, {
      status: 'lobby',
      undercoverCivilianWord: '',
      undercoverSpyWord: '',
      mrWhitePlayerId: '',
      undercoverTurnOrderIds: [],
      undercoverTurnIndex: 0,
      undercoverRoundNumber: 1,
      undercoverTurnPlayerId: '',
      undercoverEliminatedIds: [],
      undercoverRoundVerdictPending: false,
      undercoverLastEliminatedId: '',
      undercoverLastEliminatedName: '',
      mrWhiteGuessedWord: '',
      mrWhiteGuessSuccess: false,
      undercoverHistory: [],
      winnerTeam: 'in_progress',
      accusedPlayerId: '',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}
