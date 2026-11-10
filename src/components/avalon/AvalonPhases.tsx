import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import {
  ShieldAlert,
  Crown,
  Check,
  X,
  Send,
  Trophy,
  RotateCcw,
  Sparkles,
  Flame,
  Shield,
  Target,
  Volume2,
} from 'lucide-react';
import {
  FirestoreRoom,
  FirestorePlayer,
  PlayerRoleCard,
  AvalonQuestResult,
} from '../../firebase/tableService';
import { AVALON_QUEST_MATRIX, AVALON_ROLES_META } from '../../data/avalonRules';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';
import { AvalonQuestTracker } from './AvalonQuestTracker';
import { AvalonRoleCard3D } from './AvalonRoleCard3D';
import { AvalonQuestRevealModal } from './AvalonQuestRevealModal';

export interface AvalonPhasesProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  isLoading: boolean;
  onSelectManualRole?: (role: PlayerRoleCard) => Promise<void>;
  onConfirmRoleRevealed: () => Promise<void>;
  onProposeTeam: (teamIds: string[]) => Promise<void>;
  onSubmitTeamVote: (choice: 'approve' | 'reject') => Promise<void>;
  onSubmitQuestVote: (choice: 'success' | 'fail') => Promise<void>;
  onSubmitAssassination: (targetId: string) => Promise<void>;
  onRematch: () => Promise<void>;
  onPlayCardFlipSound?: () => void;
  onPlaySuspenseTick?: () => void;
  onPlayCardSuccessSound?: () => void;
  onPlayCardFailSound?: () => void;
  onPlayVoteCastSound?: () => void;
}

const PHASE_ANIMATION_VARIANTS: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -14,
    scale: 0.98,
    transition: { duration: 0.2 },
  },
};

