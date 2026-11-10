import { useEffect } from 'react';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/tableService';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';

interface UseUndercoverGameMasterOptions {
  currentRoom: FirestoreRoom | null;
  players: FirestorePlayer[];
  soundEnabled: boolean;
}

export function useUndercoverGameMaster({
  currentRoom,
  players,
  soundEnabled,
}: UseUndercoverGameMasterOptions) {
  useEffect(() => {
    thaiGameMaster.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Phase & Round Verdict Voice Narration
  useEffect(() => {
    if (!currentRoom || !soundEnabled) return;

    const round = currentRoom.undercoverRoundNumber || 1;

    if (currentRoom.status === 'undercover_deal') {
      thaiGameMaster.speakUndercoverDeal(
        currentRoom.undercoverCategoryLabel || 'ชีวิตประจำวัน'
      );
    } else if (currentRoom.status === 'undercover_vote') {
      if (currentRoom.undercoverRoundVerdictPending) {
        const eliminatedName =
          currentRoom.undercoverLastEliminatedName || 'ผู้เล่นที่ถูกโหวต';
        const role = currentRoom.undercoverLastEliminatedRole;
        const roleLabel =
          role === 'undercover_spy'
            ? 'สายลับ'
            : role === 'undercover_mrwhite'
            ? 'มิสเตอร์ไวท์'
            : 'พลเมืองดี';
        thaiGameMaster.speakUndercoverRoundVerdict(
          eliminatedName,
          roleLabel,
          round + 1
        );
      } else {
        thaiGameMaster.speakUndercoverVotePhase(round);
      }
    } else if (currentRoom.status === 'undercover_mrwhite_guess') {
      const accused = players.find((p) => p.id === currentRoom.accusedPlayerId);
      thaiGameMaster.speakUndercoverMrWhiteChance(
        accused?.name || 'มิสเตอร์ไวท์'
      );
    } else if (currentRoom.status === 'undercover_game_over') {
      thaiGameMaster.speakUndercoverGameOver(
        currentRoom.winnerTeam,
        currentRoom.undercoverCivilianWord || '-',
        currentRoom.undercoverSpyWord || '-'
      );
    }
  }, [
    currentRoom?.status,
    currentRoom?.undercoverRoundVerdictPending,
    currentRoom?.undercoverRoundNumber,
    currentRoom?.undercoverLastEliminatedName,
    currentRoom?.undercoverLastEliminatedRole,
    currentRoom?.accusedPlayerId,
    currentRoom?.winnerTeam,
    soundEnabled,
    players,
  ]);

  // Speaker Turn Callout during Clue Phase
  useEffect(() => {
    if (
      !currentRoom ||
      !soundEnabled ||
      currentRoom.status !== 'undercover_clue' ||
      !currentRoom.undercoverTurnPlayerId
    ) {
      return;
    }

    const speaker = players.find(
      (p) => p.id === currentRoom.undercoverTurnPlayerId
    );
    if (!speaker) return;

    const round = currentRoom.undercoverRoundNumber || 1;
    thaiGameMaster.speakUndercoverSpeakerTurn(round, speaker.name);
  }, [
    currentRoom?.status,
    currentRoom?.undercoverTurnPlayerId,
    currentRoom?.undercoverRoundNumber,
    players,
    soundEnabled,
  ]);
}
