import dayjs from "dayjs";
import "dayjs/locale/uz";

dayjs.locale("uz");

// ─── PUL ─────────────────────────────────────────────────────────────────────
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "—";
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
};

export const formatMillions = (amount) => {
  if (!amount && amount !== 0) return "—";
  return `${(amount / 1_000_000).toFixed(1)} mln`;
};

// ─── SANA ─────────────────────────────────────────────────────────────────────
export const formatDate = (date) => {
  if (!date) return "—";
  return dayjs(date).format("DD.MM.YYYY");
};

export const formatDateTime = (date) => {
  if (!date) return "—";
  return dayjs(date).format("DD.MM.YYYY HH:mm");
};

export const formatTime = (date) => {
  if (!date) return "—";
  return dayjs(date).format("HH:mm");
};

export const formatRelative = (date) => {
  if (!date) return "—";
  const diff = dayjs().diff(dayjs(date), "day");
  if (diff === 0) return "Bugun";
  if (diff === 1) return "Kecha";
  return `${diff} kun oldin`;
};

// ─── FOIZ ─────────────────────────────────────────────────────────────────────
export const formatPercent = (value, total) => {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
};

// ─── DAQIQA → SOAT:DAQIQA ────────────────────────────────────────────────────
export const formatMinutes = (minutes) => {
  if (!minutes) return "0 daq";
  if (minutes < 60) return `${minutes} daq`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}s ${m}d` : `${h} soat`;
};

// ─── OBUNA KUNLAR ─────────────────────────────────────────────────────────────
export const getDaysLeft = (endDate) => {
  if (!endDate) return null;
  return dayjs(endDate).diff(dayjs(), "day");
};

export const getSubStatus = (endDate, isActive) => {
  if (!isActive) return "expired";
  const days = getDaysLeft(endDate);
  if (days < 0)  return "expired";
  if (days <= 7) return "critical";
  if (days <= 30) return "warning";
  return "active";
};

// ─── ISM BOSH HARFLARI ────────────────────────────────────────────────────────
export const getInitials = (fullName) => {
  if (!fullName) return "?";
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
};

// ─── TELEFON ──────────────────────────────────────────────────────────────────
export const formatPhone = (phone) => {
  if (!phone) return "—";
  return phone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
};