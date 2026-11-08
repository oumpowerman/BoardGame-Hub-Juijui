import {
  AvalonGameState,
  AvalonPlayerSeat,
  AvalonQuestSlot,
  AvalonRole,
  BoardGame,
  CheeseGameState,
  CheesePlayerSeat,
  CheeseRole,
  ForumThread,
  GameCategoryId,
  PlayerRankingEntry,
  ThreadTag,
} from '../types/boardgame';

// =========================================================
// 1. ELO & Ranking Pure Calculations
// =========================================================
export function getRankTitleFromElo(elo: number): string {
  if (elo >= 1900) return 'Supreme Grandmaster';
  if (elo >= 1800) return 'Grandmaster Tactician';
  if (elo >= 1700) return 'Diamond Strategist';
  if (elo >= 1600) return 'Platinum Challenger';
  return 'Gold Adventurer';
}

export function calculateEloDelta(playerElo: number, tableAvgElo: number, won: boolean): number {
  const kFactor = 32;
  const expectedScore = 1 / (1 + Math.pow(10, (tableAvgElo - playerElo) / 400));
  const actualScore = won ? 1 : 0;
  const rawDelta = Math.round(kFactor * (actualScore - expectedScore));
  if (won) return Math.max(12, rawDelta);
  return Math.min(-10, rawDelta);
}

export function applyMatchResultToLeaderboard(
  leaderboard: PlayerRankingEntry[],
  playerName: string,
  gameId: BoardGame['slug'],
  won: boolean,
  eloDelta: number
): PlayerRankingEntry[] {
  const updated = leaderboard.map((entry) => {
    if (entry.playerName !== playerName) return entry;

    const currentGameStat = entry.gameStats[gameId] || {
      elo: 1500,
      matches: 0,
      wins: 0,
      winRate: 0,
    };

    const newGameElo = Math.max(1000, currentGameStat.elo + eloDelta);
    const newGameMatches = currentGameStat.matches + 1;
    const newGameWins = currentGameStat.wins + (won ? 1 : 0);
    const newGameWinRate = Number(((newGameWins / newGameMatches) * 100).toFixed(1));

    const newTotalMatches = entry.totalMatches + 1;
    const newTotalWins = entry.wins + (won ? 1 : 0);
    const newOverallWinRate = Number(((newTotalWins / newTotalMatches) * 100).toFixed(1));
    const newOverallElo = Math.max(1000, entry.overallElo + eloDelta);

    return {
      ...entry,
      overallElo: newOverallElo,
      rankTitle: getRankTitleFromElo(newOverallElo),
      totalMatches: newTotalMatches,
      wins: newTotalWins,
      winRate: newOverallWinRate,
      streak: won ? entry.streak + 1 : 0,
      gameStats: {
        ...entry.gameStats,
        [gameId]: {
          elo: newGameElo,
          matches: newGameMatches,
          wins: newGameWins,
          winRate: newGameWinRate,
        },
      },
    };
  });

  return [...updated].sort((a, b) => b.overallElo - a.overallElo);
}

export function filterAndSortLeaderboard(
  leaderboard: PlayerRankingEntry[],
  gameFilter: 'all' | BoardGame['slug'],
  searchQuery: string
): PlayerRankingEntry[] {
  const q = searchQuery.trim().toLowerCase();
  const filtered = leaderboard.filter((entry) => {
    if (!q) return true;
    return (
      entry.playerName.toLowerCase().includes(q) ||
      entry.rankTitle.toLowerCase().includes(q) ||
      entry.signatureRole.toLowerCase().includes(q)
    );
  });

  return [...filtered].sort((a, b) => {
    if (gameFilter === 'all') {
      return b.overallElo - a.overallElo;
    }
    const eloA = a.gameStats[gameFilter]?.elo ?? 0;
    const eloB = b.gameStats[gameFilter]?.elo ?? 0;
    return eloB - eloA;
  });
}

