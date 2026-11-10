import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Crown,
  Play,
  Settings2,
  Sparkles,
  Bot,
  UserPlus,
  Trash2,
  Shield,
  Layers,
  CheckCircle2,
  Info,
  ChevronDown,
} from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/tableService';
import { AVALON_QUEST_MATRIX, AVALON_ROLES_META } from '../../data/avalonRules';
import { AvalonSettingsPayload } from '../../firebase/table/avalonService';
import { AvalonRoleDetailModal } from './AvalonRoleDetailModal';
import { AvalonRoleIcon } from './AvalonRoleIcon';
import {
  SameRoomQuickFriendBar,
  SeatQuickAddFriendButton,
} from '../friends/SameRoomQuickFriendBar';

export interface AvalonLobbyProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  isLoading: boolean;
  onUpdateSettings: (settings: AvalonSettingsPayload) => Promise<void>;
  onAddBot?: () => Promise<void>;
  onRemovePlayer?: (playerId: string) => Promise<void>;
  onStartGame: () => Promise<void>;
  onOpenInviteModal?: () => void;
  onPlayFlipSound?: () => void;
}

export const AvalonLobby: React.FC<AvalonLobbyProps> = ({
  currentRoom,
  players,
  currentUid,
  isLoading,
  onUpdateSettings,
  onAddBot,
  onRemovePlayer,
  onStartGame,
  onOpenInviteModal,
  onPlayFlipSound,
}) => {
  const [detailRoleKey, setDetailRoleKey] = useState<string | null>(null);
  const [isRolesExpanded, setIsRolesExpanded] = useState<boolean>(false);
  const [selectedTargetCount, setSelectedTargetCount] = useState<number>(() => {
    return currentRoom.avalonTargetPlayers || Math.min(10, Math.max(5, players.length));
  });
  const [isAutoFilling, setIsAutoFilling] = useState<boolean>(false);

  const isHost = currentRoom.hostId === currentUid;
  const totalPlayers = players.length;

  // Auto-bump target if joined players exceed selected target
  React.useEffect(() => {
    if (players.length > selectedTargetCount) {
      const newTarget = Math.min(10, players.length);
      setSelectedTargetCount(newTarget);
      if (isHost) {
        onUpdateSettings({ targetPlayers: newTarget });
      }
    }
  }, [players.length, selectedTargetCount, isHost, onUpdateSettings]);

  React.useEffect(() => {
    if (currentRoom.avalonTargetPlayers && currentRoom.avalonTargetPlayers !== selectedTargetCount) {
      setSelectedTargetCount(currentRoom.avalonTargetPlayers);
    }
  }, [currentRoom.avalonTargetPlayers, selectedTargetCount]);

  const targetCount = selectedTargetCount;
  const matrix = AVALON_QUEST_MATRIX[targetCount] || AVALON_QUEST_MATRIX[5];
  const remainingNeeded = Math.max(0, targetCount - totalPlayers);

  // Quick fill remaining slots with bots
  const handleQuickFillBots = async () => {
    if (!onAddBot || isAutoFilling || remainingNeeded <= 0) return;
    setIsAutoFilling(true);
    try {
      for (let i = 0; i < remainingNeeded; i++) {
        await onAddBot();
      }
    } catch {
      // Handled in parent
    } finally {
      setIsAutoFilling(false);
    }
  };

  const roleMode = currentRoom.avalonRoleMode || 'auto';
  const enableMerlin = currentRoom.avalonEnableMerlin ?? true;
  const enableAssassin = currentRoom.avalonEnableAssassin ?? true;
  const enablePercival = currentRoom.avalonEnablePercival ?? true;
  const enableMorgana = currentRoom.avalonEnableMorgana ?? true;
  const enableMordred = currentRoom.avalonEnableMordred ?? false;
  const enableOberon = currentRoom.avalonEnableOberon ?? false;

  // Active special roles counts based on selected target matrix
  const specialGoodCount = (enableMerlin ? 1 : 0) + (enablePercival ? 1 : 0);
  const loyalServantsCount = Math.max(0, matrix.goodCount - specialGoodCount);

  const specialEvilCount =
    (enableAssassin ? 1 : 0) +
    (enableMorgana ? 1 : 0) +
    (enableMordred ? 1 : 0) +
    (enableOberon ? 1 : 0);
  const minionsCount = Math.max(0, matrix.evilCount - specialEvilCount);

  return (
    <div className="space-y-6">
      {/* 1. Player Ratio & Matrix Ribbon */}
      <div className="p-5 bg-gradient-to-r from-emerald-100 via-white to-amber-100 border-2 border-emerald-300 rounded-3xl space-y-3.5 shadow-xs">
        {/* Target Capacity Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-emerald-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">🎯</span>
            <span>กำหนดสัดส่วนโต๊ะเป้าหมาย:</span>
            <span className="text-[11px] font-normal text-slate-500">(เลือกพรีวิวสัดส่วน 5–10 คน)</span>
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl overflow-x-auto max-w-full">
            {[5, 6, 7, 8, 9, 10].map((cnt) => {
              const isSelected = targetCount === cnt;
              return (
                <button
                  key={cnt}
                  type="button"
                  disabled={!isHost || isLoading}
                  onClick={() => {
                    onPlayFlipSound?.();
                    setSelectedTargetCount(cnt);
                    if (isHost) onUpdateSettings({ targetPlayers: cnt });
                  }}
                  className={`px-3 py-1 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-emerald-100/70'
                  }`}
                >
                  {cnt} คน
                </button>
              );
            })}
          </div>
        </div>

        {/* Faction Ratio & Quick Bot Top-Up */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-700 text-white rounded-xl text-base">
              ⚔️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  สัดส่วนโต๊ะ {targetCount} คน
                </h2>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  ผู้เล่นในห้อง {totalPlayers}/{targetCount} คน
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {remainingNeeded > 0
                  ? `ขาดอีก ${remainingNeeded} คนเพื่อให้ครบสัดส่วนที่เลือกไว้`
                  : `ผู้เล่นครบ ${targetCount} คนตามสัดส่วนแล้ว พร้อมเริ่มศึกอัศวินโต๊ะกลม!`}
              </p>
              {remainingNeeded > 0 && isHost && onAddBot && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  disabled={isLoading || isAutoFilling}
                  onClick={handleQuickFillBots}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold text-amber-950 bg-amber-200/90 hover:bg-amber-300 border border-amber-300 rounded-xl transition-all cursor-pointer shadow-2xs mt-2"
                >
                  <Bot className="w-3.5 h-3.5 text-amber-800" />
                  <span>
                    {isAutoFilling
                      ? 'กำลังเติมบอท...'
                      : `+ เติมบอทให้ครบ ${targetCount} คน (ขาดอีก ${remainingNeeded} คน)`}
                  </span>
                </motion.button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span className="px-3 py-1 bg-emerald-700 text-white rounded-xl shadow-2xs">
              💙 ฝ่ายอัศวิน (Good): {matrix.goodCount} คน
            </span>
            <span className="px-3 py-1 bg-rose-700 text-white rounded-xl shadow-2xs">
              ❤️ ฝ่ายปีศาจ (Evil): {matrix.evilCount} คน
            </span>
          </div>
        </div>

        {/* Quest Team Sizes */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-emerald-900 block">
            จำนวนอัศวินทำภารกิจ 5 รอบประจำสัดส่วน {targetCount} คนนี้:
          </span>
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono font-bold">
            {matrix.quests.map((q, idx) => (
              <div
                key={idx}
                className="p-2 bg-white border border-emerald-200 rounded-xl shadow-2xs"
              >
                <div className="text-[10px] text-slate-500">รอบที่ {idx + 1}</div>
                <div className="text-emerald-950 font-black">{q.teamSize} คน</div>
                {q.requiredFails > 1 && (
                  <div className="text-[10px] text-rose-600 font-extrabold">
                    ({q.requiredFails} Fails)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Role Mode Switch (Auto vs Manual Physical Selection) */}
      <div className="p-5 sm:p-6 bg-white border border-emerald-200 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
          <Layers className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-black text-slate-900">
              โหมดการระบุบทบาท (Role Assignment Mode)
            </h3>
            <p className="text-xs text-slate-500">
              เลือกวิธีการแจกหรือระบุบทบาทลับของผู้เล่นที่โต๊ะ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.015, y: -2 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            disabled={!isHost || isLoading}
            onClick={() => {
              onPlayFlipSound?.();
              onUpdateSettings({ roleMode: 'auto' });
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              roleMode === 'auto'
                ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-300/60 shadow-xs'
                : 'bg-slate-50/60 border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>🎲 1. แอปสุ่มแจกบทบาท (Auto Deal)</span>
              </span>
              {roleMode === 'auto' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              ระบบดิจิทัลจะสลับไพ่และสุ่มแจกบทบาทให้ผู้เล่นทุกคนอัตโนมัติ ผู้เล่นแต่ละคนกดค้างบนหน้าจอมือถือเพื่อแอบส่องบทบาทของตนเอง
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.015, y: -2 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            disabled={!isHost || isLoading}
            onClick={() => {
              onPlayFlipSound?.();
              onUpdateSettings({ roleMode: 'manual' });
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              roleMode === 'manual'
                ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-300/60 shadow-xs'
                : 'bg-slate-50/60 border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>🃏 2. ผู้เล่นเลือกบทบาทเองตามไพ่จริง (Manual Pick)</span>
              </span>
              {roleMode === 'manual' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              สำหรับโต๊ะที่แจกการ์ด Avalon ของจริงบนโต๊ะ ผู้เล่นแต่ละคนจะสามารถกดเลือกบทบาทที่ตนเองหยิบได้จริงเพื่อให้นิมิตและการโหวตทำงานแม่นยำ
            </p>
          </motion.button>
        </div>
      </div>

      {/* 3. Collapsible 8 Roles Configuration Deck */}
      <div className="p-4 sm:p-5 bg-white border border-emerald-200 rounded-3xl shadow-sm space-y-3">
        {/* Accordion Header Toggle */}
        <button
          type="button"
          onClick={() => {
            onPlayFlipSound?.();
            setIsRolesExpanded((prev) => !prev);
          }}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100/90 text-emerald-800 rounded-2xl border border-emerald-300 shadow-2xs group-hover:scale-105 transition-transform">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                  ตั้งค่าสำรับบทบาททั้ง 8 ตัวละคร (Roles Configuration)
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  เปิด {specialGoodCount + specialEvilCount}/6 พิเศษ
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                  อัศวิน {matrix.goodCount} · ปีศาจ {matrix.evilCount}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRolesExpanded
                  ? (isHost
                      ? 'ติ๊กเปิด-ปิดบทบาทพิเศษประจำโต๊ะ ระบบจะคำนวณจำนวนอัศวินรับใช้และลูกสมุนให้อัตโนมัติ'
                      : 'โฮสต์กำลังตั้งค่าชุดบทบาทของโต๊ะ')
                  : 'แตะเพื่อกางเปิด-ปิดบทบาทพิเศษและดูรายชื่อตัวละคร'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              {isRolesExpanded ? 'พับเก็บ' : 'กางออก'}
            </span>
            <motion.div
              animate={{ rotate: isRolesExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-800 flex items-center justify-center transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
        </button>

        {/* Collapsible Content */}
        <AnimatePresence initial={false}>
          {isRolesExpanded && (
            <motion.div
              key="roles-configuration-accordion"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden pt-3 border-t border-emerald-100"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    key: 'avalon_merlin',
                    name: 'Merlin (เมอร์ลิน)',
                    faction: 'good',
                    isEnabled: enableMerlin,
                    isSpecial: true,
                    onToggle: (val: boolean) => onUpdateSettings({ enableMerlin: val }),
                  },
                  {
                    key: 'avalon_percival',
                    name: 'Percival (เพอร์ซิวาล)',
                    faction: 'good',
                    isEnabled: enablePercival,
                    isSpecial: true,
                    onToggle: (val: boolean) => onUpdateSettings({ enablePercival: val }),
                  },
                  {
                    key: 'avalon_loyal_servant',
                    name: 'Loyal Servant (อัศวินผู้ภักดี)',
                    faction: 'good',
                    count: loyalServantsCount,
                    isSpecial: false,
                  },
                  {
                    key: 'avalon_assassin',
                    name: 'Assassin (มือสังหาร)',
                    faction: 'evil',
                    isEnabled: enableAssassin,
                    isSpecial: true,
                    onToggle: (val: boolean) => onUpdateSettings({ enableAssassin: val }),
                  },
                  {
                    key: 'avalon_morgana',
                    name: 'Morgana (มอร์กาน่า)',
                    faction: 'evil',
                    isEnabled: enableMorgana,
                    isSpecial: true,
                    onToggle: (val: boolean) => onUpdateSettings({ enableMorgana: val }),
                  },
                  {
                    key: 'avalon_mordred',
                    name: 'Mordred (มอร์ดเร็ด)',
                    faction: 'evil',
                    isEnabled: enableMordred,
                    isSpecial: true,
                    onToggle: (val: boolean) => onUpdateSettings({ enableMordred: val }),
                  },
                  {
                    key: 'avalon_oberon',
                    name: 'Oberon (โอเบรอน)',
                    faction: 'evil',
                    isEnabled: enableOberon,
                    isSpecial: true,
                    onToggle: (val: boolean) => onUpdateSettings({ enableOberon: val }),
                  },
                  {
                    key: 'avalon_minion',
                    name: 'Minion of Mordred (สมุนปีศาจ)',
                    faction: 'evil',
                    count: minionsCount,
                    isSpecial: false,
                  },
                ].map((role) => {
                  const isGood = role.faction === 'good';
                  const active = role.isSpecial ? role.isEnabled : true;

                  return (
                    <div
                      key={role.key}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 shadow-2xs ${
                        active
                          ? isGood
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-rose-50/70 border-rose-300'
                          : 'bg-slate-50/70 border-slate-200 opacity-70'
                      }`}
                    >
                      <div
                        onClick={() => {
                          onPlayFlipSound?.();
                          setDetailRoleKey(role.key);
                        }}
                        className="flex items-center gap-2.5 cursor-pointer min-w-0"
                      >
                        <AvalonRoleIcon roleId={role.key} size="sm" />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-900 truncate">
                            {role.name}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isGood
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-rose-200 text-rose-900'
                            }`}
                          >
                            {isGood ? 'ฝ่ายอัศวิน' : 'ฝ่ายปีศาจ'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onPlayFlipSound?.();
                            setDetailRoleKey(role.key);
                          }}
                          className={`p-1.5 text-xs bg-white/80 hover:bg-white rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ${
                            isGood ? 'hover:text-emerald-800' : 'hover:text-rose-800'
                          }`}
                          title="ดูข้อมูลและความสามารถ"
                        >
                          <Info
                            className={`w-3.5 h-3.5 ${
                              isGood ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          />
                          <span className="text-[11px] hidden sm:inline font-bold">ข้อมูล</span>
                        </button>

                        {role.isSpecial ? (
                          isHost ? (
                            <input
                              type="checkbox"
                              checked={role.isEnabled}
                              onChange={(e) => role.onToggle?.(e.target.checked)}
                              className={`w-5 h-5 rounded-md cursor-pointer shrink-0 ${
                                isGood
                                  ? 'text-emerald-600 focus:ring-emerald-400'
                                  : 'text-rose-600 focus:ring-rose-400'
                              }`}
                            />
                          ) : (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                role.isEnabled
                                  ? isGood
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {role.isEnabled ? 'เปิด' : 'ปิด'}
                            </span>
                          )
                        ) : (
                          <span
                            className={`px-2.5 py-1 text-xs font-mono font-black rounded-xl border ${
                              isGood
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border-rose-300'
                            }`}
                          >
                            {role.count} ใบ
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Same-Room 1-Click Add Friends Strip */}
      <SameRoomQuickFriendBar
        players={players}
        currentUid={currentUid}
        friends={[]}
      />

      {/* 4. Seated Players Grid & Bot Controls */}
      <div className="p-5 sm:p-6 bg-white border border-emerald-200 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-900">
              ผู้เล่นที่นั่งประจำโต๊ะ ({players.length} / 10 คน)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {isHost && onAddBot && players.length < 10 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  onPlayFlipSound?.();
                  onAddBot();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100/90 hover:bg-amber-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <Bot className="w-3.5 h-3.5 text-amber-700" />
                <span>+ เพิ่มบอทซ้อมมือ</span>
              </motion.button>
            )}

            {onOpenInviteModal && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onOpenInviteModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                <span>ดึงเพื่อนเข้าโต๊ะ</span>
              </motion.button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {players.map((p, idx) => {
              const isPBot = p.id.startsWith('bot_');
              const isPHost = p.id === currentRoom.hostId;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ delay: idx * 0.04 }}
                  className="p-3.5 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate flex items-center gap-1">
                      {isPHost && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />}
                      {isPBot && <Bot className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                      <span className="truncate">{p.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>{isPHost ? 'หัวหน้าโต๊ะ' : isPBot ? 'บอทซ้อมมือ' : 'ผู้เล่นพร้อม'}</span>
                      <SeatQuickAddFriendButton
                        seatPlayer={p}
                        currentUid={currentUid}
                      />
                    </div>
                  </div>

                  {isHost && !isPHost && onRemovePlayer && (
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => onRemovePlayer(p.id)}
                      title="ลบผู้เล่นคนนี้ออกจากโต๊ะ"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Start Game Action Bar */}
        {isHost ? (
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={isLoading || players.length < 5}
              onClick={onStartGame}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-sm rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {roleMode === 'manual'
                  ? 'ยืนยันจำนวนผู้เล่นและเปิดหน้าจอเลือกบทบาทตามไพ่จริง →'
                  : 'สุ่มแจกบทบาทและเริ่มศึกอัศวินโต๊ะกลม →'}
              </span>
            </motion.button>
            {players.length < 5 && (
              <p className="text-[11px] text-rose-600 text-center font-bold mt-2">
                * ต้องมีผู้เล่นอย่างน้อย 5 คนจึงจะเริ่มได้ (กดปุ่ม &quot;+ เพิ่มบอทซ้อมมือ&quot; เพื่อเติมผู้เล่นได้)
              </p>
            )}
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-xs font-bold text-emerald-900">
            ⏳ กำลังรอหัวหน้าโต๊ะ ({currentRoom.hostName}) กดเริ่มเกม...
          </div>
        )}
      </div>

      {/* Role Detail Modal */}
      <AvalonRoleDetailModal
        isOpen={Boolean(detailRoleKey)}
        onClose={() => setDetailRoleKey(null)}
        roleKey={detailRoleKey}
        isEnabled={
          detailRoleKey === 'avalon_merlin'
            ? enableMerlin
            : detailRoleKey === 'avalon_percival'
            ? enablePercival
            : detailRoleKey === 'avalon_assassin'
            ? enableAssassin
            : detailRoleKey === 'avalon_morgana'
            ? enableMorgana
            : detailRoleKey === 'avalon_mordred'
            ? enableMordred
            : detailRoleKey === 'avalon_oberon'
            ? enableOberon
            : true
        }
        isHost={isHost}
        quantity={
          detailRoleKey === 'avalon_loyal_servant'
            ? loyalServantsCount
            : detailRoleKey === 'avalon_minion'
            ? minionsCount
            : undefined
        }
        onToggleRole={(newVal) => {
          onPlayFlipSound?.();
          if (detailRoleKey === 'avalon_merlin') onUpdateSettings({ enableMerlin: newVal });
          else if (detailRoleKey === 'avalon_percival') onUpdateSettings({ enablePercival: newVal });
          else if (detailRoleKey === 'avalon_assassin') onUpdateSettings({ enableAssassin: newVal });
          else if (detailRoleKey === 'avalon_morgana') onUpdateSettings({ enableMorgana: newVal });
          else if (detailRoleKey === 'avalon_mordred') onUpdateSettings({ enableMordred: newVal });
          else if (detailRoleKey === 'avalon_oberon') onUpdateSettings({ enableOberon: newVal });
        }}
      />
    </div>
  );
};