export const AvalonPhases: React.FC<AvalonPhasesProps> = ({
  currentRoom,
  players,
  currentUid,
  isLoading,
  onSelectManualRole,
  onConfirmRoleRevealed,
  onProposeTeam,
  onSubmitTeamVote,
  onSubmitQuestVote,
  onSubmitAssassination,
  onRematch,
  onPlayCardFlipSound,
  onPlaySuspenseTick,
  onPlayCardSuccessSound,
  onPlayCardFailSound,
  onPlayVoteCastSound,
}) => {
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [selectedAssassinTarget, setSelectedAssassinTarget] = useState<string>('');

  // Dramatic Quest Reveal Modal State
  const [activeRevealResult, setActiveRevealResult] = useState<{
    result: AvalonQuestResult;
    questNumber: number;
    requiredFails: number;
  } | null>(null);

  const prevResultsCountRef = useRef<number>(currentRoom.avalonQuestResults?.length || 0);

  const myPlayer = players.find((p) => p.id === currentUid);
  const isLeader = currentRoom.avalonLeaderId === currentUid;
  const isHost = currentRoom.hostId === currentUid;
  const isAssassin = myPlayer?.role === 'avalon_assassin';

  const totalPlayers = Math.min(10, Math.max(5, players.length));
  const matrix = AVALON_QUEST_MATRIX[totalPlayers] || AVALON_QUEST_MATRIX[5];
  const questIndex = currentRoom.avalonCurrentQuestIndex || 0;
  const currentQuestReq = matrix.quests[questIndex] || matrix.quests[0];

  // Auto-trigger dramatic reveal when a new quest completes
  useEffect(() => {
    const currentResults = currentRoom.avalonQuestResults || [];
    if (currentResults.length > prevResultsCountRef.current) {
      const latestResult = currentResults[currentResults.length - 1];
      const targetReq = matrix.quests[latestResult.questIndex] || matrix.quests[0];
      setActiveRevealResult({
        result: latestResult,
        questNumber: latestResult.questIndex + 1,
        requiredFails: targetReq.requiredFails,
      });
    }
    prevResultsCountRef.current = currentResults.length;
  }, [currentRoom.avalonQuestResults, matrix.quests]);

  // Role Vision Helper Logic
  const getRoleVisionList = () => {
    if (!myPlayer?.role) return [];
    const role = myPlayer.role;

    if (role === 'avalon_merlin') {
      return players.filter(
        (p) =>
          p.id !== currentUid &&
          (p.role === 'avalon_assassin' ||
            p.role === 'avalon_morgana' ||
            p.role === 'avalon_oberon' ||
            p.role === 'avalon_minion')
      );
    }

    if (role === 'avalon_percival') {
      return players.filter(
        (p) =>
          p.id !== currentUid &&
          (p.role === 'avalon_merlin' || p.role === 'avalon_morgana')
      );
    }

    if (
      role === 'avalon_assassin' ||
      role === 'avalon_morgana' ||
      role === 'avalon_mordred' ||
      role === 'avalon_minion'
    ) {
      return players.filter(
        (p) =>
          p.id !== currentUid &&
          (p.role === 'avalon_assassin' ||
            p.role === 'avalon_morgana' ||
            p.role === 'avalon_mordred' ||
            p.role === 'avalon_minion')
      );
    }

    return [];
  };

  const visionList = getRoleVisionList();
  const roleMeta = AVALON_ROLES_META[myPlayer?.role || 'avalon_loyal_servant'];

  // Open modal from quest tracker bubble click
  const handleOpenQuestReveal = (result: AvalonQuestResult, index: number) => {
    const req = matrix.quests[index] || matrix.quests[0];
    setActiveRevealResult({
      result,
      questNumber: index + 1,
      requiredFails: req.requiredFails,
    });
  };

  return (
    <div className="space-y-6">
      {/* Dramatic Quest Reveal Modal */}
      <AvalonQuestRevealModal
        isOpen={Boolean(activeRevealResult)}
        onClose={() => setActiveRevealResult(null)}
        result={activeRevealResult?.result || null}
        questNumber={activeRevealResult?.questNumber || 1}
        requiredFails={activeRevealResult?.requiredFails || 1}
        onPlaySuccessSound={onPlayCardSuccessSound}
        onPlayFailSound={onPlayCardFailSound}
        onPlayFlipSound={onPlayCardFlipSound}
        onPlaySuspenseTick={onPlaySuspenseTick}
      />

      <AnimatePresence mode="wait">
        {/* PHASE 1: Role Reveal */}
        {currentRoom.status === 'avalon_role_reveal' && (
          <motion.div
            key="avalon_role_reveal"
            variants={PHASE_ANIMATION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4 max-w-xl mx-auto"
          >
            {/* Optional Tabletop Night Script Voice Button */}
            <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="text-xs text-amber-900">
                <span className="font-black block">🎭 โหมดพากย์เสียงหลับตา-ลืมตาที่โต๊ะจริง</span>
                <span className="text-amber-700">
                  กดเพื่อให้ AI Game Master ขานบทหลับตา-ชูนิ้วโป้งให้เมอร์ลินและเพอร์ซิวาลส่องที่โต๊ะ
                </span>
              </div>
              <button
                type="button"
                onClick={() => thaiGameMaster.speakAvalonTabletopNightScript()}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>ให้ GM ขานบทหลับตา</span>
              </button>
            </div>

            <AvalonRoleCard3D
              myPlayer={myPlayer}
              roleMeta={roleMeta}
              visionList={visionList}
              isManualMode={currentRoom.avalonRoleMode === 'manual'}
              onSelectManualRole={onSelectManualRole}
              onConfirmRoleRevealed={onConfirmRoleRevealed}
              isLoading={isLoading}
              onPlayFlipSound={onPlayCardFlipSound}
            />
          </motion.div>
        )}

        {/* PHASE 2: Team Selection */}
        {currentRoom.status === 'avalon_team_selection' && (
          <motion.div
            key="avalon_team_selection"
            variants={PHASE_ANIMATION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <AvalonQuestTracker
              currentRoom={currentRoom}
              totalPlayers={players.length}
              onOpenQuestReveal={handleOpenQuestReveal}
            />

            <div className="p-6 bg-white/95 backdrop-blur-xs border border-emerald-200 rounded-3xl space-y-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-3">
                <div>
                  <span className="text-[11px] font-mono font-bold text-emerald-800 uppercase tracking-wider block">
                    QUEST 0{questIndex + 1} · TEAM SELECTION
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    เสนอรายชื่ออัศวินทำภารกิจที่ {questIndex + 1} ({currentQuestReq.teamSize} คน)
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500 block">หัวหน้าทีมรอบนี้:</span>
                  <span className="text-xs font-black text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5 shadow-2xs">
                    <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-400 animate-bounce" />
                    {players.find((p) => p.id === currentRoom.avalonLeaderId)?.name || 'Leader'}
                  </span>
                </div>
              </div>

              {isLeader ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600">
                    คุณคือหัวหน้าทีม! กรุณาเลือกอัศวินจำนวน <strong>{currentQuestReq.teamSize} คน</strong> เพื่อออกทำภารกิจ:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {players.map((p) => {
                      const isSelected = selectedTeamIds.includes(p.id);
                      return (
                        <motion.button
                          key={p.id}
                          type="button"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            onPlayCardFlipSound?.();
                            if (selectedTeamIds.includes(p.id)) {
                              setSelectedTeamIds(selectedTeamIds.filter((id) => id !== p.id));
                            } else if (selectedTeamIds.length < currentQuestReq.teamSize) {
                              setSelectedTeamIds([...selectedTeamIds, p.id]);
                            }
                          }}
                          className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-100/90 border-emerald-500 font-extrabold text-emerald-950 ring-2 ring-emerald-300/80 shadow-xs'
                              : 'bg-slate-50 hover:bg-emerald-50/50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <span className="text-xs truncate font-bold">{p.name}</span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={selectedTeamIds.length !== currentQuestReq.teamSize || isLoading}
                    onClick={async () => {
                      if (selectedTeamIds.length !== currentQuestReq.teamSize || isLoading) return;
                      onPlayVoteCastSound?.();
                      await onProposeTeam(selectedTeamIds);
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>เสนอรายชื่อทีมนี้ให้ทั้งกลุ่มลงมติ ({selectedTeamIds.length}/{currentQuestReq.teamSize}) →</span>
                  </motion.button>
                </div>
              ) : (
                <div className="p-5 bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-200 rounded-2xl text-center text-xs font-bold text-emerald-900 space-y-1 shadow-2xs">
                  <p className="text-sm">⏳ รอหัวหน้าทีมเลือกอัศวิน {currentQuestReq.teamSize} คน...</p>
                  <p className="text-slate-500">
                    หัวหน้าทีมปัจจุบันคือ <strong>{players.find((p) => p.id === currentRoom.avalonLeaderId)?.name}</strong>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* PHASE 3: Team Vote (Approve / Reject) */}
        {currentRoom.status === 'avalon_team_vote' && (
          <motion.div
            key="avalon_team_vote"
            variants={PHASE_ANIMATION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <AvalonQuestTracker
              currentRoom={currentRoom}
              totalPlayers={players.length}
              onOpenQuestReveal={handleOpenQuestReveal}
            />

            <div className="p-6 bg-white/95 backdrop-blur-xs border border-emerald-200 rounded-3xl space-y-5 shadow-sm">
              <div className="text-center space-y-2 border-b border-emerald-100 pb-4">
                <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider block">
                  TEAM APPROVAL VOTE · โหวตรับรองทีม
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  ลงมติเห็นชอบทีมทำภารกิจที่ {questIndex + 1}
                </h3>
                <p className="text-xs text-slate-600">
                  หัวหน้าทีมเสนอสมาชิก <strong>{currentRoom.avalonProposedTeamIds?.length || 0} คน</strong> ออกทำภารกิจ:
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {players
                    .filter((p) => currentRoom.avalonProposedTeamIds?.includes(p.id))
                    .map((m) => (
                      <motion.span
                        key={m.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="px-3.5 py-1.5 bg-emerald-100 text-emerald-950 font-extrabold text-xs rounded-xl border border-emerald-300 shadow-2xs"
                      >
                        ⚔️ {m.name}
                      </motion.span>
                    ))}
                </div>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <p className="text-center text-xs font-bold text-slate-700">
                  คุณไว้วางใจให้ทีมนี้ออกทำภารกิจหรือไม่?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={Boolean(currentRoom.avalonTeamVotes?.[currentUid]) || isLoading}
                    onClick={async () => {
                      onPlayVoteCastSound?.();
                      await onSubmitTeamVote('approve');
                    }}
                    className="py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>เห็นชอบ (Approve)</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={Boolean(currentRoom.avalonTeamVotes?.[currentUid]) || isLoading}
                    onClick={async () => {
                      onPlayVoteCastSound?.();
                      await onSubmitTeamVote('reject');
                    }}
                    className="py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    <span>คัดค้าน (Reject)</span>
                  </motion.button>
                </div>

                <div className="text-center text-xs font-mono font-bold text-slate-500 pt-1">
                  ลงคะแนนแล้ว {Object.keys(currentRoom.avalonTeamVotes || {}).length} / {players.length} คน
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PHASE 4: Quest Secret Vote */}
        {currentRoom.status === 'avalon_quest_vote' && (
          <motion.div
            key="avalon_quest_vote"
            variants={PHASE_ANIMATION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <AvalonQuestTracker
              currentRoom={currentRoom}
              totalPlayers={players.length}
              onOpenQuestReveal={handleOpenQuestReveal}
            />

            <div className="p-6 bg-white/95 backdrop-blur-xs border border-emerald-200 rounded-3xl space-y-5 shadow-sm text-center">
              <div className="space-y-1.5 border-b border-emerald-100 pb-4">
                <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider block">
                  SECRET QUEST EXECUTION · ลงคะแนนภารกิจลับ
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  ส่งการ์ดภารกิจลับรอบที่ {questIndex + 1}
                </h3>
                <p className="text-xs text-slate-600">
                  ต้องการอย่างน้อย <strong>{currentQuestReq.requiredFails} การ์ดล้มเหลว (Fail)</strong> ในการทำลายภารกิจนี้
                </p>
              </div>

              {currentRoom.avalonProposedTeamIds?.includes(currentUid) ? (
                <div className="max-w-md mx-auto space-y-4">
                  <p className="text-xs font-black text-slate-800">
                    คุณคือสมาชิกทีมทำภารกิจ! กรุณาเลือกการ์ดลงในกล่องภารกิจลับ:
                  </p>

                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Success Card Option */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={Boolean(currentRoom.avalonQuestVotes?.[currentUid]) || isLoading}
                      onClick={async () => {
                        onPlayVoteCastSound?.();
                        await onSubmitQuestVote('success');
                      }}
                      className="py-5 bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 disabled:opacity-50 text-white font-black text-sm rounded-3xl transition-all shadow-md cursor-pointer flex flex-col items-center gap-1.5 border-2 border-emerald-300"
                    >
                      <span className="text-2xl">⚔️</span>
                      <span>ภารกิจสำเร็จ</span>
                      <span className="text-[10px] font-mono opacity-80">(Success)</span>
                    </motion.button>

                    {/* Fail Card Option */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={
                        Boolean(currentRoom.avalonQuestVotes?.[currentUid]) ||
                        isLoading ||
                        roleMeta?.faction === 'good'
                      }
                      onClick={async () => {
                        onPlayVoteCastSound?.();
                        await onSubmitQuestVote('fail');
                      }}
                      className="py-5 bg-gradient-to-b from-rose-500 to-rose-700 hover:from-rose-600 hover:to-rose-800 disabled:opacity-40 text-white font-black text-sm rounded-3xl transition-all shadow-md cursor-pointer flex flex-col items-center gap-1.5 border-2 border-rose-300"
                    >
                      <span className="text-2xl">🔥</span>
                      <span>ทำลายภารกิจ</span>
                      <span className="text-[10px] font-mono opacity-80">(Fail)</span>
                      {roleMeta?.faction === 'good' && (
                        <span className="text-[10px] font-normal text-rose-200">
                          (ฝ่ายอัศวินต้องส่ง Success)
                        </span>
                      )}
                    </motion.button>
                  </div>

                  <div className="text-xs font-mono font-bold text-slate-500">
                    สมาชิกทีมส่งการ์ดแล้ว {Object.keys(currentRoom.avalonQuestVotes || {}).length} / {currentRoom.avalonProposedTeamIds?.length || 0} คน
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 space-y-1">
                  <p className="text-sm">⏳ สมาชิกทีมกำลังส่งการ์ดภารกิจลับในมือถือ...</p>
                  <div className="text-slate-500 font-mono">
                    ส่งการ์ดแล้ว {Object.keys(currentRoom.avalonQuestVotes || {}).length} / {currentRoom.avalonProposedTeamIds?.length || 0} คน
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* PHASE 5: Assassination Stage */}
        {currentRoom.status === 'avalon_assassination' && (
          <motion.div
            key="avalon_assassination"
            variants={PHASE_ANIMATION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <AvalonQuestTracker
              currentRoom={currentRoom}
              totalPlayers={players.length}
              onOpenQuestReveal={handleOpenQuestReveal}
            />

            <div className="p-6 bg-white/95 backdrop-blur-xs border-2 border-rose-400 rounded-3xl space-y-5 shadow-lg">
              <div className="text-center space-y-2 border-b border-rose-100 pb-4">
                <motion.span
                  animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 font-bold text-2xl flex items-center justify-center mx-auto shadow-inner"
                >
                  🗡️
                </motion.span>
                <h3 className="text-lg sm:text-xl font-black text-rose-950">
                  เฟสสังหาร Merlin! (ASSASSINATION STAGE)
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  ฝ่ายอัศวินทำภารกิจสำเร็จครบ 3 รอบ! แต่ฝ่ายปีศาจยังมีโอกาสสุดท้าย หาก <strong>Assassin (มือสังหาร)</strong> ชี้ตัว Merlin ถูก ฝ่ายปีศาจจะพลิกมาชนะทันที!
                </p>
              </div>

              {isAssassin ? (
                <div className="max-w-md mx-auto space-y-4">
                  <p className="text-xs font-extrabold text-rose-900 text-center">
                    คุณคือ Assassin! เลือกชี้เป้าผู้เล่นที่คุณสงสัยว่าเป็น Merlin:
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {players
                      .filter(
                        (p) =>
                          p.role === 'avalon_merlin' ||
                          p.role === 'avalon_percival' ||
                          p.role === 'avalon_loyal_servant'
                      )
                      .map((p) => {
                        const isSelected = selectedAssassinTarget === p.id;
                        return (
                          <motion.button
                            key={p.id}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              onPlayCardFlipSound?.();
                              setSelectedAssassinTarget(p.id);
                            }}
                            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-rose-100 border-rose-600 text-rose-950 ring-2 ring-rose-400 font-black shadow-xs'
                                : 'bg-slate-50 hover:bg-rose-50/50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <span className="text-xs truncate">{p.name}</span>
                            {isSelected && <Target className="w-4 h-4 text-rose-700 shrink-0" />}
                          </motion.button>
                        );
                      })}
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.96 }}
                    disabled={!selectedAssassinTarget || isLoading}
                    onClick={async () => {
                      if (!selectedAssassinTarget || isLoading) return;
                      onPlayVoteCastSound?.();
                      await onSubmitAssassination(selectedAssassinTarget);
                    }}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>🗡️ ปลิดชีพเป้าหมายคนนี้ (ชี้ขาดชัยชนะ)</span>
                  </motion.button>
                </div>
              ) : (
                <div className="p-5 bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-2xl text-center text-xs font-bold text-rose-950 space-y-1">
                  <p className="text-sm">⏳ กำลังรอ Assassin กำลังชี้ตัว Merlin...</p>
                  <p className="text-slate-600">
                    ฝ่ายปีศาจกำลังปรึกษากันที่โต๊ะอย่างดุเดือด!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* PHASE 6: Scoring & Victory */}
        {currentRoom.status === 'avalon_scoring' && (
          <motion.div
            key="avalon_scoring"
            variants={PHASE_ANIMATION_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            {/* Victory Crest Banner */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 18 }}
              className={`p-6 sm:p-8 rounded-3xl text-center space-y-3 shadow-lg ${
                currentRoom.winnerTeam === 'good'
                  ? 'bg-gradient-to-br from-emerald-100 via-white to-amber-100 border-2 border-emerald-400 text-emerald-950'
                  : 'bg-gradient-to-br from-rose-100 via-white to-amber-100 border-2 border-rose-400 text-rose-950'
              }`}
            >
              <span className="text-5xl block animate-bounce">
                {currentRoom.winnerTeam === 'good' ? '👑' : '🔥'}
              </span>

              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 bg-white/90 rounded-full inline-block border">
                  {currentRoom.winnerTeam === 'good'
                    ? 'VICTORY FOR ARTHUR · ฝ่ายอัศวินกอบกู้อาณาจักรสำเร็จ!'
                    : 'EVIL TRIUMPHS · ฝ่ายปีศาจยึดครองอาณาจักร!'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black">
                  {currentRoom.winnerTeam === 'good'
                    ? 'ฝ่ายอัศวินแห่งอาเธอร์ ชนะ!'
                    : 'ฝ่ายปีศาจแห่งมอร์ดเร็ด ชนะ!'}
                </h2>
                {currentRoom.avalonAssassinationTargetId && (
                  <p className="text-xs sm:text-sm text-slate-600">
                    {currentRoom.avalonAssassinationSuccess
                      ? '🗡️ Assassin สังหาร Merlin ถูกต้องสำเร็จ!'
                      : '🛡️ Assassin ทาย Merlin ผิด! Merlin ปลอดภัย!'}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Revealed True Roles & Standings */}
            <div className="p-6 bg-white border border-emerald-200 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-black text-slate-900">
                    เฉลยบทบาทจริงและคะแนนอันดับ ELO
                  </h3>
                </div>
                <span className="text-xs font-mono font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  ชนะ +25 ELO / แพ้ -15 ELO
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {players.map((p, idx) => {
                  const pMeta = AVALON_ROLES_META[p.role || 'avalon_loyal_servant'];
                  const isWinner =
                    (currentRoom.winnerTeam === 'good' && pMeta?.faction === 'good') ||
                    (currentRoom.winnerTeam === 'evil' && pMeta?.faction === 'evil');

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        isWinner
                          ? 'bg-emerald-50/80 border-emerald-300'
                          : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{p.name}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              pMeta?.faction === 'good'
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-rose-200 text-rose-900'
                            }`}
                          >
                            {pMeta?.nameTh}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isWinner ? (
                            <strong className="text-emerald-700">✓ ฝ่ายชนะ (+25 ELO)</strong>
                          ) : (
                            <span className="text-slate-500">✕ ฝ่ายแพ้ (-15 ELO)</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {isHost && (
                <div className="pt-4 border-t border-emerald-100 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={onRematch}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>เปิดศึกรอบถัดไป (สลับ Leader) →</span>
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
