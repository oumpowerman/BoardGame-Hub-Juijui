import React, { useState } from 'react';
import {
  Users,
  Bot,
  Trash2,
  Play,
  Share2,
  Tablet,
  QrCode,
  CheckCircle2,
  Sparkles,
  LogOut,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import {
  FirestoreRoom,
  FirestorePlayer,
} from '../../firebase/tableService';
import { UserProfile } from '../../firebase/userService';
import {
  DYING_MESSAGE_CATEGORIES,
  DyingMessageEvidenceCategory,
} from '../../data/dyingMessageCards';

interface DyingMessageLobbyProps {
  room: FirestoreRoom;
  players: FirestorePlayer[];
  currentUser: UserProfile;
  friends: UserProfile[];
  isLoading: boolean;
  onUpdateSettings: (settings: {
    dmCategory?: DyingMessageEvidenceCategory;
    dmEnableDetective?: boolean;
    dmEnableDoctor?: boolean;
    dmEnableAccomplice?: boolean;
    dmDebateDurationSeconds?: number;
  }) => void;
  onAddBot: () => void;
  onRemovePlayer: (playerId: string) => void;
  onPullFriendToSeat: (friend: UserProfile) => void;
  onToggleIpadConnected: (connected: boolean) => void;
  onSwitchToIpadView: () => void;
  onOpenShareModal: () => void;
  onLeaveOrCloseRoom: () => void;
  onStartGame: () => void;
}

export const DyingMessageLobby: React.FC<DyingMessageLobbyProps> = ({
  room,
  players,
  currentUser,
  friends,
  isLoading,
  onUpdateSettings,
  onAddBot,
  onRemovePlayer,
  onPullFriendToSeat,
  onToggleIpadConnected,
  onSwitchToIpadView,
  onOpenShareModal,
  onLeaveOrCloseRoom,
  onStartGame,
}) => {
  const [showQrBox, setShowQrBox] = useState<boolean>(false);
  const [copiedBoardUrl, setCopiedBoardUrl] = useState<boolean>(false);

  const isHost = room.hostId === currentUser.uid;
  const activeCategory = room.dmCategory || 'all';
  const enableDetective = room.dmEnableDetective ?? true;
  const enableDoctor = room.dmEnableDoctor ?? true;
  const enableAccomplice = room.dmEnableAccomplice ?? true;
  const debateSeconds = room.dmDebateDurationSeconds || 180;
  const isIpadConnected = Boolean(room.dmIpadConnected);

  const ipadBoardUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?game=dying-message&mode=board&room=${room.roomCode}`
      : '';

  const qrImageUrl = ipadBoardUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        ipadBoardUrl
      )}`
    : '';

  const handleCopyBoardLink = () => {
    if (!ipadBoardUrl || typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(ipadBoardUrl);
    setCopiedBoardUrl(true);
    setTimeout(() => setCopiedBoardUrl(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Room Banner */}
      <div className="bg-gradient-to-br from-sky-50 via-[#FFFDF9] to-rose-50 border-2 border-sky-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-extrabold text-sky-800">
              <span>STEP 1 · ตั้งโต๊ะสืบคดี (4–12 คน)</span>
              <span>·</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-sky-200/80 text-sky-950">
                รหัสโต๊ะ #{room.roomCode}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              {room.roomName || `โต๊ะเบาะแสมรณะของ ${room.hostName}`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              ผู้ตายทิ้งการ์ดเบาะแสจริง 1 ใบที่สื่อถึงตัวจริงหรืออวตารของฆาตกร ·
              ฆาตกรแอบใส่การ์ดปลอม 2 ใบเพื่อปั่นหัวคนทั้งวง!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenShareModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-600" />
              <span>เชิญเพื่อน / QR เข้าห้อง</span>
            </button>

            <button
              type="button"
              onClick={onLeaveOrCloseRoom}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isHost ? 'ยุบโต๊ะ' : 'ออกจากโต๊ะ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Highlight Card: iPad Central Evidence Board Pairing */}
      <div
        className={`rounded-3xl p-5 sm:p-6 border-2 transition-all ${
          isIpadConnected
            ? 'bg-gradient-to-r from-emerald-50 via-[#FFFDF9] to-sky-50 border-emerald-300 shadow-xs'
            : 'bg-white border-sky-200/90 shadow-xs'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold ${
                  isIpadConnected
                    ? 'bg-emerald-500 text-white'
                    : 'bg-sky-100 text-sky-900 border border-sky-200'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>
                  {isIpadConnected
                    ? 'เชื่อมต่อจอ iPad กระดานกลางแล้ว (Heads-Up Mode ทำงาน)'
                    : 'รองรับการเชื่อมจอ iPad เป็นกระดานวางหลักฐานกลางโต๊ะ'}
                </span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isIpadConnected
                ? 'เมื่อเริ่มเกม การ์ดหลักฐานและผังผู้ต้องสงสัยจะแสดงเฉพาะบนจอ iPad เท่านั้น ส่วนมือถือผู้เล่นจะตัดข้อมูลซ้ำออกทั้งหมดเพื่อให้ทุกคนเงยหน้าพูดคุยกันในชีวิตจริง!'
                : 'นำ iPad หรือแท็บเล็ตวางกลางวงแล้วสแกน QR เพื่อเปิดเป็นกระดานหลักฐานกลาง (เมื่อเชื่อมแล้ว ข้อมูลบน iPad จะไม่แสดงซ้ำในมือถือ)'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowQrBox((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-950 text-xs font-extrabold transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-sky-700" />
              <span>{showQrBox ? 'ซ่อน QR เชื่อม iPad' : 'สแกนเชื่อม iPad กลางโต๊ะ'}</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleIpadConnected(!isIpadConnected)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-extrabold transition-colors cursor-pointer ${
                isIpadConnected
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-950 hover:bg-emerald-200'
                  : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isIpadConnected
                  ? 'โหมดเชื่อม iPad: เปิดอยู่'
                  : 'เปิดโหมดซ่อนข้อมูลซ้ำบนมือถือ'}
              </span>
            </button>

            <button
              type="button"
              onClick={onSwitchToIpadView}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold transition-colors cursor-pointer"
            >
              <Tablet className="w-4 h-4" />
              <span>ใช้เครื่องนี้เป็นจอ iPad กลาง</span>
            </button>
          </div>
        </div>

        {showQrBox && (
          <div className="mt-4 pt-4 border-t border-sky-200/70 flex flex-col sm:flex-row items-center gap-5 bg-sky-50/50 p-4 rounded-2xl">
            {qrImageUrl && (
              <img
                src={qrImageUrl}
                alt="QR Code สำหรับเชื่อมจอ iPad กระดานกลาง"
                referrerPolicy="no-referrer"
                className="w-36 h-36 rounded-2xl border-2 border-sky-300 bg-white p-2 shadow-xs shrink-0"
              />
            )}
            <div className="space-y-2.5 text-center sm:text-left">
              <div className="text-sm font-extrabold text-slate-900">
                วิธีเชื่อมจอ iPad วางกลางวงสนทนา
              </div>
              <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1">
                <li>ใช้กล้อง iPad หรือแท็บเล็ตสแกน QR Code ด้านซ้าย</li>
                <li>
                  จอ iPad จะเข้าสู่ <strong>กระดานวางหลักฐานกลางโต๊ะ</strong>{' '}
                  โดยไม่แย่งที่นั่งผู้เล่น
                </li>
                <li>
                  มือถือของทุกคนจะเปลี่ยนเป็นโหมดประหยัดหน้าจอ (ใช้แอบดูบทบาทและกดเลือกการ์ดตอนหลับตาเท่านั้น)
                </li>
              </ol>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyBoardLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-sky-300 text-sky-900 text-xs font-bold hover:bg-sky-100 cursor-pointer"
                >
                  {copiedBoardUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>คัดลอกลิงก์จอ iPad แล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-sky-600" />
                      <span>คัดลอกลิงก์สำหรับเปิดบน iPad</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Column Grid: Left = Settings, Right = Players at Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Game & Role Settings */}
        <div className="lg:col-span-5 bg-white border border-sky-200/80 rounded-3xl p-5 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>ตั้งค่าชุดการ์ดเบาะแส & บทบาทพิเศษ</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold">
              {isHost ? 'คุณเป็นโฮสต์' : 'โฮสต์เป็นผู้ตั้งค่า'}
            </span>
          </div>

          {/* Evidence Deck Category */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 block">
              1. หมวดการ์ดเบาะแสมรณะ (เชื่อมโยงตัวจริง & อวตาร)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {DYING_MESSAGE_CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={!isHost}
                    onClick={() => onUpdateSettings({ dmCategory: cat.id })}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200/70'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-sky-50/40'
                    } ${isHost ? 'cursor-pointer' : 'opacity-80 cursor-default'}`}
                  >
                    <span className="text-xl shrink-0">{cat.emoji}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900">
                        {cat.nameTh}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-snug">
                        {cat.descTh}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Roles Configuration */}
          <div className="space-y-2 pt-2 border-t border-sky-100">
            <label className="text-xs font-extrabold text-slate-700 block">
              2. บทบาทพิเศษในคดี (เปิด/ปิดได้)
            </label>
            <div className="space-y-2">
              <button
                type="button"
                disabled={!isHost}
                onClick={() =>
                  onUpdateSettings({ dmEnableDetective: !enableDetective })
                }
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-colors ${
                  enableDetective
                    ? 'bg-sky-50 border-sky-300 text-sky-950'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                } ${isHost ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🕵️</span>
                  <div>
                    <div className="text-xs font-extrabold">
                      ตำรวจสายสืบ (Detective)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      แอบส่องตรวจผู้ต้องสงสัยตอนกลางคืนได้คืนละ 1 คน
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${
                    enableDetective
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {enableDetective ? 'เปิดใช้' : 'ปิด'}
                </span>
              </button>

              <button
                type="button"
                disabled={!isHost}
                onClick={() =>
                  onUpdateSettings({ dmEnableDoctor: !enableDoctor })
                }
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-colors ${
                  enableDoctor
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                } ${isHost ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🧪</span>
                  <div>
                    <div className="text-xs font-extrabold">
                      หมอชันสูตร (Forensic Doctor)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      กดตัดการ์ดเบาะแสปลอมบนจอ iPad ออกได้ 1 ใบ (1 ครั้ง/เกม)
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${
                    enableDoctor
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {enableDoctor ? 'เปิดใช้' : 'ปิด'}
                </span>
              </button>

              <button
                type="button"
                disabled={!isHost}
                onClick={() =>
                  onUpdateSettings({ dmEnableAccomplice: !enableAccomplice })
                }
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-colors ${
                  enableAccomplice
                    ? 'bg-orange-50 border-orange-300 text-orange-950'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                } ${isHost ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🃏</span>
                  <div>
                    <div className="text-xs font-extrabold">
                      ผู้สมรู้ร่วมคิด (Accomplice · 6+ คน)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      รู้ตัวฆาตกรและช่วยพูดเบี่ยงประเด็นในวงสนทนา
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${
                    enableAccomplice
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {enableAccomplice ? 'เปิดใช้' : 'ปิด'}
                </span>
              </button>
            </div>
          </div>

          {/* Debate Duration */}
          <div className="space-y-2 pt-2 border-t border-sky-100">
            <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>3. เวลาสืบสวนต่อรอบ</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[120, 180, 240].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  disabled={!isHost}
                  onClick={() =>
                    onUpdateSettings({ dmDebateDurationSeconds: sec })
                  }
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-colors ${
                    debateSeconds === sec
                      ? 'bg-sky-500 text-white border-sky-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-sky-50'
                  } ${isHost ? 'cursor-pointer' : ''}`}
                >
                  {sec / 60} นาที
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Players Seated & Start Game */}
        <div className="lg:col-span-7 bg-white border border-sky-200/80 rounded-3xl p-5 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                ผู้เล่นที่นั่งอยู่ในวง ({players.length}/12 คน)
              </h3>
            </div>

            {isHost && players.length < 12 && (
              <button
                type="button"
                onClick={onAddBot}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-extrabold transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-amber-700" />
                <span>+ เพิ่มบอทฝึกซ้อม</span>
              </button>
            )}
          </div>

          {/* Player Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {players.map((p, index) => {
              const isBot = p.id.startsWith('bot_');
              return (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-sky-50/50 border border-sky-200/80 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-extrabold text-amber-950 text-xs overflow-hidden shrink-0">
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        p.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                        <span>
                          {index + 1}. {p.name}
                        </span>
                        {p.isHost && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 font-bold">
                            โฮสต์
                          </span>
                        )}
                        {isBot && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                            BOT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        พร้อมสืบคดี
                      </div>
                    </div>
                  </div>

                  {isHost && p.id !== currentUser.uid && (
                    <button
                      type="button"
                      onClick={() => onRemovePlayer(p.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="เชิญออกจากโต๊ะ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Pull Friends Bar */}
          {isHost && friends.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/70 space-y-2">
              <div className="text-xs font-extrabold text-rose-950">
                ดึงเพื่อนของคุณเข้ามานั่งในโต๊ะทันที
              </div>
              <div className="flex flex-wrap gap-2">
                {friends.map((friend) => {
                  const alreadySeated = players.some(
                    (p) => p.id === friend.uid
                  );
                  return (
                    <button
                      key={friend.uid}
                      type="button"
                      disabled={alreadySeated}
                      onClick={() => onPullFriendToSeat(friend)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        alreadySeated
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-default'
                          : 'bg-white hover:bg-rose-100 border-rose-300 text-rose-900 cursor-pointer'
                      }`}
                    >
                      {alreadySeated
                        ? `✓ ${friend.accountName} นั่งแล้ว`
                        : `+ ดึง ${friend.accountName}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Start Game Action */}
          <div className="pt-3 border-t border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {players.length < 5
                ? `ขณะนี้มี ${players.length} คน (หากกดเริ่มเลย ระบบจะเติมบอทให้ครบ 5 คนอัตโนมัติ)`
                : `ผู้เล่นครบ ${players.length} คน พร้อมเปิดคดีเบาะแสมรณะ!`}
            </div>

            {isHost ? (
              <button
                type="button"
                disabled={isLoading}
                onClick={onStartGame}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-sm shadow-sm transition-all cursor-pointer active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>เริ่มเกม · แจกบทบาทลับ</span>
              </button>
            ) : (
              <div className="px-4 py-2.5 rounded-2xl bg-sky-100 text-sky-900 text-xs font-extrabold">
                รอโฮสต์ ({room.hostName}) กดเริ่มเกม...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
