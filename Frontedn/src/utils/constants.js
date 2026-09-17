// ─── ROLLAR ───────────────────────────────────────────────────────────────────
export const ROLES = {
  SUPERADMIN:   "superadmin",
  FOUNDER:      "founder",
  DIRECTOR:     "director",
  CENTER_ADMIN: "center_admin",
  TEACHER:      "teacher",
  STUDENT:      "student",
};

export const ROLE_META = {
  superadmin:   { label: "Super Admin",       color: "#f59e0b", bg: "rgba(245,158,11,0.12)",   icon: "👑", redirectTo: "/superadmin/dashboard" },
  founder:      { label: "Ta'sischi",         color: "#a855f7", bg: "rgba(168,85,247,0.12)",   icon: "🏛", redirectTo: "/founder/dashboard"    },
  director:     { label: "Direktor",          color: "#6366f1", bg: "rgba(99,102,241,0.12)",   icon: "📋", redirectTo: "/director/dashboard"   },
  center_admin: { label: "Texnikum Admini",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)",   icon: "🎓", redirectTo: "/admin/dashboard"      },
  teacher:      { label: "O'qituvchi",        color: "#10b981", bg: "rgba(16,185,129,0.12)",   icon: "📚", redirectTo: "/teacher/dashboard"    },
  student:      { label: "Talaba",            color: "#06b6d4", bg: "rgba(6,182,212,0.12)",    icon: "🎒", redirectTo: "/student/dashboard"    },
};

// ─── DAVOMAT HOLATLARI ────────────────────────────────────────────────────────
export const ATT_STATUS = {
  present: { label: "Keldi",      color: "#10b981", bg: "rgba(16,185,129,0.10)", emoji: "✅" },
  late:    { label: "Kechikdi",   color: "#f59e0b", bg: "rgba(245,158,11,0.10)", emoji: "⏱"  },
  absent:  { label: "Kelmadi",    color: "#ef4444", bg: "rgba(239,68,68,0.10)",  emoji: "❌" },
  excused: { label: "Sababli",    color: "#6366f1", bg: "rgba(99,102,241,0.10)", emoji: "📋" },
  vacation:{ label: "Ta'tilda",   color: "#8b5cf6", bg: "rgba(139,92,246,0.10)", emoji: "🏖" },
  sick:    { label: "Kasal",      color: "#f97316", bg: "rgba(249,115,22,0.10)", emoji: "🤒" },
};

// ─── OYLIK HOLATLARI ──────────────────────────────────────────────────────────
export const PAYROLL_STATUS = {
  draft:    { label: "Kutilmoqda",  color: "#f59e0b", bg: "rgba(245,158,11,0.10)"  },
  approved: { label: "Tasdiqlandi", color: "#10b981", bg: "rgba(16,185,129,0.10)"  },
  paid:     { label: "To'landi",    color: "#6366f1", bg: "rgba(99,102,241,0.10)"  },
  rejected: { label: "Rad etildi",  color: "#ef4444", bg: "rgba(239,68,68,0.10)"   },
};

// ─── TO'LOV USULLARI ──────────────────────────────────────────────────────────
export const PAYMENT_METHODS = {
  cash:     { label: "Naqd",       color: "#10b981" },
  card:     { label: "Karta",      color: "#3b82f6" },
  transfer: { label: "O'tkazma",   color: "#8b5cf6" },
  online:   { label: "Online",     color: "#f59e0b" },
};

// ─── XARAJAT KATEGORIYALARI ───────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = {
  rent:      { label: "Ijara",               color: "#6366f1", emoji: "🏢" },
  utilities: { label: "Kommunal xizmatlar",  color: "#3b82f6", emoji: "💡" },
  equipment: { label: "Jihozlar",            color: "#f59e0b", emoji: "🖥"  },
  marketing: { label: "Reklama",             color: "#ec4899", emoji: "📣" },
  education: { label: "O'quv materiallari",  color: "#10b981", emoji: "📚" },
  transport: { label: "Transport",           color: "#8b5cf6", emoji: "🚗" },
  salary:    { label: "Maosh",               color: "#ef4444", emoji: "💰" },
  other:     { label: "Boshqa",              color: "#94a3b8", emoji: "📦" },
};

