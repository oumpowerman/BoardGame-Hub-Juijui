import React from 'react';
import {
  Crown,
  Users,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  ArrowRight,
  Shuffle,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
} from 'lucide-react';

export interface DoraemonSetupViewProps {
  onBackToCatalog: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  initialKingCommand: string;
  onChangeInitialKingCommand: (val: string) => void;
  onRandomizeKingCommand: () => void;
  setupPlayers: { name: string; avatar: string }[];
  avatarOptions: string[];
  onChangePlayerAvatar: (index: number, newAvatar: string) => void;
  newPlayerInput: string;
  onChangeNewPlayerInput: (val: string) => void;
  onAddPlayer: () => void;
  onRemovePlayer: (index: number) => void;
  onMovePlayer: (index: number, direction: 'up' | 'down') => void;
  isLoading: boolean;
  onStartGame: () => void;
}

export const DoraemonSetupView: React.FC<DoraemonSetupViewProps> = ({
  onBackToCatalog,
  isSoundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
  initialKingCommand,
  onChangeInitialKingCommand,
  onRandomizeKingCommand,
  setupPlayers,
  avatarOptions,
  onChangePlayerAvatar,
  newPlayerInput,
  onChangeNewPlayerInput,
  onAddPlayer,
  onRemovePlayer,
  onMovePlayer,
  isLoading,
  onStartGame,
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="py-2 px-3.5 rounded-xl bg-white border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          ← กลับหน้ารวมเกม
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title={isSoundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
          >
            {isSoundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="สลับเต็มจอ"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Title Hero */}
      <div className="text-center space-y-2 py-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold">
          <Crown className="w-3.5 h-3.5 text-amber-600" />
          <span>SINGLE-DEVICE PARTY CARD GAME</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          ไพ่โดเรม่อน 🍻 (King&apos;s Cup)
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          ใช้เครื่องเดียววางกลางโต๊ะหรือส่งต่อรอบวง ใส่ชื่อทุกคน จัดลำดับ แล้วเริ่มจั่วไพ่ลุ้นความสนุกได้เลย!
        </p>
      </div>

      {/* Setup Card */}
      <div className="bg-white border-2 border-amber-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
        {/* Step 1: King's Initial Command */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-600" />
              <span>คำสั่งของ King คนแรก</span>
            </label>
            <button
              type="button"
              onClick={onRandomizeKingCommand}
              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3 h-3" />
              <span>สุ่มคำสั่งสนุกๆ</span>
            </button>
          </div>
          <input
            type="text"
            value={initialKingCommand}
            onChange={(e) => onChangeInitialKingCommand(e.target.value)}
            placeholder="ระบุสิ่งที่คนได้ K คนแรกต้องทำ..."
            className="w-full px-4 py-3 rounded-2xl border-2 border-amber-200 focus:border-amber-500 focus:outline-hidden text-sm font-bold text-slate-900 bg-amber-50/30"
          />
          <p className="text-[11px] text-slate-500">
            💡 ใครจั่วได้ไพ่ K คนแรกต้องทำคำสั่งนี้ และหลังจากนั้นจะได้พิมพ์คำสั่งใหม่ส่งต่อให้ K คนถัดไป!
          </p>
        </div>

        <hr className="border-slate-100" />

        {/* Step 2: Player Roster & Reorder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-rose-600" />
              <span>
                รายชื่อผู้เล่นและลำดับคิว ({setupPlayers.length} คน)
              </span>
            </label>
            <span className="text-xs text-slate-500 font-medium">
              คลิกอวาตาร์เพื่อเปลี่ยน · 🔼 🔽 สลับคิว
            </span>
          </div>

          {/* Player List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {setupPlayers.map((player, index) => (
              <div
                key={`p-${index}`}
                className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-amber-200/80 border border-amber-300 text-amber-950 text-xs font-black flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const curIdx = avatarOptions.indexOf(player.avatar);
                      const nextAvatar =
                        avatarOptions[(curIdx + 1) % avatarOptions.length] || '🐱';
                      onChangePlayerAvatar(index, nextAvatar);
                    }}
                    className="w-9 h-9 rounded-2xl bg-white border border-amber-300 shadow-2xs flex items-center justify-center text-lg hover:bg-amber-50 cursor-pointer transition-transform active:scale-95 shrink-0"
                    title="คลิกเพื่อเปลี่ยนรูปอวาตาร์"
                  >
                    {player.avatar}
                  </button>
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {player.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onMovePlayer(index, 'up')}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-30 text-slate-600 hover:bg-slate-100 cursor-pointer"
                    title="เลื่อนขึ้น"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === setupPlayers.length - 1}
                    onClick={() => onMovePlayer(index, 'down')}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-30 text-slate-600 hover:bg-slate-100 cursor-pointer"
                    title="เลื่อนลง"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={setupPlayers.length <= 2}
                    onClick={() => onRemovePlayer(index)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-30 text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="ลบผู้เล่น"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Player Input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newPlayerInput}
              onChange={(e) => onChangeNewPlayerInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddPlayer()}
              placeholder="พิมพ์ชื่อเพื่อน..."
              className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:outline-hidden text-sm font-bold text-slate-900"
            />
            <button
              type="button"
              onClick={onAddPlayer}
              className="py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่ม</span>
            </button>
          </div>
        </div>

        {/* Quick Actions & Start */}
        <div className="pt-2 space-y-3">
          <button
            type="button"
            disabled={isLoading || setupPlayers.length < 2}
            onClick={onStartGame}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:opacity-95 text-white font-black text-base shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
          >
            <span>เริ่มเกมโดเรม่อนทันที 🚀</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <span>✓ ไพ่ 52 ใบมาตรฐาน</span>
            <span>•</span>
            <span>✓ ลุ้นเปิดไพ่ 2 จังหวะ</span>
            <span>•</span>
            <span>✓ ซิงค์ Firestore ถาวร</span>
          </div>
        </div>
      </div>
    </div>
  );
};
