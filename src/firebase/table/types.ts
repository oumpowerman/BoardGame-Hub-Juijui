import { InsiderWordCategoryId } from '../../data/insiderWords';

export type GamePhase =
  | 'lobby'
  | 'role_deal'
  | 'dice_roll'
  | 'night_phases'
  | 'follower_phase'
  | 'voting'
  | 'word_reveal'
  | 'question_phase'
  | 'discussion_guesser_vote'
  | 'general_vote'
  | 'game_over'
  // Undercover phases
  | 'undercover_deal'
  | 'undercover_clue'
  | 'undercover_vote'
  | 'undercover_mrwhite_guess'
  | 'undercover_game_over'
  // Detective Club phases
  | 'dc_word_entry'
  | 'dc_card_rounds'
  | 'dc_discussion'
  | 'dc_voting'
  | 'dc_scoring'
  // Avalon phases
  | 'avalon_role_reveal'
  | 'avalon_team_selection'
  | 'avalon_team_vote'
  | 'avalon_quest_vote'
  | 'avalon_quest_result'
  | 'avalon_assassination'
  | 'avalon_scoring'
  | 'avalon_game_over'
  // Hues and Cues phases
  | 'hc_clue_1'
  | 'hc_guess_1'
  | 'hc_clue_2'
  | 'hc_guess_2'
  | 'hc_scoring'
  | 'hc_game_over';

export type PlayerRoleCard =
  | 'cheese_thief'
  | 'sleepy_mouse'
  | 'fall_mouse'
  | 'insider_master'
  | 'insider_traitor'
  | 'insider_common'
  // Undercover roles
  | 'undercover_civilian'
  | 'undercover_spy'
  | 'undercover_mrwhite'
  // Detective Club roles
  | 'dc_active_player'
  | 'dc_detective'
  | 'dc_conspirator'
  // Avalon roles
  | 'avalon_merlin'
  | 'avalon_percival'
  | 'avalon_loyal_servant'
  | 'avalon_assassin'
  | 'avalon_morgana'
  | 'avalon_mordred'
  | 'avalon_oberon'
  | 'avalon_minion'
  // Hues and Cues roles
  | 'hc_clue_giver'
  | 'hc_guesser';

export interface UndercoverClueEntry {
  round: number;
  playerId: string;
  playerName: string;
  clue: string;
  timestamp: string;
}

export interface AvalonQuestResult {
  questIndex: number;
  teamSize: number;
  successCount: number;
  failCount: number;
  passed: boolean;
}

export interface HuesCuesGuessEntry {
  uid: string;
  playerName: string;
  avatarUrl?: string;
  tileId: string;
  roundStep: 1 | 2;
  updatedBy?: 'phone' | 'ipad';
  updatedAt: string;
}

