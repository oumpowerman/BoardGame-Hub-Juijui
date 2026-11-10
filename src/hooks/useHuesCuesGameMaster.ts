import { useCallback, useEffect, useRef } from 'react';
import { GamePhase } from '../firebase/table/types';
import { thaiGameMaster } from '../utils/thaiGameMasterTTS';
import { tableAudio } from '../utils/tableAudio';

export function useHuesCuesGameMaster(
  phase: GamePhase,
  clueGiverName?: string,
  clue1?: string,
  clue2?: string,
  isMuted: boolean = false
) {
  const lastSpokenPhaseRef = useRef<string>('');

  const speakPhaseInstruction = useCallback(
    (currentPhase: GamePhase) => {
      if (isMuted) return;

      const phaseKey = `${currentPhase}_${clue1 || ''}_${clue2 || ''}`;
      if (lastSpokenPhaseRef.current === phaseKey) return;

      let text = '';
      if (currentPhase === 'hc_clue_1') {
        tableAudio.playWakeChime(1);
        text = `เริ่มรอบใหม่แล้วครับ ขอเชิญผู้ให้คำใบ้ คุณ ${
          clueGiverName || 'โฮสต์'
        } ดูสีลับในโทรศัพท์ แล้วตั้งคำใบ้ที่หนึ่ง จำนวนหนึ่งคำครับ`;
      } else if (currentPhase === 'hc_guess_1') {
        tableAudio.playHourChime(3);
        text = `คำใบ้ที่หนึ่งคือคำว่า ${
          clue1 || 'ปริศนา'
        }... ขอเชิญผู้เล่นทุกคนเลือกสีในโทรศัพท์ของตัวเอง หรือลากหมากชื่อตัวเองบนกระดานไอแพดได้เลยครับ`;
      } else if (currentPhase === 'hc_clue_2') {
        tableAudio.playWakeChime(4);
        text = `เชิญผู้ให้คำใบ้ คุณ ${
          clueGiverName || 'โฮสต์'
        } ให้คำใบ้เพิ่มเติมรอบที่สอง หรือกดเปิดเผยเฉลยได้เลยครับ`;
      } else if (currentPhase === 'hc_guess_2') {
        tableAudio.playHourChime(5);
        text = `คำใบ้เพิ่มเติมคือคำว่า ${
          clue2 || ''
        }... ผู้เล่นทุกคนสามารถขยับหมากทายสีในโทรศัพท์หรือบนไอแพดเพื่อปรับตำแหน่งได้เลยครับ`;
      } else if (currentPhase === 'hc_scoring') {
        tableAudio.playMorningGong();
        text =
          'หมดเวลาทายสีแล้วครับ! เปิดเผยกรอบคะแนนสีเป้าหมาย 3 คูณ 3 บนกระดานไอแพด และสรุปคะแนนประจำรอบครับ';
      }

      if (text) {
        lastSpokenPhaseRef.current = phaseKey;
        thaiGameMaster.speak(text, `hues_${phaseKey}_${Date.now()}`);
      }
    },
    [isMuted, clueGiverName, clue1, clue2]
  );

  useEffect(() => {
    speakPhaseInstruction(phase);
  }, [phase, speakPhaseInstruction]);

  return { speakPhaseInstruction };
}
