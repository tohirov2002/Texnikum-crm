// ── Rollar ────────────────────────────────────────────────────────────────────
export const ROLES = {
  SUPERADMIN:   'superadmin',
  FOUNDER:      'founder',
  DIRECTOR:     'director',
  CENTER_ADMIN: 'center_admin',
  TEACHER:      'teacher',
  STUDENT:      'student',
};

// ── Rol → Home route ──────────────────────────────────────────────────────────
export const ROLE_HOME = {
  superadmin:   '/(tabs)/founder/',
  founder:      '/(tabs)/founder/',
  director:     '/(tabs)/director/',
  center_admin: '/(tabs)/admin/',
  teacher:      '/(tabs)/teacher/',
  student:      '/(tabs)/student/',
};

// ── Davomat statuslar ─────────────────────────────────────────────────────────
export const ATT_STATUS = {
  present: { labelKey: 'present', color: '#10b981', bg: 'rgba(16,185,129,0.12)', emoji: '✅' },
  late:    { labelKey: 'late',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', emoji: '⏱'  },
  absent:  { labelKey: 'absent',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)', emoji: '❌' },
  excused: { labelKey: 'excused', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', emoji: '📋' },
};

// ── Rang palette ──────────────────────────────────────────────────────────────
export const COLORS = {
  brand:   '#6366f1',
  brand2:  '#8b5cf6',
  green:   '#10b981',
  yellow:  '#f59e0b',
  red:     '#ef4444',
  blue:    '#3b82f6',
};

// ── Tillar ────────────────────────────────────────────────────────────────────
export const LANGUAGES = [
  { code: 'uz', label: "O'zbek",  flag: '🇺🇿', native: "O'zbek"  },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', native: 'Русский' },
  { code: 'en', label: 'English', flag: '🇬🇧', native: 'English' },
];
