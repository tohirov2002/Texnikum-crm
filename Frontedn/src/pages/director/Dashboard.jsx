import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Table, Tag, Spin, Alert, Typography, Progress } from "antd";
import dashboardApi from "../../api/dashboard.api";
import { formatCurrency, formatMillions, getInitials } from "../../utils/formatters";

const { Text, Title } = Typography;

const StatCard = ({ emoji, label, value, sub, trend, color }) => (
  <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", height: "100%", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", right: -20, top: -20, width: 100, height: 100, borderRadius: "50%", background: `${color}0c`, pointerEvents: "none" }} />
    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{emoji}</div>
    <Text style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>{label.toUpperCase()}</Text>
    <Title level={3} style={{ margin: "0 0 6px", color: "#1e1e3a" }}>{value}</Title>
    {trend && <span style={{ fontSize: 12, fontWeight: 700, color: trend.up ? "#10b981" : "#ef4444" }}>{trend.up ? "↑" : "↓"} {trend.val}</span>}
    {sub && <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>{sub}</Text>}
  </Card>
);

const BarChart = ({ data = [] }) => {
  if (!data.length) return null;
  const maxV = Math.max(...data.map(d => Math.max(d.income || 0, d.expense || 0))) || 1;
  const W = 500, H = 130, bw = 20, gap = W / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} style={{ width: "100%", height: 170 }}>
      {[0.25, 0.5, 0.75, 1].map((r, i) => <line key={i} x1={0} y1={H - H * r} x2={W} y2={H - H * r} stroke="#f1f5f9" strokeWidth={1} />)}
      {data.map((d, i) => {
        const x = i * gap + gap / 2;
        const incH = ((d.income  || 0) / maxV) * H;
        const expH = ((d.expense || 0) / maxV) * H;
        return (
          <g key={i}>
            <rect x={x - bw - 2} y={H - incH} width={bw} height={incH} rx={4} fill="#6366f1" opacity={0.85} />
            <rect x={x + 2}      y={H - expH} width={bw} height={expH} rx={4} fill="#ef4444" opacity={0.7}  />
            <text x={x} y={H + 16} textAnchor="middle" fontSize={9} fill="#94a3b8">{d.month}</text>
          </g>
        );
      })}
      <rect x={10} y={H + 20} width={8} height={5} rx={1} fill="#6366f1" opacity={0.85} />
      <text x={22} y={H + 26} fontSize={8} fill="#64748b">Daromad</text>
      <rect x={72} y={H + 20} width={8} height={5} rx={1} fill="#ef4444" opacity={0.7} />
      <text x={84} y={H + 26} fontSize={8} fill="#64748b">Xarajat</text>
    </svg>
  );
};

const DonutChart = ({ present = 0, late = 0, absent = 0, total = 1 }) => {
  const pct = Math.round((present + late) / total * 100);
  const R = 38, CX = 56, CY = 56, circ = 2 * Math.PI * R;
  const segs = [{ val: present, color: "#10b981" }, { val: late, color: "#f59e0b" }, { val: absent, color: "#ef4444" }];
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <svg viewBox="0 0 112 112" style={{ width: 112, height: 112, flexShrink: 0 }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={13} />
        {segs.map((s, i) => {
          const dash = (s.val / total) * circ;
          const el = <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={s.color} strokeWidth={13} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />;
          offset += dash;
          return el;
        })}
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize={15} fontWeight={900} fill="#1e1e3a">{pct}%</text>
        <text x={CX} y={CY + 11} textAnchor="middle" fontSize={7} fill="#94a3b8">davomat</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {[{ l: "Keldi", v: present, c: "#10b981" }, { l: "Kechikdi", v: late, c: "#f59e0b" }, { l: "Kelmadi", v: absent, c: "#ef4444" }].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.c }} />
            <Text style={{ fontSize: 12, color: "#64748b" }}>{s.l}:</Text>
            <Text strong style={{ fontSize: 13, color: s.c }}>{s.v}</Text>
          </div>
        ))}
        <Text type="secondary" style={{ fontSize: 11 }}>Jami: {total}</Text>
      </div>
    </div>
  );
};

