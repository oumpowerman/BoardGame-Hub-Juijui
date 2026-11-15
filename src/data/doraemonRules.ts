// Standard Thai Doraemon (King's Cup) Party Card Game Rules and 52-Card Deck Definitions

export type CardSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type CardRank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

export interface DoraemonCard {
  id: string; // e.g. 'S-A', 'H-K'
  suit: CardSuit;
  rank: CardRank;
  suitSymbol: string;
  suitNameTh: string;
  isRed: boolean;
  titleTh: string;
  defaultRuleTh: string;
  badgeEmoji: string;
  colorClass: string;
}

export interface DoraemonRuleDefinition {
  rank: CardRank;
  nameTh: string;
  emoji: string;
  defaultDescription: string;
  summaryShort: string;
  isSpecialPinned?: boolean;
}

// 13 Standard Thai Popular Rules for A through K
export const DEFAULT_DORAEMON_RULES: Record<CardRank, DoraemonRuleDefinition> = {
  A: {
    rank: 'A',
    nameTh: 'A · สั่งช็อต / สั่งดื่ม',
    emoji: '🎯',
    defaultDescription:
      'ผู้ที่จั่วได้ไพ่ใบนี้ มีสิทธิ์ชี้ตัวเพื่อนในวง 1 คนให้ดื่ม หรือสั่ง 1 ช็อตทันที!',
    summaryShort: 'ชี้สั่งเพื่อน 1 คนดื่ม',
  },
  '2': {
    rank: '2',
    nameTh: '2 · หาคู่หู (Buddy)',
    emoji: '🤝',
    defaultDescription:
      'เลือกเพื่อน 1 คนมาเป็นคู่หู ไม่ว่าใครคนใดคนหนึ่งต้องดื่ม อีกคนต้องดื่มตามไปด้วยเสมอจนจบเกมหรือมีคนจั่ว 2 ใหม่!',
    summaryShort: 'เลือกบัดดี้ 1 คน ดื่มไปด้วยกัน',
  },
  '3': {
    rank: '3',
    nameTh: '3 · สามดื่มเอง',
    emoji: '🍺',
    defaultDescription:
      'ไม่มีใครช่วยคุณได้! คนที่จั่วได้ไพ่ใบนี้ต้องดื่มเอง 1 ช็อต/จิบ',
    summaryShort: 'คนจั่วดื่มเอง 1 ช็อต',
  },
  '4': {
    rank: '4',
    nameTh: '4 · แตะโต๊ะ / ห้ามขยับ (Floor / Freeze)',
    emoji: '🖐️',
    defaultDescription:
      'ทุกคนต้องรีบเอามือแตะโต๊ะ (หรือก้มแตะพื้น) ให้เร็วที่สุด คนสุดท้ายที่แตะต้องดื่ม!',
    summaryShort: 'คนแตะโต๊ะช้าสุดดื่ม',
  },
  '5': {
    rank: '5',
    nameTh: '5 · หนุ่มๆ ดื่ม (Men Drink)',
    emoji: '👨',
    defaultDescription:
      'สุภาพบุรุษและหนุ่มๆ ทุกคนในวงต้องยกดื่มพร้อมกัน!',
    summaryShort: 'ผู้ชายทุกคนในวงดื่ม',
  },
  '6': {
    rank: '6',
    nameTh: '6 · สาวๆ ดื่ม (Women Drink)',
    emoji: '👩',
    defaultDescription:
      'สุภาพสตรีและสาวๆ ทุกคนในวงต้องยกดื่มพร้อมกัน!',
    summaryShort: 'ผู้หญิงทุกคนในวงดื่ม',
  },
  '7': {
    rank: '7',
    nameTh: '7 · ป๊อกแป๊ก / นับเลข 7 (Seven)',
    emoji: '🔢',
    defaultDescription:
      'เริ่มนับเลขวนตามเข็มนาฬิกา ห้ามพูดเลขที่มีเลข 7 หรือหาร 7 ลงตัว (เช่น 7, 14, 17, 21...) ให้ตบโต๊ะแทน ใครพูดพลาดดื่ม!',
    summaryShort: 'นับเลขวน ห้ามพูดเลข 7',
  },
  '8': {
    rank: '8',
    nameTh: '8 · ตั๋วห้องน้ำ / ปาร์ตี้การ์ด (Bathroom Pass)',
    emoji: '🚽',
    defaultDescription:
      'ได้สิทธิ์ลุกไปเข้าห้องน้ำได้ 1 ครั้ง (ถ้าไม่มีไพ่ใบนี้ห้ามลุกจากโต๊ะ) หรือเก็บไว้ใช้เป็นไพ่สั่งเพื่อนดื่มได้',
    summaryShort: 'ตั๋วอนุญาตลุกไปห้องน้ำ',
  },
  '9': {
    rank: '9',
    nameTh: '9 · ดื่มคนละครึ่งกับเพื่อนข้างๆ',
    emoji: '🍻',
    defaultDescription:
      'คนจั่วได้ดื่มคู่กับคนทางซ้าย หรือคนทางขวาคนละครึ่งแก้ว/จิบ',
    summaryShort: 'ดื่มคู่คนข้างๆ คนละครึ่ง',
  },
  '10': {
    rank: '10',
    nameTh: '10 · กำหนดหมวดหมู่ (Category)',
    emoji: '📚',
    defaultDescription:
      'คนจั่วตั้งหมวดหมู่ขึ้นมา 1 หัวข้อ (เช่น ชื่อยี่ห้อรถ, ชื่อดารา, เครื่องดื่ม) ทุกคนต้องตอบตามหมวดหมู่ทีละคน ใครตอบซ้ำหรือช้าเกิน 5 วิ ดื่ม!',
    summaryShort: 'ตั้งหมวดหมู่ ตอบวนรอบวง',
  },
  J: {
    rank: 'J',
    nameTh: 'J · แจ็คผู้ตั้งกฎ (Rule Master)',
    emoji: '🃏',
    defaultDescription:
      'ผู้ที่ได้ J ล่าสุดจะถูกปักหมุดเป็น Rule Master มีสิทธิ์ออกกฎใหม่ 1 ข้อ (เช่น ห้ามพูดคำหยาบ, ต้องยกมือขึ้นก่อนพูด) ใครทำผิดกฎต้องดื่ม!',
    summaryShort: 'ตั้งกฎใหม่ในวง (ปักหมุด)',
    isSpecialPinned: true,
  },
  Q: {
    rank: 'Q',
    nameTh: 'Q · ควีนคำถามห้ามตอบ (Question Queen)',
    emoji: '👸',
    defaultDescription:
      'ผู้ที่ได้ Q ล่าสุดจะถูกปักหมุดเป็น Question Queen ใครก็ตามที่เผลอตอบคำถามของคนนี้ต้องดื่มทันที! (จะพ้นตำแหน่งเมื่อมีคนจั่วได้ Q ใบใหม่)',
    summaryShort: 'ห้ามใครตอบคำถามคนนี้ (ปักหมุด)',
    isSpecialPinned: true,
  },
  K: {
    rank: 'K',
    nameTh: 'K · พระราชา (King of Kings)',
    emoji: '👑',
    defaultDescription:
      'ผู้ที่จั่วได้ K ต้องทำตามคำสั่งของ King ที่ถูกกำหนดไว้! และจากนั้นผู้เล่นคนนี้จะต้องตั้งคำสั่งใหม่ลงในระบบเพื่อให้คนที่ได้ K คนต่อไปทำตาม!',
    summaryShort: 'ทำตามคำสั่ง King & ตั้งคำสั่งใหม่ (ปักหมุด)',
    isSpecialPinned: true,
  },
};