export interface FirestoreRoom {
  id: string;
  roomCode: string;
  roomName?: string;
  gameId: 'cheese-thief' | 'insider' | 'undercover' | 'detective-club' | 'avalon' | 'hues-cues';
  hostId: string;
  hostName: string;
  status: GamePhase;
  nightHour: number; // 0 = not started, 1..6 = active night hour, 7 = morning
  stolenHour: number; // Hour cheese was stolen (1..6)
  cheeseStolen?: boolean; // Whether the thief has grabbed the cheese in their hour
  enableFallMouse?: boolean; // Special mode for 6-8 players
  followerIds?: string[]; // UIDs of players who became Followers (ลูกน้อง)
  cheeseNightDuration?: number; // Duration in seconds per night hour (default 10)
  cheeseNightPaused?: boolean; // Whether night countdown is paused by host
  // Insider Specific Fields
  wordCategory?: InsiderWordCategoryId;
  wordCategoryLabel?: string;
  secretWord?: string;
  insiderEyesOpen?: boolean;
  quizDurationSeconds?: number;
  elapsedQuizSeconds?: number;
  guesserPlayerId?: string;
  guesserPlayerName?: string;
  masterLastSignal?: 'yes' | 'no' | 'unsure' | '';
  masterSignalCount?: number;
  guesserVoteResult?: 'accused_guesser' | 'spared_guesser' | 'timeout_loss' | '';
  guesserYesVotes?: number;
  guesserNoVotes?: number;
  insiderTurnOrderIds?: string[];
  // Undercover Specific Fields
  undercoverCategory?: string;
  undercoverCategoryLabel?: string;
  undercoverCivilianWord?: string;
  undercoverSpyWord?: string;
  enableMrWhite?: boolean;
  undercoverTurnOrderIds?: string[];
  undercoverTurnIndex?: number;
  undercoverRoundNumber?: number;
  undercoverTurnPlayerId?: string;
  undercoverTurnDeadline?: string;
  clueDurationSeconds?: number;
  undercoverEliminatedIds?: string[];
  undercoverRoundVerdictPending?: boolean;
  undercoverLastEliminatedId?: string;
  undercoverLastEliminatedName?: string;
  undercoverLastEliminatedRole?: PlayerRoleCard;
  mrWhitePlayerId?: string;
  mrWhiteGuessedWord?: string;
  mrWhiteGuessSuccess?: boolean;
  undercoverHistory?: UndercoverClueEntry[];
  // Detective Club Specific Fields
  dcSecretWord?: string;
  dcActivePlayerId?: string;
  dcConspiratorId?: string;
  dcRoundNumber?: number;
  dcCardRound?: number;
  dcTurnOrderIds?: string[];
  dcTurnIndex?: number;
  dcCardPlacedPlayerIds?: string[];
  dcSpeakerIndex?: number;
  dcDiscussionDurationSeconds?: number;
  dcVotes?: Record<string, string>;
  dcScores?: Record<string, number>;
  dcRoundSummary?: {
    caught: boolean;
    conspiratorName: string;
    secretWord: string;
    pointsAwarded: Record<string, number>;
  };
  // Avalon Specific Fields
  avalonTargetPlayers?: number;
  avalonRoleMode?: 'auto' | 'manual';
  avalonEnableMerlin?: boolean;
  avalonEnableAssassin?: boolean;
  avalonEnablePercival?: boolean;
  avalonEnableMorgana?: boolean;
  avalonEnableMordred?: boolean;
  avalonEnableOberon?: boolean;
  avalonLeaderId?: string;
  avalonCurrentQuestIndex?: number;
  avalonProposedTeamIds?: string[];
  avalonTeamVotes?: Record<string, 'approve' | 'reject'>;
  avalonRejectedTeamsCount?: number;
  avalonQuestVotes?: Record<string, 'success' | 'fail'>;
  avalonQuestResults?: AvalonQuestResult[];
  avalonGoodWinsCount?: number;
  avalonEvilWinsCount?: number;
  avalonAssassinationTargetId?: string;
  avalonAssassinationSuccess?: boolean;
  // Hues and Cues Specific Fields
  hcIpadConnected?: boolean;
  hcIpadLastSeen?: string;
  hcRoundNumber?: number;
  hcClueGiverId?: string;
  hcClueGiverName?: string;
  hcSecretTileId?: string;
  hcCandidateTileIds?: string[];
  hcClue1?: string;
  hcClue2?: string;
  hcGuesses?: Record<string, HuesCuesGuessEntry>;
  hcScores?: Record<string, number>;
  hcRoundScores?: Record<string, number>;
  winnerTeam:
    | 'mice'
    | 'thief'
    | 'fall_mouse'
    | 'commons'
    | 'insider'
    | 'civilians'
    | 'undercover'
    | 'mr_white'
    | 'detectives'
    | 'conspirator'
    | 'good'
    | 'evil'
    | 'nobody'
    | 'in_progress'
    | 'none';
  accusedPlayerId?: string;
  playerCount?: number;
  maxPlayers?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FirestorePlayer {
  id: string;
  name: string;
  avatarUrl?: string;
  isHost: boolean;
  isReady: boolean;
  isFriendSeat?: boolean;
  role?: PlayerRoleCard;
  isFollower?: boolean; // True if converted/chosen as Follower (ลูกน้อง) during Night Phase
  roleAcknowledged?: boolean;
  diceHour?: number; // Chosen wake-up hour (1 to 6)
  secondaryDiceHour?: number; // 2nd die in 4-player mode (Thief wakes on both hours)
  rolledDicePair?: number[]; // Raw rolled dice in cup (1 die for 5-8p, 2 dice for 4p)
  hasGrabbedCheese?: boolean;
  peekedTargetId?: string; // Sleepyhead solo wake action: peeked 1 player's cup
  peekedTargetName?: string;
  peekedDiceValue?: number;
  guesserJudgmentVote?: 'yes_insider' | 'no_innocent' | ''; // Stage 1 vote in Insider
  voteTargetId?: string; // Accused player UID
  // Undercover Specific Fields
  undercoverWord?: string;
  isUndercoverEliminated?: boolean;
  currentRoundClue?: string;
  cluesSubmitted?: string[];
  // Detective Club Specific Fields
  dcNotebookWord?: string;
  dcVoteTargetId?: string;
  dcTotalScore?: number;
  // Avalon Specific Fields
  avalonTeamVoteChoice?: 'approve' | 'reject' | '';
  avalonQuestVoteChoice?: 'success' | 'fail' | '';
  // Hues and Cues Specific Fields
  hcSelectedTileId?: string;
  hcTotalScore?: number;
  joinedAt: string;
}

export interface FirestoreLeaderboardEntry {
  id: string;
  playerName: string;
  overallElo: number;
  matchesPlayed: number;
  wins: number;
  winRate: number;
  favoriteGame: string;
  updatedAt: string;
}
