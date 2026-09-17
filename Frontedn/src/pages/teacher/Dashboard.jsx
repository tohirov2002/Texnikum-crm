import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Table, Tag, Spin, Alert, Typography, Progress, Badge } from "antd";
import dashboardApi from "../../api/dashboard.api";
import { formatDate, formatCurrency, getInitials } from "../../utils/formatters";
import { ATT_STATUS } from "../../utils/constants";

const { Text, Title } = Typography;

const COLOR = "#10b981";

// ── Stat karta ────────────────────────────────────────────────────────────────
const StatCard = ({ emoji, label, value, sub, color }) => (
  <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", height: "100%", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", right: -18, top: -18, width: 90, height: 90, borderRadius: "50%", background: `${color}0c`, pointerEvents: "none" }} />
    <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 }}>{emoji}</div>
    <Text style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>{label.toUpperCase()}</Text>
    <Title level={3} style={{ margin: "0 0 4px", color: "#1e1e3a" }}>{value}</Title>
    {sub && <Text type="secondary" style={{ fontSize: 12 }}>{sub}</Text>}
  </Card>
);

// ── Ava ───────────────────────────────────────────────────────────────────────
const Ava = ({ name, color = COLOR, size = 32 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(135deg,${color}28,${color}55)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 800, color, flexShrink: 0 }}>
    {getInitials(name)}
  </div>
);

