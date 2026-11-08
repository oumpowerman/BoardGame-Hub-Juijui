export type UndercoverWordCategoryId =
  | 'all'
  | 'food'
  | 'daily'
  | 'animals'
  | 'places'
  | 'pop_culture';

export interface UndercoverCategoryMeta {
  id: UndercoverWordCategoryId;
  label: string;
  icon: string;
  description: string;
}

export const UNDERCOVER_CATEGORIES: UndercoverCategoryMeta[] = [
  {
    id: 'all',
    label: 'ทุกหมวดหมู่ยอดฮิต',
    icon: '✨',
    description: 'สุ่มคำคู่เหมือนจากทุกหมวดหมู่ในชีวิตประจำวัน',
  },
  {
    id: 'food',
    label: 'อาหาร & เครื่องดื่ม',
    icon: '🍜',
    description: 'เมนูยอดนิยม ของหวาน สตรีทฟู้ด และเครื่องดื่มคลายร้อน',
  },
  {
    id: 'daily',
    label: 'สิ่งของ & ของใช้ประจำวัน',
    icon: '🎒',
    description: 'อุปกรณ์ ไอที เครื่องใช้ในบ้าน และของติดกระเป๋า',
  },
  {
    id: 'animals',
    label: 'สัตว์ & ธรรมชาติ',
    icon: '🦁',
    description: 'สัตว์เลี้ยง สัตว์ป่า สัตว์น้ำ และบรรยากาศธรรมชาติ',
  },
  {
    id: 'places',
    label: 'สถานที่ & ท่องเที่ยว',
    icon: '🏖️',
    description: 'แลนด์มาร์ก ห้าง ตลาด แหล่งพักผ่อน และการเดินทาง',
  },
  {
    id: 'pop_culture',
    label: 'ป๊อปคัลเจอร์ & กิจกรรม',
    icon: '📱',
    description: 'แอปยอดฮิต โซเชียลมีเดีย ไลฟ์สไตล์ และความบันเทิง',
  },
];

export interface UndercoverWordPair {
  id: string;
  civilianWord: string; // คำสำหรับฝ่ายพลเมือง (เสียงส่วนใหญ่)
  undercoverWord: string; // คำสำหรับสายลับ Undercover (คำใกล้เคียงมาก)
  category: UndercoverWordCategoryId;
  categoryLabel: string;
  hint: string;
}

