import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Clock,
  Flame,
  Check,
  Send,
  ChevronRight,
  X,
} from 'lucide-react';
import { BaseModal } from '../BaseModal';
import { UserProfile } from '../../firebase/userService';
import {
  useSortedFriends,
  FriendSortMode,
  formatRelativePlayedTime,
} from '../../utils/friendSortUtils';

export type FriendThemeAccent =
  | 'rose'
  | 'amber'
  | 'emerald'
  | 'violet'
  | 'sky';

const ACCENT_STYLES: Record<
  FriendThemeAccent,
  {
    stripBg: string;
    stripBorder: string;
    titleText: string;
    iconColor: string;
    linkText: string;
    cardBorder: string;
    pullBtn: string;
    moreBtn: string;
    activeTab: string;
  }
> = {
  rose: {
    stripBg: 'bg-rose-50/60',
    stripBorder: 'border-rose-200/80',
    titleText: 'text-rose-950',
    iconColor: 'text-rose-600',
    linkText: 'text-rose-700 hover:text-rose-900',
    cardBorder: 'border-rose-200/90',
    pullBtn: 'bg-rose-500 hover:bg-rose-600 text-white',
    moreBtn:
      'bg-white hover:bg-rose-100/80 text-rose-900 border-rose-300',
    activeTab: 'bg-rose-500 text-white shadow-2xs',
  },
  amber: {
    stripBg: 'bg-amber-50/70',
    stripBorder: 'border-amber-200/80',
    titleText: 'text-amber-950',
    iconColor: 'text-amber-600',
    linkText: 'text-amber-800 hover:text-amber-950',
    cardBorder: 'border-amber-200/90',
    pullBtn: 'bg-amber-400 hover:bg-amber-300 text-amber-950',
    moreBtn:
      'bg-white hover:bg-amber-100/80 text-amber-950 border-amber-300',
    activeTab: 'bg-amber-500 text-white shadow-2xs',
  },
  emerald: {
    stripBg: 'bg-emerald-50/60',
    stripBorder: 'border-emerald-200/80',
    titleText: 'text-emerald-950',
    iconColor: 'text-emerald-600',
    linkText: 'text-emerald-800 hover:text-emerald-950',
    cardBorder: 'border-emerald-200/90',
    pullBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    moreBtn:
      'bg-white hover:bg-emerald-100/80 text-emerald-900 border-emerald-300',
    activeTab: 'bg-emerald-600 text-white shadow-2xs',
  },
  violet: {
    stripBg: 'bg-violet-50/60',
    stripBorder: 'border-violet-200/80',
    titleText: 'text-violet-950',
    iconColor: 'text-violet-600',
    linkText: 'text-violet-700 hover:text-violet-950',
    cardBorder: 'border-violet-200/90',
    pullBtn: 'bg-violet-500 hover:bg-violet-600 text-white',
    moreBtn:
      'bg-white hover:bg-violet-100/80 text-violet-900 border-violet-300',
    activeTab: 'bg-violet-600 text-white shadow-2xs',
  },
  sky: {
    stripBg: 'bg-sky-50/60',
    stripBorder: 'border-sky-200/80',
    titleText: 'text-sky-950',
    iconColor: 'text-sky-600',
    linkText: 'text-sky-700 hover:text-sky-950',
    cardBorder: 'border-sky-200/90',
    pullBtn: 'bg-sky-500 hover:bg-sky-600 text-white',
    moreBtn:
      'bg-white hover:bg-sky-100/80 text-sky-900 border-sky-300',
    activeTab: 'bg-sky-600 text-white shadow-2xs',
  },
};

export interface AllFriendsQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: UserProfile[];
  seatedPlayerIds?: string[];
  maxPlayersReached?: boolean;
  onPullFriend?: (friend: UserProfile) => void;
  onOpenFriendManager?: () => void;
  accent?: FriendThemeAccent;
  title?: string;
}

