/**
 * Barrel Index for TabletopNexus Real-Time Firestore Services.
 *
 * Domain Sub-Modules under `src/firebase/table/`:
 * - `types.ts`: Shared Firestore Room, Player, Phase, Role & Leaderboard interfaces
 * - `roomHelpers.ts`: Shared bot generator, 4-digit room code & player count sync
 * - `leaderboardService.ts`: Unified ELO calculation & real-time leaderboard listener
 * - `roomLifecycleService.ts`: Room creation, 4-digit lookup, seat management, reset & room listeners
 * - `cheeseThiefService.ts`: Official Cheese Thief (4–8 players) state machine & night/follower rules
 * - `insiderService.ts`: Official Oink Games Insider (4–8 players) state machine & 2-stage voting
 */

export * from './table/types';
export * from './table/roomHelpers';
export * from './table/leaderboardService';
export * from './table/roomLifecycleService';
export * from './table/cheeseThiefService';
export * from './table/insiderService';
export * from './table/undercoverService';
export * from './table/detectiveClubService';
export * from './table/avalonService';
