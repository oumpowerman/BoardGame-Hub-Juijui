import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/tableService';
import { tableAudio } from '../../utils/tableAudio';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';

export interface UseDetectiveClubGameMasterOptions {
  activeRoom: FirestoreRoom | null;
  players: FirestorePlayer[];
  currentUid: string;
  soundEnabled: boolean;
}

export interface UseDetectiveClubGameMasterReturn {
  discussionSecondsLeft: number;
}

/**
 * Custom Hook isolating Detective Club discussion countdown timer,
 * Thai Game Master voice narration (including per-player physical card turns & speaker turns),
 * audio chime sound effects, and round reveal fanfare.
 */
export function useDetectiveClubGameMaster({
  activeRoom,
  players,
  currentUid,
  soundEnabled,
}: UseDetectiveClubGameMasterOptions): UseDetectiveClubGameMasterReturn {
  const [discussionSecondsLeft, setDiscussionSecondsLeft] = useState<number>(90);

  const prevStatusRef = useRef<string | undefined>(undefined);
  const prevCardRoundRef = useRef<number | undefined>(undefined);
  const prevTurnIndexRef = useRef<number | undefined>(undefined);
  const prevSpeakerIndexRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    thaiGameMaster.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Thai Game Master Voice Narration on Phase, Card Round, Player Turn & Speaker Turn Changes
  useEffect(() => {
    if (!activeRoom || !soundEnabled) return;

    const status = activeRoom.status;
    const cardRound = activeRoom.dcCardRound || 1;
    const turnOrderIds = activeRoom.dcTurnOrderIds || [];
    const turnIndex = activeRoom.dcTurnIndex ?? 0;
    const speakerIndex = activeRoom.dcSpeakerIndex ?? 0;

    const activePlayer = players.find(
      (p) => p.id === activeRoom.dcActivePlayerId
    );
    const activePlayerName = activePlayer?.name || 'ผู้ตั้งโจทย์';

    const currentTurnPlayerId = turnOrderIds[turnIndex];
    const currentTurnPlayerName =
      players.find((p) => p.id === currentTurnPlayerId)?.name || activePlayerName;

    const currentSpeakerId = turnOrderIds[speakerIndex];
    const currentSpeakerName =
      players.find((p) => p.id === currentSpeakerId)?.name || activePlayerName;

    const statusChanged = status !== prevStatusRef.current;
    const cardRoundChanged = cardRound !== prevCardRoundRef.current;
    const turnIndexChanged = turnIndex !== prevTurnIndexRef.current;
    const speakerIndexChanged = speakerIndex !== prevSpeakerIndexRef.current;

    prevStatusRef.current = status;
    prevCardRoundRef.current = cardRound;
    prevTurnIndexRef.current = turnIndex;
    prevSpeakerIndexRef.current = speakerIndex;

    if (status === 'dc_word_entry' && statusChanged) {
      thaiGameMaster.speakDetectiveWordEntry(activePlayerName);
    } else if (status === 'dc_card_rounds') {
      if (statusChanged || cardRoundChanged) {
        thaiGameMaster.speakDetectiveCardRound(cardRound, currentTurnPlayerName);
      } else if (turnIndexChanged && currentTurnPlayerId) {
        thaiGameMaster.speakDetectivePlayerCardTurn(
          cardRound,
          currentTurnPlayerName
        );
      }
    } else if (status === 'dc_discussion') {
      if (statusChanged) {
        thaiGameMaster.speakDetectiveDiscussion(
          activeRoom.dcSecretWord || '-',
          activePlayerName
        );
      } else if (speakerIndexChanged && speakerIndex > 0) {
        thaiGameMaster.speakDetectiveSpeakerTurn(currentSpeakerName);
      }
    } else if (status === 'dc_voting' && statusChanged) {
      thaiGameMaster.speakDetectiveVoting();
    } else if (status === 'dc_scoring' && statusChanged) {
      const caught = Boolean(activeRoom.dcRoundSummary?.caught);
      const conspiratorName =
        activeRoom.dcRoundSummary?.conspiratorName || 'ผู้สมรู้ร่วมคิด';
      thaiGameMaster.speakDetectiveScoring(caught, conspiratorName);
    }
  }, [
    activeRoom?.status,
    activeRoom?.dcCardRound,
    activeRoom?.dcTurnIndex,
    activeRoom?.dcSpeakerIndex,
    activeRoom?.dcTurnOrderIds,
    activeRoom?.dcActivePlayerId,
    activeRoom?.dcSecretWord,
    activeRoom?.dcRoundSummary?.caught,
    activeRoom?.dcRoundSummary?.conspiratorName,
    players,
    soundEnabled,
  ]);

  // Discussion countdown timer
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'dc_discussion') {
      setDiscussionSecondsLeft(activeRoom?.dcDiscussionDurationSeconds || 90);
      return;
    }

    const duration = activeRoom.dcDiscussionDurationSeconds || 90;
    setDiscussionSecondsLeft(duration);

    const timer = window.setInterval(() => {
      setDiscussionSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.dcDiscussionDurationSeconds,
  ]);

  // Round Scoring Reveal Fanfare & Confetti
  useEffect(() => {
    if (activeRoom?.status === 'dc_scoring') {
      const isConspiratorCaught = activeRoom.dcRoundSummary?.caught;
      const myPlayer = players.find((p) => p.id === currentUid);
      const isConspirator = myPlayer?.role === 'dc_conspirator';

      // Win sound check
      const didIWin = isConspirator
        ? !isConspiratorCaught
        : Boolean(isConspiratorCaught);

      if (soundEnabled) {
        tableAudio.playDramaticReveal(didIWin);
      }

      confetti({
        particleCount: 90,
        spread: 65,
        origin: { y: 0.6 },
      });
    }
  }, [
    activeRoom?.status,
    activeRoom?.dcRoundSummary?.caught,
    players,
    currentUid,
    soundEnabled,
  ]);

  return {
    discussionSecondsLeft,
  };
}