// Fun Preset Suggestions for King's Commands
export const KING_COMMAND_PRESETS: string[] = [
  'เต้นท่าไก่กุ๊กๆ กลางวง 10 วินาที 🐔',
  'ดื่มเครื่องดื่มรวดเดียวหมดแก้ว 🍻',
  'โดนเพื่อนข้างขวาเอาปากกาหรือลิปสติกเขียนหน้า 1 จุด 💄',
  'พูดลงท้ายประโยคด้วยคำว่า "เจ้าค่ะ/ขอรับ" ตลอดเกมจนกว่าจะมีคิงใหม่ 👑',
  'ทำหน้าตาหวานและส่งจุ๊บให้ทุกคนในโต๊ะ 1 รอบ 😘',
  'โทรไปบอก "คิดถึงนะ" กับคนแรกในรายชื่อแชทล่าสุด 📱',
  'ยืนกอดอกนิ่งๆ เหมือนรูปปั้นเป็นเวลา 1 ตา 🗿',
  'ร้องเพลงท่อนฮุกที่เพื่อนในวงเลือกให้ฟัง 1 ท่อน 🎤',
  'บอกความลับที่ไม่มีใครในโต๊ะเคยรู้มาก่อน 1 เรื่อง 🤫',
  'ให้เพื่อนทางซ้ายสั่งอะไรก็ได้ 1 อย่าง 🎯',
];

