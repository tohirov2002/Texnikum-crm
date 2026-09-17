export const fmt   = (n) => `${(n || 0).toLocaleString('uz-UZ')} so'm`;
export const fmtK  = (n) => {
  if (!n) return '0';
  if (n >= 1_000_000_000) return `${(n/1e9).toFixed(1)} mlrd`;
  if (n >= 1_000_000)     return `${(n/1e6).toFixed(1)} mln`;
  if (n >= 1_000)         return `${(n/1e3).toFixed(0)} ming`;
  return String(n);
};

export const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('uz-UZ', { day:'2-digit', month:'2-digit', year:'numeric' });
};

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const fmtPhone = (p) => {
  if (!p) return '—';
  const d = p.replace(/\D/g, '');
  if (d.length === 12)
    return `+${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5,8)}-${d.slice(8,10)}-${d.slice(10)}`;
  return p;
};

export const initials = (name) =>
  (name || '?').split(' ').map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
