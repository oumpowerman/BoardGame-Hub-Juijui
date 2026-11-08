import { GamePhase } from '../../../firebase/tableService';

export const HOUR_THAI_NAMES: Record<number, string> = {
  1: 'หนึ่ง',
  2: 'สอง',
  3: 'สาม',
  4: 'สี่',
  5: 'ห้า',
  6: 'หก',
};

export const STEP_LIST: { step: number; phases: GamePhase[]; label: string }[] = [
  { step: 1, phases: ['lobby'], label: 'ตั้งโต๊ะ' },
  { step: 2, phases: ['role_deal'], label: 'แจกการ์ด' },
  { step: 3, phases: ['dice_roll'], label: 'ทอยเต๋าในถ้วย' },
  {
    step: 4,
    phases: ['night_phases', 'follower_phase'],
    label: 'กลางคืน & ลูกน้อง',
  },
  { step: 5, phases: ['voting'], label: 'ถกเถียง & โหวต' },
  { step: 6, phases: ['game_over'], label: 'เปิดการ์ด & ชนะ' },
];

export interface CheeseThiefRoleInfo {
  titleTh: string;
  team: 'thief' | 'fall_mouse' | 'mice';
  emoji: string;
  color: string;
  goal: string;
}

export function getCheeseThiefRoleDetails(
  role?: string,
  isFollower?: boolean
): CheeseThiefRoleInfo {
  if (role === 'cheese_thief') {
    return {
      titleTh: 'จอมโจรชีส (Cheese Thief)',
      team: 'thief',
      emoji: '🧀',
      color: 'text-amber-800 bg-amber-50 border-amber-300',
      goal: 'พอถึงชั่วโมงของตัวเอง ต้องคว้าชีสกลางโต๊ะไปซ่อนให้มิดชิด! ตอนเช้าต้องเนียนและปั้นแพะไม่ให้ตัวเองถูกโหวตมากที่สุด',
    };
  }
  if (role === 'fall_mouse') {
    return {
      titleTh: 'Fall Mouse (หนูจอมปั่นอยากโดนโหวต)',
      team: 'fall_mouse',
      emoji: '🃏',
      color: 'text-purple-900 bg-purple-50 border-purple-300',
      goal: 'โหมดพิเศษ 6–8 คน! พยายามทำตัวน่าสงสัยเพื่อให้คนทั้งโต๊ะโหวตชี้ตัวคุณมากที่สุด หากคุณถูกโหวตมากที่สุด คุณจะชนะเดี่ยวทันที!',
    };
  }
  if (isFollower) {
    return {
      titleTh: 'หนูขี้เซา → ย้ายข้างเป็นลูกน้อง (Follower)',
      team: 'thief',
      emoji: '🕵️',
      color: 'text-rose-800 bg-rose-50 border-rose-300',
      goal: 'คุณกลายเป็นลูกน้อง (Follower) ของจอมโจรชีสแล้ว! ห้ามบอกข้อมูลเต๋าช่วงกลางคืน และต้องช่วยเบี่ยงเบนให้จอมโจรชีสรอดจากการถูกโหวต',
    };
  }
  return {
    titleTh: 'หนูขี้เซา (Sleepyhead)',
    team: 'mice',
    emoji: '🐭',
    color: 'text-sky-800 bg-sky-50 border-sky-300',
    goal: 'ถ้าตื่นขึ้นมาคนเดียวในชั่วโมงของตัวเอง จะแอบส่องเต๋าใต้ถ้วยของคนอื่นได้ 1 คน! ตอนเช้าช่วยกันถกเถียงและโหวตจับจอมโจรชีสให้ได้',
  };
}