export default function DirectorDashboard() {
  const navigate  = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    dashboardApi.getDirector()
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Ma'lumot yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spin size="large" /></div>;
  if (error)   return <Alert type="error" message={error} />;
  if (!data)   return null;

  const { texnikum = {}, employees = {}, attendance = {}, finance = {}, monthly_chart = [], kechikuvchilar = [], dept_stats = [], announcements = [] } = data;
  const attTotal   = employees.total || 1;
  const attPresent = attendance.present || 0;
  const attLate    = attendance.late    || 0;
  const attAbsent  = attendance.absent  || 0;

  const lateCols = [
    { title: "#",       key: "i",    width: 40, render: (_, __, i) => <Text type="secondary" style={{ fontSize: 12 }}>{i + 1}</Text> },
    { title: "Xodim",  key: "name", render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#f59e0b" }}>{getInitials(r.employee_name)}</div>
          <Text strong style={{ fontSize: 13 }}>{r.employee_name}</Text>
        </div>
      )
    },
    { title: "Keldi",    dataIndex: "check_in",      key: "in",   render: (t) => t || "—" },
    { title: "Kechikdi", dataIndex: "late_minutes",  key: "late", render: (m) => <Tag color="warning" style={{ borderRadius: 20 }}>{m} daq</Tag> },
    { title: "Jarima",   dataIndex: "penalty_amount",key: "pen",  render: (v) => <Text style={{ color: "#ef4444", fontWeight: 700 }}>{formatCurrency(v)}</Text> },
  ];

  const deptCols = [
    { title: "Bo'lim",   dataIndex: "name",           key: "name", render: (n) => <Text strong>{n}</Text> },
    { title: "Xodimlar", dataIndex: "employees_count",key: "emp",  render: (v) => <Text style={{ color: "#6366f1", fontWeight: 700 }}>{v}</Text> },
    { title: "Davomat",  dataIndex: "attendance_pct", key: "pct",
      render: (v) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Progress percent={v || 0} size="small" style={{ width: 80, margin: 0 }} strokeColor={v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : "#ef4444"} showInfo={false} />
          <Text style={{ fontSize: 12, fontWeight: 700, color: v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : "#ef4444" }}>{v}%</Text>
        </div>
      ),
    },
    { title: "Jarima", dataIndex: "total_penalty", key: "pen", render: (v) => <Text style={{ color: "#ef4444", fontWeight: 700 }}>{formatCurrency(v || 0)}</Text> },
  ];

  return (
    <div>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg,#1e1e3a,#1e3a5f)", borderRadius: 20, padding: "24px 32px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden", boxShadow: "0 8px 32px rgba(99,102,241,0.20)" }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 220, height: 220, borderRadius: "50%", background: "rgba(99,102,241,0.10)", pointerEvents: "none" }} />
        <div style={{ zIndex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, display: "block", marginBottom: 4 }}>📋 Direktor paneli</Text>
          <Title level={3} style={{ color: "#fff", margin: "0 0 4px", letterSpacing: -0.5 }}>{texnikum.name || "Markaz"}</Title>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            {new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </div>
        <div style={{ display: "flex", gap: 12, zIndex: 1 }}>
          {[{ l: "Keldi", v: attPresent, c: "#6ee7b7" }, { l: "Kechikdi", v: attLate, c: "#fcd34d" }, { l: "Kelmadi", v: attAbsent, c: "#fca5a5" }].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "12px 18px", borderRadius: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 3, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat kartalar */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}><StatCard emoji="👥" label="Jami xodimlar"  value={employees.total || 0}   sub={`Aktiv: ${employees.active || 0}`} color="#6366f1" /></Col>
        <Col span={6}><StatCard emoji="📅" label="Davomat foizi"  value={`${Math.round((attPresent + attLate) / attTotal * 100)}%`} sub={`${attAbsent} ta kelmadi`} color="#10b981" /></Col>
        <Col span={6}><StatCard emoji="💰" label="Bu oy xarajat"  value={formatMillions(finance.monthly_expense)} trend={{ up: false, val: "-3.1%" }} color="#ef4444" /></Col>
        <Col span={6}><StatCard emoji="📈" label="Sof foyda"       value={formatMillions(finance.monthly_profit)}  trend={{ up: true,  val: "+5.4%" }} color="#f59e0b" /></Col>
      </Row>

      {/* Grafik + Davomat */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={15}>
          <Card title={<span style={{ fontWeight: 700 }}>📊 6 oylik moliyaviy tahlil</span>} extra={<Text style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/director/expenses")}>Xarajatlar →</Text>} bordered={false} style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <BarChart data={monthly_chart} />
          </Card>
        </Col>
        <Col span={9}>
          <Card title={<span style={{ fontWeight: 700 }}>📅 Bugungi davomat</span>} extra={<Text style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/director/attendance")}>Batafsil →</Text>} bordered={false} style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", height: "100%" }}>
            <DonutChart present={attPresent} late={attLate} absent={attAbsent} total={attTotal} />
          </Card>
        </Col>
      </Row>

      {/* Kechikuvchilar + Bo'limlar */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={14}>
          <Card title={<span style={{ fontWeight: 700 }}>⏱ Bugungi kechikuvchilar</span>} extra={<Text style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/director/attendance")}>Barchasi →</Text>} bordered={false} style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Table dataSource={kechikuvchilar.slice(0, 6)} columns={lateCols} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={10}>
          <Card title={<span style={{ fontWeight: 700 }}>🏢 Bo'limlar davomat</span>} bordered={false} style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Table dataSource={dept_stats} columns={deptCols} rowKey="name" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>

      {/* E'lonlar */}
      {announcements.length > 0 && (
        <Card title={<span style={{ fontWeight: 700 }}>🔔 Oxirgi e'lonlar</span>} bordered={false} style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {announcements.slice(0, 3).map((a, i) => (
              <div key={i} style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 12, borderLeft: "3px solid #6366f1" }}>
                <Text strong style={{ fontSize: 13 }}>{a.title}</Text>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 3 }}>{a.body}</Text>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}