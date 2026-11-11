export type DyingMessageEvidenceCategory =
  | 'all'
  | 'appearance'
  | 'personality'
  | 'lifestyle'
  | 'avatar_vibe';

export interface DyingMessageEvidenceCard {
  id: string;
  titleTh: string;
  subtitleTh: string;
  category: Exclude<DyingMessageEvidenceCategory, 'all'>;
  categoryLabel: string;
  emoji: string;
  pastelBg: string;
  pastelBorder: string;
  pastelText: string;
  hintPrompt: string;
}

export interface DyingMessageRoleInfo {
  id:
    | 'dm_killer'
    | 'dm_accomplice'
    | 'dm_detective'
    | 'dm_doctor'
    | 'dm_civilian';
  nameTh: string;
  nameEn: string;
  faction: 'good' | 'evil';
  emoji: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  shortAbility: string;
  nightInstruction: string;
  dayInstruction: string;
}

export const DYING_MESSAGE_CATEGORIES: {
  id: DyingMessageEvidenceCategory;
  nameTh: string;
  descTh: string;
  emoji: string;
}[] = [
  {
    id: 'all',
    nameTh: 'ผสมครบทุกมิติ (แนะนำ)',
    descTh: 'รวมการ์ดลักษณะตัวจริง เสื้อผ้า นิสัยในวงเพื่อน และจุดเด่นอวตาร',
    emoji: '🔎',
  },
  {
    id: 'appearance',
    nameTh: 'ลักษณะตัวจริง & การแต่งกาย',
    descTh: 'เน้นสังเกตเสื้อผ้า ทรงผม แว่นตา เครื่องประดับ ของคนที่นั่งในวง',
    emoji: '👕',
  },
  {
    id: 'personality',
    nameTh: 'บุคลิก & ท่าทางในวงสนทนา',
    descTh: 'เน้นนิสัยประจำตัว เสียงหัวเราะ ท่านั่ง และสไตล์การพูดคุย',
    emoji: '🎭',
  },
  {
    id: 'lifestyle',
    nameTh: 'สิ่งของใกล้ตัว & ไลฟ์สไตล์',
    descTh: 'เน้นของที่วางอยู่หน้าตัก เครื่องดื่ม เคสมือถือ หรือความชอบส่วนตัว',
    emoji: '☕',
  },
];

export const DYING_MESSAGE_ROLES: Record<
  DyingMessageRoleInfo['id'],
  DyingMessageRoleInfo