export const UNDERCOVER_WORD_PAIRS: UndercoverWordPair[] = [
  // หมวดอาหาร & เครื่องดื่ม
  {
    id: 'food-1',
    civilianWord: 'ชานมไข่มุก',
    undercoverWord: 'กาแฟเย็น',
    category: 'food',
    categoryLabel: 'อาหาร & เครื่องดื่ม',
    hint: 'เครื่องดื่มหวานเย็นใส่แก้ว มีหลอดดูด',
  },
  {
    id: 'food-2',
    civilianWord: 'หมูกระทะ',
    undercoverWord: 'ชาบู',
    category: 'food',
    categoryLabel: 'อาหาร & เครื่องดื่ม',
    hint: 'มื้อปาร์ตี้ล้อมวง มีเนื้อสัตว์และน้ำซุป',
  },
  {
    id: 'food-3',
    civilianWord: 'ข้าวมันไก่',
    undercoverWord: 'ข้าวหมูกรอบ',
    category: 'food',
    categoryLabel: 'อาหาร & เครื่องดื่ม',
    hint: 'อาหารจานเดียวราดน้ำจิ้ม มีน้ำซุปถ้วยเล็ก',
  },
  {
    id: 'food-4',
    civilianWord: 'ส้มตำ',
    undercoverWord: 'ยำวุ้นเส้น',
    category: 'food',
    categoryLabel: 'อาหาร & เครื่องดื่ม',
    hint: 'อาหารรสแซ่บ เผ็ดเปรี้ยว กินคู่กับข้าวเหนียวหรือไก่ย่าง',
  },
  {
    id: 'food-5',
    civilianWord: 'พิซซ่า',
    undercoverWord: 'แฮมเบอร์เกอร์',
    category: 'food',
    categoryLabel: 'อาหาร & เครื่องดื่ม',
    hint: 'ฟาสต์ฟู้ดสไตล์ตะวันตก มีแป้ง ชีส และเนื้อสัตว์',
  },
  {
    id: 'food-6',
    civilianWord: 'ไอศกรีม',
    undercoverWord: 'บิงซู',
    category: 'food',
    categoryLabel: 'อาหาร & เครื่องดื่ม',
    hint: 'ของหวานเย็นฉ่ำ ละลายในปาก ราดท็อปปิ้ง',
  },
  {
    id: 'food-7',
    civilianWord: 'กะเพราหมูกรอบ',
    undercoverWord: 'ข้าวผัดหมู',
    category: 'food',
    categoryLabel: 'อาหาร & เครื่องดื่ม',
    hint: 'เมนูตามสั่งยอดฮิต สั่งง่ายได้ไวเวลานึกไม่ออก',
  },
  {
    id: 'food-8',
    civilianWord: 'โรตี',
    undercoverWord: 'เครป',
    category: 'food',
    categoryLabel: 'อาหาร & เครื่องดื่ม',
    hint: 'ขนมแป้งแผ่นทอดบนเตา ราดนมข้นหรือใส่ไส้',
  },

  // หมวดของใช้ & ชีวิตประจำวัน
  {
    id: 'daily-1',
    civilianWord: 'แว่นตา',
    undercoverWord: 'แว่นกันแดด',
    category: 'daily',
    categoryLabel: 'สิ่งของ & ของใช้ประจำวัน',
    hint: 'อุปกรณ์สวมใส่บนใบหน้า มีเลนส์และขาแว่น',
  },
  {
    id: 'daily-2',
    civilianWord: 'แปรงสีฟัน',
    undercoverWord: 'ยาสีฟัน',
    category: 'daily',
    categoryLabel: 'สิ่งของ & ของใช้ประจำวัน',
    hint: 'ของใช้ในห้องน้ำ ใช้ทำความสะอาดช่องปากทุกเช้า',
  },
  {
    id: 'daily-3',
    civilianWord: 'หูฟังบลูทูธ',
    undercoverWord: 'ลำโพงพกพา',
    category: 'daily',
    categoryLabel: 'สิ่งของ & ของใช้ประจำวัน',
    hint: 'อุปกรณ์เปิดเสียงเพลง เชื่อมต่อกับสมาร์ทโฟนแบบไร้สาย',
  },
  {
    id: 'daily-4',
    civilianWord: 'พัดลม',
    undercoverWord: 'เครื่องปรับอากาศ (แอร์)',
    category: 'daily',
    categoryLabel: 'สิ่งของ & ของใช้ประจำวัน',
    hint: 'เครื่องใช้ไฟฟ้าช่วยคลายร้อนในห้องเวลาอากาศอบอ้าว',
  },
  {
    id: 'daily-5',
    civilianWord: 'มอเตอร์ไซค์',
    undercoverWord: 'จักรยาน',
    category: 'daily',
    categoryLabel: 'สิ่งของ & ของใช้ประจำวัน',
    hint: 'ยานพาหนะสองล้อ ใช้แฮนด์บังคับและขับขี่บนถนน',
  },
  {
    id: 'daily-6',
    civilianWord: 'สมาร์ทวอทช์',
    undercoverWord: 'นาฬิกาข้อมือเข็ม',
    category: 'daily',
    categoryLabel: 'สิ่งของ & ของใช้ประจำวัน',
    hint: 'ไอเทมสวมใส่ที่ข้อมือเพื่อบอกเวลา',
  },
  {
    id: 'daily-7',
    civilianWord: 'พาวเวอร์แบงก์',
    undercoverWord: 'สายชาร์จแบต',
    category: 'daily',
    categoryLabel: 'สิ่งของ & ของใช้ประจำวัน',
    hint: 'อุปกรณ์พกพาติดตัวไว้เติมพลังงานให้มือถือ',
  },
  {
    id: 'daily-8',
    civilianWord: 'ร่มพับ',
    undercoverWord: 'เสื้อกันฝน',
    category: 'daily',
    categoryLabel: 'สิ่งของ & ของใช้ประจำวัน',
    hint: 'ของจำเป็นสำหรับหน้าฝน ป้องกันไม่ให้ตัวเปียก',
  },

  // หมวดสัตว์ & ธรรมชาติ
  {
    id: 'anim-1',
    civilianWord: 'สุนัข',
    undercoverWord: 'แมว',
    category: 'animals',
    categoryLabel: 'สัตว์ & ธรรมชาติ',
    hint: 'สัตว์เลี้ยงสี่ขาสุดน่ารักยอดนิยมประจำบ้าน',
  },
  {
    id: 'anim-2',
    civilianWord: 'เสือ',
    undercoverWord: 'สิงโต',
    category: 'animals',
    categoryLabel: 'สัตว์ & ธรรมชาติ',
    hint: 'สัตว์นักล่าตระกูลแมวตัวใหญ่ ทรงพลังและดุร้าย',
  },
  {
    id: 'anim-3',
    civilianWord: 'โลมา',
    undercoverWord: 'วาฬ',
    category: 'animals',
    categoryLabel: 'สัตว์ & ธรรมชาติ',
    hint: 'สัตว์เลี้ยงลูกด้วยนมอาศัยอยู่ในมหาสมุทร ฉลาดและเป็นมิตร',
  },
  {
    id: 'anim-4',
    civilianWord: 'กระต่าย',
    undercoverWord: 'หนูแฮมสเตอร์',
    category: 'animals',
    categoryLabel: 'สัตว์ & ธรรมชาติ',
    hint: 'สัตว์ฟันแทะขนปุย มีฟันคู่หน้า ชอบแทะพืชผัก',
  },
  {
    id: 'anim-5',
    civilianWord: 'ผึ้ง',
    undercoverWord: 'ตัวต่อ',
    category: 'animals',
    categoryLabel: 'สัตว์ & ธรรมชาติ',
    hint: 'แมลงบินได้ มีเหล็กในป้องกันตัว บินตอมเกสรดอกไม้',
  },
  {
    id: 'anim-6',
    civilianWord: 'ทะเล',
    undercoverWord: 'น้ำตก',
    category: 'animals',
    categoryLabel: 'สัตว์ & ธรรมชาติ',
    hint: 'แหล่งน้ำธรรมชาติยอดฮิตสำหรับคลายร้อนช่วงวันหยุด',
  },

  // หมวดสถานที่ & ท่องเที่ยว
  {
    id: 'place-1',
    civilianWord: 'ห้างสรรพสินค้า',
    undercoverWord: 'ตลาดนัดกลางคืน',
    category: 'places',
    categoryLabel: 'สถานที่ & ท่องเที่ยว',
    hint: 'แหล่งรวมของกิน แฟชั่น เดินช้อปปิ้งของคนเมือง',
  },
  {
    id: 'place-2',
    civilianWord: 'สวนสนุก',
    undercoverWord: 'สวนสัตว์',
    category: 'places',
    categoryLabel: 'สถานที่ & ท่องเที่ยว',
    hint: 'สถานที่พักผ่อนวันหยุดสำหรับครอบครัวและกลุ่มเพื่อน',
  },
  {
    id: 'place-3',
    civilianWord: 'สนามบิน',
    undercoverWord: 'สถานีรถไฟ',
    category: 'places',
    categoryLabel: 'สถานที่ & ท่องเที่ยว',
    hint: 'จุดศูนย์กลางการคมนาคมขนส่งผู้โดยสารทางไกล มีตารางเวลาเดินทาง',
  },
  {
    id: 'place-4',
    civilianWord: 'โรงภาพยนตร์',
    undercoverWord: 'โรงละครเวที',
    category: 'places',
    categoryLabel: 'สถานที่ & ท่องเที่ยว',
    hint: 'ห้องจัดแสดงความบันเทิง ปิดไฟมืด มีเก้าอี้เรียงแถวและจอ/เวทีใหญ่',
  },
  {
    id: 'place-5',
    civilianWord: 'ห้องสมุด',
    undercoverWord: 'ร้านหนังสือ',
    category: 'places',
    categoryLabel: 'สถานที่ & ท่องเที่ยว',
    hint: 'สถานที่เงียบสงบ เต็มไปด้วยชั้นวางหนังสือความรู้และวรรณกรรม',
  },

  // หมวดป๊อปคัลเจอร์ & กิจกรรม
  {
    id: 'pop-1',
    civilianWord: 'TikTok',
    undercoverWord: 'YouTube',
    category: 'pop_culture',
    categoryLabel: 'ป๊อปคัลเจอร์ & กิจกรรม',
    hint: 'แพลตฟอร์มรับชมวิดีโอยอดนิยม มีครีเอเตอร์และยอดวิวหลักล้าน',
  },
  {
    id: 'pop-2',
    civilianWord: 'Shopee',
    undercoverWord: 'Lazada',
    category: 'pop_culture',
    categoryLabel: 'ป๊อปคัลเจอร์ & กิจกรรม',
    hint: 'แอปช้อปปิ้งออนไลน์ แจกโค้ดส่งฟรีและโปรโมชันวันดับเบิ้ลเดย์',
  },
  {
    id: 'pop-3',
    civilianWord: 'ซีรีส์เกาหลี',
    undercoverWord: 'อนิเมะญี่ปุ่น',
    category: 'pop_culture',
    categoryLabel: 'ป๊อปคัลเจอร์ & กิจกรรม',
    hint: 'สื่อบันเทิงจากเอเชียที่มีแฟนคลับทั่วโลก มีซับไทยให้ติดตาม',
  },
  {
    id: 'pop-4',
    civilianWord: 'คอนเสิร์ต',
    undercoverWord: 'งานเทศกาลดนตรี',
    category: 'pop_culture',
    categoryLabel: 'ป๊อปคัลเจอร์ & กิจกรรม',
    hint: 'อีเวนต์ดนตรีสดที่มีศิลปินขึ้นเวที คนดูส่งเสียงเชียร์และโบกแท่งไฟ',
  },
  {
    id: 'pop-5',
    civilianWord: 'ฟุตบอล',
    undercoverWord: 'บาสเกตบอล',
    category: 'pop_culture',
    categoryLabel: 'ป๊อปคัลเจอร์ & กิจกรรม',
    hint: 'กีฬาลูกกลมๆ แข่งขันเป็นทีม มีกรรมการเป่านกหวีดและยิงทำแต้ม',
  },
];

export function getRandomUndercoverWordPair(
  category: UndercoverWordCategoryId = 'all'
): UndercoverWordPair {
  const pool =
    category === 'all'
      ? UNDERCOVER_WORD_PAIRS
      : UNDERCOVER_WORD_PAIRS.filter((p) => p.category === category);

  const selectedPool = pool.length > 0 ? pool : UNDERCOVER_WORD_PAIRS;
  const picked =
    selectedPool[Math.floor(Math.random() * selectedPool.length)];

  // Randomly flip Civilian vs Undercover 50% of the time so the word doesn't always skew the same way
  if (Math.random() > 0.5) {
    return {
      ...picked,
      civilianWord: picked.undercoverWord,
      undercoverWord: picked.civilianWord,
    };
  }
  return picked;
}
