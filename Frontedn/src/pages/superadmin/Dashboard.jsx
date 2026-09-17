import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Table, Tag, Spin, Typography, Alert } from "antd";
import { BankOutlined, TeamOutlined, DollarOutlined, WarningOutlined } from "@ant-design/icons";
import dashboardApi from "../../api/dashboard.api";
import { formatCurrency, formatMillions, formatDate, getDaysLeft } from "../../utils/formatters";
import { SUB_STATUS } from "../../utils/constants";

const { Text, Title } = Typography;

// ─── SafeValue — object kelsa crash bo'lmaydi ────────────────────────────────
const safeStr = (val) => {
  if (val === null || val === undefined) return "0";
  if (typeof val === "object") return JSON.stringify(val); // xato bo'lsa ko'rinadi
  return String(val);
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, trend, color }) => (
  <Card
    variant="borderless"
    style={{
      borderRadius: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      height: "100%",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute", right: -16, top: -16,
        width: 90, height: 90, borderRadius: "50%",
        background: `${color}0d`,
      }}
    />
    <div
      style={{
        width: 38, height: 38, borderRadius: 10,
        background: `${color}12`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color, fontSize: 20, marginBottom: 14,
      }}
    >
      {icon}
    </div>
    <Text
      style={{
        fontSize: 11, fontWeight: 700, color: "#94a3b8",
        letterSpacing: 0.5, display: "block", marginBottom: 6,
      }}
    >
      {safeStr(label).toUpperCase()}
    </Text>
    {/* value ni safeStr orqali render qilamiz — object kelsa crash bo'lmaydi */}
    <Title level={3} style={{ margin: "0 0 6px", color: "#1e1e3a" }}>
      {safeStr(value)}
    </Title>
    {trend && (
      <Tag color={trend.up ? "success" : "error"} style={{ borderRadius: 20 }}>
        {trend.up ? "↑" : "↓"} {safeStr(trend.val)}
      </Tag>
    )}
    {sub && (
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
        {safeStr(sub)}
      </Text>
    )}
  </Card>
);