> = {
  dm_killer: {
    id: 'dm_killer',
    nameTh: 'ฆาตกรเงามืด (Killer)',
    nameEn: 'The Shadow Killer',
    faction: 'evil',
    emoji: '🗡️',
    badgeBg: 'bg-rose-100',
    badgeBorder: 'border-rose-300',
    badgeText: 'text-rose-900',
    shortAbility:
      'เลือกสังหารเหยื่อในคืนแรก และแอบใส่การ์ดเบาะแสปลอม 2 ใบเพื่อโยนความผิดให้คนอื่นในวง',
    nightInstruction:
      'เลือกเหยื่อ 1 คน จากนั้นเลือกการ์ดเบาะแสปลอม 2 ใบที่ชี้เป้าไปหาคนอื่นในโต๊ะ',
    dayInstruction:
      'ตีเนียนช่วยวิเคราะห์หลักฐานบนจอ iPad และเบี่ยงประเด็นให้คนโหวตผิดคน',
  },
  dm_accomplice: {
    id: 'dm_accomplice',
    nameTh: 'ผู้สมรู้ร่วมคิด (Accomplice)',
    nameEn: 'Secret Accomplice',
    faction: 'evil',
    emoji: '🃏',
    badgeBg: 'bg-orange-100',
    badgeBorder: 'border-orange-300',
    badgeText: 'text-orange-900',
    shortAbility:
      'รู้ว่าใครคือฆาตกรตัวจริง! มีหน้าที่ช่วยพูดปั่นหัวชาวบ้านในวงสนทนาให้โหวตแพะรับบาป',
    nightInstruction:
      'จดจำชื่อฆาตกรไว้ให้แม่น แล้วเตรียมแผนช่วยพูดเบี่ยงประเด็นตอนเช้า',
    dayInstruction:
      'แกล้งทำเป็นวิเคราะห์การ์ดหลักฐานบน iPad เพื่อชี้เป้าไปหาชาวบ้านผู้บริสุทธิ์',
  },
  dm_detective: {
    id: 'dm_detective',
    nameTh: 'ตำรวจสายสืบ (Detective)',
    nameEn: 'Lead Detective',
    faction: 'good',
    emoji: '🕵️',
    badgeBg: 'bg-sky-100',
    badgeBorder: 'border-sky-300',
    badgeText: 'text-sky-900',
    shortAbility:
      'ตอนกลางคืนสามารถเลือกส่องตรวจสอบผู้ต้องสงสัยได้ 1 คนว่าใช่ "ฆาตกรตัวจริง" หรือไม่',
    nightInstruction:
      'เลือกผู้ต้องสงสัย 1 คนเพื่อตรวจประวัติลับ (ผู้สมรู้ร่วมคิดจะแสดงผลว่าไม่ใช่ฆาตกรลงมือ)',
    dayInstruction:
      'ใช้ข้อมูลจากการส่องประกอบกับการ์ดเบาะแสบน iPad เพื่อนำทางเพื่อนในวงโดยไม่ให้ฆาตกรรู้ตัวเร็วเกินไป',
  },
  dm_doctor: {
    id: 'dm_doctor',
    nameTh: 'หมอชันสูตร (Forensic Doctor)',
    nameEn: 'Forensic Doctor',
    faction: 'good',
    emoji: '🧪',
    badgeBg: 'bg-emerald-100',
    badgeBorder: 'border-emerald-300',
    badgeText: 'text-emerald-900',
    shortAbility:
      'ในช่วงกลางวัน สามารถกดใช้สกิล "ชันสูตรตัดหลักฐานปลอม" ออกได้ 1 ใบ (ใช้ได้ 1 ครั้งต่อเกม)',
    nightInstruction: 'พักผ่อนและรอวิเคราะห์หลักฐานสำคัญเมื่อเข้าสู่ช่วงเช้า',
    dayInstruction:
      'เมื่อเห็นการ์ด 3 ใบบนจอ iPad สามารถกดปุ่มสกิลในมือถือเพื่อประทับตราตัดการ์ดปลอมออก 1 ใบทันที!',
  },
  dm_civilian: {
    id: 'dm_civilian',
    nameTh: 'พยานชาวบ้าน (Civilian)',
    nameEn: 'Town Witness',
    faction: 'good',
    emoji: '🔍',
    badgeBg: 'bg-amber-100',
    badgeBorder: 'border-amber-300',
    badgeText: 'text-amber-900',
    shortAbility:
      'ช่วยกันสังเกตลักษณะตัวจริงและอวตารของเพื่อนในวง เพื่อหาว่าการ์ดใบไหนคือเบาะแสจริงของผู้ตาย',
    nightInstruction:
      'หากคุณตกเป็นเหยื่อ คุณจะได้เห็นหน้าฆาตกรและต้องเลือกการ์ดเบาะแสจริง 1 ใบที่สื่อถึงฆาตกรที่สุด',
    dayInstruction:
      'เงยหน้ามองจอ iPad กลางโต๊ะ สังเกตเพื่อนรอบวง และช่วยกันโหวตจับฆาตกรตัวจริง',
  },
};

