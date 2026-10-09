import type { FormationId, FormationSlot } from '@/types';

/**
 * Same formations, slot keys and coordinates as the website's Squad Lab
 * (components/formation-pitch.tsx), so a lineup saved on one side opens on the other.
 * x runs left to right and y runs attack (0) to own goal (1).
 */
export const FORMATIONS: Record<FormationId, FormationSlot[]> = {
  '4-3-3': [
    { slotKey: 'gk', label: 'GK', pos: 'GK', x: 0.5, y: 0.92 },
    { slotKey: 'lb', label: 'LB', pos: 'DEF', x: 0.14, y: 0.72 },
    { slotKey: 'cb1', label: 'CB', pos: 'DEF', x: 0.36, y: 0.76 },
    { slotKey: 'cb2', label: 'CB', pos: 'DEF', x: 0.64, y: 0.76 },
    { slotKey: 'rb', label: 'RB', pos: 'DEF', x: 0.86, y: 0.72 },
    { slotKey: 'cm1', label: 'CM', pos: 'MID', x: 0.28, y: 0.5 },
    { slotKey: 'cm2', label: 'CM', pos: 'MID', x: 0.5, y: 0.45 },
    { slotKey: 'cm3', label: 'CM', pos: 'MID', x: 0.72, y: 0.5 },
    { slotKey: 'lw', label: 'LW', pos: 'FWD', x: 0.18, y: 0.2 },
    { slotKey: 'st', label: 'ST', pos: 'FWD', x: 0.5, y: 0.14 },
    { slotKey: 'rw', label: 'RW', pos: 'FWD', x: 0.82, y: 0.2 },
  ],
  '4-4-2': [
    { slotKey: 'gk', label: 'GK', pos: 'GK', x: 0.5, y: 0.92 },
    { slotKey: 'lb', label: 'LB', pos: 'DEF', x: 0.14, y: 0.72 },
    { slotKey: 'cb1', label: 'CB', pos: 'DEF', x: 0.36, y: 0.76 },
    { slotKey: 'cb2', label: 'CB', pos: 'DEF', x: 0.64, y: 0.76 },
    { slotKey: 'rb', label: 'RB', pos: 'DEF', x: 0.86, y: 0.72 },
    { slotKey: 'lm', label: 'LM', pos: 'MID', x: 0.14, y: 0.45 },
    { slotKey: 'cm1', label: 'CM', pos: 'MID', x: 0.38, y: 0.48 },
    { slotKey: 'cm2', label: 'CM', pos: 'MID', x: 0.62, y: 0.48 },
    { slotKey: 'rm', label: 'RM', pos: 'MID', x: 0.86, y: 0.45 },
    { slotKey: 'st1', label: 'ST', pos: 'FWD', x: 0.38, y: 0.16 },
    { slotKey: 'st2', label: 'ST', pos: 'FWD', x: 0.62, y: 0.16 },
  ],
  '4-2-3-1': [
    { slotKey: 'gk', label: 'GK', pos: 'GK', x: 0.5, y: 0.92 },
    { slotKey: 'lb', label: 'LB', pos: 'DEF', x: 0.14, y: 0.72 },
    { slotKey: 'cb1', label: 'CB', pos: 'DEF', x: 0.36, y: 0.76 },
    { slotKey: 'cb2', label: 'CB', pos: 'DEF', x: 0.64, y: 0.76 },
    { slotKey: 'rb', label: 'RB', pos: 'DEF', x: 0.86, y: 0.72 },
    { slotKey: 'cdm1', label: 'CDM', pos: 'MID', x: 0.38, y: 0.58 },
    { slotKey: 'cdm2', label: 'CDM', pos: 'MID', x: 0.62, y: 0.58 },
    { slotKey: 'lw', label: 'LW', pos: 'FWD', x: 0.18, y: 0.3 },
    { slotKey: 'cam', label: 'CAM', pos: 'MID', x: 0.5, y: 0.32 },
    { slotKey: 'rw', label: 'RW', pos: 'FWD', x: 0.82, y: 0.3 },
    { slotKey: 'st', label: 'ST', pos: 'FWD', x: 0.5, y: 0.12 },
  ],
  '3-5-2': [
    { slotKey: 'gk', label: 'GK', pos: 'GK', x: 0.5, y: 0.92 },
    { slotKey: 'cb1', label: 'CB', pos: 'DEF', x: 0.3, y: 0.76 },
    { slotKey: 'cb2', label: 'CB', pos: 'DEF', x: 0.5, y: 0.79 },
    { slotKey: 'cb3', label: 'CB', pos: 'DEF', x: 0.7, y: 0.76 },
    { slotKey: 'lwb', label: 'LWB', pos: 'DEF', x: 0.1, y: 0.5 },
    { slotKey: 'cm1', label: 'CM', pos: 'MID', x: 0.35, y: 0.48 },
    { slotKey: 'cm2', label: 'CM', pos: 'MID', x: 0.5, y: 0.52 },
    { slotKey: 'cm3', label: 'CM', pos: 'MID', x: 0.65, y: 0.48 },
    { slotKey: 'rwb', label: 'RWB', pos: 'DEF', x: 0.9, y: 0.5 },
    { slotKey: 'st1', label: 'ST', pos: 'FWD', x: 0.38, y: 0.16 },
    { slotKey: 'st2', label: 'ST', pos: 'FWD', x: 0.62, y: 0.16 },
  ],
};

export const FORMATION_IDS: FormationId[] = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2'];
export const MAX_CALL_UPS = 23;
