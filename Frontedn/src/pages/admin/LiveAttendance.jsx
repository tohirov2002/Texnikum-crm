import { useEffect, useState, useCallback, useRef } from "react";
import { Row, Col, Card, Tag, Button, Input, Modal, Form, Select, message, Typography, Badge } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { lessonApi, stdAttendanceApi, groupApi } from "../../api/resources.api";
import { getInitials, formatCurrency } from "../../utils/formatters";
import { ATT_STATUS } from "../../utils/constants";

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ── Pulsing dot ───────────────────────────────────────────────────────────────
const Dot = ({ color = "#10b981", size = 8 }) => (
  <span style={{ position: "relative", display: "inline-block", width: size, height: size }}>
    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, animation: "ping 1.4s infinite", opacity: 0.5 }} />
    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }} />
    <style>{`@keyframes ping { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }`}</style>
  </span>
);

// ── Avatar ────────────────────────────────────────────────────────────────────
const Ava = ({ name, color = "#6366f1", size = 38 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(135deg,${color}28,${color}60)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 800, color, flexShrink: 0 }}>
    {getInitials(name)}
  </div>
);

// ── Status tahrirlash modali ───────────────────────────────────────────────────
function StatusModal({ record, open, onClose, onSuccess }) {
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selStatus, setSelStatus] = useState(null);

  useEffect(() => {
    if (open && record) { setSelStatus(record.status || "absent"); form.setFieldsValue({ status: record.status, note: record.note }); }
  }, [open, record, form]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      await stdAttendanceApi.update(record.id, { status: selStatus, note: values.note });
      message.success("Davomat yangilandi!"); onSuccess(); onClose();
    } catch (e) { message.error(e.response?.data?.detail || "Xatolik"); }
    finally { setLoading(false); }
  };

  if (!record) return null;
  return (
    <Modal
      title={<div><div style={{ fontWeight: 800 }}>Davomat belgilash</div><div style={{ color: "#6366f1", fontSize: 13 }}>{record.student_name}</div></div>}
      open={open} onCancel={onClose} footer={null} width={400}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {/* Status tugmalari */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {Object.entries(ATT_STATUS).map(([k, v]) => (
            <button key={k} type="button" onClick={() => setSelStatus(k)}
              style={{ padding: "10px", borderRadius: 10, border: `2px solid ${selStatus === k ? v.color : "#eef0f6"}`, background: selStatus === k ? v.bg : "#fff", cursor: "pointer", fontWeight: 700, color: selStatus === k ? v.color : "#64748b", fontSize: 13, transition: "all 0.15s" }}>
              {v.emoji} {v.label}
            </button>
          ))}
        </div>
        <Form.Item name="note" label="Izoh"><TextArea rows={2} placeholder="Ixtiyoriy izoh..." /></Form.Item>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button type="primary" loading={loading} onClick={handleSave}
            style={{ background: selStatus ? ATT_STATUS[selStatus]?.color : "#6366f1", border: "none", borderRadius: 10 }}>
            {ATT_STATUS[selStatus]?.emoji} Saqlash
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

// ── SMS modali ────────────────────────────────────────────────────────────────
function SmsModal({ record, open, onClose }) {
  const [sent, setSent] = useState(false);
  const defaultMsg = record ? `Hurmatli ota-ona, ${record.student_name} bugun darsga kelmadi. Iltimos bog'laning.` : "";

  const handleSend = () => {
    setTimeout(() => { setSent(true); setTimeout(() => { setSent(false); onClose(); }, 1500); }, 800);
  };

  return (
    <Modal title={<div><div style={{ fontWeight: 800 }}>📱 SMS yuborish</div><div style={{ color: "#f59e0b", fontSize: 13 }}>{record?.student_name}</div></div>}
      open={open} onCancel={onClose} footer={null} width={420}>
      {sent ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <Text strong style={{ fontSize: 16, color: "#10b981" }}>SMS yuborildi!</Text>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 10, marginBottom: 14 }}>
            <Text style={{ fontSize: 12, color: "#94a3b8" }}>Ota-ona telefoni:</Text>
            <div style={{ fontWeight: 700, color: "#1e1e3a" }}>{record?.parent_phone || "—"}</div>
          </div>
          <Input.TextArea rows={4} defaultValue={defaultMsg} style={{ borderRadius: 10, marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Bekor</Button>
            <Button type="primary" onClick={handleSend} style={{ background: "#f59e0b", border: "none", borderRadius: 10 }}>📱 Yuborish</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── ASOSIY KOMPONENT ──────────────────────────────────────────────────────────
export default function LiveAttendance() {
  const [groups,       setGroups]       = useState([]);
  const [activeGroup,  setActiveGroup]  = useState(null);
  const [attendance,   setAttendance]   = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusModal,  setStatusModal]  = useState(null);
  const [smsModal,     setSmsModal]     = useState(null);
  const [time,         setTime]         = useState(new Date());
  const timerRef = useRef(null);

  // Soat
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Guruhlarni yuklash
  useEffect(() => {
    groupApi.getAll({ page_size: 50, is_active: true })
      .then(d => {
        const list = d.results || [];
        setGroups(list);
        if (list.length > 0) setActiveGroup(list[0]);
      }).catch(() => {});
  }, []);

  // Davomat yuklash (har 10 sek avtomatik)
  const fetchAttendance = useCallback(() => {
    if (!activeGroup) return;
    setLoading(true);
    stdAttendanceApi.getAll({ group: activeGroup.id, date: new Date().toISOString().slice(0, 10), page_size: 100 })
      .then(d => setAttendance(d.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeGroup]);

  useEffect(() => {
    fetchAttendance();
    timerRef.current = setInterval(fetchAttendance, 10000);
    return () => clearInterval(timerRef.current);
  }, [fetchAttendance]);

  // Filter
  const filtered = attendance.filter(r => {
    const matchSearch = (r.student_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Statistika
  const counts = {
    present: attendance.filter(r => r.status === "present").length,
    late:    attendance.filter(r => r.status === "late").length,
    absent:  attendance.filter(r => r.status === "absent").length,
    excused: attendance.filter(r => r.status === "excused").length,
  };
  const total     = attendance.length || 1;
  const presentPct = Math.round((counts.present + counts.late) / total * 100);

  return (
    <div>
      {/* ── Navbar ── */}
      <div style={{ background: "#0c0c1d", borderRadius: 16, padding: "14px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff" }}>MT</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Jonli Davomat Taxtasi</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{activeGroup?.name || "Guruh tanlanmagan"}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 18, fontFamily: "monospace" }}>{time.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{time.toLocaleDateString("uz-UZ", { day: "numeric", month: "long" })}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.30)" }}>
            <Dot color="#10b981" size={7} />
            <Text style={{ color: "#10b981", fontSize: 12, fontWeight: 700 }}>JONLI EFIR</Text>
          </div>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {/* ── CHAP: Guruhlar ro'yxati ── */}
        <Col span={6}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {groups.map(g => {
              const gAtt     = attendance.filter(r => r.group === g.id);
              const gPresent = gAtt.filter(r => r.status === "present" || r.status === "late").length;
              const gAbsent  = gAtt.filter(r => r.status === "absent").length;
              const isActive = activeGroup?.id === g.id;
              return (
                <div key={g.id} onClick={() => setActiveGroup(g)}
                  style={{ background: "#fff", borderRadius: 14, padding: "12px 14px", cursor: "pointer", border: isActive ? "2px solid #6366f1" : "1px solid #eef0f6", boxShadow: isActive ? "0 0 0 3px rgba(99,102,241,0.10)" : "0 1px 4px rgba(0,0,0,0.04)", transition: "all 0.15s", position: "relative" }}>
                  {gAbsent > 0 && <div style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />}
                  <div style={{ fontWeight: 700, fontSize: 13, color: isActive ? "#6366f1" : "#1e1e3a", marginBottom: 4 }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>👨‍🏫 {g.teacher_name || "—"} · 🚪 {g.room}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(16,185,129,0.10)", color: "#10b981", fontSize: 11, fontWeight: 700 }}>✅ {gPresent}</span>
                    <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(239,68,68,0.10)",  color: "#ef4444", fontSize: 11, fontWeight: 700 }}>❌ {gAbsent}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Col>

        {/* ── O'NG: Asosiy board ── */}
        <Col span={18}>
          {/* Statistika */}
          <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
            {[
              { label: "Keldi",    count: counts.present, color: "#10b981", status: "present" },
              { label: "Kechikdi", count: counts.late,    color: "#f59e0b", status: "late"    },
              { label: "Kelmadi",  count: counts.absent,  color: "#ef4444", status: "absent"  },
              { label: "Sababli",  count: counts.excused, color: "#6366f1", status: "excused" },
            ].map((s, i) => (
              <Col span={6} key={i}>
                <div onClick={() => setStatusFilter(statusFilter === s.status ? "all" : s.status)}
                  style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: `1.5px solid ${statusFilter === s.status ? s.color : "#eef0f6"}`, cursor: "pointer", transition: "all 0.15s", boxShadow: statusFilter === s.status ? `0 0 0 3px ${s.color}15` : "none" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginTop: 2 }}>{s.label.toUpperCase()}</div>
                  <div style={{ height: 3, borderRadius: 2, background: `${s.color}20`, marginTop: 8 }}>
                    <div style={{ height: "100%", borderRadius: 2, background: s.color, width: `${(s.count / total) * 100}%`, transition: "width 0.4s" }} />
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          {/* Toolbar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <Input prefix={<SearchOutlined style={{ color: "#94a3b8" }} />} placeholder="Talaba ismi..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 240, borderRadius: 10 }} />
            <Button icon={<ReloadOutlined />} onClick={fetchAttendance} loading={loading} style={{ borderRadius: 10 }} />
            <div style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #eef0f6" }}>
              <Text style={{ fontSize: 13, fontWeight: 700, color: presentPct >= 80 ? "#10b981" : "#f59e0b" }}>{presentPct}% davomat</Text>
            </div>
          </div>

          {/* Talabalar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
            {filtered.map(r => {
              const cfg = ATT_STATUS[r.status] || ATT_STATUS.absent;
              return (
                <div key={r.id}
                  style={{ background: "#fff", borderRadius: 14, padding: "14px 12px", border: `1.5px solid ${cfg.color}25`, boxShadow: `0 2px 8px ${cfg.color}08`, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: cfg.color, opacity: 0.7 }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <Ava name={r.student_name || "?"} color={cfg.color} size={40} />
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#1e1e3a", lineHeight: 1.3 }}>{r.student_name}</div>
                      {r.check_in && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>🕐 {r.check_in}</div>}
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>
                      {cfg.emoji} {cfg.label}
                    </span>
                    <div style={{ display: "flex", gap: 6, width: "100%" }}>
                      <button onClick={() => setStatusModal(r)}
                        style={{ flex: 1, padding: "5px", borderRadius: 8, border: "1px solid #eef0f6", background: "#f8fafc", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#64748b" }}>
                        ✏️ Tahrir
                      </button>
                      {r.status === "absent" && (
                        <button onClick={() => setSmsModal(r)}
                          style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", cursor: "pointer", fontSize: 11, color: "#f59e0b" }}>
                          📱
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kelmagan talabalar bannerи */}
          {counts.absent > 0 && (
            <div style={{ marginTop: 16, padding: "14px 18px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.20)", borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#ef4444", fontWeight: 700 }}>❌ {counts.absent} ta talaba kelmadi — SMS yuborilsinmi?</Text>
              <Button onClick={() => { const first = attendance.find(r => r.status === "absent"); if (first) setSmsModal(first); }}
                style={{ background: "#f59e0b", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 12 }}>
                📱 SMS yuborish
              </Button>
            </div>
          )}
        </Col>
      </Row>

      <StatusModal record={statusModal} open={!!statusModal} onClose={() => setStatusModal(null)} onSuccess={fetchAttendance} />
      <SmsModal    record={smsModal}    open={!!smsModal}    onClose={() => setSmsModal(null)} />
    </div>
  );
}