import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_FORUM_THREADS,
  INITIAL_LEADERBOARD,
  INITIAL_MASTER_ROOMS,
} from './src/data/seedData';
import {
  BoardGame,
  ForumComment,
  ForumThread,
  MasterServerRoom,
  PlayerRankingEntry,
  RoomChatMessage,
  ServerWsEvent,
} from './src/types/boardgame';
import { GoogleGenAI, Type } from '@google/genai';
import { getRandomUndercoverWordPair } from './src/data/undercoverWords';
import { getRandomInsiderWord } from './src/data/insiderWords';
import { applyMatchResultToLeaderboard } from './src/utils/gameLogic';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '.server-store.json');

interface ServerStore {
  rooms: MasterServerRoom[];
  threads: ForumThread[];
  leaderboard: PlayerRankingEntry[];
}

function loadStore(): ServerStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as ServerStore;
      // Ignore legacy store files that contained initial seed rooms/threads
      const hasLegacySeed =
        parsed.rooms?.some((r) => r.id === 'room-ct-101') ||
        parsed.threads?.some((t) => t.id === 'thread-ct-1') ||
        parsed.leaderboard?.some((l) => l.id === 'rank-1');
      if (!hasLegacySeed && parsed.rooms && parsed.threads && parsed.leaderboard) {
        return parsed;
      }
    }
  } catch {
    // Fallback to clean empty store
  }
  const cleanStore: ServerStore = {
    rooms: structuredClone(INITIAL_MASTER_ROOMS),
    threads: structuredClone(INITIAL_FORUM_THREADS),
    leaderboard: structuredClone(INITIAL_LEADERBOARD),
  };
  saveStore(cleanStore);
  return cleanStore;
}

