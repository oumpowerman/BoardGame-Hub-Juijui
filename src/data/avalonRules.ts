/**
 * Official Avalon (The Resistance: Avalon) Rules Data & Quest Lookups
 * Supporting 5 to 10 players according to IGAMES / Indie Boards & Cards official rulebook.
 */

export interface QuestRequirement {
  teamSize: number;
  requiredFails: number;
}

export interface PlayerCountConfig {
  goodCount: number;
  evilCount: number;
  quests: QuestRequirement[];
}

// Official Quest Team Size & Required Fails Matrix (5 to 10 players)
export const AVALON_QUEST_MATRIX: Record<number, PlayerCountConfig> = {
  5: {
    goodCount: 3,
    evilCount: 2,
    quests: [
      { teamSize: 2, requiredFails: 1 },
      { teamSize: 3, requiredFails: 1 },
      { teamSize: 2, requiredFails: 1 },
      { teamSize: 3, requiredFails: 1 },
      { teamSize: 3, requiredFails: 1 },
    ],
  },
  6: {
    goodCount: 4,
    evilCount: 2,
    quests: [
      { teamSize: 2, requiredFails: 1 },
      { teamSize: 3, requiredFails: 1 },
      { teamSize: 4, requiredFails: 1 },
      { teamSize: 3, requiredFails: 1 },
      { teamSize: 4, requiredFails: 1 },
    ],
  },
  7: {
    goodCount: 4,
    evilCount: 3,
    quests: [
      { teamSize: 2, requiredFails: 1 },
      { teamSize: 3, requiredFails: 1 },
      { teamSize: 3, requiredFails: 1 },
      { teamSize: 4, requiredFails: 2 }, // 7+ players: Quest 4 needs 2 Fails!
      { teamSize: 4, requiredFails: 1 },
    ],
  },
  8: {
    goodCount: 5,
    evilCount: 3,
    quests: [
      { teamSize: 3, requiredFails: 1 },
      { teamSize: 4, requiredFails: 1 },
      { teamSize: 4, requiredFails: 1 },
      { teamSize: 5, requiredFails: 2 }, // 8+ players: Quest 4 needs 2 Fails!
      { teamSize: 5, requiredFails: 1 },
    ],
  },
  9: {
    goodCount: 6,
    evilCount: 3,
    quests: [
      { teamSize: 3, requiredFails: 1 },
      { teamSize: 4, requiredFails: 1 },
      { teamSize: 4, requiredFails: 1 },
      { teamSize: 5, requiredFails: 2 },
      { teamSize: 5, requiredFails: 1 },
    ],
  },
  10: {
    goodCount: 6,
    evilCount: 4,
    quests: [
      { teamSize: 3, requiredFails: 1 },
      { teamSize: 4, requiredFails: 1 },
      { teamSize: 4, requiredFails: 1 },
      { teamSize: 5, requiredFails: 2 },
      { teamSize: 5, requiredFails: 1 },
    ],
  },
};

export interface AvalonRoleMeta {
  roleId: string;
  nameTh: string;
  nameEn: string;
  faction: 'good' | 'evil';
  isSpecial: boolean;
  description: string;
}

export const AVALON_ROLES_META: Record<string, AvalonRoleMeta> = {
  avalon_merlin: {
    roleId: 'avalon_merlin',
    nameTh: 'Merlin (พ่อมดเมอร์ลิน)',
    nameEn: 'Merlin',
    faction: 'good',
    isSpecial: true,
    description: 'รู้ตัวผู้เล่นฝ่ายปีศาจทุกคน (ยกเว้น Mordred) แต่ต้องคอยซ่อนตัวไม่ให้ Assassin สังหารตอนจบ',
  },
  avalon_percival: {
    roleId: 'avalon_percival',
    nameTh: 'Percival (อัศวินเพอร์ซิวาล)',
    nameEn: 'Percival',
    faction: 'good',
    isSpecial: true,
    description: 'เห็นผู้เล่น 2 คนที่เป็น Merlin และ Morgana แต่ไม่รู้ว่าใครคือตัวจริง ต้องคอยช่วยค้ำประกัน Merlin',
  },
  avalon_loyal_servant: {
    roleId: 'avalon_loyal_servant',
    nameTh: 'Loyal Servant of Arthur (อัศวินผู้ซื่อสัตย์)',
    nameEn: 'Loyal Servant',
    faction: 'good',
    isSpecial: false,
    description: 'อัศวินโต๊ะกลมผู้จงรักภักดี ไม่มีพลังพิเศษ ต้องใช้การสังเกตและฟังอภิปรายในการลงโหวต',
  },
  avalon_assassin: {
    roleId: 'avalon_assassin',
    nameTh: 'Assassin (มือสังหาร)',
    nameEn: 'Assassin',
    faction: 'evil',
    isSpecial: true,
    description: 'แฝงตัวเป็นปีศาจ รู้จักพวกพ้อง หากอัศวินทำภารกิจสำเร็จ 3 รอบ จะได้รับสิทธิ์สังหาร Merlin เพื่อพลิกกลับมาชนะ',
  },
  avalon_morgana: {
    roleId: 'avalon_morgana',
    nameTh: 'Morgana (แม่มดมอร์กาน่า)',
    nameEn: 'Morgana',
    faction: 'evil',
    isSpecial: true,
    description: 'ปลอมตัวเป็น Merlin ในสายตาของ Percival เพื่อหลอกให้ Percival หลงเชื่อและชี้นำทีมผิดๆ',
  },
  avalon_mordred: {
    roleId: 'avalon_mordred',
    nameTh: 'Mordred (มอร์ดเร็ด จอมกบฏ)',
    nameEn: 'Mordred',
    faction: 'evil',
    isSpecial: true,
    description: 'หัวหน้าฝ่ายปีศาจผู้ซ่อนตัวจากสายตาของ Merlin (Merlin จะมองไม่เห็นว่า Mordred เป็นปีศาจ)',
  },
  avalon_oberon: {
    roleId: 'avalon_oberon',
    nameTh: 'Oberon (โอเบรอน ผู้สันโดษ)',
    nameEn: 'Oberon',
    faction: 'evil',
    isSpecial: true,
    description: 'ปีศาจผู้สันโดษ ไม่รู้จักพวกพ้องปีศาจคนอื่น และปีศาจคนอื่นก็มองไม่เห็น Oberon เช่นกัน',
  },
  avalon_minion: {
    roleId: 'avalon_minion',
    nameTh: 'Minion of Mordred (สมุนปีศาจ)',
    nameEn: 'Minion of Mordred',
    faction: 'evil',
    isSpecial: false,
    description: 'สมุนฝ่ายปีศาจ รู้จักพวกพ้อง ช่วยกันส่งการ์ดล้มเหลวป่วนภารกิจของอัศวิน',
  },
};
