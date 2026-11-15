import { useState, useEffect, useMemo, useCallback } from 'react';
import { UserProfile } from '../firebase/userService';

export interface FriendPlayStat {
  lastPlayedAt: string;
  playCount: number;
}

export type FriendSortMode = 'recent_frequent' | 'frequent' | 'name';

const STORAGE_KEY = 'tabletop_friend_play_stats_v1';
const UPDATE_EVENT = 'tabletop-friend-stats-updated';

export function getFriendPlayStatsMap(): Record<string, FriendPlayStat> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function recordFriendPlayedWith(friendUid: string): void {
  if (!friendUid || typeof window === 'undefined') return;
  try {
    const current = getFriendPlayStatsMap();
    const prev = current[friendUid] || { lastPlayedAt: '', playCount: 0 };
    current[friendUid] = {
      lastPlayedAt: new Date().toISOString(),
      playCount: (prev.playCount || 0) + 1,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    // Ignore storage quota errors
  }
}

export function formatRelativePlayedTime(isoDate?: string): string {
  if (!isoDate) return '';
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (diffSec < 60) return 'เมื่อสักครู่';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ชม. ที่แล้ว`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} วันที่แล้ว`;
  return new Date(isoDate).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });
}

export function sortFriendsList(
  friends: UserProfile[],
  statsMap: Record<string, FriendPlayStat>,
  mode: FriendSortMode = 'recent_frequent'
): UserProfile[] {
  return [...friends].sort((a, b) => {
    const statA = statsMap[a.uid];
    const statB = statsMap[b.uid];
    const countA = statA?.playCount || 0;
    const countB = statB?.playCount || 0;
    const timeA = statA?.lastPlayedAt ? new Date(statA.lastPlayedAt).getTime() : 0;
    const timeB = statB?.lastPlayedAt ? new Date(statB.lastPlayedAt).getTime() : 0;

    if (mode === 'name') {
      return a.accountName.localeCompare(b.accountName, 'th');
    }

    if (mode === 'frequent') {
      if (countB !== countA) return countB - countA;
      if (timeB !== timeA) return timeB - timeA;
      return a.accountName.localeCompare(b.accountName, 'th');
    }

    // Default: 'recent_frequent' (เรียงจากคนที่เล่นด้วยล่าสุด ตามด้วยคนที่เล่นบ่อยสุด)
    if (timeB !== timeA) return timeB - timeA;
    if (countB !== countA) return countB - countA;
    return a.accountName.localeCompare(b.accountName, 'th');
  });
}

export function useSortedFriends(
  friends: UserProfile[],
  limitCount = 5,
  initialMode: FriendSortMode = 'recent_frequent'
) {
  const [statsMap, setStatsMap] = useState<Record<string, FriendPlayStat>>(() =>
    getFriendPlayStatsMap()
  );
  const [sortMode, setSortMode] = useState<FriendSortMode>(initialMode);

  useEffect(() => {
    const handleStorageUpdate = () => {
      setStatsMap(getFriendPlayStatsMap());
    };
    window.addEventListener(UPDATE_EVENT, handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener(UPDATE_EVENT, handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const sortedFriends = useMemo(
    () => sortFriendsList(friends, statsMap, sortMode),
    [friends, statsMap, sortMode]
  );

  // Top N always uses the primary 'recent_frequent' order for the compact preview
  const topFriends = useMemo(
    () =>
      sortFriendsList(friends, statsMap, 'recent_frequent').slice(
        0,
        limitCount
      ),
    [friends, statsMap, limitCount]
  );

  const getFriendStat = useCallback(
    (uid: string): FriendPlayStat | undefined => statsMap[uid],
    [statsMap]
  );

  return {
    sortedFriends,
    topFriends,
    remainingCount: Math.max(0, friends.length - limitCount),
    sortMode,
    setSortMode,
    getFriendStat,
    recordFriendPlayedWith,
  };
}