// ── SVG bar chart (haftalik davomat) ──────────────────────────────────────────
const WeekChart = ({ data = [] }) => {
  if (!data.length) return null;
  const days = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
  const W = 400, H = 80;
  const maxV = Math.max(...data.map(d => d.count || 0)) || 1;
  const gap = W / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: "100%", height: 120 }}>
      {data.map((d, i) => {
        const x   = i * gap + gap / 2;
        const h   = ((d.count || 0) / maxV) * H;
        const clr = d.pct >= 80 ? COLOR : d.pct >= 60 ? "#f59e0b" : "#ef4444";
        return (
          <g key={i}>
            <rect x={x - 14} y={H - h} width={28} height={h} rx={6} fill={clr} opacity={0.85} />
            <text x={x} y={H + 14} textAnchor="middle" fontSize={10} fill="#94a3b8">{days[d.day_of_week ?? i]}</text>
            <text x={x} y={H - h - 4} textAnchor="middle" fontSize={9} fill={clr} fontWeight={700}>{d.count}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ── ASOSIY KOMPONENT ──────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const navigate  = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    dashboardApi.getTeacher?.()
      .then(setData)
      .catch(e => setError(e.response?.data?.error || "Ma'lumot yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spin size="large" /></div>;
  if (error)   return <Alert type="error" message={error} />;
  if (!data)   return null;

  const {
    teacher          = {},
    groups           = {},
    students         = {},
    my_attendance    = {},
    week_chart       = [],
    today_lessons    = [],
    upcoming_lessons = [],
    top_students     = [],
    absent_students  = [],
  } = data;

  // Bugungi davomat rangi
  const myAttCfg  = ATT_STATUS[my_attendance.today_status] || {};
  const myAttColor = myAttCfg.color || "#94a3b8";

  // Bugungi darslar ustunlari
  const lessonCols = [
    { title: "Guruh",    dataIndex: "group_name",  key: "gr",  render: n => <Text strong>{n}</Text> },
    { title: "Mavzu",    dataIndex: "topic",        key: "top", render: t => <Text style={{ fontSize: 12 }}>{t || "—"}</Text> },
    { title: "Vaqt",     key: "time",               render: (_, r) => <Text style={{ fontSize: 12 }}>{r.start_time} – {r.end_time}</Text> },
    { title: "Xona",     dataIndex: "room",         key: "room",render: r => <Tag style={{ borderRadius: 20 }}>🚪 {r}</Tag> },
    { title: "Talabalar",dataIndex: "students_count",key: "st", render: v => <Text style={{ color: "#6366f1", fontWeight: 700 }}>{v || 0}</Text> },
    { title: "Holat",    dataIndex: "status",       key: "st2",
      render: s => <Tag color={s === "finished" ? "success" : s === "ongoing" ? "processing" : "default"} style={{ borderRadius: 20 }}>
        {s === "finished" ? "✅ Tugadi" : s === "ongoing" ? "🔴 Davom etmoqda" : "🕐 Kutilmoqda"}
      </Tag>
    },
  ];

  // Kelmagan talabalar
  const absentCols = [
    { title: "#",       key: "i",    width: 40, render: (_, __, i) => <Text type="secondary" style={{ fontSize: 12 }}>{i + 1}</Text> },
    { title: "Talaba",  key: "name", render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Ava name={r.student_name || "?"} color="#ef4444" size={28} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{r.student_name}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{r.group_name}</div>
          </div>
        </div>
      )
    },
    { title: "Sana",    dataIndex: "date",   key: "date",  render: d => formatDate(d) },
    { title: "Izoh",    dataIndex: "note",   key: "note",  render: n => <Text type="secondary" style={{ fontSize: 11 }}>{n || "—"}</Text> },
  ];

  // Top talabalar
  const topCols = [
    { title: "#",  key: "i", width: 40, render: (_, __, i) => (
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#cd7c47", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff" }}>{i + 1}</div>
      )
    },
    { title: "Talaba", key: "name", render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Ava name={r.full_name || "?"} size={28} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{r.full_name}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{r.group_name}</div>
          </div>
        </div>
      )
    },
    { title: "Davomat", dataIndex: "attendance_pct", key: "att",
      render: v => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Progress percent={v || 0} size="small" style={{ width: 60, margin: 0 }} strokeColor={COLOR} showInfo={false} />
          <Text style={{ fontSize: 12, fontWeight: 700, color: COLOR }}>{v}%</Text>
        </div>
      )
    },
  ];

  return (
    <div>
      {/* ── Banner ── */}
      <div style={{ background: "linear-gradient(135deg,#071a0f,#0d4a2a)", borderRadius: 20, padding: "22px 28px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden", boxShadow: `0 8px 32px ${COLOR}25` }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 200, height: 200, borderRadius: "50%", background: `${COLOR}12`, pointerEvents: "none" }} />
        <div style={{ zIndex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, display: "block", marginBottom: 4 }}>📚 O'qituvchi paneli</Text>
          <Title level={3} style={{ color: "#fff", margin: "0 0 4px", letterSpacing: -0.5 }}>{teacher.last_name} {teacher.first_name}</Title>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            {new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </div>
        <div style={{ display: "flex", gap: 12, zIndex: 1 }}>
          {[
            { l: "Guruhlarim", v: groups.total || 0, c: "#6ee7b7" },
            { l: "Talabalarim",v: students.total || 0, c: "#93c5fd" },
            { l: "Bugun davomatim", v: myAttCfg.label || "—", c: myAttColor },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "10px 16px", borderRadius: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ fontSize: i < 2 ? 22 : 14, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat kartalar ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}><StatCard emoji="📚" label="Guruhlarim"     value={groups.total || 0}   sub={`Faol: ${groups.active || 0}`}       color="#6366f1" /></Col>
        <Col span={6}><StatCard emoji="🎓" label="Jami talabalar" value={students.total || 0} sub={`Bu oy: ${students.new_this_month || 0} yangi`} color="#3b82f6" /></Col>
        <Col span={6}><StatCard emoji="📅" label="Davomat foizim" value={`${my_attendance.month_pct || 0}%`} sub={`Bu oy: ${my_attendance.present_days || 0} kun`} color={COLOR} /></Col>
        <Col span={6}><StatCard emoji="⏱" label="Kechikishlar"   value={`${my_attendance.late_count || 0} marta`} sub={`Jarima: ${formatCurrency(my_attendance.total_penalty || 0)}`} color="#f59e0b" /></Col>
      </Row>

      {/* ── Haftalik davomat + Bugungi darslar ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={10}>
          <Card title={<span style={{ fontWeight: 700 }}>📊 Haftalik davomat (talabalar)</span>} bordered={false} style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <WeekChart data={week_chart} />
            <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
              {[
                { l: "O'rtacha", v: `${students.avg_attendance_pct || 0}%`, c: COLOR },
                { l: "Kelmagan", v: `${students.absent_count || 0} ta`,     c: "#ef4444" },
              ].map((s, i) => (
                <Col span={12} key={i}>
                  <div style={{ textAlign: "center", padding: "8px", background: `${s.c}08`, borderRadius: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{s.l}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col span={14}>
          <Card
            title={<span style={{ fontWeight: 700 }}>🎯 Bugungi darslar</span>}
            extra={<Text style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/teacher/lessons")}>Barchasini →</Text>}
            bordered={false} style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {today_lessons.length > 0
              ? <Table dataSource={today_lessons} columns={lessonCols} rowKey="id" pagination={false} size="small" />
              : <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8" }}>📭 Bugun dars yo'q</div>
            }
          </Card>
        </Col>
      </Row>

      {/* ── Kelmagan talabalar + Top talabalar ── */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card
            title={<span style={{ fontWeight: 700 }}>❌ Bugun kelmagan talabalar</span>}
            extra={<Badge count={absent_students.length} style={{ background: "#ef4444" }} />}
            bordered={false} style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {absent_students.length > 0
              ? <Table dataSource={absent_students.slice(0, 5)} columns={absentCols} rowKey="id" pagination={false} size="small" />
              : <div style={{ textAlign: "center", padding: "20px 0", color: "#10b981" }}>✅ Hammasi keldi!</div>
            }
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={<span style={{ fontWeight: 700 }}>🏆 Eng faol talabalar</span>}
            bordered={false} style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Table dataSource={top_students.slice(0, 5)} columns={topCols} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}