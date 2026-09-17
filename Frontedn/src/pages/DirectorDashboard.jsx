import { useState } from "react";

// ─── SVG IKONLAR ─────────────────────────────────────────────────────────────
const Ico = ({ d, s = 16, sw = 1.8, fill = "none" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const IC = {
  users:    ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z","M23 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75"],
  clock:    ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 6v6l4 2"],
  check:    "M20 6L9 17l-5-5",
  x:        "M18 6L6 18M6 6l12 12",
  alert:    ["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"],
  dollar:   "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  trend_up: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  chart:    ["M18 20V10","M12 20V4","M6 20v-6"],
  plus:     "M12 5v14M5 12h14",
  search:   ["M11 4a7 7 0 1 0 0 14A7 7 0 0 0 11 4z","M21 21l-4.35-4.35"],
  pin:      ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z","M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  calendar: ["M8 2v4","M16 2v4","M3 10h18","M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"],
  edit:     ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  save:     ["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z","M17 21v-8H7v8","M7 3v5h8"],
  close:    "M18 6L6 18M6 6l12 12",
  chevron:  "M6 9l6 6 6-6",
  receipt:  ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"],
  bell:     ["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"],
  eye:      ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  approve:  ["M22 11.08V12a10 10 0 1 1-5.93-9.14","M22 4L12 14.01l-3-3"],
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const TODAY_ATT = [
  { id:1,  name:"Akbar Toshmatov",   pos:"Dasturchi",      time:"07:58", late:0,  status:"present", dept:"IT" },
  { id:2,  name:"Dilnoza Yusupova",  pos:"Buxgalter",      time:"08:17", late:17, status:"late",    dept:"Moliya" },
  { id:3,  name:"Jasur Rahimov",     pos:"O'qituvchi",     time:"—",     late:0,  status:"absent",  dept:"O'quv" },
  { id:4,  name:"Malika Karimova",   pos:"HR mutaxassisi",  time:"07:55", late:0,  status:"present", dept:"HR" },
  { id:5,  name:"Sherzod Nazarov",   pos:"Tizim admin",    time:"08:31", late:31, status:"late",    dept:"IT" },
  { id:6,  name:"Nodira Hamidova",   pos:"O'qituvchi",     time:"08:01", late:1,  status:"present", dept:"O'quv" },
  { id:7,  name:"Bobur Tursunov",    pos:"Laborant",       time:"—",     late:0,  status:"absent",  dept:"Lab" },
  { id:8,  name:"Gulnora Mirzaeva",  pos:"O'qituvchi",     time:"07:50", late:0,  status:"present", dept:"O'quv" },
  { id:9,  name:"Kamol Yusupov",     pos:"Xavfsizlik",     time:"08:05", late:5,  status:"late",    dept:"Xizmat" },
  { id:10, name:"Sarvar Qodirov",    pos:"Dasturchi",      time:"07:48", late:0,  status:"present", dept:"IT" },
  { id:11, name:"Maftuna Aliyeva",   pos:"Kotib",          time:"—",     late:0,  status:"vacation",dept:"HR" },
  { id:12, name:"Ulmas Ergashev",    pos:"O'qituvchi",     time:"08:03", late:3,  status:"present", dept:"O'quv" },
];

const EXPENSES = [
  { id:1, title:"Ijara",          cat:"rent",      amount:8500000, date:"2025-02-01", by:"Direktor" },
  { id:2, title:"Elektr va gaz",  cat:"utilities", amount:1240000, date:"2025-02-05", by:"Direktor" },
  { id:3, title:"Proyektor x2",   cat:"equipment", amount:4800000, date:"2025-02-10", by:"Direktor" },
  { id:4, title:"Reklama (SMM)",  cat:"marketing", amount:900000,  date:"2025-02-12", by:"Direktor" },
  { id:5, title:"Darslik va qog'oz",cat:"education",amount:620000, date:"2025-02-14", by:"Admin" },
  { id:6, title:"Transport",      cat:"transport", amount:380000,  date:"2025-02-18", by:"Direktor" },
];

const PAYROLLS = [
  { id:1, name:"Akbar Toshmatov",  base:3500000, late_min:0,  penalty:0,      bonus:200000, net:3700000, status:"draft" },
  { id:2, name:"Dilnoza Yusupova", base:2800000, late_min:17, penalty:39583,  bonus:0,      net:2760417, status:"draft" },
  { id:3, name:"Malika Karimova",  base:2500000, late_min:0,  penalty:0,      bonus:150000, net:2650000, status:"approved" },
  { id:4, name:"Sherzod Nazarov",  base:3000000, late_min:31, penalty:72083,  bonus:0,      net:2927917, status:"draft" },
  { id:5, name:"Gulnora Mirzaeva", base:2200000, late_min:0,  penalty:0,      bonus:0,      net:2200000, status:"approved" },
  { id:6, name:"Sarvar Qodirov",   base:3800000, late_min:0,  penalty:0,      bonus:300000, net:4100000, status:"paid" },
];

const MONTHLY_CHART = [
  { m:"Yan", income:38200000, expense:14100000 },
  { m:"Feb", income:42100000, expense:16400000 },
  { m:"Mar", income:39800000, expense:15200000 },
  { m:"Apr", income:51300000, expense:18700000 },
  { m:"May", income:48600000, expense:17300000 },
  { m:"Iyn", income:55400000, expense:19800000 },
];

const DEPT_ATT = [
  { dept:"IT",     total:4, present:3, pct:75 },
  { dept:"O'quv",  total:4, present:3, pct:75 },
  { dept:"Moliya", total:2, present:1, pct:50 },
  { dept:"HR",     total:2, present:1, pct:50 },
  { dept:"Lab",    total:2, present:1, pct:50 },
  { dept:"Xizmat", total:2, present:2, pct:100 },
];

const CAT_META = {
  rent:      { label:"Ijara",          color:"#6366f1", emoji:"🏢" },
  utilities: { label:"Kommunal",       color:"#3b82f6", emoji:"💡" },
  equipment: { label:"Jihozlar",       color:"#f59e0b", emoji:"🖥" },
  marketing: { label:"Reklama",        color:"#ec4899", emoji:"📣" },
  education: { label:"O'quv materiallari", color:"#10b981", emoji:"📚" },
  transport: { label:"Transport",      color:"#8b5cf6", emoji:"🚗" },
  salary:    { label:"Maosh",          color:"#ef4444", emoji:"💰" },
  other:     { label:"Boshqa",         color:"#94a3b8", emoji:"📦" },
};

const STATUS_META = {
  present:  { label:"Keldi",        bg:"rgba(16,185,129,0.10)",  text:"#10b981", dot:"#10b981" },
  late:     { label:"Kechikdi",     bg:"rgba(245,158,11,0.10)",  text:"#f59e0b", dot:"#f59e0b" },
  absent:   { label:"Kelmadi",      bg:"rgba(239,68,68,0.10)",   text:"#ef4444", dot:"#ef4444" },
  vacation: { label:"Ta'tilda",     bg:"rgba(99,102,241,0.10)",  text:"#6366f1", dot:"#6366f1" },
};

const PAY_META = {
  draft:    { label:"Kutilmoqda",   bg:"rgba(245,158,11,0.10)",  text:"#f59e0b" },
  approved: { label:"Tasdiqlandi",  bg:"rgba(16,185,129,0.10)",  text:"#10b981" },
  paid:     { label:"To'landi",     bg:"rgba(99,102,241,0.10)",  text:"#6366f1" },
};

const fmt = (n) => n?.toLocaleString("uz-UZ") + " so'm";
const fmtM = (n) => `${(n / 1_000_000).toFixed(1)} mln`;

// ─────────────────────────────────────────────────────────────────────────────
//  KICHIK KOMPONENTLAR
// ─────────────────────────────────────────────────────────────────────────────
const Badge = ({ status, map }) => {
  const m = map[status] || {};
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: m.bg, color: m.text, whiteSpace: "nowrap",
    }}>{m.label}</span>
  );
};

