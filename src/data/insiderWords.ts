export type InsiderWordCategoryId =
  | 'all'
  | 'food'
  | 'animals'
  | 'places'
  | 'objects'
  | 'jobs'
  | 'popculture';

export interface InsiderWordCategory {
  id: InsiderWordCategoryId;
  labelTh: string;
  emoji: string;
  words: string[];
}

export const INSIDER_WORD_CATEGORIES: InsiderWordCategory[] = [
  {
    id: 'food',
    labelTh: 'อาหาร & เครื่องดื่ม',
    emoji: '🍜',
    words: [
      'ข้าวเหนียวมะม่วง',
      'ส้มตำปูปลาร้า',
      'ชาไข่มุก',
      'หมูกระทะ',
      'ต้มยำกุ้ง',
      'ผัดไทยกุ้งสด',
      'ทุเรียนหมอนทอง',
      'ข้าวมันไก่',
      'บิงซูสายไหม',
      'ก๋วยเตี๋ยวเรือ',
      'ลูกชิ้นปิ้ง',
      'ขนมครก',
      'ซูชิแซลมอน',
      'พิซซ่าฮาวายเอี้ยน',
      'กาแฟเอสเปรสโซ',
      'น้ำมะพร้าวปั่น',
      'ปาท่องโก๋สังขยา',
      'ไข่เจียวหมูสับ',
      'โรตีสายไหม',
      'ไอศกรีมกะทิ',
    ],
  },
  {
    id: 'animals',
    labelTh: 'สัตว์ & ธรรมชาติ',
    emoji: '🦛',
    words: [
      'ฮิปโปแคระ (หมูเด้ง)',
      'แพนด้ายักษ์',
      'เพนกวินจักรพรรดิ',
      'สลอธสามนิ้ว',
      'กิ้งก่าคาเมเลี่ยน',
      'ปลาโลมาปากขวด',
      'นกฟลามิงโก',
      'จิงโจ้แดง',
      'หมีขั้วโลก',
      'แมวน้ำอุ๋งๆ',
      'ตุ่นปากเป็ด',
      'คาปิบารา',
      'นกฮูกหิมะ',
      'ปลาหมึกยักษ์',
      'เต่ามะเฟือง',
      'ต้นกระบองเพชร',
      'ดอกทานตะวัน',
      'ภูเขาไฟฟูจิ',
      'แสงเหนือ (ออโรรา)',
      'รุ้งกินน้ำ',
    ],
  },
  {
    id: 'places',
    labelTh: 'สถานที่ & แลนด์มาร์ก',
    emoji: '🎡',
    words: [
      'ตลาดนัดจตุจักร',
      'หอไอเฟล',
      'โรงภาพยนตร์',
      'สวนสนุกดิสนีย์แลนด์',
      'สถานีรถไฟใต้ดิน',
      'สนามบินสุวรรณภูมิ',
      'หอดูดาว',
      'พิพิธภัณฑ์สัตว์น้ำ',
      'วัดพระแก้ว',
      'กำแพงเมืองจีน',
      'พีระมิดอียิปต์',
      'ร้านสะดวกซื้อ 24 ชั่วโมง',
      'ห้องสมุดประชาชน',
      'ชายหาดพัทยา',
      'บ้านผีสิง',
      'ร้านตัดผมวินเทจ',
      'ค่ายลูกเสือ',
      'ตลาดน้ำอัมพวา',
      'สถานีอวกาศ',
      'เรือสำราญ',
    ],
  },
  {
    id: 'objects',
    labelTh: 'สิ่งของรอบตัว',
    emoji: '⏳',
    words: [
      'นาฬิกาทราย',
      'ร่มพับกันฝน',
      'หูฟังไร้สาย',
      'ตู้คีบตุ๊กตา',
      'หม้อทอดไร้น้ำมัน',
      'พาวเวอร์แบงค์',
      'แว่นขยาย',
      'ไฟฉายคาดหัว',
      'ลูกเต๋าหกหน้า',
      'กระปุกออมสินหมู',
      'พัดลมมือถือ',
      'กล้องโพลาลอยด์',
      'เครื่องซักผ้าหยอดเหรียญ',
      'ไม้เซลฟี่',
      'กุญแจนิรภัย',
      'เตารีดไอน้ำ',
      'เข็มทิศเดินป่า',
      'กระติกน้ำเก็บความเย็น',
      'ไมโครโฟนคาราโอเกะ',
      'เก้าอี้เกมมิ่ง',
    ],
  },
  {
    id: 'jobs',
    labelTh: 'อาชีพ & บทบาท',
    emoji: '🕵️',
    words: [
      'นักสืบเอกชน',
      'นักบินอวกาศ',
      'เชฟกระทะเหล็ก',
      'นักพากย์การ์ตูน',
      'หมอดูไพ่ยิปซี',
      'นักมายากล',
      'ดีเจเปิดแผ่น',
      'สัตวแพทย์',
      'นักดับเพลิง',
      'บาริสต้าชงกาแฟ',
      'ผู้กำกับภาพยนตร์',
      'นักโบราณคดี',
      'เทรนเนอร์ฟิตเนส',
      'ไรเดอร์ส่งอาหาร',
      'แคสเตอร์เกม',
      'นักประดาน้ำ',
      'ช่างภาพงานแต่ง',
      'แอร์โฮสเตส',
    ],
  },
  {
    id: 'popculture',
    labelTh: 'วัฒนธรรม & ปาร์ตี้',
    emoji: '🎭',
    words: [
      'วันสงกรานต์',
      'วันลอยกระทง',
      'คอนเสิร์ตเคป๊อป',
      'ซูเปอร์ฮีโร่',
      'แวมไพร์แดรกคิวลา',
      'ซอมบี้บุกเมือง',
      'หุ่นยนต์แปลงร่าง',
      'ไททานิค',
      'แฮร์รี่ พอตเตอร์',
      'โดราเอมอน',
      'โคนันยอดนักสืบ',
      'งานวัดปาโป่ง',
      'หมอลำซิ่ง',
      'รถตุ๊กตุ๊กไทยแลนด์',
      'มวยไทยคาดเชือก',
      'บอร์ดเกมคาเฟ่',
      'บุฟเฟต์ชาบู',
      'ปาร์ตี้ชุดนอน',
    ],
  },
];