export const AllFriendsQuickModal: React.FC<AllFriendsQuickModalProps> = ({
  isOpen,
  onClose,
  friends,
  seatedPlayerIds = [],
  maxPlayersReached = false,
  onPullFriend,
  onOpenFriendManager,
  accent = 'rose',
  title,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const {
    sortedFriends,
    sortMode,
    setSortMode,
    getFriendStat,
    recordFriendPlayedWith,
  } = useSortedFriends(friends, 5, 'recent_frequent');

  const style = ACCENT_STYLES[accent];

  const filteredFriends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedFriends;
    return sortedFriends.filter(
      (f) =>
        f.accountName.toLowerCase().includes(q) ||
        f.friendCode.toLowerCase().includes(q)
    );
  }, [sortedFriends, searchQuery]);

  const sortOptions: { id: FriendSortMode; label: string }[] = [
    { id: 'recent_frequent', label: 'เล่นล่าสุด & บ่อยสุด' },
    { id: 'frequent', label: 'เล่นบ่อยสุด' },
    { id: 'name', label: 'เรียงตามชื่อ' },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title || `รายชื่อเพื่อนของคุณทั้งหมด (${friends.length} คน)`}
      subtitle="เรียงตามคนที่เล่นด้วยกันล่าสุดและบ่อยที่สุด"
      icon={<Users className="w-5 h-5" />}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Search & Sort Controls */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อเพื่อน หรือ #รหัสเพื่อน..."
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                title="ล้างคำค้นหา"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {sortOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortMode(opt.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    sortMode === opt.id
                      ? style.activeTab
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {onOpenFriendManager && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFriendManager();
                }}
                className={`inline-flex items-center gap-1 text-xs font-bold ${style.linkText} cursor-pointer whitespace-nowrap shrink-0`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ เพิ่ม / รับแอดเพื่อนใหม่</span>
              </button>
            )}
          </div>
        </div>

        {/* Friends Scrollable List */}
        {filteredFriends.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              {searchQuery
                ? `ไม่พบรายชื่อเพื่อนที่ตรงกับ "${searchQuery}"`
                : 'ยังไม่มีรายชื่อเพื่อนในระบบ'}
            </p>
            {onOpenFriendManager && !searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFriendManager();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${style.pullBtn} cursor-pointer`}
              >
                + ค้นหาและแอดเพื่อนใหม่
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {filteredFriends.map((friend, index) => {
              const stat = getFriendStat(friend.uid);
              const relTime = formatRelativePlayedTime(stat?.lastPlayedAt);
              const isSeated = seatedPlayerIds.includes(friend.uid);

              return (
                <div
                  key={friend.uid}
                  className="p-3 bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-extrabold text-slate-700 shrink-0 overflow-hidden">
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.accountName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        friend.accountName.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {friend.accountName}
                        </span>
                        {index < 5 && (stat?.playCount || 0) > 0 && (
                          <span className="text-[10px] font-bold text-amber-600 shrink-0">
                            ★ ขาประจำ
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="font-mono">#{friend.friendCode}</span>
                        {stat && stat.playCount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-0.5 text-slate-600 font-medium tabular-nums">
                              <Flame className="w-3 h-3 text-amber-500" />
                              เล่นด้วยกัน {stat.playCount} ครั้ง
                            </span>
                          </>
                        )}
                        {relTime && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-0.5 text-slate-500">
                              <Clock className="w-3 h-3" />
                              {relTime}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action: Pull to Seat or Status */}
                  <div className="shrink-0">
                    {onPullFriend ? (
                      isSeated ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 px-2.5 py-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>อยู่ในห้องแล้ว</span>
                        </span>
                      ) : maxPlayersReached ? (
                        <span className="text-xs font-semibold text-slate-400">
                          โต๊ะเต็มแล้ว
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            recordFriendPlayedWith(friend.uid);
                            onPullFriend(friend);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${style.pullBtn}`}
                        >
                          <Send className="w-3 h-3" />
                          <span>+ ดึงเข้าโต๊ะ</span>
                        </button>
                      )
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700">
                        พร้อมชวนเข้าโต๊ะ
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BaseModal>
  );
};

// ============================================================================
// 1. COMPACT HUB FRIENDS CARD (สำหรับหน้า GameHubScreen ก่อนเข้าโต๊ะ)
// ============================================================================
export interface CompactHubFriendsCardProps {
  friends: UserProfile[];
  onOpenFriendModal: () => void;
  accent?: FriendThemeAccent;
  addFriendBtnClass?: string;
  friendRowClass?: string;
}

