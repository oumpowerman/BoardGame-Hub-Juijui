import { useState, useRef, useCallback, useEffect } from 'react';
import {
  TransitionGameVariant,
  SceneTransitionMode,
} from '../components/transitions/GameSceneTransition';

export interface UseRoomTransitionReturn {
  transitionProps: {
    isVisible: boolean;
    mode: SceneTransitionMode;
    gameVariant: TransitionGameVariant;
    roomCode?: string;
    errorMessage?: string | null;
    onDismissError: () => void;
  };
  isCodeInputError: boolean;
  clearCodeInputError: () => void;
  runCreateRoomTransition: <T extends { roomCode?: string }>(
    action: () => Promise<T>
  ) => Promise<T | null>;
  runJoinRoomTransition: <T extends { roomCode?: string }>(
    rawCodeOrLabel: string,
    action: () => Promise<T>
  ) => Promise<T | null>;
  runLeaveRoomTransition: (
    roomCode: string | undefined,
    action: () => Promise<void>
  ) => Promise<void>;
  runStartGameTransition: (
    roomCode: string | undefined,
    action: () => Promise<void>
  ) => Promise<void>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Reusable hook for orchestrating smooth Portal curtain transitions
 * across Create Room, Join Room (both valid & invalid codes), Leave Room, and Start Game.
 */
export function useRoomTransition(
  gameVariant: TransitionGameVariant
): UseRoomTransitionReturn {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [mode, setMode] = useState<SceneTransitionMode>('enter');
  const [roomCode, setRoomCode] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCodeInputError, setIsCodeInputError] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const dismissError = useCallback(() => {
    clearTimer();
    setIsVisible(false);
    setErrorMessage(null);
  }, [clearTimer]);

  const clearCodeInputError = useCallback(() => {
    setIsCodeInputError(false);
  }, []);

  const showErrorCurtain = useCallback(
    (codeLabel: string | undefined, msg: string) => {
      clearTimer();
      setRoomCode(codeLabel);
      setErrorMessage(msg);
      setMode('join_error');
      setIsVisible(true);
      setIsCodeInputError(true);

      timerRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, 1850);
    },
    [clearTimer]
  );

  const runCreateRoomTransition = useCallback(
    async <T extends { roomCode?: string }>(
      action: () => Promise<T>
    ): Promise<T | null> => {
      clearTimer();
      setIsCodeInputError(false);
      setErrorMessage(null);
      setRoomCode(undefined);
      setMode('create_room');
      setIsVisible(true);

      const start = Date.now();
      try {
        const result = await action();
        const elapsed = Date.now() - start;
        if (elapsed < 380) {
          await wait(380 - elapsed);
        }
        if (result?.roomCode) {
          setRoomCode(result.roomCode);
          setMode('join_success');
          await wait(360);
        }
        setIsVisible(false);
        return result;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'ไม่สามารถสร้างห้องได้ในขณะนี้';
        showErrorCurtain(undefined, msg);
        return null;
      }
    },
    [clearTimer, showErrorCurtain]
  );

  const runJoinRoomTransition = useCallback(
    async <T extends { roomCode?: string }>(
      rawCodeOrLabel: string,
      action: () => Promise<T>
    ): Promise<T | null> => {
      clearTimer();
      setIsCodeInputError(false);
      setErrorMessage(null);

      const cleanDisplay = rawCodeOrLabel.startsWith('room_')
        ? undefined
        : rawCodeOrLabel.trim().toUpperCase();

      setRoomCode(cleanDisplay);
      setMode('join_verifying');
      setIsVisible(true);

      const start = Date.now();
      try {
        const result = await action();
        const elapsed = Date.now() - start;
        if (elapsed < 340) {
          await wait(340 - elapsed);
        }
        setRoomCode(result?.roomCode || cleanDisplay);
        setMode('join_success');
        await wait(380);
        setIsVisible(false);
        return result;
      } catch (err) {
        const elapsed = Date.now() - start;
        if (elapsed < 260) {
          await wait(260 - elapsed);
        }
        const msg =
          err instanceof Error
            ? err.message
            : 'ไม่พบห้องรหัสนี้ กรุณาตรวจสอบรหัสห้องอีกครั้ง';
        showErrorCurtain(cleanDisplay, msg);
        return null;
      }
    },
    [clearTimer, showErrorCurtain]
  );

  const runLeaveRoomTransition = useCallback(
    async (
      code: string | undefined,
      action: () => Promise<void>
    ): Promise<void> => {
      clearTimer();
      setErrorMessage(null);
      setRoomCode(code);
      setMode('leave_room');
      setIsVisible(true);

      const start = Date.now();
      try {
        await action();
      } finally {
        const elapsed = Date.now() - start;
        if (elapsed < 380) {
          await wait(380 - elapsed);
        }
        setIsVisible(false);
      }
    },
    [clearTimer]
  );

  const runStartGameTransition = useCallback(
    async (
      code: string | undefined,
      action: () => Promise<void>
    ): Promise<void> => {
      clearTimer();
      setErrorMessage(null);
      setRoomCode(code);
      setMode('start_game');
      setIsVisible(true);

      const start = Date.now();
      try {
        await action();
        const elapsed = Date.now() - start;
        if (elapsed < 440) {
          await wait(440 - elapsed);
        }
        setIsVisible(false);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'ไม่สามารถเริ่มเกมได้ในขณะนี้';
        showErrorCurtain(code, msg);
      }
    },
    [clearTimer, showErrorCurtain]
  );

  return {
    transitionProps: {
      isVisible,
      mode,
      gameVariant,
      roomCode,
      errorMessage,
      onDismissError: dismissError,
    },
    isCodeInputError,
    clearCodeInputError,
    runCreateRoomTransition,
    runJoinRoomTransition,
    runLeaveRoomTransition,
    runStartGameTransition,
  };
}
