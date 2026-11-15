import React from 'react';
import { GameSceneTransition } from '../transitions/GameSceneTransition';
import { UserProfile } from '../../firebase/userService';
import { FirestoreRoom } from '../../firebase/table/types';
import { CardRank } from '../../data/doraemonRules';
import { useDoraemonGame } from '../../hooks/useDoraemonGame';
import { DoraemonSetupView } from './DoraemonSetupView';
import { DoraemonTopBar } from './DoraemonTopBar';
import { DoraemonPinnedBadges } from './DoraemonPinnedBadges';
import { DoraemonTurnBanner } from './DoraemonTurnBanner';
import { DoraemonDeckTable } from './DoraemonDeckTable';
import { DoraemonCardRevealModal } from './DoraemonCardRevealModal';
import {
  DoraemonRulesModal,
  DoraemonHistoryModal,
  DoraemonKingCommandModal,
} from './DoraemonModals';
import { backToDoraemonSetup } from '../../firebase/table/doraemonService';

export interface DoraemonScreenProps {
  currentUser: UserProfile | null;
  initialRoomCode?: string;
  onBackToCatalog: () => void;
  onActiveRoomChange?: (room: FirestoreRoom | null) => void;
}

export const DoraemonScreen: React.FC<DoraemonScreenProps> = ({
  currentUser,
  onBackToCatalog,
  onActiveRoomChange,
}) => {
  const {
    activeRoom,
    isLoading,
    isSoundEnabled,
    setIsSoundEnabled,
    isFullscreen,
    containerRef,
    transitionProps,
    runLeaveRoomTransition,
    setupPlayers,
    AVATAR_OPTIONS,
    handleChangePlayerAvatar,
    newPlayerInput,
    setNewPlayerInput,
    initialKingCommand,
    setInitialKingCommand,
    handleAddPlayer,
    handleRemovePlayer,
    handleMovePlayer,
    handleRandomizeKingCommand,
    handleStartGame,
    currentTurnPlayer,
    nextTurnPlayer,
    currentCard,
    currentRuleText,
    revealedModalCard,
    revealedModalRuleText,
    remainingDeckCount,
    totalDrawn,
    copiedCode,
    handleToggleFullscreen,
    handleCopyRoomCode,
    handlePlayAgain,
    revealStage,
    handleInitiateDraw,
    handleConfirmFlipCard,
    handleAcknowledgeReveal,
    handleCloseRevealModal,
    handleInspectCurrentCard,
    isRulesModalOpen,
    setIsRulesModalOpen,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    customRulesState,
    setCustomRulesState,
    handleSaveCustomRules,
    kingModalData,
    setKingModalData,
    handleSubmitKingCommand,
    isHeaderVisible,
    setIsHeaderVisible,
  } = useDoraemonGame({
    currentUser,
    onActiveRoomChange,
  });

  // =========================================================================
  // VIEW 1: SETUP SCREEN (ใส่ชื่อทุกคน, ปรับลำดับคิว, ตั้งคำสั่ง K แรก)
  // =========================================================================
  if (!activeRoom || activeRoom.status === 'doraemon_setup') {
    return (
      <div
        ref={containerRef}
        className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/40 to-sky-50 text-slate-900 p-4 sm:p-6"
      >
        <GameSceneTransition {...transitionProps} />
        <DoraemonSetupView
          onBackToCatalog={onBackToCatalog}
          isSoundEnabled={isSoundEnabled}
          onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          initialKingCommand={initialKingCommand}
          onChangeInitialKingCommand={setInitialKingCommand}
          onRandomizeKingCommand={handleRandomizeKingCommand}
          setupPlayers={setupPlayers}
          avatarOptions={AVATAR_OPTIONS}
          onChangePlayerAvatar={handleChangePlayerAvatar}
          newPlayerInput={newPlayerInput}
          onChangeNewPlayerInput={setNewPlayerInput}
          onAddPlayer={handleAddPlayer}
          onRemovePlayer={handleRemovePlayer}
          onMovePlayer={handleMovePlayer}
          isLoading={isLoading}
          onStartGame={handleStartGame}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: GAMEPLAY BOARD SCREEN (จั่วไพ่ 2 จังหวะ, ปักหมุด JQK, สลับคิว)
  // =========================================================================
  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-radial from-amber-50/70 via-rose-50/40 to-slate-100 text-slate-900 p-3 sm:p-6 flex flex-col justify-between select-none"
    >
      <GameSceneTransition {...transitionProps} />

      {/* Top Bar or Minimal Floating Trigger */}
      {isHeaderVisible ? (
        <DoraemonTopBar
          roomCode={activeRoom.roomCode}
          copiedCode={copiedCode}
          onCopyRoomCode={handleCopyRoomCode}
          onBackToCatalog={onBackToCatalog}
          onOpenRules={() => setIsRulesModalOpen(true)}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
          totalDrawn={totalDrawn}
          onBackToSetup={() =>
            runLeaveRoomTransition(activeRoom.roomCode, () =>
              backToDoraemonSetup(activeRoom.id)
            )
          }
          isSoundEnabled={isSoundEnabled}
          onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onHideHeader={() => setIsHeaderVisible(false)}
        />
      ) : (
        <div className="flex items-center justify-end max-w-4xl mx-auto w-full pb-2">
          <button
            type="button"
            onClick={() => setIsHeaderVisible(true)}
            className="py-1.5 px-3 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-950 text-xs font-black shadow-sm flex items-center gap-1.5 hover:bg-amber-200 cursor-pointer transition-transform active:scale-95"
            title="แสดงเมนูหลักด้านบน"
          >
            <span>✨ เปิดเมนู</span>
          </button>
        </div>
      )}

      {/* Main Playing Area */}
      <div className="max-w-4xl mx-auto w-full my-auto space-y-4">
        {/* Pinned Badges Bar (J, Q, K) */}
        <DoraemonPinnedBadges
          activeRoom={activeRoom}
          initialKingCommand={initialKingCommand}
          onOpenKingModal={() =>
            setKingModalData({
              isOpen: true,
              activeCommand:
                activeRoom.doraemonPinnedKing?.command ||
                activeRoom.doraemonInitialKingCommand ||
                initialKingCommand,
              kingPlayerName:
                activeRoom.doraemonPinnedKing?.playerName || 'Host',
              newCommandInput: '',
            })
          }
        />

        {/* Current Turn Notification Banner */}
        <DoraemonTurnBanner
          currentTurnPlayer={currentTurnPlayer}
          nextTurnPlayer={nextTurnPlayer}
          totalDrawn={totalDrawn}
          remainingDeckCount={remainingDeckCount}
        />

        {/* Centerpiece: Interactive Card Table */}
        <DoraemonDeckTable
          remainingDeckCount={remainingDeckCount}
          totalDrawn={totalDrawn}
          lastDrawerName={activeRoom.doraemonDrawHistory?.[0]?.playerName || '-'}
          currentCard={currentCard}
          currentRuleText={currentRuleText}
          isRevealOpen={revealStage.isOpen}
          onInitiateDraw={handleInitiateDraw}
          onInspectCurrentCard={handleInspectCurrentCard}
          onPlayAgain={handlePlayAgain}
          onOpenKingModal={() =>
            setKingModalData({
              isOpen: true,
              activeCommand:
                activeRoom.doraemonPinnedKing?.command ||
                activeRoom.doraemonInitialKingCommand ||
                initialKingCommand,
              kingPlayerName:
                activeRoom.doraemonDrawHistory?.[0]?.playerName || 'King',
              newCommandInput: '',
            })
          }
        />
      </div>

      {/* Footer Info */}
      <div className="max-w-4xl mx-auto w-full pt-3 text-center text-[11px] text-slate-500">
        โหมดเครื่องเดียว (Single-Device / Pass & Play) · ลุ้นเปิดไพ่ 2 จังหวะพร้อมซิงค์ Firestore
      </div>

      {/* ===================================================================== */}
      {/* 2-STAGE SUSPENSE & GRAND REVEAL PORTAL MODAL */}
      {/* ===================================================================== */}
      <DoraemonCardRevealModal
        isOpen={revealStage.isOpen}
        stage={revealStage.stage}
        drawerPlayerName={revealStage.drawerName}
        nextPlayerName={revealStage.nextPlayerName}
        remainingDeckCount={remainingDeckCount}
        card={revealedModalCard}
        ruleText={revealedModalRuleText}
        activeKingCommand={revealStage.activeKingCommandSnapshot}
        isFlipping={revealStage.isFlipping}
        onConfirmFlip={handleConfirmFlipCard}
        onAcknowledgeAndContinue={handleAcknowledgeReveal}
        onClose={handleCloseRevealModal}
      />

      {/* ===================================================================== */}
      {/* MODALS (All wrapped in BaseModal & React.createPortal) */}
      {/* ===================================================================== */}
      <DoraemonKingCommandModal
        isOpen={kingModalData.isOpen}
        activeCommand={kingModalData.activeCommand}
        kingPlayerName={kingModalData.kingPlayerName}
        newCommandInput={kingModalData.newCommandInput}
        onChangeNewCommand={(val) =>
          setKingModalData((prev) => ({ ...prev, newCommandInput: val }))
        }
        onSubmitNewCommand={handleSubmitKingCommand}
        onClose={() => setKingModalData((prev) => ({ ...prev, isOpen: false }))}
      />

      <DoraemonRulesModal
        isOpen={isRulesModalOpen}
        customRulesState={customRulesState}
        onChangeCustomRule={(rank: CardRank, val: string) =>
          setCustomRulesState((prev) => ({ ...prev, [rank]: val }))
        }
        onResetAllRules={() => setCustomRulesState({})}
        onSaveRules={handleSaveCustomRules}
        onClose={() => setIsRulesModalOpen(false)}
      />

      <DoraemonHistoryModal
        isOpen={isHistoryModalOpen}
        history={activeRoom.doraemonDrawHistory || []}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
};
