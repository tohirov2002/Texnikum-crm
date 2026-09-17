import { useState, useEffect, useRef } from "react";

// ─── SVG IKONLAR ─────────────────────────────────────────────────────────────
const Ico = ({ d, s = 16, sw = 1.8 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const IC = {
  users:   ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z","M23 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75"],
  check:   "M20 6L9 17l-5-5",
  x:       "M18 6L6 18M6 6l12 12",
  clock:   ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 6v6l4 2"],
  bell:    ["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"],
  search:  ["M11 4a7 7 0 1 0 0 14A7 7 0 0 0 11 4z","M21 21l-4.35-4.35"],
  pin:     ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z","M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  phone:   ["M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"],
  edit:    ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  close:   "M18 6L6 18M6 6l12 12",
  plus:    "M12 5v14M5 12h14",
  eye:     ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  send:    ["M22 2L11 13","M22 2L15 22l-4-9-9-4 20-7z"],
  filter:  ["M22 3H2l8 9.46V19l4 2v-8.54L22 3z"],
  chart:   ["M18 20V10","M12 20V4","M6 20v-6"],
  save:    ["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z","M17 21v-8H7v8","M7 3v5h8"],
  wifi:    ["M5 12.55a11 11 0 0 1 14.08 0","M1.42 9a16 16 0 0 1 21.16 0","M8.53 16.11a6 16 0 0 1 6.95 0","M12 20h.01"],
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const GROUPS = [
  { id:1, name:"1-IT-24",   teacher:"Akbar Toshmatov",   subject:"Dasturlash",   room:"101-xona", schedule:"09:00–11:00", students_count:14 },
  { id:2, name:"2-IT-24",   teacher:"Sarvar Qodirov",    subject:"Ma'lumotlar bazasi", room:"102-xona", schedule:"11:00–13:00", students_count:12 },
  { id:3, name:"1-Iqt-24",  teacher:"Dilnoza Yusupova",  subject:"Iqtisodiyot",  room:"201-xona", schedule:"09:00–11:00", students_count:16 },
  { id:4, name:"2-Iqt-24",  teacher:"Nodira Hamidova",   subject:"Buxgalteriya", room:"202-xona", schedule:"13:00–15:00", students_count:11 },
  { id:5, name:"1-Huq-24",  teacher:"Bobur Tursunov",    subject:"Huquq asoslari",room:"301-xona",schedule:"11:00–13:00", students_count:15 },
];

const makeStudents = (groupId, count) => {
  const names = [
    "Abdullayev Jamshid","Toshmatova Malika","Rahimov Sherzod","Karimova Dilnoza",
    "Yusupov Akbar","Mirzayeva Gulnora","Hasanov Bobur","Ergasheva Kamola",
    "Nazarov Ulmas","Aliyeva Maftuna","Qodirov Sardor","Hamidova Nozima",
    "Tursunov Jasur","Mirzaeva Barno","Ismoilov Firdavs","Xoliqova Shahnoza",
  ];
  const statuses = ["present","present","present","present","present","late","late","absent","absent","absent","present","present","excused","present","present","absent"];
  const times    = ["08:58","09:03","09:07","—","09:14","09:21","—","—","09:02","08:55","09:18","09:05","—","08:59","09:11","—"];
  return names.slice(0, count).map((name, i) => ({
    id: groupId * 100 + i + 1,
    name,
    status: statuses[i] || "absent",
    time:   times[i]   || "—",
    phone:  `+998 9${Math.floor(Math.random()*9)+1} ${Math.floor(Math.random()*900+100)} ${Math.floor(Math.random()*90+10)} ${Math.floor(Math.random()*90+10)}`,
    parent_phone: `+998 9${Math.floor(Math.random()*9)+1} ${Math.floor(Math.random()*900+100)} ${Math.floor(Math.random()*90+10)} ${Math.floor(Math.random()*90+10)}`,
    note: "",
  }));
};

const INITIAL_STUDENTS = Object.fromEntries(
  GROUPS.map(g => [g.id, makeStudents(g.id, g.students_count)])
);

const STATUS_CFG = {
  present: { label:"Keldi",       color:"#10b981", bg:"rgba(16,185,129,0.12)",  border:"rgba(16,185,129,0.30)", dot:"#10b981", emoji:"✅" },
  late:    { label:"Kechikdi",    color:"#f59e0b", bg:"rgba(245,158,11,0.12)",  border:"rgba(245,158,11,0.30)", dot:"#f59e0b", emoji:"⏱" },
  absent:  { label:"Kelmadi",     color:"#ef4444", bg:"rgba(239,68,68,0.12)",   border:"rgba(239,68,68,0.30)",  dot:"#ef4444", emoji:"❌" },
  excused: { label:"Sababli",     color:"#6366f1", bg:"rgba(99,102,241,0.12)",  border:"rgba(99,102,241,0.30)", dot:"#6366f1", emoji:"📋" },
  left:    { label:"Erta ketdi",  color:"#f97316", bg:"rgba(249,115,22,0.12)",  border:"rgba(249,115,22,0.30)", dot:"#f97316", emoji:"🚶" },
};

// ─── VAQT ────────────────────────────────────────────────────────────────────
const useTime = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return time;
};

// ─── KICHIK KOMPONENTLAR ──────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.absent;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
      background:c.bg, color:c.color, border:`1px solid ${c.border}`,
      whiteSpace:"nowrap",
    }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.color, display:"inline-block" }}/>
      {c.label}
    </span>
  );
};

