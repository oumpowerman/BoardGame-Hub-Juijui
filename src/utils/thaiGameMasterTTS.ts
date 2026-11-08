// Thai Game Master Text-to-Speech & Sound Orchestrator for In-Person Tabletop Mode
import { tableAudio } from './tableAudio';

const HOUR_WORDS: Record<number, string> = {
  1: 'ตีหนึ่ง',
  2: 'ตีสอง',
  3: 'ตีสาม',
  4: 'ตีสี่',
  5: 'ตีห้า',
  6: 'ตีหก',
};

class ThaiGameMasterTTS {
  private enabled: boolean = true;
  private volume: number = 1.0;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private lastSpokenKey: string = '';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoice();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoice();
      };
    }
  }

  private initVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Prioritize Thai voices (e.g. Google ภาษาไทย, Narisa, Kanya, or any th-TH voice)
    const thaiVoice =
      voices.find((v) => v.lang === 'th-TH' || v.lang.startsWith('th')) ||
      voices.find((v) => v.name.toLowerCase().includes('thai')) ||
      null;
    this.selectedVoice = thaiVoice;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
  }

  public cancel() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Speak a Thai phrase with SpeechSynthesisUtterance.
   * Dedupes by key so identical calls within short succession don't repeat.
   */
  public speak(text: string, dedupeKey?: string, rate: number = 0.95, pitch: number = 1.0) {
    if (!this.enabled) return;
    if (dedupeKey && this.lastSpokenKey === dedupeKey) return;
    if (dedupeKey) {
      this.lastSpokenKey = dedupeKey;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      // Cancel pending utterances to keep pace
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = rate; // 0.95 for clear, authoritative tabletop GM pacing
      utterance.pitch = pitch;
      utterance.volume = this.volume;

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Graceful fallback to silence/chimes
    }
  }

  // --- Game Master Scripted Moments ---

  /** Called when entering Night Phases (1:00 AM) */
  public speakNightBegins() {
    tableAudio.playHourChime(1);
    this.speak(
      'ทุกคนหลับตา และเอามือวางบนโต๊ะ... คืนนี้ชีสจะถูกขโมยหรือไม่',
      'night_begins',
      0.92,
      1.0
    );
  }

  /** Called at second 10 (or start) of night hour 1-6 */
  public speakHourWake(hour: number) {
    const hourText = HOUR_WORDS[hour] || `ตี ${hour}`;
    tableAudio.playHourChime(hour);
    this.speak(
      `หนู${hourText} ลืมตา... ตรวจดูรอบตัวหรือส่องถ้วยเต๋า`,
      `hour_wake_${hour}`,
      0.95,
      1.0
    );
  }

  /** Called at second 3 of the 10-second window to command eyes closed */
  public speakHourSleep(hour: number) {
    const hourText = HOUR_WORDS[hour] || `ตี ${hour}`;
    this.speak(`หนู${hourText} หลับตา`, `hour_sleep_${hour}`, 1.0, 1.0);
  }

  /** Called when transitioning to follower phase for 6-8 players */
  public speakFollowerThiefSelect() {
    this.speak(
      'จอมโจรชีส ลืมตาขึ้นมาแตะเลือกลูกน้อง... จอมโจรชีส หลับตา',
      'follower_thief_select',
      0.92,
      1.0
    );
  }

  /** Called when followers wake to acknowledge each other (7 players) */
  public speakFollowersMeet() {
    this.speak(
      'ลูกน้องทั้งสองคน ลืมตาขึ้นมารู้จักกัน... ลูกน้อง หลับตา',
      'followers_meet',
      0.92,
      1.0
    );
  }

  /** Called when morning arrives / voting phase starts */
  public speakMorningWake() {
    tableAudio.playMorningGong();
    this.speak(
      'ทุกคนลืมตา ตอนนี้เช้าแล้ว! ชีสก้อนทองกลางโต๊ะหายไปแล้ว! เริ่มการถกเถียงและจับตัวคนร้ายได้',
      'morning_wake',
      0.92,
      1.05
    );
  }

  /** Preview voice button for host */
  public testVoice() {
    tableAudio.playHourChime(3);
    this.speak(
      'ทดสอบเสียง Game Master... หนูตีหนึ่ง ลืมตา... หนูตีหนึ่ง หลับตา',
      `test_voice_${Date.now()}`,
      0.95,
      1.0
    );
  }

  // --- Insider (จอมบงการคำใบ้) Scripted Moments ---

  /** Step 3A: Everyone closes eyes while Master checks/customizes the Secret Word */
  public speakInsiderMasterWordCheck() {
    tableAudio.playHourChime(2);
    this.speak(
      'ทุกคนหลับตา... มาสเตอร์ลืมตาตรวจสอบคำศัพท์ลับบนหน้าจอ แล้วกดยืนยันเมื่อพร้อม',
      'insider_master_word_check',
      0.94,
      1.0
    );
  }

  /** Step 3B: Insider wakes up to see the Secret Word */
  public speakInsiderWakeToPeekWord() {
    tableAudio.playHourChime(4);
    this.speak(
      'มาสเตอร์หลับตา... จอมบงการ อินไซเดอร์ ลืมตาขึ้นมาดูคำศัพท์ลับบนหน้าจอ',
      'insider_wake_peek',
      0.94,
      1.0
    );
  }

  /** Step 3C: Insider closes eyes before Quiz starts */
  public speakInsiderCloseEyes() {
    this.speak(
      'อินไซเดอร์ หลับตา',
      'insider_close_eyes',
      0.96,
      1.0
    );
  }

  /** Step 4: Quiz Phase starts */
  public speakInsiderQuizStart() {
    tableAudio.playMorningGong();
    this.speak(
      'ทุกคนลืมตา! เริ่มตั้งคำถาม ใช่ หรือ ไม่ใช่ กับมาสเตอร์ เพื่อทายคำศัพท์ลับให้ทันเวลาได้เลย',
      'insider_quiz_start',
      0.94,
      1.05
    );
  }

  /** Step 5A: Word Guessed -> Flip Sand Timer & Stage 1 Guesser Judgment Vote */
  public speakInsiderWordGuessed(guesserName: string) {
    tableAudio.playMorningGong();
    this.speak(
      `ทายคำศัพท์ถูกต้องโดยคุณ ${guesserName}! พลิกกลับนาฬิกาทราย เริ่มถกเถียงและโหวตขั้นที่หนึ่งว่า ผู้ที่ทายคำถูก ใช่ อินไซเดอร์ หรือไม่`,
      `insider_guessed_${guesserName}`,
      0.94,
      1.05
    );
  }

  /** Step 5B: Stage 1 Spared Guesser -> Proceed to Stage 2 General Vote */
  public speakInsiderGeneralVote() {
    tableAudio.playHourChime(5);
    this.speak(
      'เสียงข้างมากเชื่อว่าคนทายถูกเป็นพลเมืองดี! เข้าสู่การโหวตขั้นที่สอง ชี้ตัวผู้เล่นที่คุณสงสัยว่าเป็น อินไซเดอร์ ตัวจริง',
      'insider_general_vote',
      0.94,
      1.0
    );
  }

  /** Step 6 (Timeout): Nobody guessed the secret word in time */
  public speakInsiderTimeoutLoss() {
    tableAudio.playDramaticReveal(false);
    this.speak(
      'หมดเวลาทายคำศัพท์! ไม่มีใครทายคำลับทันเวลา ทุกคนพ่ายแพ้ร่วมกันในรอบนี้',
      'insider_timeout_loss',
      0.94,
      0.95
    );
  }

  /** Test voice for Insider Host */
  public testInsiderVoice() {
    tableAudio.playHourChime(4);
    this.speak(
      'ทดสอบเสียง Game Master เกมอินไซเดอร์... จอมบงการ อินไซเดอร์ ลืมตาดูคำศัพท์ลับ... อินไซเดอร์ หลับตา',
      `test_insider_voice_${Date.now()}`,
      0.95,
      1.0
    );
  }
}

export const thaiGameMaster = new ThaiGameMasterTTS();
