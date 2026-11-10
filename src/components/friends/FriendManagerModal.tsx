import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Check,
  X,
  Copy,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Camera,
  QrCode,
} from 'lucide-react';
import { BaseModal } from '../BaseModal';
import {
  UserProfile,
  FriendRequestDoc,
  findUsersByQuery,
  sendFriendRequest,
  respondToFriendRequest,
  registerOrUpdateUserProfile,
  updateUserAvatar,
} from '../../firebase/userService';
import { AvatarPickerModal } from '../profile/AvatarPickerModal';
import { FriendQrScannerModal } from './FriendQrScannerModal';

interface FriendManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  friends: UserProfile[];
  incomingRequests: FriendRequestDoc[];
  outgoingRequests: FriendRequestDoc[];
  onProfileUpdated: (updated: UserProfile) => void;
  onInviteFriendToActiveRoom?: (friend: UserProfile) => Promise<void>;
  activeRoomCode?: string;
}

export const FriendManagerModal: React.FC<FriendManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  friends,
  incomingRequests,
  outgoingRequests,
  onProfileUpdated,
  onInviteFriendToActiveRoom,
  activeRoomCode,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Account Name Edit State
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [newNameInput, setNewNameInput] = useState<string>(currentUser.accountName);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  const handleSaveAvatar = async (avatarUrl: string) => {
    try {
      const updated = await updateUserAvatar(currentUser.uid, avatarUrl);
      if (updated) {
        onProfileUpdated(updated);
        setStatusMessage('อัปเดตรูปโปรไฟล์ของคุณเรียบร้อยแล้ว!');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถบันทึกรูปโปรไฟล์ได้'
      );
    }
  };

  const handleCopyMyCode = () => {
    navigator.clipboard.writeText(currentUser.friendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveAccountName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameInput.trim()) return;
    try {
      const updated = await registerOrUpdateUserProfile(
        currentUser.uid,
        newNameInput.trim()
      );
      onProfileUpdated(updated);
      setIsEditingName(false);
      setStatusMessage(`เปลี่ยนชื่อบัญชีเป็น "${updated.accountName}" เรียบร้อยแล้ว`);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถเปลี่ยนชื่อบัญชีได้'
      );
    }
  };

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const found = await findUsersByQuery(searchQuery, currentUser.uid);
      setSearchResults(found);
      if (found.length === 0) {
        setErrorMessage(
          `ไม่พบผู้ใช้ที่มีชื่อหรือรหัส "${searchQuery.trim()}" ในฐานข้อมูล`
        );
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการค้นหาเพื่อน'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (target: UserProfile) => {
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      await sendFriendRequest(currentUser, target);
      setStatusMessage(
        `ส่งคำขอเป็นเพื่อนไปยัง "${target.accountName}" เรียบร้อยแล้ว! รออีกฝ่ายกดรับแอด`
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถส่งคำขอเป็นเพื่อนได้'
      );
    }
  };

  const handleRespondRequest = async (
    req: FriendRequestDoc,
    accept: boolean
  ) => {
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      await respondToFriendRequest(req, accept);
      setStatusMessage(
        accept
          ? `คุณและ "${req.fromName}" เป็นเพื่อนกันแล้ว! สามารถชวนเข้าห้องเล่นหนูขโมยชีสได้ทันที`
          : `ปฏิเสธคำขอเป็นเพื่อนจาก "${req.fromName}" แล้ว`
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถดำเนินการคำขอเป็นเพื่อนได้'
      );
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      icon={<Users className="w-5 h-5 text-amber-950" />}
      subtitle="ACCOUNT & FRIEND SYSTEM · ต้องเป็นเพื่อนกันก่อนจึงชวนเข้าโต๊ะได้"
      title={`บัญชีของ ${currentUser.accountName} & รายชื่อเพื่อน (${friends.length})`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* My Account Card */}
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar with Camera badge */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="w-14 h-14 rounded-full border-2 border-amber-300 shadow-2xs overflow-hidden bg-amber-100 flex items-center justify-center cursor-pointer group hover:opacity-90 transition-opacity"
                title="คลิกเพื่อเปลี่ยนรูปถ่ายหรืออวตาร"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.accountName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-base font-black text-amber-900">
                    {currentUser.accountName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute -bottom-1 -right-1 p-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-full border border-white shadow-2xs cursor-pointer"
                title="เปลี่ยนรูปถ่ายหรืออวตาร"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-0.5">
              <div className="text-[11px] text-slate-500 font-semibold">
                ข้อมูลบัญชีของคุณ (แตะรูปเพื่อเปลี่ยน):
              </div>
              {isEditingName ? (
                <form onSubmit={handleSaveAccountName} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newNameInput}
                    onChange={(e) => setNewNameInput(e.target.value)}
                    maxLength={40}
                    className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-amber-400 text-amber-950 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    บันทึก
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="px-2 py-1.5 text-xs text-slate-500 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-extrabold text-slate-900">
                    {currentUser.accountName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewNameInput(currentUser.accountName);
                      setIsEditingName(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-amber-800 hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>เปลี่ยนชื่อ</span>
                  </button>
                </div>
              )}
              <div className="text-xs font-mono text-slate-600">
                รหัสเพื่อน: <strong className="text-amber-900">{currentUser.friendCode}</strong> · UID:{' '}
                <span className="text-slate-500">{currentUser.uid}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer shrink-0 min-h-[40px]"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code / สแกนเพื่อน</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMyCode}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 transition-colors cursor-pointer shrink-0 min-h-[40px]"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">คัดลอกรหัสแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-700" />
                  <span>คัดลอกรหัส {currentUser.friendCode}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status / Error Alerts */}
        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1">{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Section 1: Search & Add Friend by Account Name or UID */}
        <div className="p-4 bg-white border border-rose-100 rounded-2xl space-y-3 shadow-2xs">
          <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-rose-500" />
            <span>ค้นหาและเพิ่มเพื่อน (ด้วยชื่อ Account หรือรหัสเพื่อน / UID)</span>
          </div>

          <form onSubmit={handleSearchUsers} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ชื่อ Account หรือรหัสเพื่อน เช่น CT..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-rose-50/40 border border-rose-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-300 min-h-[42px]"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 min-h-[42px]"
            >
              {isSearching ? 'กำลังค้นหา...' : 'ค้นหาเพื่อน'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-2 pt-1">
              {searchResults.map((user) => {
                const isAlreadyFriend = currentUser.friends.includes(user.uid);
                const isPendingOut = outgoingRequests.some(
                  (r) => r.toUid === user.uid
                );

                return (
                  <div
                    key={user.uid}
                    className="p-3 bg-amber-50/50 border border-amber-200/70 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {user.accountName}
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        รหัส: {user.friendCode} · UID: {user.uid}
                      </div>
                    </div>

                    {isAlreadyFriend ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
                        เป็นเพื่อนกันแล้ว
                      </span>
                    ) : isPendingOut ? (
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl">
                        รออีกฝ่ายกดรับแอด
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendRequest(user)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>ส่งคำขอเป็นเพื่อน</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Incoming Pending Friend Requests */}
        {incomingRequests.length > 0 && (
          <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-3">
            <div className="text-xs sm:text-sm font-extrabold text-amber-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>คำขอเป็นเพื่อนที่รอคุณกดยืนยัน ({incomingRequests.length})</span>
            </div>

            <div className="space-y-2">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {req.fromName}
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                      รหัสเพื่อน: {req.fromFriendCode}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRespondRequest(req, true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>รับแอดเพื่อน</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespondRequest(req, false)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>ปฏิเสธ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Accepted Friends List */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>รายชื่อเพื่อนที่รับแอดแล้ว ({friends.length} คน)</span>
            </span>
            <span className="text-[11px] text-slate-500">
              ชวนเข้าห้องหนูขโมยชีสได้เฉพาะเพื่อนในรายชื่อนี้
            </span>
          </div>

          {friends.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
              คุณยังไม่มีรายชื่อเพื่อน ค้นหาชื่อ Account หรือรหัสเพื่อนด้านบนเพื่อส่งคำขอแอดเพื่อนได้เลย!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {friends.map((friend) => (
                <div
                  key={friend.uid}
                  className="p-3 bg-emerald-50/40 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center font-bold text-emerald-900 text-xs shrink-0 overflow-hidden shadow-2xs">
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.accountName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        friend.accountName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {friend.accountName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        #{friend.friendCode}
                      </div>
                    </div>
                  </div>

                  {activeRoomCode && onInviteFriendToActiveRoom ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await onInviteFriendToActiveRoom(friend);
                        setStatusMessage(
                          `ดึง "${friend.accountName}" เข้าห้อง #${activeRoomCode} และส่งคำเชิญแล้ว!`
                        );
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold rounded-xl cursor-pointer shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>ชวนเข้าห้อง #{activeRoomCode}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg shrink-0">
                      เพื่อนของคุณ
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={currentUser.avatarUrl}
        userName={currentUser.accountName}
        onSaveAvatar={handleSaveAvatar}
      />

      {/* QR Code & Scanner Modal */}
      <FriendQrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        currentUser={currentUser}
        onFriendAddedSuccess={(addedFriend) => {
          setStatusMessage(
            `เพิ่ม "${addedFriend.accountName}" เป็นเพื่อนเรียบร้อยแล้ว!`
          );
        }}
      />
    </BaseModal>
  );
};