const PulseDot = ({ active, color }) => (
  <span style={{ position:"relative", display:"inline-flex", width:10, height:10 }}>
    <span style={{
      position:"absolute", inset:0, borderRadius:"50%", background:color, opacity:0.3,
      animation: active ? "ping 1.2s cubic-bezier(0,0,0.2,1) infinite" : "none",
    }}/>
    <span style={{ position:"relative", width:10, height:10, borderRadius:"50%", background:color, display:"inline-block" }}/>
  </span>
);

// Modal wrapper
const Modal = ({ onClose, children, width = 480 }) => (
  <div onClick={onClose} style={{
    position:"fixed", inset:0, background:"rgba(10,10,30,0.65)",
    backdropFilter:"blur(6px)", zIndex:1000,
    display:"flex", alignItems:"center", justifyContent:"center", padding:20,
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      background:"#fff", borderRadius:24, padding:"30px 34px",
      width:"100%", maxWidth:width, maxHeight:"90vh", overflowY:"auto",
      boxShadow:"0 40px 80px rgba(0,0,0,0.28)",
    }}>
      {children}
    </div>
  </div>
);

// ─── STATUS O'ZGARTIRISH MODALI ───────────────────────────────────────────────
function StatusModal({ student, groupId, onClose, onChange }) {
  const [status, setStatus] = useState(student.status);
  const [note,   setNote]   = useState(student.note || "");
  return (
    <Modal onClose={onClose} width={400}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:"#1e1e3a" }}>Davomat o'zgartirish</div>
          <div style={{ color:"#6366f1", fontWeight:600, fontSize:14, marginTop:3 }}>{student.name}</div>
        </div>
        <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:10, padding:"7px 9px", cursor:"pointer" }}>
          <Ico d={IC.close} s={15}/>
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:18 }}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <button key={key} onClick={() => setStatus(key)} style={{
            padding:"11px 14px", borderRadius:12, cursor:"pointer",
            border: status === key ? `2px solid ${cfg.color}` : "2px solid #eef0f6",
            background: status === key ? cfg.bg : "#f8fafc",
            display:"flex", alignItems:"center", gap:9, transition:"all 0.15s",
          }}>
            <span style={{ fontSize:18 }}>{cfg.emoji}</span>
            <span style={{ fontSize:13, fontWeight:700, color: status === key ? cfg.color : "#94a3b8" }}>
              {cfg.label}
            </span>
          </button>
        ))}
      </div>

      <div style={{ marginBottom:18 }}>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#64748b", letterSpacing:0.5, marginBottom:6 }}>
          IZOH (IXTIYORIY)
        </label>
        <textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="Masalan: kasallik guvohnomasi bor..."
          rows={3} style={{
            width:"100%", padding:"10px 14px", borderRadius:10, resize:"none",
            border:"1.5px solid #eef0f6", fontSize:14, color:"#1e1e3a",
            background:"#f8fafc", outline:"none", boxSizing:"border-box",
          }}/>
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid #eef0f6", background:"#f8fafc", color:"#64748b", fontSize:14, fontWeight:700, cursor:"pointer" }}>
          Bekor
        </button>
        <button onClick={() => { onChange(groupId, student.id, status, note); onClose(); }} style={{
          flex:2, padding:"12px", borderRadius:12, border:"none",
          background: `linear-gradient(135deg,${STATUS_CFG[status].color},${STATUS_CFG[status].color}cc)`,
          color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer",
          boxShadow:`0 4px 16px ${STATUS_CFG[status].color}40`,
        }}>
          {STATUS_CFG[status].emoji} {STATUS_CFG[status].label} deb belgilash
        </button>
      </div>
    </Modal>
  );
}

