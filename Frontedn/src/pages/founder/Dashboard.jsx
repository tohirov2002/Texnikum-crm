import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Row, Col, Card, Table, Tag, Spin, Alert,
  Typography, Progress, Badge,
} from "antd";
import {
  TeamOutlined, DollarOutlined, RiseOutlined, FallOutlined,
} from "@ant-design/icons";
import dashboardApi from "../../api/dashboard.api";
import {
  formatCurrency, formatMillions, formatDate, formatPercent,
} from "../../utils/formatters";
import { ATT_STATUS } from "../../utils/constants";

const { Text, Title } = Typography;

// ─── Stat karta ───────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, trend, color }) => (
  <Card
    bordered={false}
    style={{
      borderRadius: 16, height: "100%", position: "relative", overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}
  >
    <div style={{
      position: "absolute", right: -20, top: -20,
      width: 100, height: 100, borderRadius: "50%",
      background: `${color}0c`, pointerEvents: "none",
    }} />
    <div style={{
      width: 40, height: 40, borderRadius: 12,
      background: `${color}12`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color, fontSize: 20, marginBottom: 14,
    }}>
      {icon}
    </div>
    <Text style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>
      {label.toUpperCase()}
    </Text>
    <Title level={3} style={{ margin: "0 0 6px", color: "#1e1e3a" }}>{value}</Title>
    {trend && (
      <span style={{
        fontSize: 12, fontWeight: 700,
        color: trend.up ? "#10b981" : "#ef4444",
        display: "inline-flex", alignItems: "center", gap: 3,
      }}>
        {trend.up ? <RiseOutlined /> : <FallOutlined />} {trend.val}
      </span>
    )}
    {sub && (
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>{sub}</Text>
    )}
  </Card>
);

// ─── SVG Bar chart (oylik daromad vs xarajat) ────────────────────────────────
const BarChart = ({ data = [] }) => {
  if (!data.length) return <div style={{ color: "#94a3b8", textAlign: "center", padding: 20 }}>Ma'lumot yo'q</div>;
  const maxV = Math.max(...data.map(d => Math.max(d.income || 0, d.expense || 0))) || 1;
  const W = 500, H = 140, barW = 24, gap = W / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: "100%", height: 180 }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((r, i) => (
        <line key={i} x1={0} y1={H - H * r} x2={W} y2={H - H * r}
          stroke="#f1f5f9" strokeWidth={1} />
      ))}

      {data.map((d, i) => {
        const x      = i * gap + gap / 2;
        const incH   = ((d.income  || 0) / maxV) * H;
        const expH   = ((d.expense || 0) / maxV) * H;
        return (
          <g key={i}>
            {/* Income bar */}
            <rect
              x={x - barW - 2} y={H - incH} width={barW} height={incH}
              rx={4} fill="#6366f1" opacity={0.85}
            />
            {/* Expense bar */}
            <rect
              x={x + 2} y={H - expH} width={barW} height={expH}
              rx={4} fill="#ef4444" opacity={0.7}
            />
            {/* Label */}
            <text x={x} y={H + 18} textAnchor="middle" fontSize={10} fill="#94a3b8">
              {d.month}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <rect x={10}  y={H + 22} width={10} height={6} rx={2} fill="#6366f1" opacity={0.85} />
      <text x={24}  y={H + 29} fontSize={9} fill="#64748b">Daromad</text>
      <rect x={80}  y={H + 22} width={10} height={6} rx={2} fill="#ef4444" opacity={0.7}  />
      <text x={94}  y={H + 29} fontSize={9} fill="#64748b">Xarajat</text>
    </svg>
  );
};

// ─── Donut chart (davomat) ────────────────────────────────────────────────────
const DonutChart = ({ present = 0, late = 0, absent = 0, total = 1 }) => {
  const pct     = Math.round((present + late) / total * 100);
  const R       = 40, CX = 60, CY = 60, circ = 2 * Math.PI * R;
  const segments = [
    { val: present, color: "#10b981" },
    { val: late,    color: "#f59e0b" },
    { val: absent,  color: "#ef4444" },
  ];
  let offset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, flexShrink: 0 }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={14} />
        {segments.map((s, i) => {
          const dash = (s.val / total) * circ;
          const el = (
            <circle key={i} cx={CX} cy={CY} r={R} fill="none"
              stroke={s.color} strokeWidth={14}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            />
          );
          offset += dash;
          return el;
        })}
        <text x={CX} y={CY - 5} textAnchor="middle" fontSize={16} fontWeight={900} fill="#1e1e3a">{pct}%</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize={8} fill="#94a3b8">davomat</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { l: "Keldi",    v: present, c: "#10b981" },
          { l: "Kechikdi", v: late,    c: "#f59e0b" },
          { l: "Kelmadi",  v: absent,  c: "#ef4444" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.c, flexShrink: 0 }} />
            <Text style={{ fontSize: 12, color: "#64748b" }}>{s.l}:</Text>
            <Text strong style={{ fontSize: 13, color: s.c }}>{s.v}</Text>
          </div>
        ))}
        <Text type="secondary" style={{ fontSize: 11, marginTop: 2 }}>Jami: {total} xodim</Text>
      </div>
    </div>
  );
};

