import { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../firebase/userService';
import {
  FirestoreRoom,
  DoraemonPlayerEntry,
} from '../firebase/table/types';
import {
  createDoraemonRoom,
  listenToDoraemonRoom,
  updateDoraemonRoster,
  startDoraemonGame,
  drawDoraemonCard,
  submitNextKingCommand,
  updateDoraemonCustomRules,
  resetDoraemonGame,
} from '../firebase/table/doraemonService';
import {
  CardRank,
  KING_COMMAND_PRESETS,
  getDoraemonCardById,
  DoraemonCard,
} from '../data/doraemonRules';
import { tableAudio } from '../utils/tableAudio';
import { useRoomTransition } from './useRoomTransition';

export interface UseDoraemonGameProps {
  currentUser: UserProfile | null;
  onActiveRoomChange?: (room: FirestoreRoom | null) => void;
}

export function useDoraemonGame({
  currentUser,
  onActiveRoomChange,
}: UseDoraemonGameProps) {
  const [activeRoom, setActiveRoom] = useState<FirestoreRoom | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Setup form states
  const [setupPlayers, setSetupPlayers] = useState<
    { name: string; avatar: string }[]
  >([
    { name: currentUser?.accountName || 'ผู้เล่น 1', avatar: '🐱' },
    { name: 'เพื่อนคนที่ 2', avatar: '🤖' },
    { name: 'เพื่อนคนที่ 3', avatar: '🐼' },
    { name: 'เพื่อนคนที่ 4', avatar: '🦊' },
  ]);
  const [newPlayerInput, setNewPlayerInput] = useState<string>('');
  const [initialKingCommand, setInitialKingCommand] = useState<string>(
    'เต้นท่าไก่กุ๊กๆ กลางวง 10 วินาที 🐔'
  );
  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(false);

  // Modals
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [customRulesState, setCustomRulesState] = useState<
    Record<string, string>
  >({});
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // King Command Manual Edit Modal State
  const [kingModalData, setKingModalData] = useState<{
    isOpen: boolean;
    activeCommand: string;
    kingPlayerName: string;
    newCommandInput: string;
  }>({
    isOpen: false,
    activeCommand: '',
    kingPlayerName: '',
    newCommandInput: '',
  });

  // 2-Stage Suspense & Grand Reveal Modal State
  const [revealStage, setRevealStage] = useState<{
    isOpen: boolean;
    stage: 'suspense' | 'revealed';
    drawerName: string;
    nextPlayerName: string;
    drawnCardId: string;
    activeKingCommandSnapshot: string;
    isFlipping: boolean;
  }>({
    isOpen: false,
    stage: 'suspense',
    drawerName: '',
    nextPlayerName: '',
    drawnCardId: '',
    activeKingCommandSnapshot: '',
    isFlipping: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    transitionProps,
    runStartGameTransition,
    runLeaveRoomTransition,
  } = useRoomTransition('doraemon');

  // Auto-listen to active room
  useEffect(() => {
    if (!roomId) return;
    const unsub = listenToDoraemonRoom(roomId, (room) => {
      setActiveRoom(room);
      if (onActiveRoomChange) onActiveRoomChange(room);
      if (room?.doraemonCustomRules) {
        setCustomRulesState(room.doraemonCustomRules);
      }
    });
    return () => unsub();
  }, [roomId, onActiveRoomChange]);

  // Sync fullscreen change event (e.g. user presses ESC or exits from browser UI)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle Fullscreen across entire document root (so document.body Portal Modals remain on top layer)
  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  };

  const AVATAR_OPTIONS = [
    '🐱',
    '🤖',
    '🐶',
    '🐼',
    '🦊',
    '🐰',
    '🦁',
    '🐨',
    '🦄',
    '🐯',
    '🐸',
    '🐵',
  ];

  // Add Player in Setup
  const handleAddPlayer = () => {
    const trimmed = newPlayerInput.trim();
    if (!trimmed) return;
    const randomAvatar =
      AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    setSetupPlayers((prev) => [...prev, { name: trimmed, avatar: randomAvatar }]);
    setNewPlayerInput('');
  };

  // Change Player Avatar
  const handleChangePlayerAvatar = (index: number, newAvatar: string) => {
    setSetupPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, avatar: newAvatar } : p))
    );
  };

  // Remove Player in Setup
  const handleRemovePlayer = (index: number) => {
    if (setupPlayers.length <= 2) return;
    setSetupPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  // Move Player Up / Down
  const handleMovePlayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= setupPlayers.length) return;
    const updated = [...setupPlayers];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSetupPlayers(updated);
  };

  // Randomize King Preset
  const handleRandomizeKingCommand = () => {
    const randomPreset =
      KING_COMMAND_PRESETS[
        Math.floor(Math.random() * KING_COMMAND_PRESETS.length)
      ];
    setInitialKingCommand(randomPreset);
    if (isSoundEnabled) tableAudio.playCardFlip();
  };

  // Start Game with Curtain Scene Transition
  const handleStartGame = async () => {
    setIsLoading(true);
    try {
      await runStartGameTransition(activeRoom?.roomCode, async () => {
        if (!activeRoom) {
          const newId = await createDoraemonRoom(
            'วงไพ่โดเรม่อนปาร์ตี้',
            initialKingCommand,
            setupPlayers
          );
          setRoomId(newId);
          await startDoraemonGame(newId);
          if (isSoundEnabled) tableAudio.playDiceRoll();
          return;
        }
        const players: DoraemonPlayerEntry[] = setupPlayers.map((p, idx) => ({
          id: `p_${idx + 1}_${Math.random().toString(36).slice(2, 6)}`,
          name: p.name.trim(),
          avatarEmoji: p.avatar,
          order: idx + 1,
          cardsDrawnCount: 0,
        }));
        await updateDoraemonRoster(activeRoom.id, players, initialKingCommand);
        await startDoraemonGame(activeRoom.id);
        if (isSoundEnabled) tableAudio.playDiceRoll();
      });
    } catch (err) {
      console.error('Failed to start game:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Active Player Helpers
  const playersList = activeRoom?.doraemonPlayers || [];
  const currentTurnIndex = activeRoom?.doraemonTurnIndex ?? 0;
  const currentTurnPlayer =
    playersList[currentTurnIndex % (playersList.length || 1)] || playersList[0];
  const nextTurnPlayer =
    playersList[(currentTurnIndex + 1) % (playersList.length || 1)] ||
    playersList[0];

  // STEP 1 OF DRAW: Tap Deck -> Lift Card into Suspense Spotlight
  const handleInitiateDraw = () => {
    if (!activeRoom || isLoading || revealStage.isOpen) return;
    if ((activeRoom.doraemonDeck?.length || 0) === 0) return;

    if (isSoundEnabled) {
      tableAudio.playCardFlip();
      tableAudio.playSuspensePulse();
    }
    tableAudio.vibrate([90, 60, 140]);

    const currentKingCmd =
      activeRoom.doraemonPinnedKing?.command ||
      activeRoom.doraemonInitialKingCommand ||
      initialKingCommand;

    setRevealStage({
      isOpen: true,
      stage: 'suspense',
      drawerName: currentTurnPlayer?.name || 'ผู้เล่น',
      nextPlayerName: nextTurnPlayer?.name || 'ผู้เล่นถัดไป',
      drawnCardId: '',
      activeKingCommandSnapshot: currentKingCmd,
      isFlipping: false,
    });
  };

  // STEP 2 OF DRAW: Player Taps Floating Card -> Flip 3D & Reveal Grand Card
  const handleConfirmFlipCard = async () => {
    if (!activeRoom || revealStage.isFlipping) return;

    setRevealStage((prev) => ({ ...prev, isFlipping: true }));
    if (isSoundEnabled) tableAudio.playCardFlip();
    tableAudio.vibrate([140, 70, 180]);

    try {
      const result = await drawDoraemonCard(activeRoom.id);
      if (result) {
        const isRoyal =
          result.rank === 'K' || result.rank === 'Q' || result.rank === 'J';
        if (isSoundEnabled) {
          if (result.rank === 'K') {
            tableAudio.playDramaticReveal(true);
          } else {
            tableAudio.playCardRevealFanfare(isRoyal);
          }
        }
        setRevealStage((prev) => ({
          ...prev,
          stage: 'revealed',
          drawnCardId: result.cardId,
          isFlipping: false,
        }));
      } else {
        setRevealStage((prev) => ({
          ...prev,
          isOpen: false,
          isFlipping: false,
        }));
      }
    } catch (err) {
      console.error('Failed to draw card:', err);
      setRevealStage((prev) => ({
        ...prev,
        isOpen: false,
        isFlipping: false,
      }));
    }
  };

  // STEP 3 OF DRAW: Acknowledge Revealed Card & Optional New King Command
  const handleAcknowledgeReveal = async (newKingCommand?: string) => {
    if (activeRoom && newKingCommand && newKingCommand.trim()) {
      try {
        await submitNextKingCommand(activeRoom.id, newKingCommand.trim());
      } catch (err) {
        console.error('Failed to update King command:', err);
      }
    }
    if (isSoundEnabled) tableAudio.playCardFlip();
    setRevealStage((prev) => ({ ...prev, isOpen: false }));
  };

  // Close reveal modal without passing turn (e.g. from Inspect mode)
  const handleCloseRevealModal = () => {
    if (isSoundEnabled) tableAudio.playCardFlip();
    setRevealStage((prev) => ({ ...prev, isOpen: false }));
  };

  // Open Current Card in Grand Showcase Again (Inspect Mode)
  const handleInspectCurrentCard = () => {
    if (!activeRoom?.doraemonCurrentCardId) return;
    if (isSoundEnabled) tableAudio.playCardFlip();
    const lastDrawer =
      activeRoom.doraemonDrawHistory?.[0]?.playerName || 'ผู้เล่น';
    const currentKingCmd =
      activeRoom.doraemonPinnedKing?.command ||
      activeRoom.doraemonInitialKingCommand ||
      initialKingCommand;

    setRevealStage({
      isOpen: true,
      stage: 'revealed',
      drawerName: lastDrawer,
      nextPlayerName: currentTurnPlayer?.name || 'ผู้เล่นถัดไป',
      drawnCardId: activeRoom.doraemonCurrentCardId,
      activeKingCommandSnapshot: currentKingCmd,
      isFlipping: false,
    });
  };

  // Submit King Command from Manual Edit Modal
  const handleSubmitKingCommand = async () => {
    if (!activeRoom || !kingModalData.newCommandInput.trim()) return;
    try {
      await submitNextKingCommand(
        activeRoom.id,
        kingModalData.newCommandInput.trim()
      );
      setKingModalData((prev) => ({ ...prev, isOpen: false }));
      if (isSoundEnabled) tableAudio.playCardFlip();
    } catch (err) {
      console.error('Failed to submit King command:', err);
    }
  };

  // Save Custom Rules
  const handleSaveCustomRules = async () => {
    if (!activeRoom) return;
    try {
      await updateDoraemonCustomRules(activeRoom.id, customRulesState);
      setIsRulesModalOpen(false);
      if (isSoundEnabled) tableAudio.playCardFlip();
    } catch (err) {
      console.error('Failed to update custom rules:', err);
    }
  };

  // Play Again with Fresh 52 Cards
  const handlePlayAgain = async () => {
    if (!activeRoom) return;
    setIsLoading(true);
    try {
      await runStartGameTransition(activeRoom.roomCode, async () => {
        await resetDoraemonGame(activeRoom.id);
        if (isSoundEnabled) tableAudio.playDiceRoll();
      });
    } catch (err) {
      console.error('Failed to reset game:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy Room Code
  const handleCopyRoomCode = () => {
    if (!activeRoom?.roomCode) return;
    navigator.clipboard.writeText(activeRoom.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Current Card Data Calculation
  const currentCard: DoraemonCard | null = activeRoom?.doraemonCurrentCardId
    ? getDoraemonCardById(activeRoom.doraemonCurrentCardId)
    : null;

  const currentRuleText = currentCard
    ? customRulesState[currentCard.rank] || currentCard.defaultRuleTh
    : '';

  // Safe Fallback Card for Modal
  const targetCardId = revealStage.drawnCardId || activeRoom?.doraemonCurrentCardId || '';
  const revealedModalCard: DoraemonCard | null = targetCardId
    ? getDoraemonCardById(targetCardId)
    : currentCard;

  const revealedModalRuleText = revealedModalCard
    ? customRulesState[revealedModalCard.rank] || revealedModalCard.defaultRuleTh
    : '';

  const remainingDeckCount = activeRoom?.doraemonDeck?.length ?? 52;
  const totalDrawn = activeRoom?.doraemonTotalDrawnCount ?? 0;

  return {
    activeRoom,
    roomId,
    isLoading,
    isSoundEnabled,
    setIsSoundEnabled,
    isFullscreen,
    containerRef,
    transitionProps,
    runLeaveRoomTransition,
    // Setup state & handlers
    setupPlayers,
    AVATAR_OPTIONS,
    newPlayerInput,
    setNewPlayerInput,
    initialKingCommand,
    setInitialKingCommand,
    handleAddPlayer,
    handleChangePlayerAvatar,
    handleRemovePlayer,
    handleMovePlayer,
    handleRandomizeKingCommand,
    handleStartGame,
    isHeaderVisible,
    setIsHeaderVisible,
    // Board state & helpers
    playersList,
    currentTurnIndex,
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
    // Draw & Inspect handlers
    revealStage,
    handleInitiateDraw,
    handleConfirmFlipCard,
    handleAcknowledgeReveal,
    handleCloseRevealModal,
    handleInspectCurrentCard,
    // Sub-modals
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
  };
}