// ─── OTA-ONAGA XABAR MODALI ───────────────────────────────────────────────────
function NotifyParentModal({ student, onClose }) {
  const [msg, setMsg] = useState(
    `Hurmatli ota-ona! Farzandingiz ${student.name} bugun darsga kelmadi. Iltimos, texnikum bilan bog'laning: +998 71 123 45 67`
  );
  const [sent, setSent] = useState(false);

  const handleSend = () => { setSent(true); setTimeout(onClose, 1500); };
  return (
    <Modal onClose={onClose} width={440}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:"#1e1e3a" }}>Ota-onaga xabar</div>
          <div style={{ color:"#ef4444", fontWeight:600, fontSize:13, marginTop:3 }}>
            ❌ {student.name} — kelmadi
          </div>
        </div>
        <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:10, padding:"7px 9px", cursor:"pointer" }}>
          <Ico d={IC.close} s={15}/>
        </button>
      </div>

      <div style={{ background:"#f8fafc", borderRadius:12, padding:"14px 16px", marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", marginBottom:6 }}>OTA-ONA TELEFONI</div>
        <div style={{ fontSize:15, fontWeight:800, color:"#1e1e3a", display:"flex", alignItems:"center", gap:8 }}>
          <Ico d={IC.phone} s={15}/>
          {student.parent_phone}
        </div>
      </div>

      <div style={{ marginBottom:18 }}>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#64748b", letterSpacing:0.5, marginBottom:6 }}>
          XABAR MATNI
        </label>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} style={{
          width:"100%", padding:"10px 14px", borderRadius:10, resize:"none",
          border:"1.5px solid #eef0f6", fontSize:13, color:"#1e1e3a",
          background:"#f8fafc", outline:"none", boxSizing:"border-box",
        }}/>
      </div>

      {sent ? (
        <div style={{ padding:"14px", background:"rgba(16,185,129,0.10)", borderRadius:12, border:"1px solid rgba(16,185,129,0.25)", textAlign:"center", color:"#10b981", fontWeight:700, fontSize:14 }}>
          ✅ Xabar yuborildi!
        </div>
      ) : (
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid #eef0f6", background:"#f8fafc", color:"#64748b", fontSize:14, fontWeight:700, cursor:"pointer" }}>
            Bekor
          </button>
          <button onClick={handleSend} style={{ flex:2, padding:"12px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, boxShadow:"0 4px 16px rgba(99,102,241,0.35)" }}>
            <Ico d={IC.send} s={15}/> SMS yuborish
          </button>
        </div>
      )}
    </Modal>
  );
}

// ─── TALABA KARTASI ───────────────────────────────────────────────────────────
function StudentCard({ student, groupId, idx, onStatusChange, onNotify, viewMode }) {
  const cfg = STATUS_CFG[student.status] || STATUS_CFG.absent;
  const initials = student.name.split(" ").slice(0,2).map(w => w[0]).join("");

  if (viewMode === "grid") {
    return (
      <div style={{
        background:"#fff", borderRadius:16, padding:"18px 16px",
        border:`2px solid ${cfg.border}`,
        boxShadow: student.status === "absent"
          ? "0 2px 8px rgba(239,68,68,0.08)"
          : student.status === "present"
          ? "0 2px 8px rgba(16,185,129,0.08)"
          : "0 2px 8px rgba(0,0,0,0.04)",
        display:"flex", flexDirection:"column", alignItems:"center",
        gap:10, position:"relative", transition:"all 0.2s",
      }}>
        {/* Avatar */}
        <div style={{ position:"relative" }}>
          <div style={{
            width:52, height:52, borderRadius:14,
            background:`linear-gradient(135deg,${cfg.color}22,${cfg.color}44)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, fontWeight:800, color:cfg.color,
          }}>{initials}</div>
          <div style={{
            position:"absolute", bottom:-3, right:-3,
            width:18, height:18, borderRadius:"50%",
            background:cfg.color, border:"2.5px solid #fff",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:9,
          }}>
            {student.status === "present" ? "✓" : student.status === "absent" ? "✕" : student.status === "late" ? "!" : "?"}
          </div>
        </div>

        {/* Ism */}
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#1e1e3a", lineHeight:1.3 }}>
            {student.name.split(" ")[0]}<br/>{student.name.split(" ")[1]}
          </div>
          {student.time !== "—" && (
            <div style={{ fontSize:11, color:"#94a3b8", marginTop:3 }}>{student.time}</div>
          )}
        </div>

        {/* Status */}
        <StatusBadge status={student.status}/>

        {/* Amallar */}
        <div style={{ display:"flex", gap:6, width:"100%" }}>
          <button onClick={() => onStatusChange(student)} style={{
            flex:1, padding:"6px 0", borderRadius:9, fontSize:11, fontWeight:700, cursor:"pointer",
            border:`1px solid ${cfg.color}30`, background:cfg.bg, color:cfg.color,
          }}>Tahrir</button>
          {student.status === "absent" && (
            <button onClick={() => onNotify(student)} style={{
              flex:1, padding:"6px 0", borderRadius:9, fontSize:11, fontWeight:700, cursor:"pointer",
              border:"1px solid rgba(239,68,68,0.25)", background:"rgba(239,68,68,0.08)", color:"#ef4444",
            }}>📞 SMS</button>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"12px 20px", borderBottom:"1px solid #f4f5f9",
      background: idx % 2 === 0 ? "#fff" : "#fafbfc",
      transition:"background 0.15s",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:"#94a3b8", width:24, textAlign:"center" }}>{idx+1}</div>
        <div style={{
          width:36, height:36, borderRadius:10,
          background:`linear-gradient(135deg,${cfg.color}18,${cfg.color}30)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:13, fontWeight:800, color:cfg.color, flexShrink:0,
        }}>{initials}</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#1e1e3a" }}>{student.name}</div>
          {student.note && <div style={{ fontSize:11, color:"#94a3b8", marginTop:1 }}>{student.note}</div>}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#1e1e3a", minWidth:48, textAlign:"center" }}>
          {student.time}
        </div>
        <StatusBadge status={student.status}/>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => onStatusChange(student)} style={{
            padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer",
            border:"1.5px solid #eef0f6", background:"#f8fafc", color:"#64748b",
            display:"flex", alignItems:"center", gap:5,
          }}>
            <Ico d={IC.edit} s={12}/> Tahrir
          </button>
          {student.status === "absent" && (
            <button onClick={() => onNotify(student)} style={{
              padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer",
              border:"1px solid rgba(239,68,68,0.25)", background:"rgba(239,68,68,0.07)", color:"#ef4444",
              display:"flex", alignItems:"center", gap:5,
            }}>
              <Ico d={IC.phone} s={12}/> SMS
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GURUH KARTASI (chap panel) ───────────────────────────────────────────────
function GroupCard({ group, students, isActive, onClick }) {
  const present = students.filter(s => s.status === "present").length;
  const late    = students.filter(s => s.status === "late").length;
  const absent  = students.filter(s => s.status === "absent").length;
  const pct     = Math.round((present + late) / students.length * 100);
  const hasAlert = absent > 0;

  return (
    <div onClick={onClick} style={{
      padding:"14px 16px", borderRadius:14, cursor:"pointer", marginBottom:8,
      border: isActive ? "2px solid #6366f1" : "1.5px solid #eef0f6",
      background: isActive ? "rgba(99,102,241,0.06)" : "#fff",
      transition:"all 0.2s", position:"relative",
      boxShadow: isActive ? "0 4px 16px rgba(99,102,241,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {hasAlert && !isActive && (
        <div style={{ position:"absolute", top:10, right:10, width:8, height:8, borderRadius:"50%", background:"#ef4444", animation:"ping 1.5s infinite" }}/>
      )}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color: isActive ? "#6366f1" : "#1e1e3a" }}>{group.name}</div>
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{group.teacher}</div>
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", background:"#f1f5f9", padding:"2px 8px", borderRadius:20 }}>
          {group.schedule}
        </div>
      </div>
      {/* Progress */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ flex:1, height:5, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background: pct>=80?"#10b981":pct>=60?"#f59e0b":"#ef4444", borderRadius:99, transition:"width 0.5s" }}/>
        </div>
        <span style={{ fontSize:12, fontWeight:800, color: pct>=80?"#10b981":pct>=60?"#f59e0b":"#ef4444", minWidth:32 }}>{pct}%</span>
      </div>
      {/* Mini stat */}
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        {[
          { l:"keldi",   v:present, c:"#10b981" },
          { l:"kechikdi",v:late,    c:"#f59e0b" },
          { l:"kelmadi", v:absent,  c:"#ef4444" },
        ].map((s,i)=>(
          <div key={i} style={{ fontSize:11, color:s.c, fontWeight:700, background:`${s.c}10`, padding:"2px 7px", borderRadius:20 }}>
            {s.v} {s.l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ASOSIY SAHIFA
// ─────────────────────────────────────────────────────────────────────────────
export default function LiveAttendanceBoard() {
  const now      = useTime();
  const [students,      setStudents]      = useState(INITIAL_STUDENTS);
  const [activeGroup,   setActiveGroup]   = useState(1);
  const [viewMode,      setViewMode]      = useState("grid"); // grid | list
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [statusModal,   setStatusModal]   = useState(null);
  const [notifyModal,   setNotifyModal]   = useState(null);
  const [lastUpdate,    setLastUpdate]    = useState(now);
  const [pulseGroup,    setPulseGroup]    = useState(null);

  // Har 8 soniyada bir talabaning statusini o'zgartirish (simulatsiya)
  useEffect(() => {
    const t = setInterval(() => {
      const gId = GROUPS[Math.floor(Math.random() * GROUPS.length)].id;
      setStudents(prev => {
        const list = [...prev[gId]];
        const absentIdx = list.findIndex(s => s.status === "absent");
        if (absentIdx === -1) return prev;
        const updated = [...list];
        updated[absentIdx] = {
          ...updated[absentIdx],
          status: Math.random() > 0.5 ? "present" : "late",
          time: `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`,
        };
        return { ...prev, [gId]: updated };
      });
      setPulseGroup(gId);
      setLastUpdate(new Date());
      setTimeout(() => setPulseGroup(null), 2000);
    }, 8000);
    return () => clearInterval(t);
  }, [now]);

  const handleStatusChange = (groupId, studentId, newStatus, note) => {
    setStudents(prev => {
      const list = prev[groupId].map(s =>
        s.id === studentId
          ? { ...s, status: newStatus, note, time: newStatus !== "absent" ? `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}` : "—" }
          : s
      );
      return { ...prev, [groupId]: list };
    });
    setLastUpdate(new Date());
  };

  const currGroup    = GROUPS.find(g => g.id === activeGroup);
  const currStudents = students[activeGroup] || [];
  const filtered     = currStudents.filter(s => {
    const matchS = s.name.toLowerCase().includes(search.toLowerCase());
    const matchF = filterStatus === "all" || s.status === filterStatus;
    return matchS && matchF;
  });

  const present = currStudents.filter(s => s.status === "present").length;
  const late    = currStudents.filter(s => s.status === "late").length;
  const absent  = currStudents.filter(s => s.status === "absent").length;
  const excused = currStudents.filter(s => s.status === "excused").length;
  const total   = currStudents.length;
  const pct     = Math.round((present + late) / total * 100);

  // Barcha guruhlar umumiy
  const globalPresent = Object.values(students).flat().filter(s => s.status === "present").length;
  const globalTotal   = Object.values(students).flat().length;
  const globalAbsent  = Object.values(students).flat().filter(s => s.status === "absent").length;

  return (
    <div style={{ minHeight:"100vh", background:"#f0f2f8", fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", display:"flex", flexDirection:"column" }}>

      {/* ── NAVBAR ── */}
      <div style={{
        background:"#0c0c1d", height:58, padding:"0 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:"#fff" }}>MT</div>
          <div>
            <span style={{ color:"#fff", fontWeight:700, fontSize:14 }}>Toshkent Texnikumi</span>
            <span style={{ color:"rgba(255,255,255,0.3)", fontSize:12, marginLeft:8 }}>CenterAdmin · Jonli Davomat</span>
          </div>
        </div>

        {/* Real-vaqt clock */}
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 14px", borderRadius:10, background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.25)" }}>
            <PulseDot active color="#10b981"/>
            <span style={{ color:"#6ee7b7", fontSize:12, fontWeight:700 }}>JONLI EFIR</span>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:"#fff", fontSize:20, fontWeight:900, letterSpacing:-0.5, lineHeight:1 }}>
              {now.toLocaleTimeString("uz-UZ", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
            </div>
            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11 }}>
              {now.toLocaleDateString("uz-UZ", { weekday:"short", day:"numeric", month:"short" })}
            </div>
          </div>
        </div>
      </div>

      {/* ── GLOBAL STATS BAR ── */}
      <div style={{
        background:"#fff", borderBottom:"1px solid #eef0f6", padding:"10px 24px",
        display:"flex", alignItems:"center", gap:24, flexShrink:0,
      }}>
        <div style={{ fontSize:12, fontWeight:600, color:"#94a3b8" }}>BARCHA GURUHLAR:</div>
        {[
          { l:"Jami", v:globalTotal, c:"#1e1e3a" },
          { l:"Keldi", v:globalPresent, c:"#10b981" },
          { l:"Kelmadi", v:globalAbsent, c:"#ef4444" },
          { l:"Foiz", v:`${Math.round(globalPresent/globalTotal*100)}%`, c:"#6366f1" },
        ].map((s,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:18, fontWeight:900, color:s.c }}>{s.v}</span>
            <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>{s.l}</span>
          </div>
        ))}
        <div style={{ marginLeft:"auto", fontSize:11, color:"#94a3b8" }}>
          Oxirgi yangilanish: {lastUpdate.toLocaleTimeString("uz-UZ",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:20, background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.20)" }}>
          <PulseDot active color="#10b981"/>
          <span style={{ fontSize:11, fontWeight:700, color:"#10b981" }}>Auto-yangilanish</span>
        </div>
      </div>

      {/* ── ASOSIY KONTENT ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ── CHAP PANEL: Guruhlar ── */}
        <div style={{ width:280, background:"#fff", borderRight:"1px solid #eef0f6", padding:"16px 14px", overflowY:"auto", flexShrink:0 }}>
          <div style={{ fontSize:13, fontWeight:800, color:"#1e1e3a", marginBottom:14, padding:"0 2px" }}>
            📚 Guruhlar ({GROUPS.length})
          </div>
          {GROUPS.map(g => (
            <div key={g.id} style={{ position:"relative" }}>
              {pulseGroup === g.id && (
                <div style={{ position:"absolute", inset:-2, borderRadius:16, border:"2px solid #10b981", animation:"none", pointerEvents:"none", zIndex:5 }}/>
              )}
              <GroupCard
                group={g}
                students={students[g.id]}
                isActive={activeGroup === g.id}
                onClick={() => { setActiveGroup(g.id); setSearch(""); setFilterStatus("all"); }}
              />
            </div>
          ))}

          {/* Umumiy statistika */}
          <div style={{ marginTop:16, padding:"14px", background:"linear-gradient(135deg,#1e1e3a,#312e81)", borderRadius:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>UMUMIY BUGUN</div>
            {[
              { l:"Jami talabalar", v:globalTotal,   c:"#a5b4fc" },
              { l:"Keldi",          v:globalPresent, c:"#6ee7b7" },
              { l:"Kelmadi",        v:globalAbsent,  c:"#fca5a5" },
            ].map((s,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom: i<2?"1px solid rgba(255,255,255,0.07)":"none" }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>{s.l}</span>
                <span style={{ fontSize:13, fontWeight:800, color:s.c }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── O'NG PANEL: Davomat taxtasi ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Guruh header */}
          <div style={{
            padding:"16px 24px", background:"#fff", borderBottom:"1px solid #eef0f6",
            display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0,
          }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ fontSize:20, fontWeight:900, color:"#1e1e3a" }}>{currGroup?.name}</div>
                <div style={{ fontSize:12, fontWeight:600, color:"#94a3b8", background:"#f1f5f9", padding:"3px 10px", borderRadius:20 }}>
                  {currGroup?.schedule}
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:"#6366f1", background:"rgba(99,102,241,0.08)", padding:"3px 10px", borderRadius:20 }}>
                  📍 {currGroup?.room}
                </div>
              </div>
              <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>
                👨‍🏫 {currGroup?.teacher} · 📘 {currGroup?.subject}
              </div>
            </div>

            {/* View toggle */}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ display:"flex", background:"#f1f5f9", borderRadius:10, padding:3, gap:3 }}>
                {[["grid","⊞ Grid"],["list","≡ Jadval"]].map(([m,l])=>(
                  <button key={m} onClick={()=>setViewMode(m)} style={{
                    padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer",
                    background: viewMode===m ? "#fff" : "transparent",
                    color: viewMode===m ? "#6366f1" : "#94a3b8",
                    fontSize:12, fontWeight:700,
                    boxShadow: viewMode===m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    transition:"all 0.15s",
                  }}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Stat bantlari */}
          <div style={{ padding:"12px 24px", background:"#fff", borderBottom:"1px solid #f4f5f9", display:"flex", gap:12, flexShrink:0 }}>
            {[
              { l:"Keldi",      v:present, c:"#10b981", pct: Math.round(present/total*100) },
              { l:"Kechikdi",   v:late,    c:"#f59e0b", pct: Math.round(late/total*100) },
              { l:"Kelmadi",    v:absent,  c:"#ef4444", pct: Math.round(absent/total*100) },
              { l:"Sababli",    v:excused, c:"#6366f1", pct: Math.round(excused/total*100) },
            ].map((s,i)=>(
              <div key={i} style={{ flex:1, padding:"10px 14px", borderRadius:12, background:`${s.c}08`, border:`1px solid ${s.c}20` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>{s.l}</span>
                  <span style={{ fontSize:16, fontWeight:900, color:s.c }}>{s.v}</span>
                </div>
                <div style={{ height:4, background:`${s.c}20`, borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${s.pct}%`, background:s.c, borderRadius:99, transition:"width 0.5s" }}/>
                </div>
                <div style={{ fontSize:10, color:s.c, fontWeight:700, marginTop:3 }}>{s.pct}%</div>
              </div>
            ))}

            {/* Umumiy foiz */}
            <div style={{ padding:"10px 18px", borderRadius:12, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minWidth:90 }}>
              <div style={{ fontSize:26, fontWeight:900, color:"#fff", lineHeight:1 }}>{pct}%</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", fontWeight:600, marginTop:3 }}>{total} talaba</div>
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ padding:"12px 24px", background:"#f8fafc", borderBottom:"1px solid #f4f5f9", display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
            <div style={{ position:"relative", flex:1, maxWidth:280 }}>
              <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }}><Ico d={IC.search} s={14}/></div>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Talaba qidirish..."
                style={{ width:"100%", padding:"8px 12px 8px 32px", borderRadius:9, border:"1.5px solid #eef0f6", fontSize:12, color:"#1e1e3a", background:"#fff", outline:"none", boxSizing:"border-box" }}/>
            </div>
            {["all","present","late","absent","excused","left"].map(f=>(
              <button key={f} onClick={()=>setFilterStatus(f)} style={{
                padding:"7px 12px", borderRadius:9, fontSize:11, fontWeight:700, cursor:"pointer",
                border: filterStatus===f ? `1.5px solid ${f==="all"?"#6366f1":(STATUS_CFG[f]?.color||"#6366f1")}` : "1.5px solid #eef0f6",
                background: filterStatus===f ? `${f==="all"?"rgba(99,102,241,0.08)":(STATUS_CFG[f]?.bg||"rgba(99,102,241,0.08)")}` : "#fff",
                color: filterStatus===f ? (f==="all"?"#6366f1":(STATUS_CFG[f]?.color||"#6366f1")) : "#94a3b8",
                display:"flex", alignItems:"center", gap:4,
                transition:"all 0.15s",
              }}>
                {f==="all" ? "Barchasi" : STATUS_CFG[f]?.emoji+" "+STATUS_CFG[f]?.label}
              </button>
            ))}
            <div style={{ marginLeft:"auto", fontSize:11, color:"#94a3b8" }}>{filtered.length} ta</div>
          </div>

          {/* TAXTASI */}
          <div style={{ flex:1, overflowY:"auto", padding: viewMode==="grid" ? "20px 24px" : "0" }}>
            {viewMode === "grid" ? (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12 }}>
                {filtered.map((s,i)=>(
                  <StudentCard key={s.id} student={s} groupId={activeGroup} idx={i}
                    viewMode="grid"
                    onStatusChange={(st)=>setStatusModal({student:st,groupId:activeGroup})}
                    onNotify={(st)=>setNotifyModal(st)}
                  />
                ))}
              </div>
            ) : (
              <div>
                <div style={{ display:"flex", background:"#f8fafc", padding:"10px 20px", borderBottom:"1px solid #f4f5f9" }}>
                  {["#","Talaba","Kelish vaqti","Holat","Amal"].map((h,i)=>(
                    <div key={i} style={{ flex:[0.5,3,1.2,1.5,2][i], fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:0.4 }}>{h}</div>
                  ))}
                </div>
                {filtered.map((s,i)=>(
                  <StudentCard key={s.id} student={s} groupId={activeGroup} idx={i}
                    viewMode="list"
                    onStatusChange={(st)=>setStatusModal({student:st,groupId:activeGroup})}
                    onNotify={(st)=>setNotifyModal(st)}
                  />
                ))}
              </div>
            )}
            {filtered.length === 0 && (
              <div style={{ padding:"60px", textAlign:"center", color:"#94a3b8", fontSize:14 }}>
                Hech narsa topilmadi 🔍
              </div>
            )}
          </div>

          {/* FOOTER: Kelmagan talabalar — SMS yuborish */}
          {absent > 0 && (
            <div style={{
              padding:"12px 24px", background:"#fff", borderTop:"1px solid #eef0f6",
              display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0,
            }}>
              <div style={{ fontSize:13, color:"#1e1e3a" }}>
                <span style={{ fontWeight:700, color:"#ef4444" }}>{absent} ta talaba</span>
                {" "}kelmadi — ota-onalarga xabar yuborilsinmi?
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button style={{ padding:"8px 16px", borderRadius:10, border:"1.5px solid #eef0f6", background:"#f8fafc", color:"#64748b", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                  Keyinroq
                </button>
                <button
                  onClick={() => {
                    const firstAbsent = currStudents.find(s => s.status === "absent");
                    if (firstAbsent) setNotifyModal(firstAbsent);
                  }}
                  style={{ padding:"8px 16px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6, boxShadow:"0 3px 12px rgba(239,68,68,0.30)" }}>
                  <Ico d={IC.send} s={13}/> SMS yuborish ({absent})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALLAR ── */}
      {statusModal && (
        <StatusModal
          student={statusModal.student}
          groupId={statusModal.groupId}
          onClose={()=>setStatusModal(null)}
          onChange={handleStatusChange}
        />
      )}
      {notifyModal && (
        <NotifyParentModal
          student={notifyModal}
          onClose={()=>setNotifyModal(null)}
        />
      )}

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}