export const ALL_INSIDER_CATEGORY_OPTIONS: {
  id: InsiderWordCategoryId;
  labelTh: string;
  emoji: string;
}[] = [
  { id: 'all', labelTh: 'สุ่มทุกหมวดหมู่ (110+ คำ)', emoji: '🎲' },
  ...INSIDER_WORD_CATEGORIES.map((c) => ({
    id: c.id,
    labelTh: c.labelTh,
    emoji: c.emoji,
  })),
];

export function getRandomInsiderWord(
  categoryId: InsiderWordCategoryId = 'all',
  excludeWord?: string
): { word: string; categoryLabel: string } {
  let pool: { word: string; categoryLabel: string }[] = [];

  if (categoryId === 'all') {
    INSIDER_WORD_CATEGORIES.forEach((cat) => {
      cat.words.forEach((w) => {
        pool.push({ word: w, categoryLabel: cat.labelTh });
      });
    });
  } else {
    const foundCat =
      INSIDER_WORD_CATEGORIES.find((c) => c.id === categoryId) ||
      INSIDER_WORD_CATEGORIES[0];
    foundCat.words.forEach((w) => {
      pool.push({ word: w, categoryLabel: foundCat.labelTh });
    });
  }

  if (excludeWord && pool.length > 1) {
    pool = pool.filter((item) => item.word !== excludeWord);
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return chosen || { word: 'นาฬิกาทราย', categoryLabel: 'สิ่งของรอบตัว' };
}
