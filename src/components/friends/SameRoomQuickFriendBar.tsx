import React, { useState } from 'react';
import { UserPlus, Check, Sparkles, Users, Loader2 } from 'lucide-react';
import { FirestorePlayer } from '../../firebase/tableService';
import {
  UserProfile,
  getUserProfile,
  addInstantFriendFromRoomSeat,
} from '../../firebase/userService';

interface SameRoomQuickFriendBarProps {
  players: FirestorePlayer[];
  currentUid: string;
  friends: UserProfile[];
  onFriendAdded?: (newFriend: UserProfile) => void;
}

export const SameRoomQuickFriendBar: React.FC<SameRoomQuickFriendBarProps> = ({
  players,
  currentUid,
  friends,
  onFriendAdded,
}) => {
  const [addingIds, setAddingIds] = useState<Record<string, boolean>>({});
  const [justAddedIds, setJustAddedIds] = useState<Record<string, boolean>>({});
  const [isAddingAll, setIsAddingAll] = useState<boolean>(false);

  // Filter only real human tablemates (exclude self and bots)
  const humanTablemates = players.filter(
    (p) => p.id !== currentUid && !p.id.startsWith('bot_')
  );

  if (humanTablemates.length === 0) return null;

  const isAlreadyFriend = (playerId: string) =>
    friends.some((f) => f.uid === playerId) || Boolean(justAddedIds[playerId]);

  const unaddedTablemates = humanTablemates.filter(
    (p) => !isAlreadyFriend(p.id)
  );

  const handleQuickAddSeat = async (seatPlayer: FirestorePlayer) => {
    if (addingIds[seatPlayer.id] || isAlreadyFriend(seatPlayer.id)) return;
    setAddingIds((prev) => ({ ...prev, [seatPlayer.id]: true }));
    try {
      const myProfile = await getUserProfile(currentUid);
      if (!myProfile) return;
      const added = await addInstantFriendFromRoomSeat(myProfile, seatPlayer);
      setJustAddedIds((prev) => ({ ...prev, [seatPlayer.id]: true }));
      onFriendAdded?.(added);
    } catch {
      // Ignore transient errors
    } finally {
      setAddingIds((prev) => ({ ...prev, [seatPlayer.id]: false }));
    }
  };

  const handleAddAllInRoom = async () => {
    if (isAddingAll || unaddedTablemates.length === 0) return;
    setIsAddingAll(true);
    try {
      const myProfile = await getUserProfile(currentUid);
      if (!myProfile) return;
      for (const mate of unaddedTablemates) {
        const added = await addInstantFriendFromRoomSeat(myProfile, mate);
        setJustAddedIds((prev) => ({ ...prev, [mate.id]: true }));
        onFriendAdded?.(added);
      }
    } catch {
      // Ignore
    } finally {
      setIsAddingAll(false);
    }
  };

  return (
    <div className="p-3.5 bg-gradient-to-r from-rose-50/90 via-amber-50/80 to-pink-50/90 border border-rose-200/90 rounded-2xl space-y-2.5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-950">
          <Users className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            เพื่อนร่วมห้องเดียวกัน ({humanTablemates.length} คน) · แอดเพื่อนได้ในคลิกเดียว!
          </span>
        </div>

        {unaddedTablemates.length > 1 && (
          <button
            type="button"
            disabled={isAddingAll}
            onClick={handleAddAllInRoom}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            {isAddingAll ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังแอดทุกคน...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ แอดเพื่อนทุกคนในห้องนี้ ({unaddedTablemates.length} คน)</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {humanTablemates.map((mate) => {
          const isFriend = isAlreadyFriend(mate.id);
          const isLoading = Boolean(addingIds[mate.id]);

          return (
            <div
              key={mate.id}
              className="px-3 py-1.5 bg-white border border-rose-200/80 rounded-xl flex items-center gap-2 shadow-2xs"
            >
              <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-amber-900 text-[10px] shrink-0 overflow-hidden">
                {mate.avatarUrl ? (
                  <img
                    src={mate.avatarUrl}
                    alt={mate.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  mate.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <span className="text-xs font-bold text-slate-900 truncate max-w-[110px]">
                {mate.name}
              </span>

              {isFriend ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg">
                  <Check className="w-3 h-3" />
                  <span>เป็นเพื่อนแล้ว</span>
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickAddSeat(mate)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-[11px] font-extrabold rounded-lg transition-colors cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <UserPlus className="w-3 h-3" />
                  )}
                  <span>+ แอดเพื่อน</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface SeatQuickAddFriendButtonProps {
  seatPlayer: FirestorePlayer;
  currentUid: string;
  friends?: UserProfile[];
}

export const SeatQuickAddFriendButton: React.FC<
  SeatQuickAddFriendButtonProps
> = ({ seatPlayer, currentUid, friends = [] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  if (seatPlayer.id === currentUid || seatPlayer.id.startsWith('bot_')) {
    return null;
  }

  const isAlreadyFriend =
    justAdded || friends.some((f) => f.uid === seatPlayer.id);

  if (isAlreadyFriend) {
    return (
      <span className="px-2 py-0.5 text-[10px] bg-rose-100 text-rose-800 rounded-md font-bold inline-flex items-center gap-0.5">
        <Check className="w-2.5 h-2.5" /> เพื่อน
      </span>
    );
  }

  const handleQuickAdd = async () => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      const myProfile = await getUserProfile(currentUid);
      if (!myProfile) return;
      await addInstantFriendFromRoomSeat(myProfile, seatPlayer);
      setJustAdded(true);
    } catch {
      // Ignore
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      type="button"
      disabled={isAdding}
      onClick={handleQuickAdd}
      title={`แอด ${seatPlayer.name} เป็นเพื่อนทันที`}
      className="px-2 py-0.5 text-[10px] bg-rose-500 hover:bg-rose-600 text-white rounded-md font-extrabold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
    >
      {isAdding ? (
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
      ) : (
        <UserPlus className="w-2.5 h-2.5" />
      )}
      <span>+แอดเพื่อน</span>
    </button>
  );
};