// Generate Full Shuffled 52-Card Deck
export function generateDoraemonDeck(): DoraemonCard[] {
  const suits: { suit: CardSuit; symbol: string; nameTh: string; isRed: boolean }[] = [
    { suit: 'spades', symbol: '♠', nameTh: 'โพดำ', isRed: false },
    { suit: 'hearts', symbol: '♥', nameTh: 'โพแดง', isRed: true },
    { suit: 'diamonds', symbol: '♦', nameTh: 'ข้าวหลามตัด', isRed: true },
    { suit: 'clubs', symbol: '♣', nameTh: 'ดอกจิก', isRed: false },
  ];

  const ranks: CardRank[] = [
    'A',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
  ];

  const deck: DoraemonCard[] = [];

  for (const s of suits) {
    for (const r of ranks) {
      const rule = DEFAULT_DORAEMON_RULES[r];
      const id = `${s.suit.charAt(0).toUpperCase()}-${r}`;
      deck.push({
        id,
        suit: s.suit,
        rank: r,
        suitSymbol: s.symbol,
        suitNameTh: s.nameTh,
        isRed: s.isRed,
        titleTh: `${r} ${s.nameTh} (${s.symbol})`,
        defaultRuleTh: rule.defaultDescription,
        badgeEmoji: rule.emoji,
        colorClass: s.isRed ? 'text-rose-600' : 'text-slate-900',
      });
    }
  }

  // Fisher-Yates Cryptographic-Safe Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

// Get Card info from cardId (e.g. 'S-A', 'H-K')
export function getDoraemonCardById(cardId: string): DoraemonCard | null {
  if (!cardId) return null;
  const parts = cardId.split('-');
  if (parts.length !== 2) return null;

  const suitChar = parts[0];
  const rank = parts[1] as CardRank;

  let suit: CardSuit = 'spades';
  let symbol = '♠';
  let nameTh = 'โพดำ';
  let isRed = false;

  if (suitChar === 'H') {
    suit = 'hearts';
    symbol = '♥';
    nameTh = 'โพแดง';
    isRed = true;
  } else if (suitChar === 'D') {
    suit = 'diamonds';
    symbol = '♦';
    nameTh = 'ข้าวหลามตัด';
    isRed = true;
  } else if (suitChar === 'C') {
    suit = 'clubs';
    symbol = '♣';
    nameTh = 'ดอกจิก';
    isRed = false;
  }

  const rule = DEFAULT_DORAEMON_RULES[rank] || DEFAULT_DORAEMON_RULES.A;

  return {
    id: cardId,
    suit,
    rank,
    suitSymbol: symbol,
    suitNameTh: nameTh,
    isRed,
    titleTh: `${rank} ${nameTh} (${symbol})`,
    defaultRuleTh: rule.defaultDescription,
    badgeEmoji: rule.emoji,
    colorClass: isRed ? 'text-rose-600' : 'text-slate-900',
  };
}