const Ring = ({ pct, color = "#6366f1", size = 72 }) => {
  const r = 28, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7"/>
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
        strokeLinecap="round" transform="rotate(-90 36 36)"
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }}/>
      <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>{pct}%</text>
    </svg>
  );
};

// SVG Bar Chart
const BarChart = ({ data }) => {
  const W = 480, H = 140, pad = 36, barW = 28, gap = 4;
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]));
  const cols = ["#6366f1", "#f1f5f9"];
  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: "100%", overflow: "visible" }}>
      {data.map((d, i) => {
        const x = pad + i * ((barW * 2 + gap + 18));
        const ih = (d.income / maxVal) * H;
        const eh = (d.expense / maxVal) * H;
        return (
          <g key={i}>
            {/* Income bar */}
            <rect x={x} y={H - ih} width={barW} height={ih} rx={5} fill="#6366f1" opacity="0.9"/>
            {/* Expense bar */}
            <rect x={x + barW + gap} y={H - eh} width={barW} height={eh} rx={5} fill="#f1a1a1" opacity="0.85"/>
            {/* Label */}
            <text x={x + barW + gap/2} y={H + 18} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">{d.m}</text>
          </g>
        );
      })}
      {/* Legend */}
      <rect x={W - 140} y={4} width={10} height={10} rx={3} fill="#6366f1"/>
      <text x={W - 125} y={13} fontSize="10" fill="#64748b" fontWeight="600">Tushum</text>
      <rect x={W - 70} y={4} width={10} height={10} rx={3} fill="#f1a1a1"/>
      <text x={W - 55} y={13} fontSize="10" fill="#64748b" fontWeight="600">Xarajat</text>
    </svg>
  );
};

// Modal wrapper
const Modal = ({ onClose, children, width = 520 }) => (
  <div onClick={onClose} style={{
    position:"fixed", inset:0, background:"rgba(15,15,35,0.60)",
    backdropFilter:"blur(6px)", zIndex:1000,
    display:"flex", alignItems:"center", justifyContent:"center", padding:20,
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      background:"#fff", borderRadius:24, padding:"32px 36px",
      width:"100%", maxWidth:width, maxHeight:"90vh", overflowY:"auto",
      boxShadow:"0 40px 80px rgba(0,0,0,0.25)",
    }}>
      {children}
    </div>
  </div>
);