// =========================================================
// 2. Catalog & Sub-Forum Pure Filtering
// =========================================================
export function filterBoardGames(
  games: BoardGame[],
  categoryId: GameCategoryId,
  searchQuery: string
): BoardGame[] {
  const q = searchQuery.trim().toLowerCase();
  return games.filter((g) => {
    const matchesCategory = categoryId === 'all' || g.categoryId === categoryId;
    if (!matchesCategory) return false;
    if (!q) return true;
    return (
      g.titleTh.toLowerCase().includes(q) ||
      g.titleEn.toLowerCase().includes(q) ||
      g.shortSummary.toLowerCase().includes(q) ||
      g.categoryLabel.toLowerCase().includes(q)
    );
  });
}

export function filterForumThreads(
  threads: ForumThread[],
  gameFilter: 'all' | BoardGame['slug'],
  tagFilter: ThreadTag,
  searchQuery: string
): ForumThread[] {
  const q = searchQuery.trim().toLowerCase();
  return threads
    .filter((t) => {
      if (gameFilter !== 'all' && t.gameId !== gameFilter) return false;
      if (tagFilter !== 'ทั้งหมด' && t.tag !== tagFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.authorName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
}

// =========================================================
// 3. Playable Game Engine 1: หนูขโมยชีส (Cheese Thief)
// =========================================================
const CHEESE_BOT_NAMES = [
  'NamoCheeseKing',
  'PloySherlock',
  'KornTabletop',
  'TonBluffMaster',
  'MewSleepyRat',
];

export function createCheeseThiefGame(seedValues?: {
  humanRole?: CheeseRole;
  diceRolls?: number[];
  centerDie?: number;
}): CheeseGameState {
  const rolesPool: CheeseRole[] = [
    'thief',
    'accomplice',
    'sleepyhead',
    'sleepyhead',
    'sleepyhead',
    'sleepyhead',
  ];

  // Deterministic or randomized role assignment
  const assignedRoles: CheeseRole[] = [...rolesPool];
  if (seedValues?.humanRole) {
    const idx = assignedRoles.indexOf(seedValues.humanRole);
    if (idx > 0) {
      const temp = assignedRoles[0];
      assignedRoles[0] = assignedRoles[idx];
      assignedRoles[idx] = temp;
    }
  } else {
    for (let i = assignedRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [assignedRoles[i], assignedRoles[j]] = [assignedRoles[j], assignedRoles[i]];
    }
  }

  const dice =
    seedValues?.diceRolls && seedValues.diceRolls.length === 6
      ? seedValues.diceRolls
      : Array.from({ length: 6 }, () => Math.floor(Math.random() * 6) + 1);

  const centerDieValue = seedValues?.centerDie ?? (Math.floor(Math.random() * 6) + 1);

  const seats: CheesePlayerSeat[] = [
    {
      id: 'seat-0',
      name: 'นักสืบโต๊ะกลม (คุณ)',
      isHuman: true,
      role: assignedRoles[0],
      dieValue: dice[0],
      wokeUpWith: [],
      statement: '',
      votedForId: null,
      votesReceived: 0,
    },
    ...CHEESE_BOT_NAMES.map((name, i) => ({
      id: `seat-${i + 1}`,
      name,
      isHuman: false,
      role: assignedRoles[i + 1],
      dieValue: dice[i + 1],
      wokeUpWith: [],
      statement: '',
      votedForId: null,
      votesReceived: 0,
    })),
  ];

  const thiefSeat = seats.find((s) => s.role === 'thief')!;
  const accompliceSeat = seats.find((s) => s.role === 'accomplice')!;
  const cheeseStolenHour = thiefSeat.dieValue;

  // Populate wokeUpWith and timeline
  const nightTimelineLog: CheeseGameState['nightTimelineLog'] = [];
  for (let hour = 1; hour <= 6; hour++) {
    const awakeSeats = seats.filter((s) => s.dieValue === hour);
    const awakeNames = awakeSeats.map((s) => s.name);
    awakeSeats.forEach((seat) => {
      seat.wokeUpWith = awakeSeats.filter((other) => other.id !== seat.id).map((o) => o.name);
    });

    let cheeseAction = 'ไม่มีใครตื่นในชั่วโมงนี้ ชีสยังวางอยู่ที่เดิม';
    if (awakeSeats.length > 0) {
      if (hour === cheeseStolenHour) {
        if (awakeSeats.length === 1) {
          cheeseAction = `${thiefSeat.name} ตื่นมาคนเดียวและแอบฉกชีสก้อนทองไปอย่างเงียบเชียบ!`;
        } else {
          cheeseAction = `เกิดเหตุชุลมุน! มีผู้ตื่นพร้อมกัน ${awakeSeats.length} คน และชีสก้อนทองถูกขโมยไปในชั่วโมงนี้!`;
        }
      } else if (hour < cheeseStolenHour) {
        cheeseAction = `${awakeNames.join(', ')} ลืมตาขึ้นมาดู เห็นชีสยังวางอยู่ครบถ้วน`;
      } else {
        cheeseAction = `${awakeNames.join(', ')} ลืมตาขึ้นมาพบว่าชีสก้อนทองหายไปแล้ว!`;
      }
    }

    nightTimelineLog.push({ hour, awakeNames, cheeseAction });
  }

  // Generate morning statements based on role & wake-up events
  seats.forEach((seat) => {
    if (seat.role === 'thief') {
      const safeFakeHour = ((seat.dieValue + 2) % 6) + 1;
      if (seat.wokeUpWith.length > 0) {
        seat.statement = `"ฉันตื่นตอนตี ${seat.dieValue}:00 น. พร้อมกับ ${seat.wokeUpWith[0]} แล้วเห็นเขาเอื้อมมือหยิบชีสต่อหน้าต่อตา!"`;
      } else {
        seat.statement = `"ฉันตื่นตอนตี ${safeFakeHour}:00 น. คนเดียว ตอนนั้นชีสยังวางอยู่กลางโต๊ะปกติเลยนะ"`;
      }
    } else if (seat.role === 'accomplice') {
      const innocentTarget = seats.find(
        (s) => s.id !== seat.id && s.id !== thiefSeat.id && !s.isHuman
      ) || seats[1];
      seat.statement = `"ฉันรู้มาว่าลูกเต๋ากองกลางคือเลข ${centerDieValue} และเมื่อคืน ${innocentTarget.name} ดูมีพิรุธมากตอนเช้ามืด!"`;
    } else {
      if (seat.dieValue === cheeseStolenHour && seat.wokeUpWith.includes(thiefSeat.name)) {
        seat.statement = `"ฉันตื่นตี ${seat.dieValue}:00 น. พร้อมกับ ${thiefSeat.name} แล้วชีสก็หายไปต่อหน้าเลย เขาคือขโมยแน่นอน!"`;
      } else if (seat.dieValue < cheeseStolenHour) {
        seat.statement = `"ฉันตื่นตี ${seat.dieValue}:00 น. ตอนนั้นชีสยังอยู่ดี แปลว่าขโมยต้องตื่นหลังจากตี ${seat.dieValue}:00 น. แน่นอน"`;
      } else {
        seat.statement = `"ฉันตื่นตี ${seat.dieValue}:00 น. ชีสหายไปแล้ว! คนที่ตื่นก่อนหน้านี้ต้องมีหนูขโมยชีสซ่อนอยู่"`;
      }
    }
  });

  return {
    phase: 'NIGHT_ROLL',
    roundNumber: 1,
    players: seats,
    centerDieValue,
    cheeseStolenHour,
    thiefId: thiefSeat.id,
    accompliceId: accompliceSeat.id,
    humanPeekTargetId: null,
    humanVoteTargetId: null,
    mostVotedPlayerId: null,
    thiefCaught: null,
    humanWon: null,
    eloDelta: 0,
    nightTimelineLog,
  };
}

export function performCheesePeek(state: CheeseGameState, targetSeatId: string): CheeseGameState {
  const target = state.players.find((p) => p.id === targetSeatId);
  if (!target) return state;

  const updatedPlayers = state.players.map((p) => {
    if (!p.isHuman) return p;
    const roleNameTh =
      target.role === 'thief'
        ? 'หนูขโมยชีส (Cheese Thief)'
        : target.role === 'accomplice'
        ? 'ลูกสมุนหนู (Accomplice)'
        : 'หนูขี้เซา (Sleepy Mouse)';
    return {
      ...p,
      peekedTargetId: targetSeatId,
      peekedInfo: `${target.name} ทอยได้ตี ${target.dieValue}:00 น. · บทบาท: ${roleNameTh}`,
    };
  });

  return {
    ...state,
    phase: 'MORNING_DEBATE',
    humanPeekTargetId: targetSeatId,
    players: updatedPlayers,
  };
}

export function submitCheeseVote(state: CheeseGameState, votedTargetId: string): CheeseGameState {
  const voteCounts: Record<string, number> = {};
  state.players.forEach((p) => {
    voteCounts[p.id] = 0;
  });

  const updatedPlayers = state.players.map((seat) => {
    let chosenId = votedTargetId;
    if (!seat.isHuman) {
      if (seat.role === 'thief' || seat.role === 'accomplice') {
        // Evil votes for an innocent player
        const innocent = state.players.find(
          (p) => p.id !== state.thiefId && p.id !== state.accompliceId && p.id !== seat.id
        );
        chosenId = innocent ? innocent.id : state.players[0].id;
      } else {
        // Good players who witnessed the thief or follow human lead
        if (seat.dieValue === state.cheeseStolenHour) {
          chosenId = state.thiefId;
        } else {
          chosenId = votedTargetId;
        }
      }
    }
    voteCounts[chosenId] = (voteCounts[chosenId] || 0) + 1;
    return {
      ...seat,
      votedForId: chosenId,
    };
  });

  let mostVotedPlayerId = updatedPlayers[0].id;
  let maxVotes = -1;
  updatedPlayers.forEach((p) => {
    const count = voteCounts[p.id] || 0;
    p.votesReceived = count;
    if (count > maxVotes) {
      maxVotes = count;
      mostVotedPlayerId = p.id;
    }
  });

  const thiefCaught = mostVotedPlayerId === state.thiefId;
  const humanPlayer = updatedPlayers.find((p) => p.isHuman)!;
  const humanIsGood = humanPlayer.role === 'sleepyhead';
  const humanWon = humanIsGood ? thiefCaught : !thiefCaught;
  const eloDelta = calculateEloDelta(1650, 1710, humanWon);

  return {
    ...state,
    phase: 'VOTE_RESULT',
    players: updatedPlayers,
    humanVoteTargetId: votedTargetId,
    mostVotedPlayerId,
    thiefCaught,
    humanWon,
    eloDelta,
  };
}

// =========================================================
// 4. Playable Game Engine 2: Avalon (ศึกอัศวินโต๊ะกลม)
// =========================================================
const AVALON_BOT_NAMES = [
  'ArthurPendragonTH',
  'MerlinWhisper',
  'MorganaShadow',
  'SirLancelot99',
];

const QUEST_TEAM_SIZES = [2, 3, 2, 3, 3];

export function createAvalonGame(preferredHumanRole?: AvalonRole): AvalonGameState {
  const roles: AvalonRole[] = ['Merlin', 'Percival', 'Loyal Knight', 'Morgana', 'Assassin'];
  if (preferredHumanRole) {
    const idx = roles.indexOf(preferredHumanRole);
    if (idx > 0) {
      [roles[0], roles[idx]] = [roles[idx], roles[0]];
    }
  } else {
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }
  }

  const players: AvalonPlayerSeat[] = [
    {
      id: 'av-0',
      name: 'นักสืบโต๊ะกลม (คุณ)',
      isHuman: true,
      role: roles[0],
      faction: roles[0] === 'Morgana' || roles[0] === 'Assassin' ? 'evil' : 'good',
      isLeader: true,
      onQuestTeam: false,
      lastVote: null,
    },
    ...AVALON_BOT_NAMES.map((name, i) => {
      const r = roles[i + 1];
      return {
        id: `av-${i + 1}`,
        name,
        isHuman: false,
        role: r,
        faction: (r === 'Morgana' || r === 'Assassin' ? 'evil' : 'good') as 'good' | 'evil',
        isLeader: false,
        onQuestTeam: false,
        lastVote: null,
      };
    }),
  ];

  const quests: AvalonQuestSlot[] = QUEST_TEAM_SIZES.map((teamSize, idx) => ({
    questNumber: idx + 1,
    teamSize,
    status: 'pending',
    failVotesCount: 0,
  }));

  return {
    phase: 'TEAM_PROPOSAL',
    currentQuestIndex: 0,
    rejectedVotesTrack: 0,
    leaderIndex: 0,
    players,
    selectedTeamIds: ['av-0', 'av-1'],
    quests,
    lastQuestFailCount: 0,
    assassinatedTargetId: null,
    winnerFaction: null,
    winReason: '',
    humanWon: null,
    eloDelta: 0,
    actionLog: [
      'เริ่มกระดานศึกอัศวินโต๊ะกลม! คุณได้รับบทบาทลับและเป็นหัวหน้าทีมในภารกิจที่ 1 (ต้องการอัศวิน 2 คน)',
    ],
  };
}

export function toggleAvalonTeamMember(state: AvalonGameState, playerId: string): AvalonGameState {
  if (state.phase !== 'TEAM_PROPOSAL') return state;
  const requiredSize = state.quests[state.currentQuestIndex].teamSize;
  const exists = state.selectedTeamIds.includes(playerId);
  let nextSelected = [...state.selectedTeamIds];

  if (exists) {
    nextSelected = nextSelected.filter((id) => id !== playerId);
  } else {
    if (nextSelected.length >= requiredSize) {
      nextSelected = [...nextSelected.slice(1), playerId];
    } else {
      nextSelected.push(playerId);
    }
  }

  return {
    ...state,
    selectedTeamIds: nextSelected,
  };
}

export function confirmAvalonTeamProposal(state: AvalonGameState): AvalonGameState {
  const requiredSize = state.quests[state.currentQuestIndex].teamSize;
  if (state.selectedTeamIds.length !== requiredSize) return state;

  const updatedPlayers = state.players.map((p) => ({
    ...p,
    onQuestTeam: state.selectedTeamIds.includes(p.id),
    lastVote: null,
  }));

  const teamNames = updatedPlayers
    .filter((p) => p.onQuestTeam)
    .map((p) => p.name)
    .join(', ');

  return {
    ...state,
    phase: 'TEAM_VOTE',
    players: updatedPlayers,
    actionLog: [
      `เสนอชื่อทีมภารกิจที่ ${state.currentQuestIndex + 1}: [${teamNames}] — รออัศวินทั้งโต๊ะโหวตอนุมัติ`,
      ...state.actionLog,
    ],
  };
}

export function voteOnAvalonTeam(
  state: AvalonGameState,
  humanVote: 'approve' | 'reject'
): AvalonGameState {
  if (state.phase !== 'TEAM_VOTE') return state;

  let approveCount = 0;
  const updatedPlayers = state.players.map((p) => {
    let vote: 'approve' | 'reject' = humanVote;
    if (!p.isHuman) {
      const teamHasEvil = state.players.some(
        (member) => state.selectedTeamIds.includes(member.id) && member.faction === 'evil'
      );
      if (p.faction === 'evil') {
        vote = teamHasEvil || state.rejectedVotesTrack >= 3 ? 'approve' : 'reject';
      } else {
        // Good bots approve if on team or if Merlin sees an all-good team
        if (p.role === 'Merlin') {
          vote = teamHasEvil ? 'reject' : 'approve';
        } else {
          vote = p.onQuestTeam || state.rejectedVotesTrack >= 2 ? 'approve' : 'approve';
        }
      }
    }
    if (vote === 'approve') approveCount++;
    return { ...p, lastVote: vote };
  });

  const approved = approveCount >= 3;
  if (!approved) {
    const nextRejected = state.rejectedVotesTrack + 1;
    const nextLeaderIndex = (state.leaderIndex + 1) % state.players.length;

    if (nextRejected >= 5) {
      const humanPlayer = updatedPlayers.find((p) => p.isHuman)!;
      const humanWon = humanPlayer.faction === 'evil';
      return {
        ...state,
        phase: 'GAME_OVER',
        rejectedVotesTrack: nextRejected,
        players: updatedPlayers,
        winnerFaction: 'evil',
        winReason: 'การโหวตจัดทีมล้มเหลวครบ 5 ครั้งติดต่อกัน อาณาจักรคาเมล็อตตกอยู่ในความโกลาหล!',
        humanWon,
        eloDelta: calculateEloDelta(1650, 1780, humanWon),
      };
    }

    return {
      ...state,
      phase: 'TEAM_PROPOSAL',
      rejectedVotesTrack: nextRejected,
      leaderIndex: nextLeaderIndex,
      players: updatedPlayers.map((p, idx) => ({ ...p, isLeader: idx === nextLeaderIndex })),
      actionLog: [
        `มติโหวตไม่ผ่าน (อนุมัติ ${approveCount}/5) — เปลี่ยนหัวหน้าทีมและตั้งทีมใหม่`,
        ...state.actionLog,
      ],
    };
  }

  return {
    ...state,
    phase: 'QUEST_EXECUTION',
    rejectedVotesTrack: 0,
    players: updatedPlayers,
    actionLog: [
      `มติโหวตผ่าน (${approveCount}/5 อนุมัติ)! ทีมอัศวินกำลังเดินทางไปปฏิบัติภารกิจที่ ${state.currentQuestIndex + 1}`,
      ...state.actionLog,
    ],
  };
}

export function executeAvalonQuest(
  state: AvalonGameState,
  humanQuestCard: 'success' | 'fail'
): AvalonGameState {
  if (state.phase !== 'QUEST_EXECUTION') return state;

  const teamMembers = state.players.filter((p) => state.selectedTeamIds.includes(p.id));
  let failVotesCount = 0;

  teamMembers.forEach((member) => {
    if (member.isHuman) {
      if (member.faction === 'evil' && humanQuestCard === 'fail') {
        failVotesCount++;
      }
    } else if (member.faction === 'evil') {
      // Evil bots sabotage quests
      failVotesCount++;
    }
  });

  const questSucceeded = failVotesCount === 0;
  const updatedQuests = state.quests.map((q, idx) =>
    idx === state.currentQuestIndex
      ? {
          ...q,
          status: (questSucceeded ? 'success' : 'fail') as 'success' | 'fail',
          failVotesCount,
        }
      : q
  );

  const successTotal = updatedQuests.filter((q) => q.status === 'success').length;
  const failTotal = updatedQuests.filter((q) => q.status === 'fail').length;
  const humanPlayer = state.players.find((p) => p.isHuman)!;

  if (failTotal >= 3) {
    const humanWon = humanPlayer.faction === 'evil';
    return {
      ...state,
      phase: 'GAME_OVER',
      quests: updatedQuests,
      lastQuestFailCount: failVotesCount,
      winnerFaction: 'evil',
      winReason: 'ฝ่ายสมุนแห่งมอร์เดร็ดทำลายภารกิจสำเร็จครบ 3 รอบ!',
      humanWon,
      eloDelta: calculateEloDelta(1650, 1780, humanWon),
      actionLog: [
        `ภารกิจที่ ${state.currentQuestIndex + 1} ล้มเหลว (พบการ์ดทำลายภารกิจ ${failVotesCount} ใบ) — ฝ่ายมอร์เดร็ดได้รับชัยชนะ!`,
        ...state.actionLog,
      ],
    };
  }

  if (successTotal >= 3) {
    return {
      ...state,
      phase: 'ASSASSINATION',
      quests: updatedQuests,
      lastQuestFailCount: failVotesCount,
      actionLog: [
        `ภารกิจสำเร็จครบ 3 รอบ! เข้าสู่ช่วงสุดท้าย: มือสังหาร (Assassin) เล็งเป้าสังหาร Merlin!`,
        ...state.actionLog,
      ],
    };
  }

  const nextQuestIndex = state.currentQuestIndex + 1;
  const nextLeaderIndex = (state.leaderIndex + 1) % state.players.length;
  const nextRequiredSize = updatedQuests[nextQuestIndex].teamSize;
  const defaultTeam = state.players.slice(0, nextRequiredSize).map((p) => p.id);

  return {
    ...state,
    phase: 'TEAM_PROPOSAL',
    currentQuestIndex: nextQuestIndex,
    leaderIndex: nextLeaderIndex,
    quests: updatedQuests,
    selectedTeamIds: defaultTeam,
    lastQuestFailCount: failVotesCount,
    players: state.players.map((p, idx) => ({
      ...p,
      isLeader: idx === nextLeaderIndex,
      onQuestTeam: defaultTeam.includes(p.id),
    })),
    actionLog: [
      questSucceeded
        ? `ภารกิจที่ ${state.currentQuestIndex + 1} สำเร็จอย่างงดงาม! เตรียมจัดทีมสำหรับภารกิจที่ ${nextQuestIndex + 1}`
        : `ภารกิจที่ ${state.currentQuestIndex + 1} ถูกบ่อนทำลาย (การ์ด Fail ${failVotesCount} ใบ)! เตรียมจัดทีมสำหรับภารกิจที่ ${nextQuestIndex + 1}`,
      ...state.actionLog,
    ],
  };
}

export function resolveAvalonAssassination(
  state: AvalonGameState,
  targetPlayerId: string
): AvalonGameState {
  if (state.phase !== 'ASSASSINATION') return state;

  const target = state.players.find((p) => p.id === targetPlayerId);
  const merlin = state.players.find((p) => p.role === 'Merlin')!;
  const merlinKilled = target?.id === merlin.id;

  const winnerFaction: 'good' | 'evil' = merlinKilled ? 'evil' : 'good';
  const humanPlayer = state.players.find((p) => p.isHuman)!;
  const humanWon = humanPlayer.faction === winnerFaction;

  return {
    ...state,
    phase: 'GAME_OVER',
    assassinatedTargetId: targetPlayerId,
    winnerFaction,
    winReason: merlinKilled
      ? `มือสังหารปลิดชีพ ${merlin.name} (Merlin ตัวจริง) ได้สำเร็จ! ฝ่ายมอร์เดร็ดพลิกกลับมาชนะ!`
      : `มือสังหารทายผิด (เลือก ${target?.name})! ${merlin.name} คือ Merlin ตัวจริง ฝ่ายอัศวินแห่งคาเมล็อตได้รับชัยชนะ!`,
    humanWon,
    eloDelta: calculateEloDelta(1650, 1780, humanWon),
    actionLog: [
      merlinKilled
        ? `มือสังหารชี้ตัว ${merlin.name} ถูกต้อง! Merlin ถูกสังหาร!`
        : `มือสังหารชี้ตัว ${target?.name} แต่ทายผิด! Merlin ตัวจริงคือ ${merlin.name}!`,
      ...state.actionLog,
    ],
  };
}