// ─── ASOSIY KOMPONENT ─────────────────────────────────────────────────────────
export default function FounderDashboard() {
  const navigate  = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    dashboardApi.getFounder()
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Ma'lumot yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spin size="large" /></div>;
  if (error)   return <Alert type="error" message={error} style={{ margin: 24 }} />;
  if (!data)   return null;

  const {
    texnikum       = {},
    employees      = {},
    students       = {},
    finance        = {},
    attendance     = {},
    monthly_chart  = [],
    top_employees  = [],
    recent_actions = [],
  } = data;

  // Davomat
  const attPresent = attendance.present || 0;
  const attLate    = attendance.late    || 0;
  const attAbsent  = attendance.absent  || 0;
  const attTotal   = employees.total    || 1;

  // So'nggi harakatlar jadvali
  const actionCols = [
    { title: "Xodim",  dataIndex: "employee_name", key: "name",
      render: (n) => <Text strong>{n || "—"}</Text> },
    { title: "Amal",   dataIndex: "description",   key: "desc",
      render: (d) => <Text style={{ fontSize: 12 }}>{d}</Text> },
    { title: "Vaqt",   dataIndex: "created_at",    key: "time",
      render: (t) => <Text type="secondary" style={{ fontSize: 11 }}>{t ? new Date(t).toLocaleString("uz-UZ") : "—"}</Text> },
  ];

  // Top xodimlar jadvali
  const empCols = [
    { title: "#", key: "i", width: 40, render: (_, __, i) => <Text type="secondary">{i + 1}</Text> },
    { title: "Xodim", dataIndex: "full_name", key: "name",
      render: (n) => <Text strong>{n}</Text> },
    { title: "Lavozim", dataIndex: "position", key: "pos",
      render: (p) => <Text type="secondary" style={{ fontSize: 12 }}>{p || "—"}</Text> },
    { title: "Davomat", dataIndex: "attendance_pct", key: "att",
      render: (v) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Progress percent={v || 0} size="small" style={{ width: 80, margin: 0 }}
            strokeColor={v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : "#ef4444"} showInfo={false} />
          <Text style={{ fontSize: 12, fontWeight: 700, color: v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : "#ef4444" }}>
            {v || 0}%
          </Text>
        </div>
      ),
    },
    { title: "Maosh", dataIndex: "monthly_salary", key: "sal",
      render: (v) => <Text strong style={{ color: "#10b981" }}>{formatCurrency(v)}</Text> },
  ];

  return (
    <div>
      {/* ── Welcome banner ── */}
      <div style={{
        background: "linear-gradient(135deg,#1e1e3a,#4c1d95)",
        borderRadius: 20, padding: "24px 32px", marginBottom: 24,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "relative", overflow: "hidden",
        boxShadow: "0 8px 32px rgba(139,92,246,0.25)",
      }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 220, height: 220, borderRadius: "50%", background: "rgba(139,92,246,0.12)", pointerEvents: "none" }} />
        <div style={{ zIndex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, display: "block", marginBottom: 4 }}>
            🏛 Ta'sischi paneli
          </Text>
          <Title level={3} style={{ color: "#fff", margin: "0 0 4px", letterSpacing: -0.5 }}>
            {texnikum.name || "Texnikum"}
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            📍 {texnikum.address} · {new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long" })}
          </Text>
        </div>
        <div style={{ display: "flex", gap: 12, zIndex: 1 }}>
          {[
            { l: "Xodimlar",  v: employees.total  || 0, c: "#c4b5fd" },
            { l: "Talabalar", v: students.total    || 0, c: "#93c5fd" },
            { l: "Bu oy foyda", v: formatMillions(finance.monthly_profit), c: "#6ee7b7" },
          ].map((s, i) => (
            <div key={i} style={{
              textAlign: "center", padding: "12px 18px", borderRadius: 14,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 3, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat kartalar ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <StatCard icon={<TeamOutlined />}   label="Jami xodimlar"   value={employees.total  || 0}
            sub={`Aktiv: ${employees.active || 0}`} color="#6366f1" />
        </Col>
        <Col span={6}>
          <StatCard icon="🎓"                 label="Jami talabalar"  value={students.total   || 0}
            sub={`Guruhlar: ${students.groups_count || 0}`} color="#3b82f6" />
        </Col>
        <Col span={6}>
          <StatCard icon={<DollarOutlined />} label="Bu oy daromad"   value={formatMillions(finance.monthly_income)}
            trend={{ up: true, val: "+8.2%" }} color="#10b981" />
        </Col>
        <Col span={6}>
          <StatCard icon={<DollarOutlined />} label="Bu oy xarajat"   value={formatMillions(finance.monthly_expense)}
            sub={`Sof foyda: ${formatMillions(finance.monthly_profit)}`} color="#f59e0b" />
        </Col>
      </Row>

      {/* ── Grafik + Davomat ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card
            title={<span style={{ fontWeight: 700 }}>📊 Oylik moliyaviy tahlil</span>}
            extra={
              <Text style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }}
                onClick={() => navigate("/founder/finance")}>
                Batafsil →
              </Text>
            }
            bordered={false}
            style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <BarChart data={monthly_chart} />
            <Row gutter={[12, 0]} style={{ marginTop: 8 }}>
              {[
                { l: "Yillik daromad",   v: formatMillions(finance.yearly_income),  c: "#6366f1" },
                { l: "Yillik xarajat",   v: formatMillions(finance.yearly_expense), c: "#ef4444" },
                { l: "Yillik sof foyda", v: formatMillions(finance.yearly_profit),  c: "#10b981" },
              ].map((s, i) => (
                <Col span={8} key={i}>
                  <div style={{ textAlign: "center", padding: "10px", background: `${s.c}08`, borderRadius: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginTop: 2 }}>{s.l}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title={<span style={{ fontWeight: 700 }}>📅 Bugungi davomat</span>}
            extra={
              <Text style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }}
                onClick={() => navigate("/founder/hr")}>
                HR →
              </Text>
            }
            bordered={false}
            style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", height: "100%" }}
          >
            <DonutChart
              present={attPresent}
              late={attLate}
              absent={attAbsent}
              total={attTotal}
            />

            {/* Kechikuvchilar */}
            {attLate > 0 && (
              <div style={{
                marginTop: 16, padding: "10px 14px",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 10,
              }}>
                <Text style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>
                  ⏱ {attLate} ta xodim kechikdi
                </Text>
              </div>
            )}
            {attAbsent > 0 && (
              <div style={{
                marginTop: 8, padding: "10px 14px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10,
              }}>
                <Text style={{ fontSize: 12, color: "#ef4444", fontWeight: 700 }}>
                  ❌ {attAbsent} ta xodim kelmadi
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Top xodimlar + So'nggi harakatlar ── */}
      <Row gutter={[16, 16]}>
        <Col span={14}>
          <Card
            title={<span style={{ fontWeight: 700 }}>🏆 Top xodimlar (davomat bo'yicha)</span>}
            extra={
              <Text style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }}
                onClick={() => navigate("/founder/hr")}>
                Barchasini ko'rish →
              </Text>
            }
            bordered={false}
            style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <Table
              dataSource={top_employees}
              columns={empCols}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col span={10}>
          <Card
            title={<span style={{ fontWeight: 700 }}>🕐 So'nggi harakatlar</span>}
            bordered={false}
            style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <Table
              dataSource={recent_actions}
              columns={actionCols}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}