import {
  DyingMessageEvidenceCard,
  DyingMessageEvidenceCategory,
} from './types';
import { APPEARANCE_CARDS } from './cards/appearanceCards';
import { PERSONALITY_CARDS } from './cards/personalityCards';
import { LIFESTYLE_CARDS } from './cards/lifestyleCards';
import { AVATAR_VIBE_CARDS } from './cards/avatarVibeCards';

export * from './types';
export * from './roles';
export { APPEARANCE_CARDS } from './cards/appearanceCards';
export { PERSONALITY_CARDS } from './cards/personalityCards';
export { LIFESTYLE_CARDS } from './cards/lifestyleCards';
export { AVATAR_VIBE_CARDS } from './cards/avatarVibeCards';

/**
 * Complete Dying Message Deck containing 100 uniquely crafted evidence cards
 * perfectly distributed across 4 distinct real-life & in-game dimensions (25 each).
 */
export const DYING_MESSAGE_ALL_CARDS: DyingMessageEvidenceCard[] = [
  ...APPEARANCE_CARDS,
  ...PERSONALITY_CARDS,
  ...LIFESTYLE_CARDS,
  ...AVATAR_VIBE_CARDS,
];

// Re-export as DYING_MESSAGE_CARDS for 100% backward compatibility
export const DYING_MESSAGE_CARDS = DYING_MESSAGE_ALL_CARDS;

export const DYING_MESSAGE_CATEGORIES: {
  id: DyingMessageEvidenceCategory;
  nameTh: string;
  descTh: string;
  emoji: string;
  cardCount: number;
}[] = [
  {
    id: 'all',
    nameTh: 'ผสมครบทุกมิติ (แนะนำ)',
    descTh: 'รวมการ์ดลักษณะตัวจริง เสื้อผ้า นิสัยในวงเพื่อน และจุดเด่นอวตารครบ 100 ใบ',
    emoji: '🔎',
    cardCount: 100,
  },
  {
    id: 'appearance',
    nameTh: 'ลักษณะตัวจริง & การแต่งกาย',
    descTh: 'เน้นสังเกตเสื้อผ้า ทรงผม แว่นตา เครื่องประดับ ของคนที่นั่งในวง',
    emoji: '👕',
    cardCount: APPEARANCE_CARDS.length,
  },
  {
    id: 'personality',
    nameTh: 'บุคลิก & ท่าทางในวงสนทนา',
    descTh: 'เน้นสังเกตภาษากาย ท่านั่ง อาการลุกลี้ลุกลน และรอยยิ้มในวงพูดคุย',
    emoji: '🤫',
    cardCount: PERSONALITY_CARDS.length,
  },
  {
    id: 'lifestyle',
    nameTh: 'ของใช้ & ไลฟ์สไตล์รอบตัว',
    descTh: 'เน้นสังเกตเคสมือถือ แก้วน้ำ ทิศทางตำแหน่งที่นั่ง และของใช้ข้างตัว',
    emoji: '📱',
    cardCount: LIFESTYLE_CARDS.length,
  },
  {
    id: 'avatar_vibe',
    nameTh: 'อวตาร & เอกลักษณ์ในห้อง',
    descTh: 'เน้นสังเกตรูปอวตาร สีพื้นหลัง สไตล์ชื่อ และสถานะการกดในห้องเกม',
    emoji: '✨',
    cardCount: AVATAR_VIBE_CARDS.length,
  },
];

/**
 * Find an evidence card by its ID
 */
export function getDyingMessageCardById(
  id: string
): DyingMessageEvidenceCard | undefined {
  return DYING_MESSAGE_ALL_CARDS.find((c) => c.id === id);
}

/**
 * Helper to sample random evidence cards for the victim or killer hand
 */
export function sampleDyingMessageCandidateCards(
  category: DyingMessageEvidenceCategory = 'all',
  count: number = 5,
  excludeIds: string[] = []
): DyingMessageEvidenceCard[] {
  let pool =
    category === 'all'
      ? [...DYING_MESSAGE_ALL_CARDS]
      : DYING_MESSAGE_ALL_CARDS.filter((c) => c.category === category);

  if (excludeIds.length > 0) {
    const excludeSet = new Set(excludeIds);
    pool = pool.filter((c) => !excludeSet.has(c.id));
  }

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(count, pool.length));
}

// Alias for backwards compatibility
export const drawRandomDyingMessageCards = sampleDyingMessageCandidateCards;

