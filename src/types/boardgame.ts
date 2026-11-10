export type GameCategoryId = 'all' | 'social-deduction' | 'bluffing' | 'strategy' | 'party';

export interface GameCategory {
  id: GameCategoryId;
  nameTh: string;
  nameEn: string;
  description: string;
}

export interface BoardGame {
  id: string;
  slug:
    | 'cheese-thief'
    | 'insider'
    | 'undercover'
    | 'detective-club'
    | 'avalon'
    | 'hues-cues'
    | 'werewolf-night'
    | 'catan-frontier';
  titleTh: string;
  titleEn: string;
  categoryId: Exclude<GameCategoryId, 'all'>;
  categoryLabel: string;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number;
  difficulty: 'ง่าย' | 'ปานกลาง' | 'เข้มข้น';
  masterServerSupported: boolean;
  playableOnline: boolean;
  activeRoomsCount: number;
  onlinePlayersCount: number;
  forumThreadsCount: number;
  coverImage: string;
  shortSummary: string;
  rulesOverview: string[];
  rolesList: {
    name: string;
    faction: 'good' | 'evil' | 'neutral';
    ability: string;
  }[];
}

export interface RoomChatMessage {
  id: string;
  roomId: string;
  senderName: string;
  senderRoleTag?: string;
  content: string;
  createdAt: string;
}

export interface MasterServerRoom {
  id: string;
  roomCode: string;
  gameId: BoardGame['slug'];
  gameTitleTh: string;
  roomName: string;
  hostName: string;
  region: 'TH-BKK-1' | 'TH-BKK-2' | 'SEA-SG-1';
  status: 'waiting' | 'in_progress' | 'finished';
  currentPlayers: number;
  maxPlayers: number;
  rankRequirement: string;
  isPrivate: boolean;
  players: {
    id: string;
    name: string;
    elo: number;
    isReady: boolean;
    isHost?: boolean;
  }[];
  chatMessages: RoomChatMessage[];
  updatedAt: string;
}

export type ThreadTag = 'ทั้งหมด' | 'เทคนิคการเล่น' | 'หาเพื่อนตี้' | 'วิเคราะห์เมต้า' | 'พูดคุยทั่วไป';

export interface ForumComment {
  id: string;
  threadId: string;
  authorName: string;
  authorRankTitle: string;
  authorElo: number;
  content: string;
  createdAt: string;
  likes: number;
}

export interface ForumThread {
  id: string;
  gameId: BoardGame['slug'];
  gameTitleTh: string;
  tag: Exclude<ThreadTag, 'ทั้งหมด'>;
  title: string;
  content: string;
  authorName: string;
  authorRankTitle: string;
  authorElo: number;
  createdAt: string;
  likes: number;
  views: number;
  isPinned?: boolean;
  comments: ForumComment[];
}

export interface PlayerRankingEntry {
  id: string;
  playerName: string;
  rankTitle: string;
  overallElo: number;
  totalMatches: number;
  wins: number;
  winRate: number;
  signatureGameId: BoardGame['slug'];
  signatureGameTitle: string;
  signatureRole: string;
  streak: number;
  gameStats: Record<
    BoardGame['slug'],
    {
      elo: number;
      matches: number;
      wins: number;
      winRate: number;
    }
  >;
}

export interface DatabaseTableSchema {
  tableName: string;
  domainGroup: 'Core Catalog' | 'Master Server & Matchmaking' | 'Community Sub-Forums' | 'Ranking & Telemetry';
  description: string;
  scalingStrategy: string;
  columns: {
    name: string;
    type: string;
    constraints: string;
    note: string;
  }[];
  indexes: string[];
}

// ==========================================
// Playable Game 1: หนูขโมยชีส (Cheese Thief)
// ==========================================
export type CheeseRole = 'thief' | 'accomplice' | 'sleepyhead';

export interface CheesePlayerSeat {
  id: string;
  name: string;
  isHuman: boolean;
  role: CheeseRole;
  dieValue: number; // 1..6 wake up hour
  wokeUpWith: string[]; // names of players who woke at same hour
  peekedTargetId?: string;
  peekedInfo?: string;
  statement: string;
  votedForId: string | null;
  votesReceived: number;
}

export type CheeseGamePhase = 'TITLE' | 'NIGHT_ROLL' | 'ACCOMPLICE_PEEK' | 'MORNING_DEBATE' | 'VOTE_RESULT';

export interface CheeseGameState {
  phase: CheeseGamePhase;
  roundNumber: number;
  players: CheesePlayerSeat[];
  centerDieValue: number;
  cheeseStolenHour: number;
  thiefId: string;
  accompliceId: string;
  humanPeekTargetId: string | null;
  humanVoteTargetId: string | null;
  mostVotedPlayerId: string | null;
  thiefCaught: boolean | null;
  humanWon: boolean | null;
  eloDelta: number;
  nightTimelineLog: {
    hour: number;
    awakeNames: string[];
    cheeseAction: string;
  }[];
}

// ==========================================
// Playable Game 2: Avalon (ศึกอัศวินโต๊ะกลม)
// ==========================================
export type AvalonRole = 'Merlin' | 'Percival' | 'Loyal Knight' | 'Morgana' | 'Assassin';

export interface AvalonPlayerSeat {
  id: string;
  name: string;
  isHuman: boolean;
  role: AvalonRole;
  faction: 'good' | 'evil';
  isLeader: boolean;
  onQuestTeam: boolean;
  lastVote: 'approve' | 'reject' | null;
}

export type AvalonPhase =
  | 'TITLE'
  | 'TEAM_PROPOSAL'
  | 'TEAM_VOTE'
  | 'QUEST_EXECUTION'
  | 'ASSASSINATION'
  | 'GAME_OVER';

export interface AvalonQuestSlot {
  questNumber: number;
  teamSize: number;
  status: 'pending' | 'success' | 'fail';
  failVotesCount: number;
}

export interface AvalonGameState {
  phase: AvalonPhase;
  currentQuestIndex: number; // 0..4
  rejectedVotesTrack: number; // 0..4
  leaderIndex: number;
  players: AvalonPlayerSeat[];
  selectedTeamIds: string[];
  quests: AvalonQuestSlot[];
  lastQuestFailCount: number;
  assassinatedTargetId: string | null;
  winnerFaction: 'good' | 'evil' | null;
  winReason: string;
  humanWon: boolean | null;
  eloDelta: number;
  actionLog: string[];
}

// ==========================================
// WebSocket Protocol Events
// ==========================================
export type ServerWsEvent =
  | {
      type: 'init:state';
      payload: {
        rooms: MasterServerRoom[];
        threads: ForumThread[];
        leaderboard: PlayerRankingEntry[];
        onlineClients: number;
      };
    }
  | { type: 'presence:count'; payload: { onlineClients: number } }
  | { type: 'thread:created'; payload: ForumThread }
  | { type: 'thread:liked'; payload: { threadId: string; likes: number } }
  | { type: 'comment:created'; payload: { threadId: string; comment: ForumComment } }
  | { type: 'room:created'; payload: MasterServerRoom }
  | { type: 'room:updated'; payload: MasterServerRoom }
  | { type: 'room:chat'; payload: { roomId: string; message: RoomChatMessage } }
  | {
      type: 'leaderboard:updated';
      payload: {
        leaderboard: PlayerRankingEntry[];
        matchSummary: {
          playerName: string;
          gameId: BoardGame['slug'];
          won: boolean;
          eloDelta: number;
        };
      };
    };