export const DYING_MESSAGE_EVIDENCE_CARDS: DyingMessageEvidenceCard[] = [
  // 1. Appearance & Clothing (ลักษณะตัวจริง & การแต่งกาย)
  {
    id: 'ev_glasses',
    titleTh: 'แว่นตา / สายตาคม',
    subtitleTh: 'ใส่แว่น พกแว่น หรือชอบหรี่ตามอง',
    category: 'appearance',
    categoryLabel: 'ลักษณะตัวจริง',
    emoji: '👓',
    pastelBg: 'bg-sky-50',
    pastelBorder: 'border-sky-200',
    pastelText: 'text-sky-900',
    hintPrompt: 'สื่อถึงคนที่ใส่แว่นสายตา แว่นกันแดด หรือมีดวงตาโดดเด่น',
  },
  {
    id: 'ev_dark_shirt',
    titleTh: 'เสื้อผ้าโทนสีเข้ม',
    subtitleTh: 'ใส่เสื้อสีดำ กรมท่า หรือโทนเข้ม',
    category: 'appearance',
    categoryLabel: 'การแต่งกาย',
    emoji: '🖤',
    pastelBg: 'bg-slate-100',
    pastelBorder: 'border-slate-300',
    pastelText: 'text-slate-900',
    hintPrompt: 'สื่อถึงคนที่ใส่เสื้อผ้าโทนมืดหรือสีเข้มในวันนี้',
  },
  {
    id: 'ev_bright_shirt',
    titleTh: 'เสื้อผ้าโทนสว่างสดใส',
    subtitleTh: 'ใส่เสื้อสีขาว พาสเทล หรือสีสันสะดุดตา',
    category: 'appearance',
    categoryLabel: 'การแต่งกาย',
    emoji: '👕',
    pastelBg: 'bg-amber-50',
    pastelBorder: 'border-amber-200',
    pastelText: 'text-amber-900',
    hintPrompt: 'สื่อถึงคนที่ใส่เสื้อสีขาวหรือสีสว่างสดใสที่สุดในวง',
  },
  {
    id: 'ev_watch_ring',
    titleTh: 'นาฬิกา / เครื่องประดับ',
    subtitleTh: 'ใส่นาฬิกาข้อมือ แหวน สร้อย หรือกำไล',
    category: 'appearance',
    categoryLabel: 'การแต่งกาย',
    emoji: '⌚',
    pastelBg: 'bg-amber-50',
    pastelBorder: 'border-amber-300',
    pastelText: 'text-amber-950',
    hintPrompt: 'สื่อถึงคนที่มีนาฬิกาข้อมือหรือเครื่องประดับบนตัว',
  },
  {
    id: 'ev_long_styled_hair',
    titleTh: 'ทรงผมเป๊ะ / ผมยาว',
    subtitleTh: 'เซ็ตผมมาดี มัดผม หรือผมยาวสลวย',
    category: 'appearance',
    categoryLabel: 'ลักษณะตัวจริง',
    emoji: '💇',
    pastelBg: 'bg-pink-50',
    pastelBorder: 'border-pink-200',
    pastelText: 'text-pink-900',
    hintPrompt: 'สื่อถึงคนที่ทรงผมโดดเด่นหรือดูแลทรงผมเป็นพิเศษ',
  },
  {
    id: 'ev_short_casual_hair',
    titleTh: 'ผมสั้น / ลุคสบายๆ',
    subtitleTh: 'ตัดผมสั้นทะมัดทะแมง หรือใส่หมวก',
    category: 'appearance',
    categoryLabel: 'ลักษณะตัวจริง',
    emoji: '🧢',
    pastelBg: 'bg-teal-50',
    pastelBorder: 'border-teal-200',
    pastelText: 'text-teal-900',
    hintPrompt: 'สื่อถึงคนผมสั้นคล่องตัวหรือคนที่สวมหมวก',
  },
  {
    id: 'ev_jacket_layer',
    titleTh: 'เสื้อคลุม / แขนยาว',
    subtitleTh: 'ใส่ฮู้ด แจ็คเก็ต เสื้อกันหนาว หรือเสื้อทับ',
    category: 'appearance',
    categoryLabel: 'การแต่งกาย',
    emoji: '🧥',
    pastelBg: 'bg-indigo-50',
    pastelBorder: 'border-indigo-200',
    pastelText: 'text-indigo-900',
    hintPrompt: 'สื่อถึงคนที่ใส่เสื้อแขนยาวหรือเสื้อคลุมทับ',
  },
  {
    id: 'ev_patterned_outfit',
    titleTh: 'เสื้อมีลวดลาย / โลโก้',
    subtitleTh: 'เสื้อสกรีนลาย การ์ตูน ตัวอักษร หรือลายตาราง',
    category: 'appearance',
    categoryLabel: 'การแต่งกาย',
    emoji: '🎨',
    pastelBg: 'bg-rose-50',
    pastelBorder: 'border-rose-200',
    pastelText: 'text-rose-900',
    hintPrompt: 'สื่อถึงคนที่เสื้อมีลายกราฟิกหรือตัวหนังสือชัดเจน',
  },
  {
    id: 'ev_tall_posture',
    titleTh: 'รูปร่างสูงโปร่ง',
    subtitleTh: 'ตัวสูงหรือนั่งหลังตรงเด่นในวง',
    category: 'appearance',
    categoryLabel: 'ลักษณะตัวจริง',
    emoji: '🦒',
    pastelBg: 'bg-emerald-50',
    pastelBorder: 'border-emerald-200',
    pastelText: 'text-emerald-900',
    hintPrompt: 'สื่อถึงคนที่ดูตัวสูงหรือนั่งเด่นที่สุดในโต๊ะ',
  },

  // 2. Personality & Table Behavior (บุคลิก & ท่าทางในวงสนทนา)
  {
    id: 'ev_smiling_laugh',
    titleTh: 'รอยยิ้มมีพิรุธ / เสียงหัวเราะ',
    subtitleTh: 'ยิ้มเก่ง ขำง่าย หรือแอบอมยิ้มมุมปาก',
    category: 'personality',
    categoryLabel: 'บุคลิกในวง',
    emoji: '😄',
    pastelBg: 'bg-yellow-50',
    pastelBorder: 'border-yellow-300',
    pastelText: 'text-yellow-900',
    hintPrompt: 'สื่อถึงคนที่ยิ้มบ่อยหรือหัวเราะดังที่สุดในกลุ่ม',
  },
  {
    id: 'ev_quiet_calm',
    titleTh: 'นิ่งขรึม / เสือซุ่ม',
    subtitleTh: 'พูดน้อย ต่อยหนัก ชอบนั่งฟังเงียบๆ',
    category: 'personality',
    categoryLabel: 'บุคลิกในวง',
    emoji: '🤫',
    pastelBg: 'bg-violet-50',
    pastelBorder: 'border-violet-200',
    pastelText: 'text-violet-900',
    hintPrompt: 'สื่อถึงคนที่ดูสุขุม นั่งนิ่ง หรือพูดน้อยในวง',
  },
  {
    id: 'ev_talkative_leader',
    titleTh: 'ขาใหญ่เปิดประเด็น',
    subtitleTh: 'ช่างพูด ชอบซักไซ้ หรือเป็นผู้นำวงสนทนา',
    category: 'personality',
    categoryLabel: 'บุคลิกในวง',
    emoji: '📢',
    pastelBg: 'bg-orange-50',
    pastelBorder: 'border-orange-200',
    pastelText: 'text-orange-900',
    hintPrompt: 'สื่อถึงคนที่พูดเก่งหรือชอบเปิดประเด็นคนแรก',
  },
  {
    id: 'ev_crossed_arms',
    titleTh: 'กอดอก / เท้าคาง',
    subtitleTh: 'ชอบนั่งกอดอก เท้าคาง หรือเอนหลังพิงเก้าอี้',
    category: 'personality',
    categoryLabel: 'ท่าทางในวง',
    emoji: '🤔',
    pastelBg: 'bg-sky-50',
    pastelBorder: 'border-sky-200',
    pastelText: 'text-sky-900',
    hintPrompt: 'สื่อถึงท่านั่งประจำตัวของคนนั้นในตอนนี้',
  },
  {
    id: 'ev_poker_face',
    titleTh: 'หน้านิ่งอ่านใจยาก',
    subtitleTh: 'สีหน้าเรียบเฉย โกหกเนียนเหมือนไม่ได้โกหก',
    category: 'personality',
    categoryLabel: 'บุคลิกในวง',
    emoji: '🗿',
    pastelBg: 'bg-stone-100',
    pastelBorder: 'border-stone-300',
    pastelText: 'text-stone-900',
    hintPrompt: 'สื่อถึงคนที่เก็บอาการเก่งที่สุดในโต๊ะ',
  },
  {
    id: 'ev_hand_gestures',
    titleTh: 'ออกท่าทางมือประกอบ',
    subtitleTh: 'เวลาพูดชอบใช้มือชี้ หรือขยับตัวตลอดเวลา',
    category: 'personality',
    categoryLabel: 'ท่าทางในวง',
    emoji: '🙌',
    pastelBg: 'bg-amber-50',
    pastelBorder: 'border-amber-200',
    pastelText: 'text-amber-900',
    hintPrompt: 'สื่อถึงคนที่ขยับไม้ขยับมือเก่งเวลาพูด',
  },
  {
    id: 'ev_polite_gentle',
    titleTh: 'สายสุภาพ / อ่อนโยน',
    subtitleTh: 'พูดจานุ่มนวล ดูใจดีไม่มีพิษมีภัย',
    category: 'personality',
    categoryLabel: 'บุคลิกในวง',
    emoji: '🕊️',
    pastelBg: 'bg-teal-50',
    pastelBorder: 'border-teal-200',
    pastelText: 'text-teal-900',
    hintPrompt: 'สื่อถึงคนที่ดูใจดีและสุภาพที่สุดในกลุ่ม',
  },
  {
    id: 'ev_Analytical_mind',
    titleTh: 'สายวิเคราะห์จริงจัง',
    subtitleTh: 'ชอบใช้เหตุผล คำนวณความน่าจะเป็น',
    category: 'personality',
    categoryLabel: 'บุคลิกในวง',
    emoji: '🧠',
    pastelBg: 'bg-indigo-50',
    pastelBorder: 'border-indigo-200',
    pastelText: 'text-indigo-900',
    hintPrompt: 'สื่อถึงคนที่ชอบคิดวิเคราะห์เป็นระบบ',
  },
  {
    id: 'ev_playful_tease',
    titleTh: 'สายปั่น / ชอบแกล้งเพื่อน',
    subtitleTh: 'ชอบแซว ชอบอำให้เพื่อนไขว้เขว',
    category: 'personality',
    categoryLabel: 'บุคลิกในวง',
    emoji: '😜',
    pastelBg: 'bg-rose-50',
    pastelBorder: 'border-rose-200',
    pastelText: 'text-rose-900',
    hintPrompt: 'สื่อถึงตัวตึงสายปั่นประจำกลุ่ม',
  },

  // 3. Lifestyle & Nearby Items (สิ่งของใกล้ตัว & ไลฟ์สไตล์)
  {
    id: 'ev_coffee_tea',
    titleTh: 'แก้วกาแฟ / ชานมข้างกาย',
    subtitleTh: 'มีแก้วน้ำ เครื่องดื่ม หรือขวดน้ำวางอยู่ใกล้ตัว',
    category: 'lifestyle',
    categoryLabel: 'ของใกล้ตัว',
    emoji: '🧋',
    pastelBg: 'bg-amber-50',
    pastelBorder: 'border-amber-200',
    pastelText: 'text-amber-900',
    hintPrompt: 'สื่อถึงคนที่มีแก้วน้ำหรือเครื่องดื่มวางอยู่ตรงหน้า',
  },
  {
    id: 'ev_fancy_phone_case',
    titleTh: 'เคสมือถือสะดุดตา',
    subtitleTh: 'เคสมือถือสีสวย มีสติกเกอร์ หรือมีสายคล้อง',
    category: 'lifestyle',
    categoryLabel: 'ของใกล้ตัว',
    emoji: '📱',
    pastelBg: 'bg-pink-50',
    pastelBorder: 'border-pink-200',
    pastelText: 'text-pink-900',
    hintPrompt: 'สื่อถึงลักษณะเคสมือถือของคนร้าย',
  },
  {
    id: 'ev_snack_foodie',
    titleTh: 'สายกิน / ของว่างใกล้ตัว',
    subtitleTh: 'ชอบกินขนม รู้จักร้านอร่อย หรือมีขนมอยู่ใกล้ๆ',
    category: 'lifestyle',
    categoryLabel: 'ไลฟ์สไตล์',
    emoji: '🍟',
    pastelBg: 'bg-orange-50',
    pastelBorder: 'border-orange-200',
    pastelText: 'text-orange-900',
    hintPrompt: 'สื่อถึงสายกินประจำกลุ่มหรือคนที่หยิบขนมบ่อย',
  },
  {
    id: 'ev_night_owl',
    titleTh: 'นกฮูกนอนดึก',
    subtitleTh: 'นอนดึกเป็นประจำ ตื่นสาย หรือตอบแชทดึกๆ',
    category: 'lifestyle',
    categoryLabel: 'ไลฟ์สไตล์',
    emoji: '🦉',
    pastelBg: 'bg-purple-50',
    pastelBorder: 'border-purple-200',
    pastelText: 'text-purple-900',
    hintPrompt: 'สื่อถึงคนที่เพื่อนๆ รู้ดีว่านอนดึกที่สุด',
  },
  {
    id: 'ev_gamer_tech',
    titleTh: 'สายเกมเมอร์ / แกดเจ็ต',
    subtitleTh: 'เล่นเกมเก่ง ชอบไอที หรือพกอุปกรณ์อิเล็กทรอนิกส์',
    category: 'lifestyle',
    categoryLabel: 'ไลฟ์สไตล์',
    emoji: '🎮',
    pastelBg: 'bg-sky-50',
    pastelBorder: 'border-sky-200',
    pastelText: 'text-sky-900',
    hintPrompt: 'สื่อถึงสายเกมหรือสายไอทีในวง',
  },
  {
    id: 'ev_travel_driver',
    titleTh: 'สายเดินทาง / กุญแจรถ',
    subtitleTh: 'ชอบเที่ยว ขับรถมา หรือพกพวงกุญแจ',
    category: 'lifestyle',
    categoryLabel: 'ของใกล้ตัว',
    emoji: '🚗',
    pastelBg: 'bg-emerald-50',
    pastelBorder: 'border-emerald-200',
    pastelText: 'text-emerald-900',
    hintPrompt: 'สื่อถึงคนที่ขับรถมาหรือชอบออกทริป',
  },
  {
    id: 'ev_music_earbuds',
    titleTh: 'หูฟัง / สายดนตรี',
    subtitleTh: 'พกหูฟัง ชอบฟังเพลง หรือร้องเพลงเก่ง',
    category: 'lifestyle',
    categoryLabel: 'ไลฟ์สไตล์',
    emoji: '🎧',
    pastelBg: 'bg-violet-50',
    pastelBorder: 'border-violet-200',
    pastelText: 'text-violet-900',
    hintPrompt: 'สื่อถึงคนที่มีกล่องหูฟังหรือชอบเสียงเพลง',
  },
  {
    id: 'ev_bag_pouch',
    titleTh: 'กระเป๋าคู่ใจวางข้างตัว',
    subtitleTh: 'สะพายกระเป๋า หรือวางกระเป๋าไว้บนตัก/ข้างเก้าอี้',
    category: 'lifestyle',
    categoryLabel: 'ของใกล้ตัว',
    emoji: '👜',
    pastelBg: 'bg-rose-50',
    pastelBorder: 'border-rose-200',
    pastelText: 'text-rose-900',
    hintPrompt: 'สื่อถึงคนที่มีกระเป๋าวางติดตัวอยู่ตอนนี้',
  },
  {
    id: 'ev_seat_edge',
    titleTh: 'ที่นั่งริมสุด / มุมโต๊ะ',
    subtitleTh: 'นั่งอยู่หัวโต๊ะ ท้ายโต๊ะ หรือติดขอบห้อง',
    category: 'lifestyle',
    categoryLabel: 'ตำแหน่งที่นั่ง',
    emoji: '🪑',
    pastelBg: 'bg-amber-50',
    pastelBorder: 'border-amber-200',
    pastelText: 'text-amber-900',
    hintPrompt: 'สื่อถึงตำแหน่งที่นั่งจริงในวงตอนนี้',
  },

  // 4. Avatar & Name Vibe (จุดเด่นอวตาร & ชื่อในห้อง)
  {
    id: 'ev_avatar_warm',
    titleTh: 'อวตารโทนสีอุ่น / สดใส',
    subtitleTh: 'รูปโปรไฟล์โทนแดง ชมพู ส้ม หรือเหลือง',
    category: 'avatar_vibe',
    categoryLabel: 'จุดเด่นอวตาร',
    emoji: '🌸',
    pastelBg: 'bg-rose-50',
    pastelBorder: 'border-rose-200',
    pastelText: 'text-rose-900',
    hintPrompt: 'สื่อถึงสีอวตารหรือป้ายชื่อของผู้เล่นในห้อง',
  },
  {
    id: 'ev_avatar_cool',
    titleTh: 'อวตารโทนสีเย็น / สบายตา',
    subtitleTh: 'รูปโปรไฟล์โทนฟ้า เขียว หรือม่วงพาสเทล',
    category: 'avatar_vibe',
    categoryLabel: 'จุดเด่นอวตาร',
    emoji: '💎',
    pastelBg: 'bg-sky-50',
    pastelBorder: 'border-sky-200',
    pastelText: 'text-sky-900',
    hintPrompt: 'สื่อถึงสีอวตารโทนเย็นของผู้เล่นในห้อง',
  },
  {
    id: 'ev_short_nickname',
    titleTh: 'ชื่อสั้นจำง่าย',
    subtitleTh: 'ชื่อเล่นหรือชื่อในเกมสั้นกระชับ (1-2 พยางค์)',
    category: 'avatar_vibe',
    categoryLabel: 'จุดเด่นชื่อ/อวตาร',
    emoji: '🏷️',
    pastelBg: 'bg-emerald-50',
    pastelBorder: 'border-emerald-200',
    pastelText: 'text-emerald-900',
    hintPrompt: 'สื่อถึงความยาวชื่อเล่นหรือชื่อในห้องของคนร้าย',
  },
  {
    id: 'ev_english_stylized_name',
    titleTh: 'ชื่อภาษาอังกฤษ / ตัวเลข',
    subtitleTh: 'ตั้งชื่อในห้องเป็นภาษาอังกฤษหรือมีสัญลักษณ์พิเศษ',
    category: 'avatar_vibe',
    categoryLabel: 'จุดเด่นชื่อ/อวตาร',
    emoji: '🔤',
    pastelBg: 'bg-indigo-50',
    pastelBorder: 'border-indigo-200',
    pastelText: 'text-indigo-900',
    hintPrompt: 'สื่อถึงรูปแบบการตั้งชื่อในห้องของผู้เล่น',
  },
  {
    id: 'ev_animal_cute_vibe',
    titleTh: 'สายรักสัตว์ / อวตารน่ารัก',
    subtitleTh: 'ชอบหมาแมว หรือใช้อวตารแนวน่ารักสดใส',
    category: 'avatar_vibe',
    categoryLabel: 'จุดเด่นอวตาร',
    emoji: '🐾',
    pastelBg: 'bg-amber-50',
    pastelBorder: 'border-amber-200',
    pastelText: 'text-amber-900',
    hintPrompt: 'สื่อถึงคนรักสัตว์หรืออวตารลุคน่ารัก',
  },
];

export function getDyingMessageCardById(
  cardId: string
): DyingMessageEvidenceCard {
  return (
    DYING_MESSAGE_EVIDENCE_CARDS.find((c) => c.id === cardId) ||
    DYING_MESSAGE_EVIDENCE_CARDS[0]
  );
}

export function drawRandomDyingMessageCards(
  category: DyingMessageEvidenceCategory = 'all',
  count: number = 6,
  excludeIds: string[] = []
): DyingMessageEvidenceCard[] {
  const pool = DYING_MESSAGE_EVIDENCE_CARDS.filter((c) => {
    if (excludeIds.includes(c.id)) return false;
    if (category === 'all') return true;
    return c.category === category || c.category === 'avatar_vibe';
  });

  const fallbackPool =
    pool.length >= count
      ? pool
      : DYING_MESSAGE_EVIDENCE_CARDS.filter((c) => !excludeIds.includes(c.id));

  const shuffled = [...fallbackPool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
