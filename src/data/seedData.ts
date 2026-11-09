import {
  BoardGame,
  DatabaseTableSchema,
  ForumThread,
  GameCategory,
  MasterServerRoom,
  PlayerRankingEntry,
} from '../types/boardgame';

export const GAME_CATEGORIES: GameCategory[] = [
  {
    id: 'all',
    nameTh: 'ทุกหมวดหมู่',
    nameEn: 'All Categories',
    description: 'รวมบอร์ดเกมยอดนิยมทุกแนวพร้อมห้องเล่นออนไลน์และคอมมูนิตี้พูดคุย',
  },
  {
    id: 'social-deduction',
    nameTh: 'สืบสวน & ซ่อนบทบาท',
    nameEn: 'Social Deduction',
    description: 'จับโกหก วิเคราะห์พิรุธ และค้นหาคนทรยศที่ซ่อนอยู่ในกลุ่มผู้เล่น',
  },
  {
    id: 'bluffing',
    nameTh: 'บลัฟฟ์ & จิตวิทยา',
    nameEn: 'Bluffing & Mind Games',
    description: 'ชิงไหวชิงพริบด้วยการสวมรอย สร้างข้อมูลลวง และอ่านใจคู่แข่ง',
  },
  {
    id: 'strategy',
    nameTh: 'กลยุทธ์ & บริหารทรัพยากร',
    nameEn: 'Strategy & Resource',
    description: 'วางแผนระยะยาว แลกเปลี่ยนทรัพยากร และยึดครองพื้นที่สำคัญบนกระดาน',
  },
  {
    id: 'party',
    nameTh: 'ปาร์ตี้ & เล่นจบไว',
    nameEn: 'Quick Party',
    description: 'กติกาเข้าใจง่าย จบรอบไว เหมาะสำหรับเล่นกับเพื่อนทั้งบนมือถือและพีซี',
  },
];

