import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMatchResultToLeaderboard,
  calculateEloDelta,
  confirmAvalonTeamProposal,
  createAvalonGame,
  createCheeseThiefGame,
  executeAvalonQuest,
  filterAndSortLeaderboard,
  filterBoardGames,
  filterForumThreads,
  performCheesePeek,
  resolveAvalonAssassination,
  submitCheeseVote,
  toggleAvalonTeamMember,
  voteOnAvalonTeam,
} from './gameLogic';
import { BOARD_GAMES } from '../data/seedData';
import { ForumThread, PlayerRankingEntry } from '../types/boardgame';

test('Cheese Thief engine initializes roles, wake-up timeline, and catches thief on vote', () => {
  const state = createCheeseThiefGame({
    humanRole: 'sleepyhead',
    diceRolls: [3, 3, 5, 1, 6, 2],
    centerDie: 4,
  });

  assert.equal(state.phase, 'NIGHT_ROLL');
  assert.equal(state.players.length, 6);
  assert.equal(state.players[0].role, 'sleepyhead');

  const peekedState = performCheesePeek(state, state.thiefId);
  assert.equal(peekedState.phase, 'MORNING_DEBATE');
  assert.equal(peekedState.humanPeekTargetId, state.thiefId);

  const resultState = submitCheeseVote(peekedState, state.thiefId);
  assert.equal(resultState.phase, 'VOTE_RESULT');
  assert.equal(resultState.thiefCaught, true);
  assert.equal(resultState.humanWon, true);
  assert.ok(resultState.eloDelta > 0);
});

test('Avalon engine progresses through team proposal, vote, quest execution, and assassination', () => {
  let state = createAvalonGame('Merlin');
  assert.equal(state.phase, 'TEAM_PROPOSAL');
  assert.equal(state.players[0].role, 'Merlin');

  // Ensure team size is 2 for Quest 1
  const goodMembers = state.players.filter((p) => p.faction === 'good').map((p) => p.id);
  state.selectedTeamIds = [goodMembers[0], goodMembers[1]];
  state = confirmAvalonTeamProposal(state);
  assert.equal(state.phase, 'TEAM_VOTE');

  state = voteOnAvalonTeam(state, 'approve');
  assert.equal(state.phase, 'QUEST_EXECUTION');

  state = executeAvalonQuest(state, 'success');
  assert.equal(state.quests[0].status, 'success');
  assert.equal(state.currentQuestIndex, 1);

  // Toggle team member in Quest 2
  const toggled = toggleAvalonTeamMember(state, goodMembers[2]);
  assert.ok(toggled.selectedTeamIds.length <= 3);

  // Fast-forward to Assassination phase test
  state.phase = 'ASSASSINATION';
  const nonMerlin = state.players.find((p) => p.role !== 'Merlin')!;
  const finalGoodWin = resolveAvalonAssassination(state, nonMerlin.id);
  assert.equal(finalGoodWin.phase, 'GAME_OVER');
  assert.equal(finalGoodWin.winnerFaction, 'good');
  assert.equal(finalGoodWin.humanWon, true);
});

test('ELO delta and leaderboard update sort players accurately', () => {
  const deltaWin = calculateEloDelta(1650, 1750, true);
  const deltaLoss = calculateEloDelta(1650, 1650, false);
  assert.ok(deltaWin >= 12);
  assert.ok(deltaLoss <= -10);

  const sampleLeaderboard: PlayerRankingEntry[] = [
    {
      id: 'p1',
      playerName: 'นักสืบโต๊ะกลม (คุณ)',
      overallElo: 1650,
      rankTitle: 'Platinum Challenger',
      totalMatches: 10,
      wins: 7,
      winRate: 70,
      signatureGameId: 'cheese-thief',
      signatureGameTitle: 'ชีสหนูอยู่ไหน',
      signatureRole: 'Sleepyhead',
      streak: 2,
      gameStats: {
        'cheese-thief': { elo: 1650, matches: 10, wins: 7, winRate: 70 },
        insider: { elo: 1500, matches: 0, wins: 0, winRate: 0 },
        undercover: { elo: 1500, matches: 0, wins: 0, winRate: 0 },
        avalon: { elo: 1500, matches: 0, wins: 0, winRate: 0 },
        'werewolf-night': { elo: 1500, matches: 0, wins: 0, winRate: 0 },
        'catan-frontier': { elo: 1500, matches: 0, wins: 0, winRate: 0 },
      },
    },
    {
      id: 'p2',
      playerName: 'PloySherlock',
      overallElo: 1600,
      rankTitle: 'Platinum Challenger',
      totalMatches: 8,
      wins: 5,
      winRate: 62.5,
      signatureGameId: 'cheese-thief',
      signatureGameTitle: 'ชีสหนูอยู่ไหน',
      signatureRole: 'Cheese Thief',
      streak: 1,
      gameStats: {
        'cheese-thief': { elo: 1600, matches: 8, wins: 5, winRate: 62.5 },
        insider: { elo: 1500, matches: 0, wins: 0, winRate: 0 },
        undercover: { elo: 1500, matches: 0, wins: 0, winRate: 0 },
        avalon: { elo: 1500, matches: 0, wins: 0, winRate: 0 },
        'werewolf-night': { elo: 1500, matches: 0, wins: 0, winRate: 0 },
        'catan-frontier': { elo: 1500, matches: 0, wins: 0, winRate: 0 },
      },
    },
  ];

  const updated = applyMatchResultToLeaderboard(
    sampleLeaderboard,
    'นักสืบโต๊ะกลม (คุณ)',
    'cheese-thief',
    true,
    25
  );
  const hero = updated.find((p) => p.playerName === 'นักสืบโต๊ะกลม (คุณ)')!;
  assert.equal(hero.overallElo, 1675);
  assert.equal(hero.gameStats['cheese-thief'].elo, 1675);

  const cheeseSorted = filterAndSortLeaderboard(updated, 'cheese-thief', '');
  assert.ok(cheeseSorted[0].gameStats['cheese-thief'].elo >= cheeseSorted[1].gameStats['cheese-thief'].elo);
});

test('Catalog and Sub-forum filtering work by category, game slug, and search query', () => {
  const bluffGames = filterBoardGames(BOARD_GAMES, 'bluffing', '');
  assert.equal(bluffGames.length, 1);
  assert.equal(bluffGames[0].slug, 'cheese-thief');

  const deductionGames = filterBoardGames(BOARD_GAMES, 'social-deduction', '');
  assert.ok(deductionGames.some((g) => g.slug === 'insider'));

  const sampleThreads: ForumThread[] = [
    {
      id: 't-1',
      gameId: 'avalon',
      gameTitleTh: 'ศึกอัศวินโต๊ะกลม (Avalon)',
      title: 'เทคนิคการบลัฟฟ์บทบาท Merlin',
      content: 'อย่ารีบชี้คนร้ายตั้งแต่รอบแรก...',
      authorName: 'Arthur99',
      authorRankTitle: 'Grandmaster Tactician',
      authorElo: 1820,
      tag: 'เทคนิคการเล่น',
      likes: 12,
      views: 85,
      comments: [],
      isPinned: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const avalonThreads = filterForumThreads(sampleThreads, 'avalon', 'ทั้งหมด', '');
  assert.equal(avalonThreads.length, 1);
  assert.equal(avalonThreads[0].gameId, 'avalon');
});