// Inputlar helper
const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#64748b", letterSpacing:0.5, marginBottom:6 }}>
      {label.toUpperCase()}
    </label>
    {children}
  </div>
);
const Inp = ({ value, onChange, placeholder, type="text" }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{
      width:"100%", padding:"10px 14px", borderRadius:10, boxSizing:"border-box",
      border:"1.5px solid #eef0f6", fontSize:14, color:"#1e1e3a",
      background:"#f8fafc", outline:"none", transition:"border-color 0.2s",
    }}
    onFocus={e => e.target.style.borderColor="#6366f1"}
    onBlur={e => e.target.style.borderColor="#eef0f6"}
  />
);
const Sel = ({ value, onChange, children }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{
    width:"100%", padding:"10px 14px", borderRadius:10, boxSizing:"border-box",
    border:"1.5px solid #eef0f6", fontSize:14, color:"#1e1e3a",
    background:"#f8fafc", outline:"none", appearance:"none",
  }}>
    {children}
  </select>
);

// ─────────────────────────────────────────────────────────────────────────────
//  MANUAL DAVOMAT MODALI
// ─────────────────────────────────────────────────────────────────────────────
function ManualAttModal({ onClose }) {
  const [emp,  setEmp]  = useState("");
  const [arr,  setArr]  = useState("08:00");
  const [dep,  setDep]  = useState("17:00");
  const [note, setNote] = useState("");
  return (
    <Modal onClose={onClose}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:26 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#1e1e3a" }}>Qo'lda davomat kiritish</div>
          <div style={{ color:"#94a3b8", fontSize:13, marginTop:3 }}>GPS ishlamagan yoki unuta qolgan xodim uchun</div>
        </div>
        <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:10, padding:"8px 10px", cursor:"pointer" }}>
          <Ico d={IC.close} s={16} />
        </button>
      </div>
      <Field label="Xodim">
        <Sel value={emp} onChange={setEmp}>
          <option value="">— Tanlang —</option>
          {TODAY_ATT.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Sel>
      </Field>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Field label="Kelish vaqti"><Inp type="time" value={arr} onChange={setArr} /></Field>
        <Field label="Ketish vaqti"><Inp type="time" value={dep} onChange={setDep} /></Field>
      </div>
      <Field label="Izoh (ixtiyoriy)">
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Sabab..."
          style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #eef0f6", fontSize:14, resize:"none", height:72, boxSizing:"border-box", background:"#f8fafc", outline:"none" }}/>
      </Field>
      <div style={{ display:"flex", gap:10, marginTop:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid #eef0f6", background:"#f8fafc", color:"#64748b", fontSize:14, fontWeight:700, cursor:"pointer" }}>
          Bekor
        </button>
        <button onClick={onClose} style={{ flex:2, padding:"12px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 16px rgba(99,102,241,0.35)" }}>
          <Ico d={IC.save} s={14} /> Saqlash
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  XARAJAT KIRITISH MODALI
// ─────────────────────────────────────────────────────────────────────────────
function AddExpenseModal({ onClose, onAdd }) {
  const [title,  setTitle]  = useState("");
  const [cat,    setCat]    = useState("other");
  const [amount, setAmount] = useState("");
  const [date,   setDate]   = useState(new Date().toISOString().slice(0,10));
  return (
    <Modal onClose={onClose}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:26 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#1e1e3a" }}>Xarajat kiritish</div>
          <div style={{ color:"#94a3b8", fontSize:13, marginTop:3 }}>Yangi xarajat yozuvi</div>
        </div>
        <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:10, padding:"8px 10px", cursor:"pointer" }}>
          <Ico d={IC.close} s={16} />
        </button>
      </div>
      <Field label="Sarlavha"><Inp value={title} onChange={setTitle} placeholder="Xarajat nomi" /></Field>
      <Field label="Kategoriya">
        <Sel value={cat} onChange={setCat}>
          {Object.entries(CAT_META).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
        </Sel>
      </Field>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Field label="Summa (so'm)"><Inp type="number" value={amount} onChange={setAmount} placeholder="0" /></Field>
        <Field label="Sana"><Inp type="date" value={date} onChange={setDate} /></Field>
      </div>
      <div style={{ display:"flex", gap:10, marginTop:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid #eef0f6", background:"#f8fafc", color:"#64748b", fontSize:14, fontWeight:700, cursor:"pointer" }}>
          Bekor
        </button>
        <button onClick={() => { onAdd({ title, cat, amount: Number(amount), date }); onClose(); }} style={{ flex:2, padding:"12px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#f59e0b,#d97706)", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 16px rgba(245,158,11,0.35)" }}>
          💸 Kiritish
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  OYLIK TASDIQLASH MODALI
// ─────────────────────────────────────────────────────────────────────────────
function ApprovePayrollModal({ payroll, onClose, onApprove }) {
  const [note, setNote] = useState("");
  if (!payroll) return null;
  return (
    <Modal onClose={onClose} width={460}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:19, fontWeight:800, color:"#1e1e3a" }}>Oylikni tasdiqlash</div>
          <div style={{ color:"#6366f1", fontSize:14, fontWeight:600, marginTop:3 }}>{payroll.name}</div>
        </div>
        <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:10, padding:"8px 10px", cursor:"pointer" }}>
          <Ico d={IC.close} s={16} />
        </button>
      </div>
      {/* Qisqacha */}
      <div style={{ background:"#f8fafc", borderRadius:14, padding:"18px", marginBottom:20 }}>
        {[
          { l:"Asosiy maosh",   v: fmt(payroll.base),    c:"#1e1e3a" },
          { l:"Kechikish",      v:`${payroll.late_min} daqiqa`, c:"#f59e0b" },
          { l:"Jarima",         v:`–${fmt(payroll.penalty)}`,  c:"#ef4444" },
          { l:"Bonus",          v:`+${fmt(payroll.bonus)}`,    c:"#10b981" },
        ].map((r,i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom: i<3 ? "1px solid #eef0f6":"none" }}>
            <span style={{ fontSize:13, color:"#64748b" }}>{r.l}</span>
            <span style={{ fontSize:13, fontWeight:700, color:r.c }}>{r.v}</span>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px", background:"rgba(16,185,129,0.07)", borderRadius:12, border:"1px solid rgba(16,185,129,0.2)", marginBottom:20 }}>
        <span style={{ fontSize:14, fontWeight:700, color:"#1e1e3a" }}>Net maosh</span>
        <span style={{ fontSize:22, fontWeight:900, color:"#10b981" }}>{fmt(payroll.net)}</span>
      </div>
      <Field label="Izoh">
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Ixtiyoriy izoh..." rows={3}
          style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #eef0f6", fontSize:14, resize:"none", boxSizing:"border-box", background:"#f8fafc", outline:"none" }}/>
      </Field>
      <div style={{ display:"flex", gap:10, marginTop:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid #eef0f6", background:"#f8fafc", color:"#64748b", fontSize:14, fontWeight:700, cursor:"pointer" }}>
          Bekor
        </button>
        <button onClick={() => { onApprove(payroll.id); onClose(); }} style={{ flex:2, padding:"12px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#10b981,#059669)", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, boxShadow:"0 4px 16px rgba(16,185,129,0.35)" }}>
          <Ico d={IC.approve} s={16} /> Tasdiqlash
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ASOSIY SAHIFA
// ─────────────────────────────────────────────────────────────────────────────
export default function DirectorDashboard() {
  const [tab,           setTab]           = useState("dashboard");
  const [manualModal,   setManualModal]   = useState(false);
  const [expModal,      setExpModal]      = useState(false);
  const [payModal,      setPayModal]      = useState(null);
  const [attSearch,     setAttSearch]     = useState("");
  const [attFilter,     setAttFilter]     = useState("all");
  const [expenses,      setExpenses]      = useState(EXPENSES);
  const [payrolls,      setPayrolls]      = useState(PAYROLLS);

  const totalEmp   = TODAY_ATT.length;
  const present    = TODAY_ATT.filter(e => e.status === "present").length;
  const late       = TODAY_ATT.filter(e => e.status === "late").length;
  const absent     = TODAY_ATT.filter(e => e.status === "absent").length;
  const vacation   = TODAY_ATT.filter(e => e.status === "vacation").length;
  const attPct     = Math.round((present + late) / totalEmp * 100);

  const totalExp   = expenses.reduce((s, e) => s + e.amount, 0);
  const netPayroll = payrolls.reduce((s, p) => s + p.net, 0);
  const monthIncome = 42100000;
  const netProfit  = monthIncome - totalExp - netPayroll;

  const filteredAtt = TODAY_ATT.filter(e => {
    const matchS = e.name.toLowerCase().includes(attSearch.toLowerCase()) || e.dept.toLowerCase().includes(attSearch.toLowerCase());
    const matchF = attFilter === "all" || e.status === attFilter;
    return matchS && matchF;
  });

  const handleApprove = (id) => setPayrolls(prev => prev.map(p => p.id === id ? { ...p, status:"approved" } : p));
  const handleAddExp  = (exp) => setExpenses(prev => [{ id: prev.length+1, ...exp, by:"Direktor" }, ...prev]);

  const TABS = [
    { key:"dashboard",  label:"Bosh sahifa",   icon:<Ico d={IC.chart} s={14}/> },
    { key:"attendance", label:"Davomat",        icon:<Ico d={IC.clock} s={14}/> },
    { key:"payroll",    label:"Oylik maosh",    icon:<Ico d={IC.dollar} s={14}/> },
    { key:"expenses",   label:"Xarajatlar",     icon:<Ico d={IC.receipt} s={14}/> },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f4f5f9", fontFamily:"'Plus Jakarta Sans','Inter',sans-serif" }}>

      {/* ── NAVBAR ── */}
      <div style={{
        background:"#0c0c1d", height:60, padding:"0 28px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        borderBottom:"1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:"#fff" }}>MT</div>
          <div>
            <span style={{ color:"#fff", fontWeight:700, fontSize:14 }}>Toshkent Texnikumi</span>
            <span style={{ color:"rgba(255,255,255,0.3)", fontSize:12, marginLeft:8 }}>Direktor paneli</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ position:"relative" }}>
            <button style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:10, padding:"6px 10px", cursor:"pointer", color:"rgba(255,255,255,0.7)", fontSize:15 }}>
              🔔
            </button>
            <div style={{ position:"absolute", top:-4, right:-4, width:16, height:16, borderRadius:"50%", background:"#ef4444", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:"#fff", border:"2px solid #0c0c1d" }}>2</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 12px 5px 6px", borderRadius:10, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.10)", cursor:"pointer" }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#fff" }}>D</div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#fff", lineHeight:1.2 }}>Direktor</div>
              <div style={{ fontSize:10, color:"#6366f1", fontWeight:600 }}>Bosh sahifa</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #eef0f6", padding:"0 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding:"16px 18px", display:"flex", alignItems:"center", gap:7,
              background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
              color: tab === t.key ? "#6366f1" : "#64748b",
              borderBottom: tab === t.key ? "2.5px solid #6366f1" : "2.5px solid transparent",
              transition:"all 0.15s",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => setManualModal(true)} style={{
            display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:10,
            border:"1.5px solid #eef0f6", background:"#f8fafc", cursor:"pointer",
            fontSize:12, fontWeight:700, color:"#6366f1",
          }}>
            <Ico d={IC.calendar} s={13}/> Qo'lda davomat
          </button>
          <button onClick={() => setExpModal(true)} style={{
            display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:10,
            border:"none", background:"linear-gradient(135deg,#f59e0b,#d97706)", cursor:"pointer",
            fontSize:12, fontWeight:700, color:"#fff",
            boxShadow:"0 3px 12px rgba(245,158,11,0.35)",
          }}>
            <Ico d={IC.plus} s={13}/> Xarajat
          </button>
        </div>
      </div>

      {/* ── KONTENT ── */}
      <div style={{ padding:"24px 28px" }}>

        {/* ════ DASHBOARD TAB ════ */}
        {tab === "dashboard" && (<>

          {/* Welcome banner */}
          <div style={{
            background:"linear-gradient(135deg,#1e1e3a 0%,#312e81 100%)",
            borderRadius:20, padding:"24px 32px", marginBottom:22,
            display:"flex", justifyContent:"space-between", alignItems:"center",
            boxShadow:"0 8px 32px rgba(99,102,241,0.22)", position:"relative", overflow:"hidden",
          }}>
            {[{r:-10,t:-10,w:160,c:"rgba(99,102,241,0.15)"},{r:60,t:"auto",b:-30,w:100,c:"rgba(139,92,246,0.12)"}].map((g,i)=>(
              <div key={i} style={{ position:"absolute", right:g.r, top:g.t, bottom:g.b, width:g.w, height:g.w, borderRadius:"50%", background:g.c, pointerEvents:"none"}}/>
            ))}
            <div style={{ zIndex:1 }}>
              <div style={{ color:"rgba(255,255,255,0.55)", fontSize:13, marginBottom:5 }}>Xush kelibsiz 👋</div>
              <div style={{ color:"#fff", fontSize:26, fontWeight:900, letterSpacing:-0.8, marginBottom:3 }}>
                {new Date().toLocaleDateString("uz-UZ",{ weekday:"long", day:"numeric", month:"long" })}
              </div>
              <div style={{ color:"rgba(255,255,255,0.40)", fontSize:13 }}>Bugungi holat — Toshkent Texnikumi</div>
            </div>
            <div style={{ display:"flex", gap:12, zIndex:1 }}>
              {[
                { l:"Keldi",    v:present,  c:"#6ee7b7", bg:"rgba(16,185,129,0.15)" },
                { l:"Kechikdi", v:late,     c:"#fcd34d", bg:"rgba(245,158,11,0.15)" },
                { l:"Kelmadi",  v:absent,   c:"#fca5a5", bg:"rgba(239,68,68,0.15)"  },
              ].map((s,i)=>(
                <div key={i} style={{ textAlign:"center", padding:"14px 20px", borderRadius:14, background:s.bg, backdropFilter:"blur(8px)", border:`1px solid ${s.c}30` }}>
                  <div style={{ fontSize:28, fontWeight:900, color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:3, fontWeight:600 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stat kartalar */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:22 }}>
            {[
              { l:"Jami xodimlar",  v:totalEmp,       sub:`${vacation} ta'tilda`,      c:"#6366f1", icon:<Ico d={IC.users} s={20}/> },
              { l:"Davomat foizi",  v:`${attPct}%`,   sub:`${present+late}/${totalEmp} xodim`,c:"#10b981",icon:<Ico d={IC.check} s={20}/> },
              { l:"Oylik xarajat",  v:fmtM(totalExp), sub:"Joriy oy",                  c:"#f59e0b", icon:<Ico d={IC.receipt} s={20}/> },
              { l:"Sof foyda",      v:fmtM(netProfit),sub:netProfit>0?"Ijobiy":"Salbiy",c:netProfit>0?"#10b981":"#ef4444",icon:<Ico d={IC.trend_up} s={20}/> },
            ].map((c,i)=>(
              <div key={i} style={{ background:"#fff", borderRadius:16, padding:"20px", border:"1px solid #eef0f6", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", right:-12, top:-12, width:80, height:80, borderRadius:"50%", background:`${c.c}0d` }}/>
                <div style={{ width:36, height:36, borderRadius:10, background:`${c.c}12`, display:"flex", alignItems:"center", justifyContent:"center", color:c.c, marginBottom:12 }}>{c.icon}</div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:0.5, marginBottom:5 }}>{c.l.toUpperCase()}</div>
                <div style={{ fontSize:26, fontWeight:900, color:"#1e1e3a", lineHeight:1, marginBottom:5 }}>{c.v}</div>
                <div style={{ fontSize:12, color:"#94a3b8" }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Grafik + Kechikishlar + Bo'limlar */}
          <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr", gap:20, marginBottom:20 }}>

            {/* Bar chart */}
            <div style={{ background:"#fff", borderRadius:18, padding:"22px 24px", border:"1px solid #eef0f6" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:"#1e1e3a" }}>Oylik moliya tahlili</div>
                  <div style={{ color:"#94a3b8", fontSize:12, marginTop:2 }}>So'nggi 6 oy · mln so'm</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>Bu oy tushum</div>
                  <div style={{ fontSize:18, fontWeight:900, color:"#6366f1" }}>{fmtM(monthIncome)}</div>
                </div>
              </div>
              <BarChart data={MONTHLY_CHART} />
            </div>

            {/* Bo'limlar davomat + Top kechikuvchilar */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Bugungi davomat halqalar */}
              <div style={{ background:"#fff", borderRadius:18, padding:"20px", border:"1px solid #eef0f6", flex:1 }}>
                <div style={{ fontSize:13, fontWeight:800, color:"#1e1e3a", marginBottom:16 }}>Bugungi umumiy</div>
                <div style={{ display:"flex", justifyContent:"space-around", alignItems:"center" }}>
                  <div style={{ textAlign:"center" }}>
                    <Ring pct={attPct} color="#6366f1" size={80}/>
                    <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, marginTop:6 }}>Umumiy</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {[
                      { l:"Keldi",    v:present,  c:"#10b981" },
                      { l:"Kechikdi", v:late,     c:"#f59e0b" },
                      { l:"Kelmadi",  v:absent,   c:"#ef4444" },
                      { l:"Ta'tilda", v:vacation, c:"#6366f1" },
                    ].map((s,i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:s.c, flexShrink:0 }}/>
                        <span style={{ fontSize:12, color:"#64748b", minWidth:60 }}>{s.l}</span>
                        <span style={{ fontSize:13, fontWeight:800, color:s.c }}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bo'limlar */}
              <div style={{ background:"#fff", borderRadius:18, padding:"20px", border:"1px solid #eef0f6" }}>
                <div style={{ fontSize:13, fontWeight:800, color:"#1e1e3a", marginBottom:14 }}>Bo'limlar bo'yicha</div>
                {DEPT_ATT.map((d,i)=>(
                  <div key={i} style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:12, color:"#64748b", fontWeight:500 }}>{d.dept}</span>
                      <span style={{ fontSize:12, fontWeight:700, color: d.pct>=75?"#10b981":d.pct>=50?"#f59e0b":"#ef4444" }}>{d.present}/{d.total}</span>
                    </div>
                    <div style={{ height:5, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${d.pct}%`, borderRadius:99, background: d.pct>=75?"#10b981":d.pct>=50?"#f59e0b":"#ef4444", transition:"width 0.6s" }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kechikuvchilar jadvali */}
          <div style={{ background:"#fff", borderRadius:18, border:"1px solid #eef0f6", overflow:"hidden" }}>
            <div style={{ padding:"18px 24px 14px", borderBottom:"1px solid #f4f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:"#1e1e3a" }}>Bugungi kechikuvchilar</div>
                <div style={{ color:"#94a3b8", fontSize:12, marginTop:2 }}>{late} ta xodim kechikdi</div>
              </div>
              <button onClick={() => setTab("attendance")} style={{ fontSize:12, color:"#6366f1", fontWeight:700, background:"none", border:"none", cursor:"pointer" }}>
                Hammasini ko'rish →
              </button>
            </div>
            {TODAY_ATT.filter(e => e.status === "late").length === 0 ? (
              <div style={{ padding:"30px", textAlign:"center", color:"#94a3b8" }}>Bugun hech kim kechmadi 🎉</div>
            ) : (
              TODAY_ATT.filter(e => e.status === "late").map((e, i, arr) => (
                <div key={e.id} style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"13px 24px", borderBottom: i < arr.length-1 ? "1px solid #f4f5f9" : "none",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:"rgba(245,158,11,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#f59e0b" }}>
                      {e.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#1e1e3a" }}>{e.name}</div>
                      <div style={{ fontSize:11, color:"#94a3b8", marginTop:1 }}>{e.pos} · {e.dept}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#1e1e3a" }}>Keldi: {e.time}</div>
                      <div style={{ fontSize:11, color:"#f59e0b", fontWeight:700 }}>+{e.late} daqiqa kech</div>
                    </div>
                    <div style={{ padding:"4px 12px", borderRadius:20, background:"rgba(239,68,68,0.08)", color:"#ef4444", fontSize:11, fontWeight:700 }}>
                      –{Math.round(e.late / 60 / 8 * 2800000 / 22).toLocaleString()} so'm
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>)}

        {/* ════ DAVOMAT TAB ════ */}
        {tab === "attendance" && (
          <div style={{ background:"#fff", borderRadius:18, border:"1px solid #eef0f6", overflow:"hidden" }}>
            {/* Toolbar */}
            <div style={{ padding:"18px 24px 14px", borderBottom:"1px solid #f4f5f9", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ position:"relative", flex:1, minWidth:200 }}>
                <div style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }}><Ico d={IC.search} s={14}/></div>
                <input value={attSearch} onChange={e=>setAttSearch(e.target.value)} placeholder="Xodim yoki bo'lim..."
                  style={{ width:"100%", padding:"9px 12px 9px 34px", borderRadius:10, border:"1.5px solid #eef0f6", fontSize:13, color:"#1e1e3a", background:"#f8fafc", outline:"none", boxSizing:"border-box" }}/>
              </div>
              {["all","present","late","absent","vacation"].map(f => (
                <button key={f} onClick={()=>setAttFilter(f)} style={{
                  padding:"7px 13px", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer",
                  border: attFilter===f ? "1.5px solid #6366f1" : "1.5px solid #eef0f6",
                  background: attFilter===f ? "rgba(99,102,241,0.08)" : "#f8fafc",
                  color: attFilter===f ? "#6366f1" : "#94a3b8",
                }}>
                  {f==="all"?"Barchasi":f==="present"?"✅ Keldi":f==="late"?"⏱ Kechikdi":f==="absent"?"❌ Kelmadi":"🏖 Ta'til"}
                </button>
              ))}
              <button onClick={()=>setManualModal(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", boxShadow:"0 3px 12px rgba(99,102,241,0.30)" }}>
                <Ico d={IC.plus} s={13}/> Qo'lda kiritish
              </button>
            </div>
            {/* Jadval header */}
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1fr 1fr 1.2fr 1fr", padding:"10px 24px", background:"#f8fafc" }}>
              {["Xodim","Bo'lim","Vaqt","Kechikish","Holat","Jarima"].map(h=>(
                <div key={h} style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:0.4 }}>{h}</div>
              ))}
            </div>
            {filteredAtt.map((e,i)=>(
              <div key={e.id} style={{
                display:"grid", gridTemplateColumns:"2fr 1.2fr 1fr 1fr 1.2fr 1fr",
                padding:"13px 24px", borderTop:"1px solid #f4f5f9",
                background: e.status==="absent"?"rgba(239,68,68,0.02)":e.status==="late"?"rgba(245,158,11,0.015)":"transparent",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{
                    width:32, height:32, borderRadius:9, flexShrink:0,
                    background: e.status==="absent"?"rgba(239,68,68,0.10)":e.status==="late"?"rgba(245,158,11,0.10)":e.status==="vacation"?"rgba(99,102,241,0.10)":"rgba(16,185,129,0.10)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, fontWeight:800,
                    color: e.status==="absent"?"#ef4444":e.status==="late"?"#f59e0b":e.status==="vacation"?"#6366f1":"#10b981",
                  }}>{e.name.charAt(0)}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1e1e3a" }}>{e.name}</div>
                    <div style={{ fontSize:11, color:"#94a3b8" }}>{e.pos}</div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", fontSize:12, color:"#64748b", fontWeight:500 }}>{e.dept}</div>
                <div style={{ display:"flex", alignItems:"center", fontSize:13, fontWeight:700, color:"#1e1e3a" }}>{e.time}</div>
                <div style={{ display:"flex", alignItems:"center", fontSize:13, fontWeight:700, color: e.late>0?"#f59e0b":"#94a3b8" }}>
                  {e.late > 0 ? `+${e.late} daq` : "—"}
                </div>
                <div style={{ display:"flex", alignItems:"center" }}>
                  <Badge status={e.status} map={STATUS_META}/>
                </div>
                <div style={{ display:"flex", alignItems:"center", fontSize:12, fontWeight:700, color: e.late>0?"#ef4444":"#94a3b8" }}>
                  {e.late > 0 ? `–${Math.round(e.late*2000).toLocaleString()} so'm` : "—"}
                </div>
              </div>
            ))}
            {filteredAtt.length === 0 && (
              <div style={{ padding:"40px", textAlign:"center", color:"#94a3b8" }}>Hech narsa topilmadi</div>
            )}
          </div>
        )}

        {/* ════ OYLIK MAOSH TAB ════ */}
        {tab === "payroll" && (
          <>
            {/* Summary */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:20 }}>
              {[
                { l:"Jami net maosh",    v:fmt(netPayroll),  c:"#6366f1" },
                { l:"Jami jarima",       v:fmt(payrolls.reduce((s,p)=>s+p.penalty,0)), c:"#ef4444" },
                { l:"Jami bonus",        v:fmt(payrolls.reduce((s,p)=>s+p.bonus,0)),   c:"#10b981" },
              ].map((s,i)=>(
                <div key={i} style={{ background:"#fff", borderRadius:14, padding:"18px 20px", border:"1px solid #eef0f6" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:0.5, marginBottom:8 }}>{s.l.toUpperCase()}</div>
                  <div style={{ fontSize:22, fontWeight:900, color:s.c }}>{s.v}</div>
                </div>
              ))}
            </div>

            <div style={{ background:"#fff", borderRadius:18, border:"1px solid #eef0f6", overflow:"hidden" }}>
              <div style={{ padding:"18px 24px 14px", borderBottom:"1px solid #f4f5f9" }}>
                <div style={{ fontSize:14, fontWeight:800, color:"#1e1e3a" }}>Fevral 2025 — Oylik hisobi</div>
                <div style={{ color:"#94a3b8", fontSize:12, marginTop:2 }}>Tasdiqlash uchun «✓ Tasdiqlash» tugmasini bosing</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1.2fr 1fr", padding:"10px 24px", background:"#f8fafc" }}>
                {["Xodim","Asosiy","Kechikish","Jarima","Bonus","Net maosh","Holat"].map(h=>(
                  <div key={h} style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:0.3 }}>{h}</div>
                ))}
              </div>
              {payrolls.map((p,i)=>(
                <div key={p.id} style={{
                  display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1.2fr 1fr",
                  padding:"13px 24px", borderTop:"1px solid #f4f5f9",
                  background: p.status==="approved"?"rgba(16,185,129,0.02)":p.status==="paid"?"rgba(99,102,241,0.02)":"transparent",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:9, background:"rgba(99,102,241,0.10)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#6366f1" }}>{p.name.charAt(0)}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1e1e3a" }}>{p.name}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", fontSize:12, color:"#64748b" }}>{fmtM(p.base)}</div>
                  <div style={{ display:"flex", alignItems:"center", fontSize:12, color: p.late_min>0?"#f59e0b":"#94a3b8" }}>{p.late_min>0?`${p.late_min} daq`:"—"}</div>
                  <div style={{ display:"flex", alignItems:"center", fontSize:12, fontWeight:700, color: p.penalty>0?"#ef4444":"#94a3b8" }}>{p.penalty>0?`–${Math.round(p.penalty/1000)}K`:"—"}</div>
                  <div style={{ display:"flex", alignItems:"center", fontSize:12, fontWeight:700, color: p.bonus>0?"#10b981":"#94a3b8" }}>{p.bonus>0?`+${Math.round(p.bonus/1000)}K`:"—"}</div>
                  <div style={{ display:"flex", alignItems:"center", fontSize:13, fontWeight:900, color:"#1e1e3a" }}>{fmtM(p.net)}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <Badge status={p.status} map={PAY_META}/>
                    {p.status === "draft" && (
                      <button onClick={()=>setPayModal(p)} style={{ background:"rgba(16,185,129,0.10)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:11, fontWeight:700, color:"#10b981", display:"flex", alignItems:"center", gap:4 }}>
                        <Ico d={IC.check} s={11} sw={2.5}/> Tasdiq
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════ XARAJATLAR TAB ════ */}
        {tab === "expenses" && (
          <>
            {/* Summary kartalar */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
              {Object.entries(
                expenses.reduce((acc,e)=>{ acc[e.cat]=(acc[e.cat]||0)+e.amount; return acc; }, {})
              ).slice(0,4).map(([cat,sum],i)=>{
                const cm = CAT_META[cat]||CAT_META.other;
                return (
                  <div key={i} style={{ background:"#fff", borderRadius:14, padding:"16px", border:"1px solid #eef0f6" }}>
                    <div style={{ fontSize:20, marginBottom:8 }}>{cm.emoji}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:0.4, marginBottom:5 }}>{cm.label.toUpperCase()}</div>
                    <div style={{ fontSize:18, fontWeight:900, color:cm.color }}>{fmtM(sum)}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ background:"#fff", borderRadius:18, border:"1px solid #eef0f6", overflow:"hidden" }}>
              <div style={{ padding:"18px 24px 14px", borderBottom:"1px solid #f4f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:"#1e1e3a" }}>Xarajatlar ro'yxati</div>
                  <div style={{ color:"#94a3b8", fontSize:12, marginTop:2 }}>
                    Jami: <strong style={{ color:"#1e1e3a" }}>{fmt(totalExp)}</strong>
                  </div>
                </div>
                <button onClick={()=>setExpModal(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#f59e0b,#d97706)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", boxShadow:"0 3px 12px rgba(245,158,11,0.35)" }}>
                  <Ico d={IC.plus} s={13}/> Yangi xarajat
                </button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1.2fr 1fr 1fr", padding:"10px 24px", background:"#f8fafc" }}>
                {["Sarlavha","Kategoriya","Summa","Sana","Kim kiritdi"].map(h=>(
                  <div key={h} style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:0.3 }}>{h}</div>
                ))}
              </div>
              {expenses.map((e,i)=>{
                const cm = CAT_META[e.cat]||CAT_META.other;
                return (
                  <div key={e.id} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1.2fr 1fr 1fr", padding:"13px 24px", borderTop:"1px solid #f4f5f9" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:9, background:`${cm.color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{cm.emoji}</div>
                      <span style={{ fontSize:13, fontWeight:700, color:"#1e1e3a" }}>{e.title}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center" }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:20, background:`${cm.color}10`, color:cm.color }}>{cm.label}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", fontSize:13, fontWeight:800, color:"#1e1e3a" }}>{fmt(e.amount)}</div>
                    <div style={{ display:"flex", alignItems:"center", fontSize:12, color:"#64748b" }}>{e.date}</div>
                    <div style={{ display:"flex", alignItems:"center", fontSize:12, color:"#64748b" }}>{e.by}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── MODALLAR ── */}
      {manualModal  && <ManualAttModal    onClose={()=>setManualModal(false)}/>}
      {expModal     && <AddExpenseModal   onClose={()=>setExpModal(false)}   onAdd={handleAddExp}/>}
      {payModal     && <ApprovePayrollModal payroll={payModal} onClose={()=>setPayModal(null)} onApprove={handleApprove}/>}
    </div>
  );
}