import React from 'react';
import {
  Wand2,
  Shield,
  Swords,
  Crosshair,
  Sparkles,
  Crown,
  EyeOff,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { PlayerRoleCard } from '../../firebase/tableService';

export interface AvalonRoleIconProps {
  roleId?: PlayerRoleCard | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBackground?: boolean;
  className?: string;
}

const SIZE_CONFIGS = {
  xs: { box: 'w-6 h-6 rounded-lg', icon: 'w-3.5 h-3.5' },
  sm: { box: 'w-8 h-8 rounded-xl', icon: 'w-4 h-4' },
  md: { box: 'w-10 h-10 rounded-2xl', icon: 'w-5 h-5' },
  lg: { box: 'w-16 h-16 rounded-3xl', icon: 'w-8 h-8' },
  xl: { box: 'w-24 h-24 rounded-3xl', icon: 'w-12 h-12' },
};

export const AvalonRoleIcon: React.FC<AvalonRoleIconProps> = ({
  roleId,
  size = 'md',
  showBackground = true,
  className = '',
}) => {
  const sizeCfg = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;

  switch (roleId) {
    case 'avalon_merlin':
      return (
        <div
          className={`${sizeCfg.box} flex items-center justify-center shrink-0 border transition-all ${
            showBackground
              ? 'bg-emerald-100/90 border-emerald-300 text-emerald-800 shadow-2xs'
              : 'text-emerald-700 border-transparent'
          } ${className}`}
          title="Merlin (พ่อมดเมอร์ลิน)"
        >
          <Wand2 className={sizeCfg.icon} />
        </div>
      );

    case 'avalon_percival':
      return (
        <div
          className={`${sizeCfg.box} flex items-center justify-center shrink-0 border transition-all ${
            showBackground
              ? 'bg-emerald-100/90 border-emerald-300 text-emerald-800 shadow-2xs'
              : 'text-emerald-700 border-transparent'
          } ${className}`}
          title="Percival (อัศวินเพอร์ซิวาล)"
        >
          <Shield className={sizeCfg.icon} />
        </div>
      );

    case 'avalon_loyal_servant':
      return (
        <div
          className={`${sizeCfg.box} flex items-center justify-center shrink-0 border transition-all ${
            showBackground
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-700 shadow-2xs'
              : 'text-emerald-600 border-transparent'
          } ${className}`}
          title="Loyal Servant (อัศวินผู้ภักดี)"
        >
          <Swords className={sizeCfg.icon} />
        </div>
      );

    case 'avalon_assassin':
      return (
        <div
          className={`${sizeCfg.box} flex items-center justify-center shrink-0 border transition-all ${
            showBackground
              ? 'bg-rose-100/90 border-rose-300 text-rose-800 shadow-2xs'
              : 'text-rose-700 border-transparent'
          } ${className}`}
          title="Assassin (มือสังหาร)"
        >
          <Crosshair className={sizeCfg.icon} />
        </div>
      );

    case 'avalon_morgana':
      return (
        <div
          className={`${sizeCfg.box} flex items-center justify-center shrink-0 border transition-all ${
            showBackground
              ? 'bg-rose-100/90 border-rose-300 text-rose-800 shadow-2xs'
              : 'text-rose-700 border-transparent'
          } ${className}`}
          title="Morgana (แม่มดมอร์กาน่า)"
        >
          <Sparkles className={sizeCfg.icon} />
        </div>
      );

    case 'avalon_mordred':
      return (
        <div
          className={`${sizeCfg.box} flex items-center justify-center shrink-0 border transition-all ${
            showBackground
              ? 'bg-rose-100/90 border-amber-400 text-rose-900 shadow-2xs'
              : 'text-rose-800 border-transparent'
          } ${className}`}
          title="Mordred (มอร์ดเร็ด จอมกบฏ)"
        >
          <Crown className={sizeCfg.icon} />
        </div>
      );

    case 'avalon_oberon':
      return (
        <div
          className={`${sizeCfg.box} flex items-center justify-center shrink-0 border transition-all ${
            showBackground
              ? 'bg-purple-100/90 border-purple-300 text-purple-800 shadow-2xs'
              : 'text-purple-700 border-transparent'
          } ${className}`}
          title="Oberon (โอเบรอน ผู้สันโดษ)"
        >
          <EyeOff className={sizeCfg.icon} />
        </div>
      );

    case 'avalon_minion':
      return (
        <div
          className={`${sizeCfg.box} flex items-center justify-center shrink-0 border transition-all ${
            showBackground
              ? 'bg-rose-50/90 border-rose-300 text-rose-700 shadow-2xs'
              : 'text-rose-600 border-transparent'
          } ${className}`}
          title="Minion of Mordred (สมุนปีศาจ)"
        >
          <Flame className={sizeCfg.icon} />
        </div>
      );

    default:
      return (
        <div
          className={`${sizeCfg.box} flex items-center justify-center shrink-0 border bg-slate-100 border-slate-300 text-slate-500 ${className}`}
        >
          <HelpCircle className={sizeCfg.icon} />
        </div>
      );
  }
};