export const CompactHubFriendsCard: React.FC<CompactHubFriendsCardProps> = ({
  friends,
  onOpenFriendModal,
  accent = 'rose',
  addFriendBtnClass = 'bg-rose-500 hover:bg-rose-600 text-white',
  friendRowClass = 'bg-rose-50/40 border-rose-100',
}) => {
  const [isAllModalOpen, setIsAllModalOpen] = useState(false);
  const { topFriends, remainingCount, getFriendStat } = useSortedFriends(
    friends,
    5,
    'recent_frequent'
  );

  return (
    <div className="bg-white border border-rose-100 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="truncate">
              รายชื่อเพื่อนของคุณ ({friends.length})
            </span>
          </span>
          {friends.length > 0 && (
            <p className="text-[11px] text-slate-500 mt-0.5">
              แสดง 5 คนแรกที่เล่นด้วยกันล่าสุดและบ่อยที่สุด
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {friends.length > 0 && (
            <button
              type="button"
              onClick={() => setIsAllModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5" />
              <span>ดูทั้งหมด ({friends.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenFriendModal}
            className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ เพิ่มเพื่อน</span>
          </button>
        </div>
      </div>

      {friends.length === 0 ? (
        <div className="p-4 bg-rose-50/40 border border-dashed border-rose-200 rounded-2xl text-center space-y-2">
          <p className="text-xs text-slate-600">
            แอดเพื่อนด้วยชื่อ Account หรือรหัสเพื่อนเพื่อดึงมานั่งโต๊ะเดียวกันได้ทันที
          </p>
          <button
            type="button"
            onClick={onOpenFriendModal}
            className={`px-3.5 py-2 ${addFriendBtnClass} text-xs font-bold rounded-xl cursor-pointer`}
          >
            ค้นหาและแอดเพื่อนด้วยชื่อ / UID
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {topFriends.map((friend) => {
              const stat = getFriendStat(friend.uid);
              const relTime = formatRelativePlayedTime(stat?.lastPlayedAt);
              return (
                <div
                  key={friend.uid}
                  className={`p-2.5 ${friendRowClass} border rounded-xl flex items-center justify-between gap-2`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[11px] font-extrabold text-slate-700 shrink-0 overflow-hidden">
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.accountName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        friend.accountName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {friend.accountName}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 truncate">
                        <span className="font-mono">#{friend.friendCode}</span>
                        {stat && stat.playCount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-slate-700 tabular-nums">
                              เล่น {stat.playCount} ครั้ง
                            </span>
                          </>
                        )}
                        {relTime && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{relTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 shrink-0">
                    พร้อมชวนเข้าโต๊ะ
                  </span>
                </div>
              );
            })}
          </div>

          {remainingCount > 0 && (
            <button
              type="button"
              onClick={() => setIsAllModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-rose-500" />
              <span>
                ดูรายชื่อเพื่อนทั้งหมด (+อีก {remainingCount} คน) และค้นหาเพื่อน
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <AllFriendsQuickModal
        isOpen={isAllModalOpen}
        onClose={() => setIsAllModalOpen(false)}
        friends={friends}
        onOpenFriendManager={onOpenFriendModal}
        accent={accent}
      />
    </div>
  );
};

// ============================================================================
// 2. COMPACT LOBBY FRIEND PULL BAR (สำหรับหน้าในห้อง Lobby ทุกเกม)
// ============================================================================
export interface CompactLobbyFriendPullBarProps {
  friends: UserProfile[];
  seatedPlayerIds: string[];
  maxPlayersReached?: boolean;
  onPullFriend: (friend: UserProfile) => void;
  onOpenFriendModal?: () => void;
  accent?: FriendThemeAccent;
  title?: string;
}

export const CompactLobbyFriendPullBar: React.FC<
  CompactLobbyFriendPullBarProps
> = ({
  friends,
  seatedPlayerIds,
  maxPlayersReached = false,
  onPullFriend,
  onOpenFriendModal,
  accent = 'rose',
  title,
}) => {
  const [isAllModalOpen, setIsAllModalOpen] = useState(false);
  const {
    topFriends,
    remainingCount,
    getFriendStat,
    recordFriendPlayedWith,
  } = useSortedFriends(friends, 5, 'recent_frequent');

  const style = ACCENT_STYLES[accent];

  return (
    <div
      className={`p-4 ${style.stripBg} border ${style.stripBorder} rounded-2xl space-y-2.5`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <span
            className={`text-xs font-extrabold ${style.titleText} flex items-center gap-1.5`}
          >
            <Users className={`w-4 h-4 ${style.iconColor} shrink-0`} />
            <span>
              {title ||
                `ดึงเพื่อนของคุณเข้ามานั่งในโต๊ะทันที (${friends.length} คน)`}
            </span>
          </span>
          {friends.length > 0 && (
            <p className="text-[11px] text-slate-500 mt-0.5">
              เรียงจากเพื่อน 5 คนแรกที่เล่นด้วยกันล่าสุดและบ่อยที่สุด
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {friends.length > 0 && (
            <button
              type="button"
              onClick={() => setIsAllModalOpen(true)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${style.moreBtn}`}
            >
              <Search className="w-3 h-3" />
              <span>
                {remainingCount > 0
                  ? `ดูเพื่อนทั้งหมด (+${remainingCount})`
                  : `ค้นหาเพื่อน (${friends.length})`}
              </span>
            </button>
          )}
          {onOpenFriendModal && (
            <button
              type="button"
              onClick={onOpenFriendModal}
              className={`text-xs font-bold ${style.linkText} hover:underline cursor-pointer whitespace-nowrap`}
            >
              จัดการเพื่อน →
            </button>
          )}
        </div>
      </div>

      {friends.length === 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/90 rounded-xl border border-slate-200/70 text-xs text-slate-600">
          <span>
            แอดเพื่อนด้วยชื่อ Account หรือรหัสเพื่อนเพื่อดึงมานั่งโต๊ะเดียวกันได้ทันที
          </span>
          {onOpenFriendModal && (
            <button
              type="button"
              onClick={onOpenFriendModal}
              className={`px-3 py-1.5 ${style.pullBtn} font-bold rounded-lg cursor-pointer shrink-0`}
            >
              + ไปหน้าเพิ่มเพื่อน
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {topFriends.map((friend) => {
            const alreadySeated = seatedPlayerIds.includes(friend.uid);
            const stat = getFriendStat(friend.uid);
            return (
              <div
                key={friend.uid}
                className={`px-3 py-1.5 bg-white border ${style.cardBorder} rounded-xl flex items-center gap-2 shadow-2xs`}
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate max-w-[130px]">
                    {friend.accountName}
                  </span>
                  {stat && stat.playCount > 0 && (
                    <span className="text-[10px] text-slate-500 block tabular-nums">
                      เล่นด้วยกัน {stat.playCount} ครั้ง
                    </span>
                  )}
                </div>

                {alreadySeated ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md whitespace-nowrap">
                    ✓ นั่งแล้ว
                  </span>
                ) : (
                  !maxPlayersReached && (
                    <button
                      type="button"
                      onClick={() => {
                        recordFriendPlayedWith(friend.uid);
                        onPullFriend(friend);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 ${style.pullBtn} text-[11px] font-bold rounded-lg cursor-pointer transition-colors whitespace-nowrap`}
                    >
                      <span>+ ดึงเข้าโต๊ะ</span>
                    </button>
                  )
                )}
              </div>
            );
          })}

          {remainingCount > 0 && (
            <button
              type="button"
              onClick={() => setIsAllModalOpen(true)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap ${style.moreBtn}`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>+ ดูเพื่อนอีก {remainingCount} คน</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <AllFriendsQuickModal
        isOpen={isAllModalOpen}
        onClose={() => setIsAllModalOpen(false)}
        friends={friends}
        seatedPlayerIds={seatedPlayerIds}
        maxPlayersReached={maxPlayersReached}
        onPullFriend={onPullFriend}
        onOpenFriendManager={onOpenFriendModal}
        accent={accent}
        title={`ดึงเพื่อนเข้าโต๊ะ (${friends.length} คนในรายชื่อเพื่อน)`}
      />
    </div>
  );
};