export const BOARD_GAMES: BoardGame[] = [
  {
    id: 'game-cheese-thief',
    slug: 'cheese-thief',
    titleTh: 'ชีสหนูอยู่ไหน — หนูขโมยชีส (Cheese Thief)',
    titleEn: 'Cheese Thief Official Rules',
    categoryId: 'bluffing',
    categoryLabel: 'บลัฟฟ์ & จิตวิทยา',
    minPlayers: 4,
    maxPlayers: 8,
    durationMinutes: 10,
    difficulty: 'ง่าย',
    masterServerSupported: true,
    playableOnline: true,
    activeRoomsCount: 0,
    onlinePlayersCount: 0,
    forumThreadsCount: 0,
    coverImage: '/images/game_cheese_thief_1794065328864.jpg',
    shortSummary:
      'ทุกคนได้บทลับเป็น หนูขี้เซา หรือ จอมโจรชีส กลางคืนหลับตาแล้วตื่นเฉพาะชั่วโมงที่เต๋าทอยได้ (1–6 น.) จอมโจรแอบคว้าชีส หนูขี้เซาแอบส่องถ้วยเต๋า พอสว่างมาโหวตหาตัวโจร — เล่น 4–8 คน จบใน 10 นาที ไม่มีใครตกรอบ!',
    rulesOverview: [
      'เริ่มเกม (ตั้งโต๊ะ): แจกการ์ด จอมโจรชีส 1 ใบ และ หนูขี้เซา (N-1) ใบ (หรือใส่การ์ด Fall Mouse ในโหมดพิเศษ 6–8 คน) ทอยเต๋าในถ้วยครอบคว่ำดูเลขชั่วโมงตื่น (1–6) โดยหากเล่น 4 คนจะใช้เต๋าคนละ 2 ลูก',
      'กลางคืน (1:00–6:00 น.): Moderator ขานเวลาทีละชั่วโมง (10 วินาที/ชั่วโมง) จอมโจรชีสต้องคว้าชีสไปซ่อนในชั่วโมงตัวเอง ส่วนหนูขี้เซาหากตื่นคนเดียว (5–8 คน) จะแอบส่องเต๋าใต้ถ้วยของคนอื่นได้ 1 คน',
      'ลูกน้อง (Follower 5–8 คน): 5 คน = หนูที่ตื่นเห็นตอนจอมโจรขโมยชีสจะกลายเป็นลูกน้องทันที · 6 คน = จอมโจรเลือกลูกน้อง 1 คน · 7–8 คน = จอมโจรเลือกลูกน้อง 2 คนช่วยปั่นโหวต',
      'เช้าวันใหม่ & โหวต: ถกเถียงแล้วนับ 3–2–1 ชี้โหวตพร้อมกัน! คนที่ได้โหวตมากที่สุดหงายการ์ด หากเป็นจอมโจรชีส หนูขี้เซาชนะยกทีม · หากไม่ใช่จอมโจร จอมโจรและลูกน้องชนะ · หากเป็น Fall Mouse ชนะเดี่ยวทันที!',
    ],
    rolesList: [
      {
        name: 'จอมโจรชีส (Cheese Thief)',
        faction: 'evil',
        ability: 'ถึงชั่วโมงตัวเองต้องคว้าชีสกลางโต๊ะไปซ่อน และบลัฟฟ์เอาตัวรอดตอนเช้าไม่ให้ถูกโหวตจับได้',
      },
      {
        name: 'หนูขี้เซา (Sleepyhead)',
        faction: 'good',
        ability: 'ตื่นตามเลขเต๋าของตัวเอง หากตื่นคนเดียว (5–8 คน) แอบส่องเต๋าใต้ถ้วยคนอื่นได้ 1 คนเพื่อหาเบาะแสจับโจร',
      },
      {
        name: 'ลูกน้อง (Follower)',
        faction: 'evil',
        ability: 'หนูที่ย้ายข้างในคืน 5–8 คน ช่วยจอมโจรชีสเบี่ยงเบนประเด็นตอนเช้า (ห้ามเฉลยข้อมูลเต๋ากลางคืน)',
      },
      {
        name: 'หนูแพะรับบาป (Fall Mouse)',
        faction: 'neutral',
        ability: 'โหมดพิเศษ 6–8 คน: ทำตัวน่าสงสัยเพื่อล่อให้คนทั้งโต๊ะโหวตตัวเอง หากได้โหวตสูงสุดชนะเดี่ยวทันที!',
      },
    ],
  },
  {
    id: 'game-insider',
    slug: 'insider',
    titleTh: 'จอมบงการคำใบ้ (Insider)',
    titleEn: 'Insider Official Rules',
    categoryId: 'social-deduction',
    categoryLabel: 'สืบสวน & ซ่อนบทบาท',
    minPlayers: 4,
    maxPlayers: 8,
    durationMinutes: 10,
    difficulty: 'ง่าย',
    masterServerSupported: true,
    playableOnline: true,
    activeRoomsCount: 0,
    onlinePlayersCount: 0,
    forumThreadsCount: 0,
    coverImage: '/images/game_insider_mystery_1794127649826.jpg',
    shortSummary:
      'บอร์ดเกมทายคำศัพท์ผสมจับคนร้ายระดับตำนาน! ช่วยกันถามคำถาม ใช่/ไม่ใช่ กับ Master เพื่อหาคำลับให้ทันเวลา แต่ระวัง... มี "จอมบงการ (Insider)" ที่แอบรู้คำตอบอยู่แล้วกำลังเนียนชี้นำทุกคนอยู่!',
    rulesOverview: [
      'STEP 1 — แจกบทบาทลับ: มี Master (ผู้คุมคำใบ้) 1 คนที่เปิดเผยตัว, Insider (จอมบงการ) 1 คน และที่เหลือเป็นพลเมืองทั่วไป (Commons)',
      'STEP 2 — ช่วงดูคำศัพท์ลับ: ทุกคนหลับตา Master และ Insider แอบดูคำศัพท์ลับบนหน้าจอตามเสียงพากย์ Game Master',
      'STEP 3 — ช่วงถามคำถามทายคำ (Quiz Phase): ทุกคนลืมตาและช่วยกันถามคำถามที่ตอบได้แค่ "ใช่ / ไม่ใช่ / ไม่แน่ใจ" กับ Master เพื่อทายคำลับให้ถูกก่อนนาฬิกาทรายหมด (ถ้าเวลาหมดก่อนทายถูก ทุกคนแพ้!)',
      'STEP 4 — พลิกนาฬิกาทราย & โหวต 2 ขั้นตอน: เมื่อทายถูกให้คว่ำนาฬิกาทรายทันที ถกเถียงและโหวตขั้นที่ 1 ว่า "คนทายคำถูกใช่ Insider หรือไม่?" หากเสียงข้างมากมองว่าไม่ใช่ จึงเข้าสู่โหวตขั้นที่ 2 ชี้ตัวหา Insider ตัวจริง!',
    ],
    rolesList: [
      {
        name: 'ผู้คุมคำใบ้ (Master)',
        faction: 'good',
        ability: 'เปิดเผยตัวตั้งแต่ต้นเกม รู้คำศัพท์ลับ และคอยตอบคำถามผู้เล่นได้เพียง "ใช่", "ไม่ใช่" หรือ "ไม่แน่ใจ" เท่านั้น (อยู่ทีมเดียวกับพลเมืองทั่วไป)',
      },
      {
        name: 'จอมบงการ (Insider)',
        faction: 'evil',
        ability: 'แอบรู้คำศัพท์ลับตั้งแต่ตอนกลางคืน! ต้องเนียนตั้งคำถามชี้นำให้กลุ่มทายคำศัพท์ถูกทันเวลา โดยไม่ให้ตัวเองดูมีพิรุธจนถูกโหวตจับได้',
      },
      {
        name: 'พลเมืองทั่วไป (Commons)',
        faction: 'good',
        ability: 'ไม่รู้คำศัพท์ลับ ต้องช่วยกันถามคำถามเพื่อไขปริศนาคำลับให้ทันเวลา และสังเกตว่าใครตั้งคำถามชี้นำผิดปกติเพื่อโหวตจับ Insider',
      },
    ],
  },
  {
    id: 'game-undercover',
    slug: 'undercover',
    titleTh: 'สายลับสลับคำ (Undercover)',
    titleEn: 'Undercover: Word Deduction Party',
    categoryId: 'bluffing',
    categoryLabel: 'บลัฟฟ์ & จิตวิทยา',
    minPlayers: 4,
    maxPlayers: 10,
    durationMinutes: 12,
    difficulty: 'ง่าย',
    masterServerSupported: true,
    playableOnline: true,
    activeRoomsCount: 0,
    onlinePlayersCount: 0,
    forumThreadsCount: 0,
    coverImage: '/images/game_undercover_noir_1794146778197.jpg',
    shortSummary:
      'สุดยอดปาร์ตี้เกมบลัฟคำศัพท์! พลเมืองได้คำลับหลัก, สายลับได้คำคู่เหมือนที่ใกล้เคียงกันมาก, และ Mr. White ไม่รู้คำอะไรเลย ผลัดกันบอกคำใบ้รอบโต๊ะ โหวตจับคนน่าสงสัย และชิงไหวชิงพริบเพื่อเอาชีวิตรอด!',
    rulesOverview: [
      'STEP 1 — แจกคำลับเฉพาะตัว: ทุกคนเปิดดูการ์ดคำของตัวเอง พลเมืองได้ "คำ A", สายลับ Undercover ได้ "คำ B" (ที่คล้ายกันมาก), ส่วน Mr. White จะได้การ์ดว่างเปล่า',
      'STEP 2 — รอบการบอกคำใบ้ (Clue Round): ผู้เล่นผลัดกันบอกคำใบ้คนละ 1 ประโยค/วลี ตามลำดับเทิร์น โดยห้ามพูดคำลับของตนเองตรงๆ เพื่อหยั่งเชิงดูว่าใครถือคำต่างจากคนอื่น',
      'STEP 3 — อภิปรายและโหวตคัดออก: ถกเถียงจับพิรุธและลงคะแนนโหวตผู้เล่นที่น่าสงสัยที่สุด ผู้ได้คะแนนสูงสุดจะถูกกำจัดและเปิดเผยบทบาท',
      'STEP 4 — โอกาสพลิกเกมของ Mr. White: หาก Mr. White ถูกโหวตออก จะมีโอกาส 1 ครั้งในการทายคำลับของพลเมือง หากทายถูก Mr. White จะชนะเดี่ยวทันที!',
    ],
    rolesList: [
      {
        name: 'พลเมือง (Civilian)',
        faction: 'good',
        ability: 'ได้รับคำศัพท์หลักเหมือนคนส่วนใหญ่ ต้องบอกคำใบ้ให้เพื่อนในฝ่ายรู้ตัว และช่วยกันโหวตคัดสายลับกับ Mr. White ออกจากเกม',
      },
      {
        name: 'สายลับ (Undercover)',
        faction: 'evil',
        ability: 'ได้รับคำศัพท์คู่เหมือนที่ต่างจากพลเมืองเล็กน้อย ต้องแฝงตัวอย่างแนบเนียน เอาชีวิตรอดจนจำนวนสายลับเท่ากับหรือมากกว่าพลเมือง',
      },
      {
        name: 'มิสเตอร์ไวท์ (Mr. White)',
        faction: 'neutral',
        ability: 'ไม่ได้รับคำศัพท์ใดๆ เลย! ต้องฟังคำใบ้ของคนอื่นเพื่อสวมรอย หากถูกโหวตออกสามารถพิมพ์ทายคำของพลเมืองเพื่อชนะเกมทันที',
      },
    ],
  },
  {
    id: 'game-detective-club',
    slug: 'detective-club',
    titleTh: 'สมาคมนักสืบ (Detective Club)',
    titleEn: 'Detective Club Official Companion',
    categoryId: 'social-deduction',
    categoryLabel: 'สืบสวน & ซ่อนบทบาท',
    minPlayers: 4,
    maxPlayers: 8,
    durationMinutes: 20,
    difficulty: 'ง่าย',
    masterServerSupported: true,
    playableOnline: true,
    activeRoomsCount: 0,
    onlinePlayersCount: 0,
    forumThreadsCount: 0,
    coverImage: '/images/game_detective_club.jpg',
    shortSummary:
      'ปาร์ตี้บอร์ดเกมสืบสวนภาพวาดเหนือจริงยอดนิยม! ผู้ตั้งโจทย์พิมพ์คำลับลงในสมุดลับดิจิทัล ทุกคนได้คำลับยกเว้น Conspirator ที่ได้สมุดว่างเปล่า วางการ์ดจริง 2 ใบ ถกเถียงหาเหตุผล และชี้ตัวสายลับที่เนียนตาม!',
    rulesOverview: [
      'STEP 1 — Active Player ตั้งคำลับ: ผู้ตั้งโจทย์ดูการ์ดจริงในมือ แล้วพิมพ์คำลับในระบบพร้อมวางการ์ดจริงใบแรกบนโต๊ะ',
      'STEP 2 — แจกสมุดบันทึกลับดิจิทัล: นักสืบจะเห็นคำลับในสมุด ส่วน Conspirator จะได้รับสมุดว่างเปล่าโดยไม่มีใครรู้',
      'STEP 3 — วางการ์ดจริง 2 รอบ: ทุกคนผลัดกันวางการ์ดจริงคนละ 2 ใบข้างการ์ดโจทย์ โดย Conspirator ต้องแถเนียนตามน้ำ',
      'STEP 4 — เฉลยคำลับ & อธิบายเหตุผล: Active Player เผยคำลับ ทุกคนต้องแถเหตุผลว่าการ์ด 2 ใบตนเกี่ยวอะไรกับคำลับ',
      'STEP 5 — โหวตชี้ตัว & คำนวณคะแนน: ทุกคนโหวตชี้ตัว Conspirator หากจับได้ นักสืบได้ 3 คะแนน, โฮสต์ได้ 4 คะแนน / หาก Conspirator รอด ได้ 5 คะแนน!',
    ],
    rolesList: [
      {
        name: 'ผู้ตั้งโจทย์ (Active Player)',
        faction: 'neutral',
        ability: 'มองการ์ดจริงในมือ ตั้งคำลับในแอป และวางการ์ดใบแรกบนโต๊ะ',
      },
      {
        name: 'นักสืบ (Detective)',
        faction: 'good',
        ability: 'เปิดดูสมุดลับดิจิทัลเห็นคำลับ วางการ์ดจริง 2 ใบ และช่วยกันโหวตจับ Conspirator',
      },
      {
        name: 'ผู้สมรู้ร่วมคิด (Conspirator)',
        faction: 'evil',
        ability: 'ได้รับสมุดว่างเปล่า ไม่รู้คำลับ ต้องมองการ์ดคนอื่นบนโต๊ะแล้ววางการ์ดเนียนตามและแถเอาตัวรอด',
      },
    ],
  },
  {
    id: 'game-avalon',
    slug: 'avalon',
    titleTh: 'Avalon: ศึกอัศวินโต๊ะกลม',
    titleEn: 'The Resistance: Avalon',
    categoryId: 'social-deduction',
    categoryLabel: 'สืบสวน & ซ่อนบทบาท',
    minPlayers: 5,
    maxPlayers: 10,
    durationMinutes: 25,
    difficulty: 'เข้มข้น',
    masterServerSupported: true,
    playableOnline: true,
    activeRoomsCount: 0,
    onlinePlayersCount: 0,
    forumThreadsCount: 0,
    coverImage: '/images/game_avalon.jpg',
    shortSummary:
      'ดิจิทัล Companion บอร์ดเกมสงครามจิตวิทยาแห่งคาเมล็อต! ช่วยแจกบทบาทลับ (Merlin, Percival, Morgana, Mordred), โหวตจัดทีมทำภารกิจ, โหวตภารกิจลับ, และเฟสสังหาร Merlin โดยไร้ข้อผิดพลาด!',
    rulesOverview: [
      'STEP 1 — แอบดูบทบาทลับ: ระบบสุ่มแจกบทบาทลับและแสดงรายชื่อที่มองเห็นตามกติกา (Merlin เห็นปีศาจ, Percival เห็น Merlin/Morgana, ปีศาจเห็นพวกเดียวกัน)',
      'STEP 2 — เสนอจัดทีมทำภารกิจ: Leader เลือกสมาชิกทีมตามจำนวนที่กำหนดในแต่ละรอบ (5–10 คน)',
      'STEP 3 — โหวตลงมติยอมรับทีม: ทุกคนกด Approve / Reject พร้อมกัน หากตกเกิน 5 ครั้ง ฝ่ายปีศาจชนะทันที!',
      'STEP 4 — โหวตลงคะแนนภารกิจลับ: สมาชิกทีมเลือก Success / Fail ในมือถือ ระบบเฉลยผลการ์ดสุ่มสีแบบไม่ระบุคน',
      'STEP 5 — เฟสสังหาร Merlin: หากฝ่ายอัศวินชนะครบ 3 ภารกิจ Assassin จะเปิดหน้าจอด้านหลังเพื่อเลือกชี้ตัว Merlin หากทายถูก ฝ่ายปีศาจพลิกชนะทันที!',
    ],
    rolesList: [
      {
        name: 'Merlin (พ่อมดเมอร์ลิน)',
        faction: 'good',
        ability: 'ทราบตัวจริงของฝ่ายปีศาจทุกคน (ยกเว้น Mordred) แต่ต้องชี้นำทีมอย่างแนบเนียนไม่ให้ Assassin รู้ตัว',
      },
      {
        name: 'Percival (อัศวินเพอร์ซิวาล)',
        faction: 'good',
        ability: 'มองเห็นผู้ต้องสงสัยเป็นเมอร์ลิน 2 คน (Merlin จริง และ Morgana ตัวปลอม)',
      },
      {
        name: 'Morgana (แม่มดมอร์กาน่า)',
        faction: 'evil',
        ability: 'ปลอมตัวเป็นเมอร์ลินในสายตาของเพอร์ซิวาลเพื่อสร้างความสับสน',
      },
      {
        name: 'Assassin (มือสังหาร)',
        faction: 'evil',
        ability: 'สังหารเมอร์ลินได้ในตอนจบหากฝ่ายอัศวินทำภารกิจสำเร็จครบ 3 รอบ',
      },
    ],
  },
  {
    id: 'game-werewolf',
    slug: 'werewolf-night',
    titleTh: 'คืนหมาป่า (One Night Werewolf)',
    titleEn: 'Werewolf Night Master',
    categoryId: 'party',
    categoryLabel: 'ปาร์ตี้ & เล่นจบไว',
    minPlayers: 4,
    maxPlayers: 10,
    durationMinutes: 10,
    difficulty: 'ปานกลาง',
    masterServerSupported: true,
    playableOnline: false,
    activeRoomsCount: 0,
    onlinePlayersCount: 0,
    forumThreadsCount: 0,
    coverImage: '/images/game_werewolf_village_1794065330493.jpg',
    shortSummary:
      'บอร์ดเกมคืนเดียวจบสุดเร้าใจ ไม่มีการคัดคนออกกลางคัน บทบาทของทุกคนอาจถูกสลับสับเปลี่ยนในตอนกลางคืนโดยที่คุณไม่รู้ตัว!',
    rulesOverview: [
      'มีเพียงคืนเดียวเท่านั้น! บทบาทพิเศษอย่าง Seer, Robber และ Troublemaker จะตื่นมาดูหรือสลับการ์ด',
      'ตอนเช้าทุกคนต้องช่วยกันปะติดปะต่อลำดับเหตุการณ์ว่าตอนนี้การ์ดหมาป่าอยู่ที่ใครกันแน่',
      'โหวตพร้อมกันในครั้งเดียว หากจับหมาป่าได้อย่างน้อย 1 ตัว ชาวบ้านเป็นฝ่ายชนะทันที',
    ],
    rolesList: [
      {
        name: 'Seer (เทพพยากรณ์)',
        faction: 'good',
        ability: 'ส่องดูการ์ดของผู้เล่นอื่น 1 คน หรือดูการ์ดกองกลาง 2 ใบ',
      },
      {
        name: 'Robber (จอมโจรสลับร่าง)',
        faction: 'good',
        ability: 'ขโมยการ์ดผู้เล่นอื่นมาเป็นของตัวเองและรับบทบาทใหม่นั้นทันที',
      },
      {
        name: 'Werewolf (มนุษย์หมาป่า)',
        faction: 'evil',
        ability: 'รับรู้พวกพ้องหมาป่าด้วยกัน และต้องเบี่ยงเบนความสนใจของชาวบ้าน',
      },
    ],
  },
  {
    id: 'game-catan',
    slug: 'catan-frontier',
    titleTh: 'บุกเบิกเกาะคาทาน (Catan Frontier)',
    titleEn: 'Catan Island Frontier',
    categoryId: 'strategy',
    categoryLabel: 'กลยุทธ์ & บริหารทรัพยากร',
    minPlayers: 3,
    maxPlayers: 4,
    durationMinutes: 45,
    difficulty: 'ปานกลาง',
    masterServerSupported: true,
    playableOnline: false,
    activeRoomsCount: 0,
    onlinePlayersCount: 0,
    forumThreadsCount: 0,
    coverImage: '/images/game_catan_islands_1794065330615.jpg',
    shortSummary:
      'บริหารทรัพยากรไม้ อิฐ ข้าวสาลี แกะ และแร่หิน สร้างถนนและตั้งถิ่นฐานบนเกาะหกเหลี่ยม พร้อมระบบเจรจาแลกเปลี่ยนทรัพยากร',
    rulesOverview: [
      'ทอยลูกเต๋า 2 ลูกทุกเทิร์นเพื่อผลิตทรัพยากรตามตัวเลขบนแผ่นพื้นที่ที่ตั้งหมู่บ้านล้อมรอบ',
      'เปิดการเจรจาแลกเปลี่ยนทรัพยากรกับผู้เล่นคนอื่นในห้อง หรือแลกกับท่าเรือการค้า',
      'สะสมครบ 10 คะแนนชัยชนะจากการสร้างหมู่บ้าน เมือง ถนนสายยาวที่สุด และกองทัพอัศวิน',
    ],
    rolesList: [
      {
        name: 'Merchant Lord (เจ้าแห่งท่าเรือ)',
        faction: 'neutral',
        ability: 'เน้นยึดครองจุดท่าเรือ 2:1 และ 3:1 เพื่อผูกขาดการแลกเปลี่ยนทรัพยากร',
      },
      {
        name: 'Road Architect (สถาปนิกสายถนน)',
        faction: 'neutral',
        ability: 'วางโครงข่ายถนนเชื่อมต่อข้ามเกาะเพื่อชิงป้าย Longest Road (+2 VP)',
      },
    ],
  },
];

