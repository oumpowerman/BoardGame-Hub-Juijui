/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BOARD_GAMES, GAME_CATEGORIES } from './data/seedData';
import {
  BoardGame,
  ForumThread,
  GameCategoryId,
  PlayerRankingEntry,
  ServerWsEvent,
  ThreadTag,
} from './types/boardgame';
import { filterBoardGames } from './utils/gameLogic';
import { ActiveSection, Navbar } from './components/Navbar';
import { CategoryFilterBar } from './components/CategoryFilterBar';
import { GameCatalogGrid } from './components/GameCatalogGrid';
import { GameSubForum } from './components/GameSubForum';
import { LeaderboardSection } from './components/LeaderboardSection';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { AuthAccountScreen } from './components/auth/AuthAccountScreen';
import { FriendManagerModal } from './components/friends/FriendManagerModal';
import { CheeseThiefScreen } from './components/cheesethief/CheeseThiefScreen';
import { InsiderScreen } from './components/insider/InsiderScreen';
import { UndercoverScreen } from './components/undercover/UndercoverScreen';
import { DetectiveClubScreen } from './components/detectiveclub/DetectiveClubScreen';
import { AvalonScreen } from './components/avalon/AvalonScreen';
import {
  GameSceneTransition,
  TransitionGameVariant,
} from './components/transitions/GameSceneTransition';
import {
  listenToActiveRooms,
  listenToLeaderboard,
  FirestoreRoom,
  addFriendToRoomSeat,
} from './firebase/tableService';
import {
  getClientUid,
  signOutAccount,
  testFirestoreConnection,
} from './firebase/config';
import {
  UserProfile,
  FriendRequestDoc,
  RoomInviteDoc,
  getUserProfile,
  listenToUserProfile,
  listenToIncomingFriendRequests,
  listenToOutgoingFriendRequests,
  listenToRoomInvites,
  getFriendsProfiles,
  sendRoomInviteToFriend,
} from './firebase/userService';