function saveStore(store: ServerStore) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Ignore write errors in read-only environments
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  const store = loadStore();

  function broadcast(event: ServerWsEvent) {
    const message = JSON.stringify(event);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  function getOnlineCount(): number {
    let count = 0;
    wss.clients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) count++;
    });
    return Math.max(1, count);
  }

  wss.on('connection', (ws) => {
    const initEvent: ServerWsEvent = {
      type: 'init:state',
      payload: {
        rooms: store.rooms,
        threads: store.threads,
        leaderboard: store.leaderboard,
        onlineClients: getOnlineCount(),
      },
    };
    ws.send(JSON.stringify(initEvent));

    broadcast({
      type: 'presence:count',
      payload: { onlineClients: getOnlineCount() },
    });

    ws.on('close', () => {
      broadcast({
        type: 'presence:count',
        payload: { onlineClients: getOnlineCount() },
      });
    });
  });

  // REST API Endpoints
  app.get('/api/state', (_req, res) => {
    res.json({
      rooms: store.rooms,
      threads: store.threads,
      leaderboard: store.leaderboard,
      onlineClients: getOnlineCount(),
    });
  });

  app.post('/api/threads', (req, res) => {
    const { gameId, gameTitleTh, tag, title, content, authorName, authorRankTitle, authorElo } =
      req.body;

    if (!title || !content || !gameId) {
      res.status(400).json({ error: 'กรุณากรอกหัวข้อและเนื้อหากระทู้ให้ครบถ้วน' });
      return;
    }

    const newThread: ForumThread = {
      id: `thread-${Date.now()}`,
      gameId,
      gameTitleTh: gameTitleTh || 'บอร์ดเกมทั่วไป',
      tag: tag || 'พูดคุยทั่วไป',
      title: String(title).trim(),
      content: String(content).trim(),
      authorName: authorName || 'นักสืบโต๊ะกลม (คุณ)',
      authorRankTitle: authorRankTitle || 'Platinum Challenger',
      authorElo: Number(authorElo) || 1650,
      createdAt: 'เมื่อสักครู่',
      likes: 1,
      views: 1,
      comments: [],
    };

    store.threads = [newThread, ...store.threads];
    saveStore(store);

    broadcast({ type: 'thread:created', payload: newThread });
    res.status(201).json(newThread);
  });

  app.post('/api/threads/:threadId/comments', (req, res) => {
    const { threadId } = req.params;
    const { content, authorName, authorRankTitle, authorElo } = req.body;

    if (!content || !String(content).trim()) {
      res.status(400).json({ error: 'กรุณาพิมพ์ข้อความแสดงความคิดเห็น' });
      return;
    }

    const thread = store.threads.find((t) => t.id === threadId);
    if (!thread) {
      res.status(404).json({ error: 'ไม่พบกระทู้ที่ระบุ' });
      return;
    }

    const newComment: ForumComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      threadId,
      authorName: authorName || 'นักสืบโต๊ะกลม (คุณ)',
      authorRankTitle: authorRankTitle || 'Platinum Challenger',
      authorElo: Number(authorElo) || 1650,
      content: String(content).trim(),
      createdAt: 'เมื่อสักครู่',
      likes: 0,
    };

    if (!thread.comments.some((c) => c.id === newComment.id)) {
      thread.comments.push(newComment);
    }
    saveStore(store);

    broadcast({
      type: 'comment:created',
      payload: { threadId, comment: newComment },
    });
    res.status(201).json(newComment);
  });

  app.post('/api/threads/:threadId/like', (req, res) => {
    const { threadId } = req.params;
    const thread = store.threads.find((t) => t.id === threadId);
    if (!thread) {
      res.status(404).json({ error: 'ไม่พบกระทู้' });
      return;
    }
    thread.likes += 1;
    saveStore(store);
    broadcast({
      type: 'thread:liked',
      payload: { threadId, likes: thread.likes },
    });
    res.json({ threadId, likes: thread.likes });
  });

  app.post('/api/rooms', (req, res) => {
    const {
      gameId,
      gameTitleTh,
      roomName,
      hostName,
      region,
      maxPlayers,
      rankRequirement,
      hostElo,
    } = req.body;

    if (!roomName || !String(roomName).trim()) {
      res.status(400).json({ error: 'กรุณาระบุชื่อห้อง Master Server' });
      return;
    }

    const prefix =
      gameId === 'cheese-thief'
        ? 'CT'
        : gameId === 'avalon'
        ? 'AV'
        : gameId === 'werewolf-night'
        ? 'WW'
        : 'CA';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const host = hostName || 'นักสืบโต๊ะกลม (คุณ)';

    const newRoom: MasterServerRoom = {
      id: `room-${Date.now()}`,
      roomCode: `${prefix}-${randomNum}`,
      gameId: gameId || 'cheese-thief',
      gameTitleTh: gameTitleTh || 'หนูขโมยชีส (Cheese Thief)',
      roomName: String(roomName).trim(),
      hostName: host,
      region: region || 'TH-BKK-1',
      status: 'waiting',
      currentPlayers: 1,
      maxPlayers: Number(maxPlayers) || 6,
      rankRequirement: rankRequirement || 'ทุกระดับ (Open)',
      isPrivate: false,
      updatedAt: 'เมื่อสักครู่',
      players: [
        {
          id: `p-${Date.now()}`,
          name: host,
          elo: Number(hostElo) || 1650,
          isReady: true,
          isHost: true,
        },
      ],
      chatMessages: [
        {
          id: `msg-${Date.now()}`,
          roomId: `room-${Date.now()}`,
          senderName: host,
          senderRoleTag: 'Host',
          content: 'สร้างห้องบน Master Server สำเร็จ! พร้อมรับผู้เล่นเข้าโต๊ะครับ',
          createdAt: new Date().toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ],
    };

    store.rooms = [newRoom, ...store.rooms];
    saveStore(store);

    broadcast({ type: 'room:created', payload: newRoom });
    res.status(201).json(newRoom);
  });

  app.post('/api/rooms/:roomId/join', (req, res) => {
    const { roomId } = req.params;
    const { playerName, playerElo } = req.body;
    const room = store.rooms.find((r) => r.id === roomId);
    if (!room) {
      res.status(404).json({ error: 'ไม่พบห้องที่ระบุ' });
      return;
    }

    const name = playerName || 'นักสืบโต๊ะกลม (คุณ)';
    const alreadyIn = room.players.some((p) => p.name === name);
    if (!alreadyIn && room.currentPlayers < room.maxPlayers) {
      room.players.push({
        id: `p-${Date.now()}`,
        name,
        elo: Number(playerElo) || 1650,
        isReady: true,
      });
      room.currentPlayers = room.players.length;
      room.updatedAt = 'เมื่อสักครู่';
      room.chatMessages.push({
        id: `msg-${Date.now()}`,
        roomId: room.id,
        senderName: name,
        content: 'เข้าร่วมโต๊ะเรียบร้อย พร้อมเริ่มเกมครับ!',
        createdAt: new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
      saveStore(store);
      broadcast({ type: 'room:updated', payload: room });
    }

    res.json(room);
  });

  app.post('/api/rooms/:roomId/chat', (req, res) => {
    const { roomId } = req.params;
    const { senderName, content } = req.body;
    const room = store.rooms.find((r) => r.id === roomId);
    if (!room || !content || !String(content).trim()) {
      res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
      return;
    }

    const message: RoomChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      roomId: room.id,
      senderName: senderName || 'นักสืบโต๊ะกลม (คุณ)',
      content: String(content).trim(),
      createdAt: new Date().toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    room.chatMessages.push(message);
    room.updatedAt = 'เมื่อสักครู่';
    saveStore(store);

    broadcast({
      type: 'room:chat',
      payload: { roomId: room.id, message },
    });
    res.status(201).json(message);
  });

  const geminiApiKey =
    process.env.GEMINI_API_KEY ||
    process.env.gemini_api_key ||
    process.env.VITE_GEMINI_API_KEY ||
    '';

  const ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health / Key Diagnostic endpoint
  app.get('/api/ai/status', (_req, res) => {
    res.json({
      hasKey: Boolean(geminiApiKey && geminiApiKey.trim().length > 0),
      keyLength: geminiApiKey ? geminiApiKey.length : 0,
      prefix: geminiApiKey ? geminiApiKey.slice(0, 6) + '...' : 'none',
    });
  });

  app.post('/api/undercover/generate-words', async (req, res) => {
    const { category, themePrompt } = req.body || {};
    try {
      const prompt = `คุณคือผู้เชี่ยวชาญการคิดคำศัพท์สำหรับปาร์ตี้บอร์ดเกม Undercover (สายลับสลับคำ) ภาษาไทย
ให้สร้างคู่คำศัพท์ภาษาไทย 2 คำ ที่มีความหมายใกล้เคียงกันมาก แต่มีความแตกต่างกันอย่างมีชั้นเชิง
- คำที่ 1: คำสำหรับฝ่ายพลเมือง (civilianWord) เป็นคำภาษาไทยเข้าใจง่ายในชีวิตประจำวัน
- คำที่ 2: คำสำหรับฝ่ายสายลับ Undercover (undercoverWord) มีความคล้ายกับคำแรกมาก
- หมวดหมู่หรือธีมที่ต้องการ: ${themePrompt || category || 'ชีวิตประจำวัน/ของกิน/สถานที่/สัตว์'}
ตอบกลับเฉพาะ JSON ตาม schema: civilianWord, undercoverWord, categoryLabel, hint (คำอธิบายความต่างสั้นๆ 1 ประโยค)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              civilianWord: { type: Type.STRING },
              undercoverWord: { type: Type.STRING },
              categoryLabel: { type: Type.STRING },
              hint: { type: Type.STRING },
            },
            required: ['civilianWord', 'undercoverWord', 'categoryLabel', 'hint'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.civilianWord && parsed.undercoverWord) {
        return res.json({
          id: `ai-${Date.now()}`,
          civilianWord: parsed.civilianWord,
          undercoverWord: parsed.undercoverWord,
          categoryLabel: parsed.categoryLabel || 'AI เจเนอเรต (Gemini Flash)',
          hint: parsed.hint || 'คู่คำสร้างสรรค์โดย Gemini Flash',
          category: 'all',
          isAiGenerated: true,
        });
      }
      throw new Error('Incomplete JSON');
    } catch (err) {
      console.error('Failed to generate Undercover words with Gemini:', err);
      const fallback = getRandomUndercoverWordPair();
      return res.json({
        ...fallback,
        isAiGenerated: false,
        errorDetail: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post('/api/insider/generate-word', async (req, res) => {
    const { category, themePrompt } = req.body || {};
    try {
      const prompt = `คุณคือผู้เชี่ยวชาญการคิดคำศัพท์สำหรับปาร์ตี้บอร์ดเกม Insider (จอมบงการคำใบ้) ภาษาไทย
ให้สร้างคำศัพท์ลับภาษาไทย 1 คำ ที่น่าสนใจ ท้าทาย และเหมาะสำหรับการเล่นทายคำถาม ใช่/ไม่ใช่
- หมวดหมู่หรือธีมที่ต้องการ: ${themePrompt || category || 'อาหาร, สิ่งของ, สถานที่, สัตว์, วัฒนธรรมปาร์ตี้'}
ตอบกลับเฉพาะ JSON ตาม schema: word (คำศัพท์ 1 คำ), categoryLabel (ชื่อหมวดหมู่), hint (คำใบ้สั้นๆ 1 ประโยค)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              categoryLabel: { type: Type.STRING },
              hint: { type: Type.STRING },
            },
            required: ['word', 'categoryLabel', 'hint'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.word) {
        return res.json({
          word: parsed.word,
          categoryLabel: parsed.categoryLabel || 'AI เจเนอเรต (Gemini Flash)',
          hint: parsed.hint || '',
          isAiGenerated: true,
        });
      }
      throw new Error('Incomplete JSON');
    } catch (err) {
      console.error('Failed to generate Insider word with Gemini:', err);
      const fallback = getRandomInsiderWord(category || 'all');
      return res.json({
        word: fallback.word,
        categoryLabel: fallback.categoryLabel,
        hint: '',
        isAiGenerated: false,
        errorDetail: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post('/api/matches/record', (req, res) => {
    const { playerName, gameId, won, eloDelta } = req.body;
    const targetName = playerName || 'นักสืบโต๊ะกลม (คุณ)';
    const targetGame = (gameId || 'cheese-thief') as BoardGame['slug'];
    const isWin = Boolean(won);
    const delta = Number(eloDelta) || (isWin ? 20 : -12);

    store.leaderboard = applyMatchResultToLeaderboard(
      store.leaderboard,
      targetName,
      targetGame,
      isWin,
      delta
    );
    saveStore(store);

    broadcast({
      type: 'leaderboard:updated',
      payload: {
        leaderboard: store.leaderboard,
        matchSummary: {
          playerName: targetName,
          gameId: targetGame,
          won: isWin,
          eloDelta: delta,
        },
      },
    });

    res.json({
      leaderboard: store.leaderboard,
      matchSummary: {
        playerName: targetName,
        gameId: targetGame,
        won: isWin,
        eloDelta: delta,
      },
    });
  });

  // Vite middleware in development, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`TabletopNexus Master Server & WebSocket running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