export const INITIAL_MASTER_ROOMS: MasterServerRoom[] = [];

export const INITIAL_FORUM_THREADS: ForumThread[] = [];

export const INITIAL_LEADERBOARD: PlayerRankingEntry[] = [];

export const DATABASE_ARCHITECTURE_SCHEMAS: DatabaseTableSchema[] = [
  {
    tableName: 'users & friend_requests',
    domainGroup: 'Core Catalog',
    description:
      'จัดเก็บข้อมูลบัญชีผู้เล่น รหัสเพื่อน (Friend Code / UID) คำขอเป็นเพื่อน และรายชื่อเพื่อนที่ยืนยันแล้วสำหรับดึงเข้าโต๊ะเกม',
    scalingStrategy: 'Indexed lookup ตาม (accountName, friendCode, uid) พร้อม Real-time Listener',
    columns: [
      { name: 'uid', type: 'VARCHAR(64)', constraints: 'PRIMARY KEY', note: 'รหัสประจำตัวผู้เล่น' },
      { name: 'account_name', type: 'VARCHAR(40)', constraints: 'NOT NULL', note: 'ชื่อบัญชีที่ใช้แสดงในเกมและค้นหาเพื่อน' },
      { name: 'friend_code', type: 'CHAR(6)', constraints: 'UNIQUE NOT NULL', note: 'รหัสเพื่อน เช่น CT4829' },
      { name: 'friends', type: 'TEXT[]', constraints: 'NOT NULL DEFAULT \'{}\'', note: 'รายการ UID ของเพื่อนที่กดรับแอดแล้ว' },
    ],
    indexes: ['idx_users_friend_code (friend_code)', 'idx_friend_requests_to_uid (to_uid, status)'],
  },
  {
    tableName: 'rooms & room_players',
    domainGroup: 'Master Server & Matchmaking',
    description:
      'จัดการสถานะโต๊ะเล่นเกมทั้ง 4 เกม (Cheese Thief, Insider, Undercover, Detective Club) ซิงค์บทบาทลับ สมุดโน้ตดิจิทัล คำใบ้ และผลโหวตแบบเรียลไทม์ผ่าน Firestore onSnapshot',
    scalingStrategy: 'Document & Subcollection Sync ต่อห้อง พร้อมการตรวจสอบสิทธิ์ผู้เล่นในโต๊ะผ่าน Firestore Rules',
    columns: [
      { name: 'id / roomCode', type: 'VARCHAR(64) / CHAR(4)', constraints: 'PRIMARY KEY / UNIQUE', note: 'รหัสห้องและรหัสโต๊ะ 4 หลักสำหรับเข้าร่วม' },
      { name: 'gameId', type: 'ENUM(cheese-thief, insider, undercover, detective-club)', constraints: 'NOT NULL', note: 'ชนิดของบอร์ดเกมที่เปิดโต๊ะ' },
      { name: 'status', type: 'ENUM(lobby, ...game_phases)', constraints: 'NOT NULL', note: 'เฟสปัจจุบันของเกมที่ซิงค์ทุกหน้าจอพร้อมกัน' },
      { name: 'dcSecretWord / dcActivePlayerId', type: 'VARCHAR(100) / UID', constraints: 'NULLABLE', note: 'คำศัพท์ลับและผู้ตั้งโจทย์ในโหมด Detective Club' },
      { name: 'dcNotebookWord / dcScores', type: 'TEXT / JSONB', constraints: 'NULLABLE', note: 'เนื้อหาสมุดโน้ตลับรายบุคคล (ว่างเปล่าสำหรับ Conspirator) และแต้มสะสม' },
    ],
    indexes: ['idx_rooms_code (room_code)', 'idx_rooms_game_updated (game_id, updated_at DESC)'],
  },
  {
    tableName: 'leaderboard_rankings',
    domainGroup: 'Ranking & Telemetry',
    description:
      'บันทึกคะแนนจัดอันดับ ELO อัตราชนะ และจำนวนแมตช์สะสมของผู้เล่นทุกคนหลังจบเกมหนูขโมยชีสในสเต็ปที่ 6',
    scalingStrategy: 'Ordered Index บน (overall_elo DESC, wins DESC)',
    columns: [
      { name: 'player_id', type: 'VARCHAR(64)', constraints: 'PRIMARY KEY', note: 'รหัสผู้เล่นที่เชื่อมกับบัญชี' },
      { name: 'player_name', type: 'VARCHAR(40)', constraints: 'NOT NULL', note: 'ชื่อบัญชีผู้เล่น' },
      { name: 'overall_elo', type: 'INTEGER', constraints: 'NOT NULL DEFAULT 1500', note: 'คะแนนจัดอันดับ ELO ปัจจุบัน' },
      { name: 'matches_played', type: 'INTEGER', constraints: 'NOT NULL DEFAULT 0', note: 'จำนวนแมตช์ที่เล่นจบ' },
      { name: 'wins', type: 'INTEGER', constraints: 'NOT NULL DEFAULT 0', note: 'จำนวนครั้งที่ชนะ' },
    ],
    indexes: ['idx_leaderboard_elo (overall_elo DESC)'],
  },
  {
    tableName: 'forum_threads & forum_comments',
    domainGroup: 'Community Sub-Forums',
    description:
      'ระบบบอร์ดพูดคุยแลกเปลี่ยนเทคนิคการเล่นแยกตามรายเกม รองรับการตั้งกระทู้ใหม่ กดถูกใจ และแสดงความคิดเห็นแบบเรียลไทม์',
    scalingStrategy: 'Ordered Feed ตาม (game_id, is_pinned DESC, created_at DESC)',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', constraints: 'PRIMARY KEY', note: 'รหัสกระทู้หรือความคิดเห็น' },
      { name: 'game_id', type: 'VARCHAR(32)', constraints: 'NOT NULL', note: 'รหัสเกมของบอร์ดย่อย' },
      { name: 'author_name', type: 'VARCHAR(40)', constraints: 'NOT NULL', note: 'ชื่อบัญชีผู้โพสต์' },
      { name: 'tag', type: 'VARCHAR(32)', constraints: 'NOT NULL', note: 'หมวดหมู่กระทู้' },
      { name: 'content', type: 'TEXT', constraints: 'NOT NULL', note: 'เนื้อหากระทู้และความคิดเห็น' },
    ],
    indexes: ['idx_threads_game_created (game_id, created_at DESC)'],
  },
];
