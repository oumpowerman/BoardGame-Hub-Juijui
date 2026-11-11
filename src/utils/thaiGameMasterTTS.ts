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

  private speechQueue: { text: string; dedupeKey?: string; rate: number; pitch: number }[] = [];
  private isProcessingQueue: boolean = false;

  public cancel() {
    this.speechQueue = [];
    this.isProcessingQueue = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Speak a Thai phrase with SpeechSynthesisUtterance.
   * Dedupes by key and enqueues utterances so sentences don't get cut off abruptly.
   */
  public speak(
    text: string,
    dedupeKey?: string,
    rate: number = 0.95,
    pitch: number = 1.0,
    interrupt: boolean = false
  ) {
    if (!this.enabled) return;
    if (dedupeKey && this.lastSpokenKey === dedupeKey) return;
    if (dedupeKey) {
      this.lastSpokenKey = dedupeKey;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (interrupt) {
      this.cancel();
    }

    this.speechQueue.push({ text, dedupeKey, rate, pitch });
    if (!this.isProcessingQueue) {
      this.processNextInQueue();
    }
  }

  private processNextInQueue() {
    if (this.speechQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const item = this.speechQueue.shift();
    if (!item) {
      this.isProcessingQueue = false;
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = 'th-TH';
      utterance.rate = item.rate;
      utterance.pitch = item.pitch;
      utterance.volume = this.volume;

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      utterance.onend = () => {
        // Small pause between sentences for natural tabletop pacing
        window.setTimeout(() => {
          this.processNextInQueue();
        }, 120);
      };

      utterance.onerror = () => {
        this.processNextInQueue();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.processNextInQueue();
    }
  }

  // --- Game Master Scripted Moments ---

  /** Called when entering Night Phases (1:00 AM) */
  public speakNightBegins() {
    tableAudio.playSleepChime();
    this.speak(
      'ทุกคนหลับตา และเอามือวางบนโต๊ะ... คืนนี้ชีสจะถูกขโมยหรือไม่',
      'night_begins',
      0.92,
      1.0
    );
  }

  /** Called at start of night hour 1-6 */
  public speakHourWake(hour: number) {
    const hourText = HOUR_WORDS[hour] || `ตี ${hour}`;
    tableAudio.playWakeChime(hour);
    this.speak(
      `หนู${hourText} ลืมตา... ตรวจดูรอบตัวหรือส่องถ้วยเต๋า`,
      `hour_wake_${hour}`,
      0.95,
      1.0
    );
  }

  /** Called at sleep window of night hour to command eyes closed */
  public speakHourSleep(hour: number) {
    const hourText = HOUR_WORDS[hour] || `ตี ${hour}`;
    tableAudio.playSleepChime();
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

  /** Step 3B Stage 1: Master closes eyes (3s buffer) */
  public speakInsiderMasterCloseEyes() {
    tableAudio.playSleepChime();
    this.speak(
      'มาสเตอร์ หลับตา',
      'insider_master_close_eyes',
      0.95,
      1.0
    );
  }

  /** Step 3B Stage 2: Insider wakes up to see the Secret Word (8s buffer) */
  public speakInsiderWakeToPeekWord() {
    tableAudio.playHourChime(4);
    this.speak(
      'จอมบงการ อินไซเดอร์ ลืมตาขึ้นมาดูคำศัพท์ลับบนหน้าจอ',
      'insider_wake_peek',
      0.95,
      1.0
    );
  }

  /** Step 3C: Insider closes eyes before Quiz starts */
  public speakInsiderCloseEyes() {
    tableAudio.playSleepChime();
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

  // --- Avalon (ศึกอัศวินโต๊ะกลม) Scripted Moments ---

  public speakAvalonRoleDeal() {
    tableAudio.playWakeChime(2);
    this.speak(
      'แจกการ์ดบทบาทอัศวินโต๊ะกลมเรียบร้อยแล้ว... กรุณาแตะเปิดดูการ์ดบทบาทและนิมิตความลับบนหน้าจอของท่าน',
      `avalon_role_deal_${Date.now()}`,
      0.94,
      1.0
    );
  }

  public speakAvalonTabletopNightScript() {
    tableAudio.playSleepChime();
    this.speak(
      'ทุกคนหลับตา และกำมือวางไว้ข้างหน้า... สมุนของมอร์เดรด ลืมตาขึ้นมามองหน้าพวกเดียวกัน... สมุนมอร์เดรด หลับตา และชูนิ้วโป้งขึ้น... เมอร์ลิน ลืมตาดูคนร้ายที่ชูนิ้วโป้งอยู่... เมอร์ลิน หลับตา และทุกคนเก็บนิ้วโป้งลง... เพอร์ซิวาล ลืมตาดูเมอร์ลินและมอร์กาน่า... เพอร์ซิวาล หลับตา... ทุกคนลืมตาได้ เริ่มภารกิจอัศวินโต๊ะกลม!',
      `avalon_night_script_${Date.now()}`,
      0.92,
      1.0
    );
  }

  public speakAvalonTeamSelection(
    questNumber: number,
    leaderName: string,
    teamSize: number
  ) {
    tableAudio.playWakeChime(questNumber);
    this.speak(
      `ภารกิจที่ ${questNumber}... หัวหน้าทีมรอบนี้คือคุณ ${leaderName} กรุณาเลือกอัศวินจำนวน ${teamSize} คนเพื่อออกทำภารกิจ`,
      `avalon_team_select_${questNumber}_${leaderName}`,
      0.95,
      1.0
    );
  }

  public speakAvalonTeamVote(questNumber: number) {
    tableAudio.playHourChime(3);
    this.speak(
      `หัวหน้าทีมเสนอรายชื่อครบแล้ว... ขอให้อัศวินทุกคนลงมติว่า อนุมัติ หรือ คัดค้าน ทีมภารกิจที่ ${questNumber}`,
      `avalon_team_vote_${questNumber}_${Date.now()}`,
      0.95,
      1.0
    );
  }

  public speakAvalonQuestVote(questNumber: number) {
    tableAudio.playMorningGong();
    this.speak(
      `เสียงข้างมากอนุมัติทีม! ขอให้อัศวินในทีมภารกิจที่ ${questNumber} กดเลือกส่งผลภารกิจ สำเร็จ หรือ ล้มเหลว อย่างเป็นความลับ`,
      `avalon_quest_vote_${questNumber}`,
      0.95,
      1.02
    );
  }

  public speakAvalonQuestResult(
    questNumber: number,
    passed: boolean,
    failCount: number
  ) {
    if (passed) {
      tableAudio.playWakeChime(5);
      this.speak(
        `ผลการตัดสินภารกิจที่ ${questNumber}... ภารกิจสำเร็จ! ฝ่ายความดีได้คะแนนภารกิจนี้`,
        `avalon_quest_res_${questNumber}_pass`,
        0.95,
        1.05
      );
    } else {
      tableAudio.playSleepChime();
      this.speak(
        `ผลการตัดสินภารกิจที่ ${questNumber}... ภารกิจล้มเหลว! พบใบล้มเหลว ${failCount} ใบ ฝ่ายความชั่วได้คะแนนภารกิจนี้`,
        `avalon_quest_res_${questNumber}_fail`,
        0.94,
        0.95
      );
    }
  }

  public speakAvalonAssassination() {
    tableAudio.playSleepChime();
    this.speak(
      'ฝ่ายอัศวินทำภารกิจสำเร็จครบ 3 ครั้ง! แต่มือสังหารได้รับโอกาสสุดท้ายในการเปิดเผยตัวและชี้เป้าสังหาร เมอร์ลิน',
      'avalon_assassination',
      0.94,
      0.98
    );
  }

  public speakAvalonGameOver(winnerTeam: string, assassinated?: boolean) {
    tableAudio.playDramaticReveal(winnerTeam === 'good');
    if (winnerTeam === 'good') {
      this.speak(
        'จบเกม! มือสังหารทายตัวเมอร์ลินผิด ฝ่ายอัศวินแห่งความดีได้รับชัยชนะอย่างสมบูรณ์!',
        'avalon_gameover_good',
        0.95,
        1.05
      );
    } else if (assassinated) {
      this.speak(
        'จบเกม! มือสังหารลอบสังหารเมอร์ลินได้ถูกต้อง ฝ่ายสมุนมอร์เดรดพลิกกลับมาชนะ!',
        'avalon_gameover_evil_assassin',
        0.95,
        0.98
      );
    } else {
      this.speak(
        'จบเกม! ภารกิจล้มเหลวครบ 3 ครั้ง ฝ่ายสมุนมอร์เดรดแห่งความมืดเป็นฝ่ายชนะ!',
        'avalon_gameover_evil',
        0.95,
        0.98
      );
    }
  }

  public testAvalonVoice() {
    tableAudio.playWakeChime(3);
    this.speak(
      'ทดสอบเสียงผู้ดำเนินเกม ศึกอัศวินโต๊ะกลม อวาลอน... เมอร์ลิน ลืมตาดูคนร้าย... เมอร์ลิน หลับตา',
      `test_avalon_voice_${Date.now()}`,
      0.95,
      1.0
    );
  }

  // --- Undercover (สายลับสลับคำ) Scripted Moments ---

  public speakUndercoverDeal(categoryLabel: string) {
    tableAudio.playWakeChime(2);
    this.speak(
      `เริ่มเกมสายลับสลับคำ หมวดหมู่ ${categoryLabel}... กรุณาแตะเปิดดูคำลับของตัวเอง แล้วกดซ่อนการ์ดเมื่อจำได้แล้ว`,
      `uc_deal_${Date.now()}`,
      0.95,
      1.0
    );
  }

  public speakUndercoverSpeakerTurn(round: number, speakerName: string) {
    tableAudio.playWakeChime((round % 6) + 1);
    this.speak(
      `รอบที่ ${round}... ถึงตาคุณ ${speakerName} พูดบอกคำใบ้ 1 ประโยค`,
      `uc_turn_r${round}_${speakerName}`,
      0.96,
      1.02
    );
  }

  public speakUndercoverVotePhase(round: number) {
    tableAudio.playMorningGong();
    this.speak(
      `ทุกคนบอกคำใบ้ครบรอบที่ ${round} แล้ว! เริ่มถกเถียงและกดโหวตผู้เล่นที่คุณสงสัยว่าเป็นสายลับ หรือ มิสเตอร์ไวท์`,
      `uc_vote_r${round}`,
      0.95,
      1.02
    );
  }

  public speakUndercoverRoundVerdict(
    eliminatedName: string,
    roleLabel: string,
    nextRound: number
  ) {
    tableAudio.playSleepChime();
    this.speak(
      `ผลการโหวต ผู้ที่ถูกคัดออกคือคุณ ${eliminatedName} ตัวตนที่แท้จริงคือ ${roleLabel}... แต่เกมยังไม่จบ เตรียมเข้าสู่การใบ้คำรอบที่ ${nextRound}`,
      `uc_verdict_r${nextRound}_${eliminatedName}`,
      0.94,
      1.0
    );
  }

  public speakUndercoverMrWhiteChance(playerName: string) {
    tableAudio.playHourChime(5);
    this.speak(
      `คุณ ${playerName} ถูกโหวตออก และเขาคือ มิสเตอร์ไวท์! มิสเตอร์ไวท์ได้รับโอกาสสุดท้ายในการพิมพ์ทายคำลับของพลเมืองเพื่อขโมยชัยชนะ`,
      `uc_mrwhite_guess_${playerName}`,
      0.94,
      1.02
    );
  }

  public speakUndercoverGameOver(
    winnerTeam: string,
    civWord: string,
    spyWord: string
  ) {
    const teamText =
      winnerTeam === 'civilians'
        ? 'ฝ่ายพลเมืองดีเป็นฝ่ายชนะ!'
        : winnerTeam === 'mr_white'
        ? 'มิสเตอร์ไวท์ทายคำลับถูกต้อง และขโมยชัยชนะไปครอง!'
        : 'ฝ่ายสายลับแฝงตัวสำเร็จและเป็นฝ่ายชนะ!';
    this.speak(
      `จบเกม! ${teamText} คำของพลเมืองคือ ${civWord} และคำของสายลับคือ ${spyWord}`,
      `uc_gameover_${winnerTeam}_${civWord}`,
      0.94,
      1.02
    );
  }

  public testUndercoverVoice() {
    tableAudio.playWakeChime(3);
    this.speak(
      'ทดสอบเสียง Game Master เกมสายลับสลับคำ... ถึงตาคุณพูดบอกคำใบ้ 1 ประโยค แล้วร่วมกันโหวตหาตัวสายลับ',
      `test_uc_voice_${Date.now()}`,
      0.95,
      1.0
    );
  }

  // --- Detective Club (ชมรมนักสืบ) Scripted Moments ---

  public speakDetectiveWordEntry(activePlayerName: string) {
    tableAudio.playWakeChime(2);
    this.speak(
      `เริ่มรอบสืบสวน... ผู้ตั้งโจทย์ในรอบนี้คือคุณ ${activePlayerName} กรุณาดูไพ่รูปภาพจริงในมือ วางไพ่ใบแรกหงายไว้กลางโต๊ะ แล้วพิมพ์คำศัพท์ลับลงในสมุดโน้ตบนหน้าจอ`,
      `dc_word_entry_${activePlayerName}_${Date.now()}`,
      0.95,
      1.0
    );
  }

  public speakDetectiveCardRound(cardRound: number, currentTurnPlayerName: string) {
    tableAudio.playWakeChime(cardRound === 1 ? 3 : 4);
    if (cardRound === 1) {
      this.speak(
        `แจกสมุดโน้ตดิจิทัลเรียบร้อย! กรุณาแอบเปิดดูสมุดโน้ตบนมือถือของตัวเอง... ผู้ตั้งโจทย์วางไพ่ใบแรกแล้ว เชิญคุณ ${currentTurnPlayerName} เลือกไพ่รูปภาพจริงใบที่ 1 วางหงายบนโต๊ะหน้าตัวเอง`,
        `dc_card_round_1_${currentTurnPlayerName}`,
        0.95,
        1.0
      );
    } else {
      this.speak(
        `เข้าสู่รอบวางไพ่รูปภาพจริงใบที่ 2 บนโต๊ะ... เริ่มจากผู้ตั้งโจทย์ คุณ ${currentTurnPlayerName} เลือกวางไพ่ใบที่ 2 หงายไว้คู่กับใบแรกบนโต๊ะ`,
        `dc_card_round_2_${currentTurnPlayerName}`,
        0.95,
        1.0
      );
    }
  }

  public speakDetectivePlayerCardTurn(cardRound: number, playerName: string) {
    tableAudio.playHourChime(cardRound === 1 ? 2 : 3);
    this.speak(
      `ตาต่อไป เชิญคุณ ${playerName} วางไพ่รูปภาพจริงใบที่ ${cardRound} หงายบนโต๊ะหน้าตัวเอง แล้วกดยืนยันในมือถือ`,
      `dc_player_card_${cardRound}_${playerName}_${Date.now()}`,
      0.96,
      1.0
    );
  }

  public speakDetectiveDiscussion(secretWord: string, activePlayerName: string) {
    tableAudio.playMorningGong();
    this.speak(
      `ทุกคนวางไพ่บนโต๊ะครบ 2 ใบแล้ว! เฉลยคำศัพท์ลับประจำรอบนี้คือคำว่า ${secretWord}... ขอเชิญผู้ตั้งโจทย์ คุณ ${activePlayerName} ชี้ไพ่จริง 2 ใบบนโต๊ะแล้วเล่าเหตุผลเป็นคนแรก`,
      `dc_discussion_${secretWord}`,
      0.94,
      1.02
    );
  }

  public speakDetectiveSpeakerTurn(speakerName: string) {
    tableAudio.playHourChime(3);
    this.speak(
      `เชิญคุณ ${speakerName} ชี้ไพ่รูปภาพจริง 2 ใบหน้าตัวเอง แล้วอธิบายว่าเชื่อมโยงกับคำศัพท์ลับอย่างไร`,
      `dc_speaker_${speakerName}_${Date.now()}`,
      0.95,
      1.0
    );
  }

  public speakDetectiveVoting() {
    tableAudio.playHourChime(5);
    this.speak(
      'ครบทุกคนแล้ว! ดูไพ่จริงบนโต๊ะประกอบการตัดสินใจ แล้วกดโหวตในมือถือของคุณว่า ใครคือผู้สมรู้ร่วมคิดที่แอบเนียนวางไพ่โดยไม่รู้คำลับ',
      `dc_voting_${Date.now()}`,
      0.95,
      1.0
    );
  }

  public speakDetectiveScoring(caught: boolean, conspiratorName: string) {
    if (caught) {
      this.speak(
        `สรุปผลการโหวต! เหล่านักสืบจับตัวผู้สมรู้ร่วมคิด คุณ ${conspiratorName} ได้สำเร็จ! ก่อนเริ่มรอบต่อไป อย่าลืมเก็บไพ่ 2 ใบบนโต๊ะทิ้ง และจั่วไพ่จริงเพิ่มให้ครบ 6 ใบในมือ`,
        `dc_scoring_caught_${conspiratorName}`,
        0.95,
        1.04
      );
    } else {
      this.speak(
        `สรุปผลการโหวต! ผู้สมรู้ร่วมคิดตัวจริงคือคุณ ${conspiratorName} ซึ่งตบตาเหล่านักสืบและรอดพ้นไปได้! ก่อนเริ่มรอบต่อไป อย่าลืมเก็บไพ่ 2 ใบบนโต๊ะทิ้ง และจั่วไพ่จริงเพิ่มให้ครบ 6 ใบในมือ`,
        `dc_scoring_escaped_${conspiratorName}`,
        0.95,
        0.98
      );
    }
  }

  public testDetectiveVoice() {
    tableAudio.playWakeChime(4);
    this.speak(
      'ทดสอบเสียง Game Master ชมรมนักสืบ... แอบดูสมุดโน้ตในมือถือ แล้ววางไพ่รูปภาพจริงหงายบนโต๊ะหน้าตัวเอง',
      `test_dc_voice_${Date.now()}`,
      0.95,
      1.0
    );
  }
}

export const thaiGameMaster = new ThaiGameMasterTTS();
