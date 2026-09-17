import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Table, Tag, Spin, Alert, Typography, Progress, Badge } from "antd";
import dashboardApi from "../../api/dashboard.api";
import { formatCurrency, formatDate, getInitials } from "../../utils/formatters";
import { ATT_STATUS } from "../../utils/constants";

const { Text, Title } = Typography;

// ─── Stat karta ───────────────────────────────────────────────────────────────
const StatCard = ({ emoji, label, value, sub, color }) => (
  <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", height: "100%", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", right: -18, top: -18, width: 90, height: 90, borderRadius: "50%", background: `${color}0c`, pointerEvents: "none" }} />
    <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, marginBottom: 12 }}>{emoji}</div>
    <Text style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>{label.toUpperCase()}</Text>
    <Title level={3} style={{ margin: "0 0 4px", color: "#1e1e3a" }}>{value}</Title>
    {sub && <Text type="secondary" style={{ fontSize: 12 }}>{sub}</Text>}
  </Card>
);

// ─── Mini donut ───────────────────────────────────────────────────────────────
const MiniDonut = ({ present = 0, late = 0, absent = 0, total = 1 }) => {
  const pct   = Math.round((present + late) / total * 100);
  const R     = 32, CX = 48, CY = 48, circ = 2 * Math.PI * R;
  const segs  = [{ v: present, c: "#10b981" }, { v: late, c: "#f59e0b" }, { v: absent, c: "#ef4444" }];
  let offset  = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <svg viewBox="0 0 96 96" style={{ width: 96, height: 96, flexShrink: 0 }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={11} />
        {segs.map((s, i) => {
          const dash = (s.v / total) * circ;
          const el   = <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={s.c} strokeWidth={11} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />;
          offset += dash;
          return el;
        })}
        <text x={CX} y={CY - 3} textAnchor="middle" fontSize={14} fontWeight={900} fill="#1e1e3a">{pct}%</text>
        <text x={CX} y={CY + 11} textAnchor="middle" fontSize={7} fill="#94a3b8">davomat</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[{ l: "Keldi", v: present, c: "#10b981" }, { l: "Kechikdi", v: late, c: "#f59e0b" }, { l: "Kelmadi", v: absent, c: "#ef4444" }].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.c }} />
            <Text style={{ fontSize: 12, color: "#64748b" }}>{s.l}:</Text>
            <Text strong style={{ fontSize: 13, color: s.c }}>{s.v}</Text>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── ASOSIY KOMPONENT ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate  = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    dashboardApi.getCenterAdmin()
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Ma'lumot yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spin size="large" /></div>;
  if (error)   return <Alert type="error" message={error} />;
  if (!data)   return null;

  const {
    texnikum         = {},
    groups           = {},
    students         = {},
    attendance_today = {},
    payments         = {},
    recent_payments  = [],
    group_stats      = [],
    debtors          = [],
  } = data;

  const attTotal   = students.total  || 1;
  const attPresent = attendance_today.present || 0;
  const attLate    = attendance_today.late    || 0;
  const attAbsent  = attendance_today.absent  || 0;

  // Guruh statistikasi ustunlari
  const groupCols = [
    { title: "Guruh", dataIndex: "name", key: "name", render: (n, r) => (
        <div>
          <div style={{ fontWeight: 700 }}>{n}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.teacher_name || "—"}</div>
        </div>
      )
    },
    { title: "Talabalar", dataIndex: "students_count", key: "st", render: (v) => <Text style={{ color: "#6366f1", fontWeight: 700 }}>{v}</Text> },
    {
      title: "Davomat", dataIndex: "attendance_pct", key: "att",
      render: (v) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Progress percent={v || 0} size="small" style={{ width: 70, margin: 0 }}
            strokeColor={v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : "#ef4444"} showInfo={false} />
          <Text style={{ fontSize: 12, fontWeight: 700, color: v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : "#ef4444" }}>{v}%</Text>
        </div>
      ),
    },
    { title: "To'lov", dataIndex: "payment_pct", key: "pay",
      render: (v) => <Tag color={v >= 80 ? "success" : v >= 50 ? "warning" : "error"} style={{ borderRadius: 20 }}>{v}%</Tag>
    },
    {
      title: "", key: "action",
      render: (_, r) => <Text style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600, fontSize: 12 }} onClick={() => navigate(`/admin/groups`)}>Ko'rish →</Text>
    },
  ];

  // Qarzdorlar ustunlari
  const debtorCols = [
    { title: "#", key: "i", width: 40, render: (_, __, i) => <Text type="secondary" style={{ fontSize: 12 }}>{i + 1}</Text> },
    { title: "Talaba", key: "name", render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#ef4444" }}>
            {getInitials(r.full_name)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{r.full_name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.group_name}</div>
          </div>
        </div>
      )
    },
    { title: "Qarzdorlik", dataIndex: "debt_amount", key: "debt",
      render: (v) => <Text strong style={{ color: "#ef4444" }}>{formatCurrency(v)}</Text>
    },
    { title: "Oxirgi to'lov", dataIndex: "last_payment_date", key: "last", render: (d) => formatDate(d) || "—" },
  ];

  // So'nggi to'lovlar
  const paymentCols = [
    { title: "Talaba",  dataIndex: "student_name", key: "st",  render: (n) => <Text strong>{n}</Text> },
    { title: "Guruh",   dataIndex: "group_name",   key: "gr",  render: (n) => <Text type="secondary">{n}</Text> },
    { title: "Miqdor",  dataIndex: "amount",        key: "amt", render: (v) => <Text strong style={{ color: "#10b981" }}>{formatCurrency(v)}</Text> },
    { title: "Sana",    dataIndex: "date",          key: "dt",  render: (d) => formatDate(d) },
    { title: "Usul",    dataIndex: "method",        key: "m",
      render: (m) => <Tag style={{ borderRadius: 20 }}>{m === "cash" ? "💵 Naqd" : m === "card" ? "💳 Karta" : "🔄 O'tkazma"}</Tag>
    },
  ];

  return (
    <div>
      {/* ── Banner ── */}
      <div style={{ background: "linear-gradient(135deg,#1e1e3a,#1e3a5f)", borderRadius: 20, padding: "22px 28px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden", boxShadow: "0 8px 32px rgba(59,130,246,0.20)" }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 200, height: 200, borderRadius: "50%", background: "rgba(59,130,246,0.10)", pointerEvents: "none" }} />
        <div style={{ zIndex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, display: "block", marginBottom: 4 }}>🎓 Markaz Admini</Text>
          <Title level={3} style={{ color: "#fff", margin: "0 0 4px", letterSpacing: -0.5 }}>{texnikum.name || "Markaz"}</Title>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            {new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </div>
        <div style={{ display: "flex", gap: 12, zIndex: 1 }}>
          {[
            { l: "Guruhlar",   v: groups.total    || 0, c: "#a5b4fc" },
            { l: "Talabalar",  v: students.total  || 0, c: "#93c5fd" },
            { l: "Bu oy tushum", v: formatCurrency(payments.monthly_income || 0), c: "#6ee7b7" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "10px 16px", borderRadius: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat kartalar ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}><StatCard emoji="📚" label="Jami guruhlar"    value={groups.total    || 0} sub={`Faol: ${groups.active || 0}`}                       color="#6366f1" /></Col>
        <Col span={6}><StatCard emoji="🎓" label="Jami talabalar"   value={students.total  || 0} sub={`Qarzdorlar: ${students.debtors_count || 0} ta`}      color="#3b82f6" /></Col>
        <Col span={6}><StatCard emoji="✅" label="Bugungi davomat"  value={`${Math.round((attPresent + attLate) / attTotal * 100)}%`} sub={`${attAbsent} ta kelmadi`} color="#10b981" /></Col>
        <Col span={6}><StatCard emoji="💳" label="Bu oy to'lovlar"  value={formatCurrency(payments.monthly_income || 0)} sub={`${payments.count || 0} ta to'lov`} color="#f59e0b" /></Col>
      </Row>

      {/* ── Guruh statistikasi + Davomat ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={15}>
          <Card
            title={<span style={{ fontWeight: 700 }}>📚 Guruhlar statistikasi</span>}
            extra={<Text style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/admin/groups")}>Barchasini →</Text>}
            bordered={false} style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <Table dataSource={group_stats.slice(0, 6)} columns={groupCols} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={9}>
          <Card
            title={<span style={{ fontWeight: 700 }}>📅 Bugungi davomat</span>}
            extra={<Text style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/admin/live-attendance")}>Jonli →</Text>}
            bordered={false} style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", height: "100%" }}
          >
            <MiniDonut present={attPresent} late={attLate} absent={attAbsent} total={attTotal} />
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              {attAbsent > 0 && (
                <div style={{ flex: 1, padding: "8px 12px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.20)", borderRadius: 10 }}>
                  <Text style={{ fontSize: 12, color: "#ef4444", fontWeight: 700 }}>❌ {attAbsent} ta kelmadi</Text>
                </div>
              )}
              {attLate > 0 && (
                <div style={{ flex: 1, padding: "8px 12px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.20)", borderRadius: 10 }}>
                  <Text style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>⏱ {attLate} ta kechikdi</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Qarzdorlar + So'nggi to'lovlar ── */}
      <Row gutter={[16, 16]}>
        <Col span={10}>
          <Card
            title={<span style={{ fontWeight: 700 }}>⚠ Qarzdor talabalar</span>}
            extra={<Badge count={debtors.length} style={{ background: "#ef4444" }} />}
            bordered={false} style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <Table dataSource={debtors.slice(0, 6)} columns={debtorCols} rowKey="id" pagination={false} size="small" />
            {debtors.length > 6 && (
              <Text style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600, fontSize: 12, display: "block", textAlign: "center", marginTop: 10 }}
                onClick={() => navigate("/admin/students")}>
                Barchasini ko'rish ({debtors.length}) →
              </Text>
            )}
          </Card>
        </Col>
        <Col span={14}>
          <Card
            title={<span style={{ fontWeight: 700 }}>💳 So'nggi to'lovlar</span>}
            extra={<Text style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/admin/payments")}>Barchasini →</Text>}
            bordered={false} style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <Table dataSource={recent_payments.slice(0, 6)} columns={paymentCols} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}