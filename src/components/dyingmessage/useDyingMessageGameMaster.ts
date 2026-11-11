import { useEffect, useState, useRef } from 'react';
import {
  FirestoreRoom,
  FirestorePlayer,
  selectDyingMessageVictim,
  submitVictimRealEvidenceCard,
  submitKillerFakeEvidenceCards,
  submitDetectiveInspection,
  castDyingMessageVote,
  isAutoControlledSeat,
} from '../../firebase/tableService';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';
import { tableAudio } from '../../utils/tableAudio';

interface UseDyingMessageGameMasterProps {
  activeRoom: FirestoreRoom | null;
  players: FirestorePlayer[];
  currentUid: string;
  isIpadBoardView: boolean;
}

export function useDyingMessageGameMaster({
  activeRoom,
  players,
  currentUid,
  isIpadBoardView,
}: UseDyingMessageGameMasterProps) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [debateSecondsLeft, setDebateSecondsLeft] = useState<number>(180);
  const lastAnnouncedKeyRef = useRef<string>('');

  const isHost = activeRoom?.hostId === currentUid;
  // When iPad Central Board is connected, prioritize voice from the iPad or Host
  const shouldSpeakOnThisDevice =
    isVoiceEnabled &&
    (isIpadBoardView || (!activeRoom?.dmIpadConnected && isHost));

  // 1. Debate Countdown Timer during dm_day_discussion
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'dm_day_discussion') {
      setDebateSecondsLeft(activeRoom?.dmDebateDurationSeconds || 180);
      return;
    }

    setDebateSecondsLeft(activeRoom.dmDebateDurationSeconds || 180);
    const interval = window.setInterval(() => {
      setDebateSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.dmRoundNumber,
    activeRoom?.dmDebateDurationSeconds,
  ]);

  // 2. Thai Game Master TTS Narration & Sound Effects
  useEffect(() => {
    if (!activeRoom) return;
    const round = activeRoom.dmRoundNumber || 1;
    const phaseKey = `${activeRoom.id}_${activeRoom.status}_r${round}_${Boolean(
      activeRoom.dmDoctorSkillUsed
    )}`;

    if (lastAnnouncedKeyRef.current === phaseKey) return;
    lastAnnouncedKeyRef.current = phaseKey;

    if (!shouldSpeakOnThisDevice) return;

    switch (activeRoom.status) {
      case 'dm_role_deal':
        tableAudio.playDiceRoll();
        thaiGameMaster.speak(
          'แจกบทบาทลับเรียบร้อย กดค้างที่การ์ดในมือถือเพื่อดูบทบาทของตัวเอง แล้ววางมือถือลงเพื่อเตรียมเข้าสู่ยามค่ำคืน',
          phaseKey
        );
        break;
      case 'dm_night_kill':
        tableAudio.playSleepChime();
        thaiGameMaster.speak(
          'ค่ำคืนแห่งคดีฆาตกรรมเริ่มต้นขึ้น ขอให้ทุกคนหลับตา ฆาตกรเงามืดโปรดเลือกเหยื่อหนึ่งคนบนหน้าจอ',
          phaseKey
        );
        break;
      case 'dm_victim_clue':
        tableAudio.playWakeChime(round);
        thaiGameMaster.speak(
          `คืนที่ ${round} ผู้ตายโปรดเลือกการ์ดเบาะแสมรณะจริงหนึ่งใบที่สื่อถึงตัวฆาตกร และฆาตกรโปรดเลือกการ์ดเบาะแสปลอมสองใบเพื่อตบตาชาวบ้าน`,
          phaseKey
        );
        break;
      case 'dm_special_roles':
        tableAudio.playDiceRoll();
        thaiGameMaster.speak(
          'ถึงเวลาของตำรวจสายสืบ โปรดเลือกส่องผู้ต้องสงสัยหนึ่งคนบนหน้าจอมือถือ',
          phaseKey
        );
        break;
      case 'dm_day_discussion':
        tableAudio.playMorningGong();
        if (activeRoom.dmDoctorSkillUsed) {
          thaiGameMaster.speak(
            'หมอชันสูตรได้ใช้ความสามารถพิเศษ ตัดการ์ดเบาะแสปลอมบนกระดานออกไปหนึ่งใบแล้ว!',
            phaseKey
          );
        } else {
          thaiGameMaster.speak(
            `เช้าวันใหม่มาถึงแล้ว ทุกคนลืมตาและเงยหน้าดูการ์ดเบาะแสมรณะทั้งสามใบบนกระดานกลาง ห้ามผู้ตายพูดใบ้เพิ่มเติม เริ่มการสืบสวนได้!`,
            phaseKey
          );
        }
        break;
      case 'dm_voting':
        tableAudio.playWakeChime(3);
        thaiGameMaster.speak(
          'หมดเวลาสืบสวน ถึงเวลาชี้ตัวฆาตกร! นับสาม สอง หนึ่ง ชี้ตัวผู้ต้องสงสัยพร้อมกัน หรือกดโหวตยืนยันได้เลย',
          phaseKey
        );
        break;
      case 'dm_round_verdict':
        tableAudio.playDramaticReveal(false);
        thaiGameMaster.speak(
          `ผู้ที่ถูกโหวตออกคือ ${
            activeRoom.dmLastEliminatedName || 'ผู้ต้องสงสัย'
          } แต่น่าเสียดายที่เขาไม่ใช่ฆาตกรตัวจริง! คดีจึงต้องดำเนินต่อไปในคืนถัดไป`,
          phaseKey
        );
        break;
      case 'dm_game_over':
        tableAudio.playDramaticReveal(
          activeRoom.winnerTeam === 'dm_civilians'
        );
        if (activeRoom.winnerTeam === 'dm_civilians') {
          thaiGameMaster.speak(
            `ขอแสดงความยินดีด้วย! ชาวบ้านและสายสืบจับตัวฆาตกร ${
              activeRoom.dmKillerName || ''
            } ได้สำเร็จ ฝ่ายคนดีเป็นฝ่ายชนะ!`,
            phaseKey
          );
        } else {
          thaiGameMaster.speak(
            `คดีปิดไม่ลง! ฆาตกรตัวจริงคือ ${
              activeRoom.dmKillerName || ''
            } สามารถตบตาชาวบ้านได้สำเร็จ ฝ่ายฆาตกรเป็นฝ่ายชนะ!`,
            phaseKey
          );
        }
        break;
      default:
        break;
    }
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.dmRoundNumber,
    activeRoom?.dmDoctorSkillUsed,
    activeRoom?.winnerTeam,
    activeRoom?.dmKillerName,
    activeRoom?.dmLastEliminatedName,
    shouldSpeakOnThisDevice,
  ]);

  // 3. Automated Bot AI Controller (Runs on Host client or iPad board if Host is auto-controlling)
  useEffect(() => {
    if (!activeRoom || (!isHost && !isIpadBoardView)) return;

    const killer = players.find((p) => p.id === activeRoom.dmKillerId);
    const victim = players.find((p) => p.id === activeRoom.dmVictimId);
    const detective = players.find((p) => p.id === activeRoom.dmDetectiveId);

    // 3A. Bot Killer selects Victim in dm_night_kill
    if (
      activeRoom.status === 'dm_night_kill' &&
      killer &&
      isAutoControlledSeat(killer, currentUid)
    ) {
      const candidates = players.filter(
        (p) =>
          p.id !== killer.id &&
          p.id !== activeRoom.dmAccompliceId &&
          p.dmIsAlive !== false
      );
      if (candidates.length > 0) {
        const timer = window.setTimeout(() => {
          const picked =
            candidates[Math.floor(Math.random() * candidates.length)];
          selectDyingMessageVictim(activeRoom.id, picked.id);
        }, 1800);
        return () => window.clearTimeout(timer);
      }
    }

    // 3B. Bot Victim or Bot Killer selects Evidence Cards in dm_victim_clue
    if (activeRoom.status === 'dm_victim_clue') {
      const timers: number[] = [];

      if (
        victim &&
        isAutoControlledSeat(victim, currentUid) &&
        (victim.dmSelectedCardIds?.length || 0) === 0 &&
        (victim.dmCandidateCards?.length || 0) > 0
      ) {
        const t1 = window.setTimeout(() => {
          const hand = victim.dmCandidateCards || [];
          const pickedCard = hand[Math.floor(Math.random() * hand.length)];
          if (pickedCard) {
            submitVictimRealEvidenceCard(activeRoom.id, victim.id, pickedCard);
          }
        }, 1600);
        timers.push(t1);
      }

      if (
        killer &&
        isAutoControlledSeat(killer, currentUid) &&
        (killer.dmSelectedCardIds?.length || 0) < 2 &&
        (killer.dmCandidateCards?.length || 0) >= 2
      ) {
        const t2 = window.setTimeout(() => {
          const hand = killer.dmCandidateCards || [];
          submitKillerFakeEvidenceCards(
            activeRoom.id,
            killer.id,
            hand.slice(0, 2)
          );
        }, 2100);
        timers.push(t2);
      }

      return () => timers.forEach((t) => window.clearTimeout(t));
    }

    // 3C. Bot Detective inspects a suspect in dm_special_roles
    if (
      activeRoom.status === 'dm_special_roles' &&
      detective &&
      isAutoControlledSeat(detective, currentUid)
    ) {
      const suspects = players.filter(
        (p) => p.id !== detective.id && p.dmIsAlive !== false
      );
      if (suspects.length > 0) {
        const timer = window.setTimeout(() => {
          const target = suspects[Math.floor(Math.random() * suspects.length)];
          submitDetectiveInspection(activeRoom.id, detective.id, target.id);
        }, 1800);
        return () => window.clearTimeout(timer);
      }
    }

    // 3D. Bot Players cast votes in dm_voting
    if (activeRoom.status === 'dm_voting') {
      const alivePlayers = players.filter((p) => p.dmIsAlive !== false);
      const aliveHumans = alivePlayers.filter(
        (p) => !isAutoControlledSeat(p, currentUid)
      );
      const anyHumanVoted =
        aliveHumans.length === 0 ||
        aliveHumans.some((h) => Boolean(h.voteTargetId));

      if (anyHumanVoted) {
        const unvotedBots = alivePlayers.filter(
          (p) => isAutoControlledSeat(p, currentUid) && !p.voteTargetId
        );
        if (unvotedBots.length > 0) {
          const timer = window.setTimeout(async () => {
            for (const bot of unvotedBots) {
              const validTargets = alivePlayers.filter((t) => t.id !== bot.id);
              if (validTargets.length > 0) {
                const picked =
                  validTargets[Math.floor(Math.random() * validTargets.length)];
                await castDyingMessageVote(activeRoom.id, picked.id, bot.id);
              }
            }
          }, 1500);
          return () => window.clearTimeout(timer);
        }
      }
    }
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.dmKillerId,
    activeRoom?.dmVictimId,
    activeRoom?.dmDetectiveId,
    activeRoom?.dmAccompliceId,
    players,
    isHost,
    isIpadBoardView,
    currentUid,
  ]);

  return {
    isVoiceEnabled,
    setIsVoiceEnabled,
    debateSecondsLeft,
  };
}