// ─── OBUNA HOLATLARI ──────────────────────────────────────────────────────────
export const SUB_STATUS = {
  active:   { label: "Aktiv",             color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  warning:  { label: "⚠ Tugayapti",      color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  critical: { label: "🔴 Kritik",         color: "#ef4444", bg: "rgba(239,68,68,0.10)"  },
  expired:  { label: "Muddati o'tgan",    color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
};

// ─── MENYULAR (har bir rol uchun) ─────────────────────────────────────────────
export const SIDEBAR_MENUS = {
  superadmin: [
    { key: "/superadmin/dashboard",   label: "Bosh sahifa",         icon: "🌐" },
    { key: "/superadmin/texnikumlar", label: "Markazlar",         icon: "🏛" },
    { key: "/superadmin/saas",        label: "SaaS / Obuna",        icon: "🔑" },
    { key: "/superadmin/users",       label: "Foydalanuvchilar",    icon: "👥" },
    { key: "/superadmin/logs",        label: "Audit loglar",        icon: "📋" },
    { key: "/superadmin/settings",    label: "Sozlamalar",          icon: "⚙️"  },
  ],
  founder: [
    { key: "/founder/dashboard",      label: "Bosh sahifa",         icon: "📊" },
    { key: "/founder/hr",             label: "HR & Xodimlar",       icon: "👥" },
    { key: "/founder/finance",        label: "Moliya",              icon: "💰" },
    { key: "/founder/attendance",     label: "Davomat nazorati",    icon: "📅" },
    { key: "/founder/logs",           label: "Harakat jurnali",     icon: "📋" },
  ],
  director: [
    { key: "/director/dashboard",     label: "Bosh sahifa",         icon: "📊" },
    { key: "/director/employees",     label: "Xodimlar",            icon: "👥" },
    { key: "/director/attendance",    label: "Davomat",             icon: "📅" },
    { key: "/director/payroll",       label: "Oylik maosh",         icon: "💰" },
    { key: "/director/expenses",      label: "Xarajatlar",          icon: "📊" },
    { key: "/director/announcements", label: "E'lonlar",            icon: "🔔" },
  ],
  center_admin: [
    { key: "/admin/dashboard",        label: "Bosh sahifa",         icon: "📊" },
    { key: "/admin/groups",           label: "Guruhlar",            icon: "📚" },
    { key: "/admin/students",         label: "Talabalar",           icon: "🎓" },
    { key: "/admin/live-attendance",  label: "Jonli davomat",       icon: "🔴" },
    { key: "/admin/payments",         label: "To'lovlar",           icon: "💳" },
    { key: "/admin/announcements",    label: "E'lonlar",            icon: "🔔" },
  ],
  teacher: [
    { key: "/teacher/dashboard",      label: "Bosh sahifa",         icon: "📊" },
    { key: "/teacher/my-attendance",  label: "Mening davomatim",    icon: "📅" },
    { key: "/teacher/lessons",        label: "Darslarim",           icon: "📖" },
    { key: "/teacher/groups",         label: "Guruhlarim",          icon: "👥" },
  ],
  student: [
    { key: "/student/dashboard",      label: "Bosh sahifa",         icon: "🏠" },
    { key: "/student/attendance",     label: "Davomatim",           icon: "📅" },
    { key: "/student/grades",         label: "Baholarim",           icon: "📊" },
    { key: "/student/schedule",       label: "Dars jadvali",        icon: "🕐" },
    { key: "/student/payments",       label: "To'lovlar",           icon: "💳" },
  ],
};