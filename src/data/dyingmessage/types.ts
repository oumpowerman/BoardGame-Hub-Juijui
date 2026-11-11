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