// ─── SVG Mini bar chart ───────────────────────────────────────────────────────
const MiniBarChart = ({ data = [] }) => {
  if (!data.length) return (
    <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 12 }}>
      Ma'lumot yo'q
    </div>
  );
  const maxV = Math.max(...data.map((d) => d.income || 0)) || 1;
  const W = 100, H = 40;
  return (
    <svg viewBox={`0 0 ${W} ${H + 10}`} style={{ width: "100%", height: 60 }}>
      {data.map((d, i) => {
        const bw = W / data.length - 2;
        const x  = i * (W / data.length) + 1;
        const bh = ((d.income || 0) / maxV) * (H - 8);
        return (
          <g key={i}>
            <rect x={x} y={H - bh} width={bw} height={bh} rx={2} fill="#6366f1" opacity={0.8} />
            <text x={x + bw / 2} y={H + 9} textAnchor="middle" fontSize={5} fill="#94a3b8">
              {d.month || i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── ASOSIY KOMPONENT ─────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    dashboardApi
      .getSuperAdmin()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.error || "Ma'lumot yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  if (error)
    return <Alert type="error" message={error} style={{ margin: 24, borderRadius: 12 }} />;
  if (!data) return null;

  const {
    texnikum        = {},
    users           = {},
    overview        = {},
    finance         = {},
    attendance_today = {},
    texnikum_stats  = [],
    recent_logs     = [],
    growth_chart    = [],
  } = data;

  // formatMillions xato qaytarsa string qilib olamiz
  const monthlyIncomeStr = safeStr(formatMillions(finance?.monthly_income));

  // expiring_soon array yoki raqam bo'lishi mumkin
  const expiringCount = Array.isArray(texnikum?.expiring_soon)
    ? texnikum.expiring_soon.length
    : texnikum?.expiring_soon || 0;

  // ── Texnikumlar jadvali ustunlari ──
  const texnikumColumns = [
    {
      title: "Texnikum",
      dataIndex: "name",
      key: "name",
      render: (name, rec) => (
        <div>
          <div style={{ fontWeight: 700, color: "#1e1e3a" }}>{safeStr(name)}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {safeStr(rec.founder)}
          </Text>
        </div>
      ),
    },
    {
      title: "Xodimlar",
      dataIndex: "employees_count",
      key: "employees",
      align: "center",
      render: (v) => (
        <Text strong style={{ color: "#6366f1" }}>
          {v || 0}
        </Text>
      ),
    },
    {
      title: "Talabalar",
      dataIndex: "students_count",
      key: "students",
      align: "center",
      render: (v) => (
        <Text strong style={{ color: "#3b82f6" }}>
          {v || 0}
        </Text>
      ),
    },
    {
      title: "Obuna",
      dataIndex: "subscription_end",
      key: "sub",
      render: (date) => {
        // date object bo'lib kelishi mumkin — string ga o'tkazamiz
        const dateStr = date && typeof date === "object" ? date.subscription_end || "" : date;
        const days    = getDaysLeft(dateStr);
        const status  = days < 0 ? "expired" : days <= 7 ? "critical" : days <= 30 ? "warning" : "active";
        const cfg     = SUB_STATUS[status] || {};
        return (
          <Tag
            color={
              status === "active" ? "success" : status === "warning" ? "warning" : "error"
            }
            style={{ borderRadius: 20, fontSize: 11 }}
          >
            {cfg.label} {days >= 0 ? `(${days} kun)` : ""}
          </Tag>
        );
      },
    },
    {
      title: "Holat",
      dataIndex: "is_active",
      key: "active",
      render: (v) => (
        <Tag color={v ? "success" : "default"}>{v ? "Aktiv" : "Nofaol"}</Tag>
      ),
    },
    {
      title: "",
      key: "action",
      render: (_, rec) => (
        <Text
          style={{ color: "#6366f1", fontWeight: 600, cursor: "pointer", fontSize: 12 }}
          onClick={() => navigate(`/superadmin/texnikumlar/${rec.id}`)}
        >
          Ko'rish →
        </Text>
      ),
    },
  ];

  // ── Loglar jadvali ustunlari ──
  const logColumns = [
    {
      title: "Foydalanuvchi",
      dataIndex: "user",
      key: "user",
      render: (u) => <Text strong>{safeStr(u)}</Text>,
    },
    {
      title: "Amal",
      dataIndex: "action",
      key: "action",
      render: (a) => <Text style={{ fontSize: 12 }}>{safeStr(a)}</Text>,
    },
    {
      title: "Vaqt",
      dataIndex: "created_at",
      key: "time",
      render: (t) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t
            ? new Date(t).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
            : "—"}
        </Text>
      ),
    },
  ];

  return (
    <div>
      {/* ── Welcome banner ── */}
      <div
        style={{
          background: "linear-gradient(135deg,#1e1e3a,#312e81)",
          borderRadius: 20,
          padding: "24px 32px",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(99,102,241,0.20)",
        }}
      >
        <div
          style={{
            position: "absolute", right: -20, top: -20,
            width: 180, height: 180, borderRadius: "50%",
            background: "rgba(99,102,241,0.12)", pointerEvents: "none",
          }}
        />
        <div style={{ zIndex: 1 }}>
          <Text
            style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, display: "block", marginBottom: 4 }}
          >
            👑 SuperAdmin
          </Text>
          <Title level={3} style={{ color: "#fff", margin: 0, letterSpacing: -0.5 }}>
            Global Boshqaruv Paneli
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            {new Date().toLocaleDateString("uz-UZ", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </Text>
        </div>
        <div style={{ display: "flex", gap: 12, zIndex: 1 }}>
          {[
            { l: "Aktiv markazlar",  v: texnikum?.active || 0,         c: "#6ee7b7" },
            { l: "Jami foydalanuvchi", v: users?.total     || 0,         c: "#a5b4fc" },
            { l: "Bu oy tushum",       v: monthlyIncomeStr,              c: "#fcd34d" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: "center", padding: "12px 18px", borderRadius: 14,
                background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 900, color: s.c }}>
                {safeStr(s.v)}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 3, fontWeight: 600 }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat kartalar ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <StatCard
            icon={<BankOutlined />}
            label="Jami Markazlar"
            value={texnikum?.total || 0}
            sub={`${texnikum?.inactive || 0} nofaol`}
            color="#6366f1"
          />
        </Col>
        <Col span={6}>
          <StatCard
            icon={<TeamOutlined />}
            label="Jami foydalanuvchilar"
            value={users?.total || 0}
            sub={`Bu oy: +${users?.new_this_month || 0}`}
            color="#3b82f6"
          />
        </Col>
        <Col span={6}>
          <StatCard
            icon={<DollarOutlined />}
            label="Bu oy tushum"
            value={monthlyIncomeStr}
            trend={{ up: true, val: "+7.8%" }}
            color="#10b981"
          />
        </Col>
        <Col span={6}>
          <StatCard
            icon={<WarningOutlined />}
            label="Diqqat talab"
            value={expiringCount}
            sub="Obuna tugayotgan markazlar"
            color="#f59e0b"
          />
        </Col>
      </Row>

      {/* ── Chart + Texnikumlar ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card
            title={<span style={{ fontWeight: 700 }}>Markazlar ro'yxati</span>}
            extra={
              <Text
                style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }}
                onClick={() => navigate("/superadmin/texnikumlar")}
              >
                Barchasini ko'rish →
              </Text>
            }
            variant="borderless"
            style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <Table
              dataSource={texnikum_stats.slice(0, 6)}
              columns={texnikumColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title={<span style={{ fontWeight: 700 }}>Oylik tushum dinamikasi</span>}
            variant="borderless"
            style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", height: "100%" }}
          >
            <MiniBarChart data={growth_chart} />
            <div style={{ marginTop: 16 }}>
              <Row gutter={8}>
                {[
                  { l: "Xodimlar",  v: overview?.total_employees || 0, c: "#6366f1" },
                  { l: "Talabalar", v: overview?.total_students  || 0, c: "#3b82f6" },
                  { l: "Guruhlar",  v: overview?.total_groups    || 0, c: "#10b981" },
                ].map((s, i) => (
                  <Col span={8} key={i}>
                    <div
                      style={{
                        textAlign: "center", padding: "10px 0",
                        background: `${s.c}08`, borderRadius: 10,
                      }}
                    >
                      <div style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{s.l}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Davomat + Loglar ── */}
      <Row gutter={[16, 16]}>
        <Col span={10}>
          <Card
            title={<span style={{ fontWeight: 700 }}>Bugungi davomat (global)</span>}
            variant="borderless"
            style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <Row gutter={[12, 12]}>
              {[
                { l: "Xodimlar keldi",    v: attendance_today?.employees_present || 0, c: "#10b981" },
                { l: "Xodimlar kechikdi", v: attendance_today?.employees_late    || 0, c: "#f59e0b" },
                { l: "Talabalar keldi",   v: attendance_today?.students_present  || 0, c: "#3b82f6" },
                { l: "Talabalar kelmadi", v: attendance_today?.students_absent   || 0, c: "#ef4444" },
              ].map((s, i) => (
                <Col span={12} key={i}>
                  <div
                    style={{
                      padding: "14px",
                      background: `${s.c}08`,
                      borderRadius: 12,
                      border: `1px solid ${s.c}20`,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 28, fontWeight: 900, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginTop: 3 }}>
                      {s.l}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col span={14}>
          <Card
            title={<span style={{ fontWeight: 700 }}>So'nggi harakatlar</span>}
            variant="borderless"
            style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <Table
              dataSource={recent_logs.slice(0, 8)}
              columns={logColumns}
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