export default function App() {
  // 1. Auth & Account Setup Gate State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // 2. Navigation & Scene Transition State
  const [activeSection, setActiveSection] = useState<ActiveSection>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<GameCategoryId>('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [forumGameFilter, setForumGameFilter] =
    useState<'all' | BoardGame['slug']>('all');
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');
  const [sceneTransition, setSceneTransition] = useState<{
    isVisible: boolean;
    direction: 'enter' | 'exit';
    gameVariant: TransitionGameVariant;
    roomCode?: string;
  }>({
    isVisible: false,
    direction: 'enter',
    gameVariant: 'cheese-thief',
  });
  const transitionTimerRef = useRef<number | null>(null);

  // 3. Friend System & Real-Time Invites State
  const [isFriendModalOpen, setIsFriendModalOpen] = useState<boolean>(false);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<
    FriendRequestDoc[]
  >([]);
  const [outgoingFriendRequests, setOutgoingFriendRequests] = useState<
    FriendRequestDoc[]
  >([]);
  const [roomInvites, setRoomInvites] = useState<RoomInviteDoc[]>([]);
  const [activeCheeseRoom, setActiveCheeseRoom] =
    useState<FirestoreRoom | null>(null);

  // 4. Live Rooms, Leaderboard & Community Threads
  const [firestoreRooms, setFirestoreRooms] = useState<FirestoreRoom[]>([]);
  const [leaderboard, setLeaderboard] = useState<PlayerRankingEntry[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [onlineClientsCount, setOnlineClientsCount] = useState<number>(1);
  const [wsConnected, setWsConnected] = useState<boolean>(true);

  // Check connection & restore logged-in user profile if previously authenticated
  useEffect(() => {
    testFirestoreConnection();
    const restoreSession = async () => {
      try {
        const isLoggedFlag =
          typeof window !== 'undefined' &&
          localStorage.getItem('tabletop_account_logged_in') === '1';
        if (isLoggedFlag) {
          const uid = getClientUid();
          const profile = await getUserProfile(uid);
          if (profile) {
            setCurrentUser(profile);
          }
        }
      } catch {
        // Require fresh login
      } finally {
        setIsCheckingAuth(false);
      }
    };
    restoreSession();
  }, []);

  // Listen to currentUser profile, Friends, Friend Requests, and Room Invites in real time
  useEffect(() => {
    if (!currentUser?.uid) {
      setFriends([]);
      setIncomingFriendRequests([]);
      setOutgoingFriendRequests([]);
      setRoomInvites([]);
      return;
    }

    const unsubProfile = listenToUserProfile(currentUser.uid, async (updated) => {
      if (updated) {
        setCurrentUser(updated);
        const friendProfiles = await getFriendsProfiles(updated.friends || []);
        setFriends(friendProfiles);
      }
    });

    const unsubIncoming = listenToIncomingFriendRequests(
      currentUser.uid,
      (reqs) => {
        setIncomingFriendRequests(reqs);
      }
    );

    const unsubOutgoing = listenToOutgoingFriendRequests(
      currentUser.uid,
      (reqs) => {
        setOutgoingFriendRequests(reqs);
      }
    );

    const unsubInvites = listenToRoomInvites(currentUser.uid, (invites) => {
      setRoomInvites(invites);
    });

    return () => {
      unsubProfile();
      unsubIncoming();
      unsubOutgoing();
      unsubInvites();
    };
  }, [currentUser?.uid]);

  // Listen to Active Rooms
  useEffect(() => {
    if (!currentUser) return;
    const unsubRooms = listenToActiveRooms((liveRooms) => {
      setFirestoreRooms(liveRooms);
    });
    return () => {
      unsubRooms();
    };
  }, [currentUser?.uid]);

  // Listen to Player Leaderboard
  useEffect(() => {
    if (!currentUser) return;
    const unsubLeaderboard = listenToLeaderboard((entries) => {
      const mapped: PlayerRankingEntry[] = entries.map((entry) => ({
        id: entry.id,
        playerName: entry.playerName,
        overallElo: entry.overallElo,
        totalMatches: entry.matchesPlayed,
        wins: entry.wins,
        winRate: entry.winRate,
        rankTitle:
          entry.overallElo >= 1800
            ? 'Grandmaster'
            : entry.overallElo >= 1650
            ? 'Master'
            : entry.overallElo >= 1500
            ? 'Diamond'
            : 'Gold',
        signatureGameId: 'cheese-thief',
        signatureGameTitle: entry.favoriteGame || 'หนูขโมยชีส (Cheese Thief)',
        signatureRole: 'หนูขโมยชีส',
        streak: Math.min(entry.wins, 5),
        gameStats: {
          'cheese-thief': {
            elo: entry.overallElo,
            matches: entry.matchesPlayed,
            wins: entry.wins,
            winRate: entry.winRate,
          },
          insider: {
            elo: entry.overallElo,
            matches: entry.matchesPlayed,
            wins: entry.wins,
            winRate: entry.winRate,
          },
          undercover: {
            elo: entry.overallElo,
            matches: entry.matchesPlayed,
            wins: entry.wins,
            winRate: entry.winRate,
          },
          'detective-club': {
            elo: entry.overallElo,
            matches: entry.matchesPlayed,
            wins: entry.wins,
            winRate: entry.winRate,
          },
          avalon: {
            elo: entry.overallElo,
            matches: 0,
            wins: 0,
            winRate: 0,
          },
          'werewolf-night': {
            elo: entry.overallElo,
            matches: 0,
            wins: 0,
            winRate: 0,
          },
          'catan-frontier': {
            elo: entry.overallElo,
            matches: 0,
            wins: 0,
            winRate: 0,
          },
        },
      }));
      setLeaderboard(mapped);
    });

    return () => {
      unsubLeaderboard();
    };
  }, [currentUser?.uid]);

  // Notification banner
  const [liveBanner, setLiveBanner] = useState<string | null>(null);
  const bannerTimerRef = useRef<number | null>(null);

  const showLiveNotification = (text: string) => {
    setLiveBanner(text);
    if (bannerTimerRef.current) {
      window.clearTimeout(bannerTimerRef.current);
    }
    bannerTimerRef.current = window.setTimeout(() => {
      setLiveBanner(null);
    }, 4000);
  };

  // Real-time connection for presence count & community threads
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let isUnmounted = false;

    const connectWebSocket = () => {
      if (isUnmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          if (!isUnmounted) setWsConnected(true);
        };
        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data) as ServerWsEvent;
            if (parsed.type === 'init:state') {
              setOnlineClientsCount(parsed.payload.onlineClients);
              if (Array.isArray(parsed.payload.threads)) {
                setThreads(parsed.payload.threads);
              }
            } else if (parsed.type === 'presence:count') {
              setOnlineClientsCount(parsed.payload.onlineClients);
            } else if (parsed.type === 'thread:created') {
              setThreads((prev) =>
                prev.some((t) => t.id === parsed.payload.id)
                  ? prev
                  : [parsed.payload, ...prev]
              );
            } else if (parsed.type === 'thread:liked') {
              setThreads((prev) =>
                prev.map((t) =>
                  t.id === parsed.payload.threadId
                    ? { ...t, likes: parsed.payload.likes }
                    : t
                )
              );
            } else if (parsed.type === 'comment:created') {
              setThreads((prev) =>
                prev.map((t) => {
                  if (t.id !== parsed.payload.threadId) return t;
                  if (
                    t.comments.some((c) => c.id === parsed.payload.comment.id)
                  )
                    return t;
                  return {
                    ...t,
                    comments: [...t.comments, parsed.payload.comment],
                  };
                })
              );
            }
          } catch {
            // Ignore malformed socket message
          }
        };
        ws.onclose = () => {
          if (!isUnmounted) {
            setWsConnected(false);
            reconnectTimer = window.setTimeout(connectWebSocket, 3000);
          }
        };
      } catch {
        // Fallback if WebSocket unavailable
      }
    };

    connectWebSocket();
    return () => {
      isUnmounted = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  // Enter the Dedicated Cheese Thief Screen with Pastel Scene Transition
  const handleEnterCheeseThiefScreen = (roomCode?: string) => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    setInitialRoomCode(roomCode || '');
    setSceneTransition({
      isVisible: true,
      direction: 'enter',
      gameVariant: 'cheese-thief',
      roomCode,
    });

    // Switch screen at 260ms when curtain is 100% opaque, without scroll jitter
    window.setTimeout(() => {
      setActiveSection('cheese-thief-screen');
      window.scrollTo(0, 0);
    }, 260);

    transitionTimerRef.current = window.setTimeout(() => {
      setSceneTransition((prev) => ({ ...prev, isVisible: false }));
    }, 620);
  };

  // Enter the Dedicated Insider Screen with Crimson Mystery Scene Transition
  const handleEnterInsiderScreen = (roomCode?: string) => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    setInitialRoomCode(roomCode || '');
    setSceneTransition({
      isVisible: true,
      direction: 'enter',
      gameVariant: 'insider',
      roomCode,
    });

    window.setTimeout(() => {
      setActiveSection('insider-screen');
      window.scrollTo(0, 0);
    }, 260);

    transitionTimerRef.current = window.setTimeout(() => {
      setSceneTransition((prev) => ({ ...prev, isVisible: false }));
    }, 620);
  };

  // Enter the Dedicated Undercover Screen with Sleek Noir Transition
  const handleEnterUndercoverScreen = (roomCode?: string) => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    setInitialRoomCode(roomCode || '');
    setSceneTransition({
      isVisible: true,
      direction: 'enter',
      gameVariant: 'undercover',
      roomCode,
    });

    window.setTimeout(() => {
      setActiveSection('undercover-screen');
      window.scrollTo(0, 0);
    }, 260);

    transitionTimerRef.current = window.setTimeout(() => {
      setSceneTransition((prev) => ({ ...prev, isVisible: false }));
    }, 620);
  };

  // Enter the Dedicated Detective Club Screen with Vintage Gold Detective Transition
  const handleEnterDetectiveClubScreen = (roomCode?: string) => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    setInitialRoomCode(roomCode || '');
    setSceneTransition({
      isVisible: true,
      direction: 'enter',
      gameVariant: 'detective-club',
      roomCode,
    });

    window.setTimeout(() => {
      setActiveSection('detective-club-screen');
      window.scrollTo(0, 0);
    }, 260);

    transitionTimerRef.current = window.setTimeout(() => {
      setSceneTransition((prev) => ({ ...prev, isVisible: false }));
    }, 620);
  };

  // Enter the Dedicated Avalon Screen with Royal Emerald Scene Transition
  const handleEnterAvalonScreen = (roomCode?: string) => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    setInitialRoomCode(roomCode || '');
    setSceneTransition({
      isVisible: true,
      direction: 'enter',
      gameVariant: 'avalon',
      roomCode,
    });

    window.setTimeout(() => {
      setActiveSection('avalon-screen');
      window.scrollTo(0, 0);
    }, 260);

    transitionTimerRef.current = window.setTimeout(() => {
      setSceneTransition((prev) => ({ ...prev, isVisible: false }));
    }, 620);
  };

  // Check URL query parameters (?room=... or ?code=...) to auto-join friends
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    const codeParam = urlParams.get('code');
    const gameParam = urlParams.get('game');
    const targetRoom = (roomParam || codeParam || '').trim();
    if (targetRoom) {
      setInitialRoomCode(targetRoom);
      if (currentUser) {
        if (gameParam === 'avalon') {
          handleEnterAvalonScreen(targetRoom);
        } else if (gameParam === 'detective-club') {
          handleEnterDetectiveClubScreen(targetRoom);
        } else if (gameParam === 'undercover') {
          handleEnterUndercoverScreen(targetRoom);
        } else if (gameParam === 'insider') {
          handleEnterInsiderScreen(targetRoom);
        } else {
          handleEnterCheeseThiefScreen(targetRoom);
        }
      }
    }
  }, [currentUser]);

  // Exit Game Screen back to another tab with Matching Game Variant Transition
  const handleExitGameToSection = (
    targetSection: ActiveSection = 'catalog',
    fromVariant: TransitionGameVariant = 'cheese-thief'
  ) => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    setSceneTransition({
      isVisible: true,
      direction: 'exit',
      gameVariant: fromVariant,
    });

    window.setTimeout(() => {
      setActiveSection(targetSection);
      window.scrollTo(0, 0);
    }, 260);

    transitionTimerRef.current = window.setTimeout(() => {
      setSceneTransition((prev) => ({ ...prev, isVisible: false }));
    }, 620);
  };

  const handleSignOut = async () => {
    await signOutAccount();
    setCurrentUser(null);
    setActiveSection('catalog');
  };

  const handleInviteFriendToActiveRoom = async (friend: UserProfile) => {
    if (!activeCheeseRoom || !currentUser) return;
    await addFriendToRoomSeat(activeCheeseRoom.id, friend);
    await sendRoomInviteToFriend(activeCheeseRoom, currentUser, friend.uid);
    showLiveNotification(
      `ดึง "${friend.accountName}" เข้าห้อง #${activeCheeseRoom.roomCode} แล้ว`
    );
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-slate-600 text-sm font-semibold">
        กำลังตรวจสอบสถานะบัญชีของคุณ...
      </div>
    );
  }

  // STEP 1 GATE: Everyone must Login & Set Account Name first
  if (!currentUser) {
    return (
      <AuthAccountScreen
        onLoginSuccess={(profile) => {
          setCurrentUser(profile);
          setActiveSection('catalog');
        }}
      />
    );
  }

  const realCheeseRooms = firestoreRooms.filter(
    (r) => r.gameId === 'cheese-thief'
  );
  const realInsiderRooms = firestoreRooms.filter(
    (r) => r.gameId === 'insider'
  );
  const realUndercoverRooms = firestoreRooms.filter(
    (r) => r.gameId === 'undercover'
  );
  const realDetectiveClubRooms = firestoreRooms.filter(
    (r) => r.gameId === 'detective-club'
  );
  const realAvalonRooms = firestoreRooms.filter(
    (r) => r.gameId === 'avalon'
  );

  const currentUserEntry: PlayerRankingEntry =
    leaderboard.find((e) => e.id === currentUser.uid) || {
      id: currentUser.uid,
      playerName: currentUser.accountName,
      overallElo: 1500,
      totalMatches: 0,
      wins: 0,
      winRate: 0,
      rankTitle: 'Diamond',
      signatureGameId: 'cheese-thief',
      signatureGameTitle: 'หนูขโมยชีส (Cheese Thief)',
      signatureRole: 'หนูขโมยชีส',
      streak: 0,
      gameStats: {
        'cheese-thief': { elo: 1500, matches: 0, wins: 0, winRate: 0 },
        insider: { elo: 1500, matches: 0, wins: 0, winRate: 0 },
        undercover: { elo: 1500, matches: 0, wins: 0, winRate: 0 },
        'detective-club': { elo: 1500, matches: 0, wins: 0, winRate: 0 },
        avalon: { elo: 1500, matches: 0, wins: 0, winRate: 0 },
        'werewolf-night': { elo: 1500, matches: 0, wins: 0, winRate: 0 },
        'catan-frontier': { elo: 1500, matches: 0, wins: 0, winRate: 0 },
      },
    };

  const filteredGames = filterBoardGames(
    BOARD_GAMES,
    selectedCategory,
    catalogSearch
  );

  const handleOpenGameSubForum = (slug: BoardGame['slug']) => {
    setForumGameFilter(slug);
    setActiveSection('sub-forums');
  };

  const handleCreateThread = async (payload: {
    gameId: BoardGame['slug'];
    gameTitleTh: string;
    tag: Exclude<ThreadTag, 'ทั้งหมด'>;
    title: string;
    content: string;
  }) => {
    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          authorName: currentUser.accountName,
          authorRankTitle: currentUserEntry.rankTitle,
          authorElo: currentUserEntry.overallElo,
        }),
      });
      if (res.ok) {
        const created = (await res.json()) as ForumThread;
        setThreads((prev) =>
          prev.some((t) => t.id === created.id) ? prev : [created, ...prev]
        );
      }
    } catch {
      // Ignore error
    }
  };

  const handleAddComment = async (threadId: string, content: string) => {
    try {
      const res = await fetch(`/api/threads/${threadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          authorName: currentUser.accountName,
          authorRankTitle: currentUserEntry.rankTitle,
          authorElo: currentUserEntry.overallElo,
        }),
      });
      if (res.ok) {
        const comment = await res.json();
        setThreads((prev) =>
          prev.map((t) => {
            if (t.id !== threadId) return t;
            if (t.comments.some((c) => c.id === comment.id)) return t;
            return { ...t, comments: [...t.comments, comment] };
          })
        );
      }
    } catch {
      // Ignore error
    }
  };

  const handleLikeThread = async (threadId: string) => {
    try {
      const res = await fetch(`/api/threads/${threadId}/like`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, likes: data.likes } : t))
        );
      }
    } catch {
      // Ignore error
    }
  };

  return (
    <div
      id="top"
      className="min-h-screen flex flex-col bg-amber-50/40 text-slate-800 w-full max-w-full overflow-x-hidden"
    >
      {/* Top-Level Persistent Scene Transition (Supports Cheese Thief & Insider Variants) */}
      <GameSceneTransition
        isVisible={sceneTransition.isVisible}
        direction={sceneTransition.direction}
        gameVariant={sceneTransition.gameVariant}
        roomCode={sceneTransition.roomCode}
      />

      {activeSection === 'cheese-thief-screen' ? (
        <CheeseThiefScreen
          currentUser={currentUser}
          friends={friends}
          pendingFriendRequestsCount={incomingFriendRequests.length}
          roomInvites={roomInvites}
          rooms={firestoreRooms}
          initialRoomCode={initialRoomCode}
          onBackToCatalog={() => handleExitGameToSection('catalog', 'cheese-thief')}
          onOpenFriendModal={() => setIsFriendModalOpen(true)}
          onActiveRoomChange={setActiveCheeseRoom}
        />
      ) : activeSection === 'insider-screen' ? (
        <InsiderScreen
          currentUser={currentUser}
          friends={friends}
          pendingFriendRequestsCount={incomingFriendRequests.length}
          roomInvites={roomInvites}
          rooms={firestoreRooms}
          initialRoomCode={initialRoomCode}
          onBackToCatalog={() => handleExitGameToSection('catalog', 'insider')}
          onOpenFriendModal={() => setIsFriendModalOpen(true)}
          onActiveRoomChange={setActiveCheeseRoom}
        />
      ) : activeSection === 'undercover-screen' ? (
        <UndercoverScreen
          currentUser={currentUser}
          friends={friends}
          pendingFriendRequestsCount={incomingFriendRequests.length}
          roomInvites={roomInvites}
          rooms={firestoreRooms}
          initialRoomCode={initialRoomCode}
          onBackToCatalog={() => handleExitGameToSection('catalog', 'undercover')}
          onOpenFriendModal={() => setIsFriendModalOpen(true)}
          onActiveRoomChange={setActiveCheeseRoom}
        />
      ) : activeSection === 'detective-club-screen' ? (
        <DetectiveClubScreen
          currentUser={currentUser}
          friends={friends}
          pendingFriendRequestsCount={incomingFriendRequests.length}
          roomInvites={roomInvites}
          rooms={firestoreRooms}
          initialRoomCode={initialRoomCode}
          onBackToCatalog={() => handleExitGameToSection('catalog', 'detective-club')}
          onOpenFriendModal={() => setIsFriendModalOpen(true)}
          onActiveRoomChange={setActiveCheeseRoom}
        />
      ) : activeSection === 'avalon-screen' ? (
        <AvalonScreen
          currentUser={currentUser}
          friends={friends}
          pendingFriendRequestsCount={incomingFriendRequests.length}
          roomInvites={roomInvites}
          onBackToCatalog={() => handleExitGameToSection('catalog', 'avalon')}
          onOpenFriendModal={() => setIsFriendModalOpen(true)}
          initialRoomCode={initialRoomCode}
        />
      ) : (
        <>
          {/* Top Bar */}
          <Navbar
        activeSection={activeSection}
        onSelectSection={(sec) => {
          if (sec === 'cheese-thief-screen') {
            handleEnterCheeseThiefScreen();
          } else if (sec === 'insider-screen') {
            handleEnterInsiderScreen();
          } else if (sec === 'undercover-screen') {
            handleEnterUndercoverScreen();
          } else if (sec === 'detective-club-screen') {
            handleEnterDetectiveClubScreen();
          } else if (sec === 'avalon-screen') {
            handleEnterAvalonScreen();
          } else {
            setActiveSection(sec);
          }
        }}
        onEnterCheeseThiefScreen={() => handleEnterCheeseThiefScreen()}
        onEnterInsiderScreen={() => handleEnterInsiderScreen()}
        onEnterUndercoverScreen={() => handleEnterUndercoverScreen()}
        onEnterDetectiveClubScreen={() => handleEnterDetectiveClubScreen()}
        onEnterAvalonScreen={() => handleEnterAvalonScreen()}
        onOpenFriendModal={() => setIsFriendModalOpen(true)}
        onSignOut={handleSignOut}
        currentUser={currentUser}
        friendsCount={friends.length}
        pendingRequestsCount={incomingFriendRequests.length}
        liveRoomsCount={realCheeseRooms.length}
        liveInsiderRoomsCount={realInsiderRooms.length}
        liveUndercoverRoomsCount={realUndercoverRooms.length}
        liveDetectiveClubRoomsCount={realDetectiveClubRooms.length}
        liveAvalonRoomsCount={realAvalonRooms.length}
      />

      {/* Live Notification Toast */}
      {liveBanner && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 px-4 py-2.5 bg-white/95 border border-amber-200 rounded-2xl shadow-xl text-xs sm:text-sm text-amber-900 font-medium flex items-center gap-2 backdrop-blur-sm"
        >
          <span>{liveBanner}</span>
        </div>
      )}

      {/* Main Content Container with Smooth Tab Transitions */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="space-y-10"
          >
            {/* View 1: Board Game Catalog & Category Explorer */}
            {activeSection === 'catalog' && (
              <div className="space-y-6">
                <CategoryFilterBar
                  categories={GAME_CATEGORIES}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  searchQuery={catalogSearch}
                  onSearchChange={setCatalogSearch}
                  totalMatchingGames={filteredGames.length}
                  wsConnected={wsConnected}
                  onlineClientsCount={onlineClientsCount}
                  activePlayerName={currentUser.accountName}
                  activePlayerElo={currentUserEntry.overallElo}
                />

                <GameCatalogGrid
                  games={filteredGames}
                  realCheeseRoomsCount={realCheeseRooms.length}
                  realInsiderRoomsCount={realInsiderRooms.length}
                  realUndercoverRoomsCount={realUndercoverRooms.length}
                  realDetectiveClubRoomsCount={realDetectiveClubRooms.length}
                  realAvalonRoomsCount={realAvalonRooms.length}
                  onEnterCheeseThiefScreen={() => handleEnterCheeseThiefScreen()}
                  onEnterInsiderScreen={() => handleEnterInsiderScreen()}
                  onEnterUndercoverScreen={() => handleEnterUndercoverScreen()}
                  onEnterDetectiveClubScreen={() => handleEnterDetectiveClubScreen()}
                  onEnterAvalonScreen={() => handleEnterAvalonScreen()}
                  onOpenGameSubForum={handleOpenGameSubForum}
                  onResetFilter={() => {
                    setSelectedCategory('all');
                    setCatalogSearch('');
                  }}
                />
              </div>
            )}

            {/* View 2: Per-Game Sub-Forums */}
            {activeSection === 'sub-forums' && (
              <GameSubForum
                threads={threads}
                games={BOARD_GAMES}
                selectedGameFilter={forumGameFilter}
                onSelectGameFilter={setForumGameFilter}
                activePlayerName={currentUser.accountName}
                activePlayerRank={currentUserEntry.rankTitle}
                activePlayerElo={currentUserEntry.overallElo}
                onCreateThread={handleCreateThread}
                onAddComment={handleAddComment}
                onLikeThread={handleLikeThread}
              />
            )}

            {/* View 3: Player Leaderboard Rankings */}
            {activeSection === 'leaderboard' && (
              <LeaderboardSection
                leaderboard={leaderboard}
                games={BOARD_GAMES}
                onPlayGameForRank={(gameSlug) => {
                  if (gameSlug === 'insider') {
                    handleEnterInsiderScreen();
                  } else if (gameSlug === 'undercover') {
                    handleEnterUndercoverScreen();
                  } else if (gameSlug === 'detective-club') {
                    handleEnterDetectiveClubScreen();
                  } else if (gameSlug === 'avalon') {
                    handleEnterAvalonScreen();
                  } else {
                    handleEnterCheeseThiefScreen();
                  }
                }}
              />
            )}

            {/* View 4: Game System & Data Architecture */}
            {activeSection === 'architecture' && <DatabaseSchemaView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Pastel Quiet Footer */}
      <footer className="border-t border-rose-100 bg-white/80 py-6 px-4 sm:px-6 mt-12 backdrop-blur-xs">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-100 text-amber-800">
              👑
            </span>
            <span>
              TabletopNexus — แพลตฟอร์มบอร์ดเกมออนไลน์ (หนูขโมยชีส, Insider, Undercover, Detective Club, Avalon)
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleEnterCheeseThiefScreen()}
              className="hover:text-amber-700 font-bold transition-colors cursor-pointer"
            >
              เข้าเล่นหนูขโมยชีส
            </button>
            <button
              type="button"
              onClick={() => handleEnterInsiderScreen()}
              className="hover:text-amber-700 font-bold transition-colors cursor-pointer"
            >
              เข้าเล่น Insider
            </button>
            <button
              type="button"
              onClick={() => handleEnterUndercoverScreen()}
              className="hover:text-amber-700 font-bold transition-colors cursor-pointer"
            >
              เข้าเล่น Undercover
            </button>
            <button
              type="button"
              onClick={() => handleEnterDetectiveClubScreen()}
              className="hover:text-amber-700 font-bold transition-colors cursor-pointer"
            >
              เข้าเล่น Detective Club
            </button>
            <button
              type="button"
              onClick={() => handleEnterAvalonScreen()}
              className="hover:text-amber-700 font-bold transition-colors cursor-pointer"
            >
              เข้าเล่น Avalon
            </button>
            <button
              type="button"
              onClick={() => setIsFriendModalOpen(true)}
              className="hover:text-amber-700 transition-colors cursor-pointer"
            >
              ระบบเพื่อน ({friends.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('catalog')}
              className="hover:text-amber-700 transition-colors cursor-pointer"
            >
              คลังบอร์ดเกม
            </button>
          </div>
        </div>
      </footer>
        </>
      )}

      {/* Friend Manager Modal (Wrapped in BaseModal with Framer Motion & Portal) */}
      <FriendManagerModal
        isOpen={isFriendModalOpen}
        onClose={() => setIsFriendModalOpen(false)}
        currentUser={currentUser}
        friends={friends}
        incomingRequests={incomingFriendRequests}
        outgoingRequests={outgoingFriendRequests}
        onProfileUpdated={setCurrentUser}
        activeRoomCode={activeCheeseRoom?.roomCode}
        onInviteFriendToActiveRoom={handleInviteFriendToActiveRoom}
      />
    </div>
  );
}
