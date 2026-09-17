import { useEffect, useState, useCallback } from "react";
import {
  Row, Col, Card, Table, Tag, Select, DatePicker,
  Spin, Alert, Typography, Button, Tabs, Progress,
} from "antd";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import dashboardApi from "../../api/dashboard.api";
import { expenseApi, payrollApi } from "../../api/resources.api";
import { formatCurrency, formatMillions, formatDate } from "../../utils/formatters";
import { PAYROLL_STATUS, EXPENSE_CATEGORIES } from "../../utils/constants";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const { Option } = Select;

// ─── Stat karta ───────────────────────────────────────────────────────────────
const StatCard = ({ emoji, label, value, sub, color }) => (
  <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `${color}10`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
      }}>{emoji}</div>
      <div>
        <Text style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.5, display: "block" }}>
          {label.toUpperCase()}
        </Text>
        <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
        {sub && <Text type="secondary" style={{ fontSize: 11 }}>{sub}</Text>}
      </div>
    </div>
  </Card>
);

// ─── SVG Line chart ───────────────────────────────────────────────────────────
const LineChart = ({ data = [], keys = [], colors = [] }) => {
  if (!data.length) return <div style={{ color: "#94a3b8", textAlign: "center", padding: 30 }}>Ma'lumot yo'q</div>;

  const W = 500, H = 150;
  const allVals = data.flatMap(d => keys.map(k => d[k] || 0));
  const maxV    = Math.max(...allVals) || 1;
  const stepX   = W / (data.length - 1 || 1);

  const toPath = (key) =>
    data.map((d, i) => {
      const x = i * stepX;
      const y = H - ((d[key] || 0) / maxV) * H;
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    }).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: "100%", height: 200 }}>
      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map((r, i) => (
        <line key={i} x1={0} y1={H - H * r} x2={W} y2={H - H * r}
          stroke="#f1f5f9" strokeWidth={1} />
      ))}

      {/* Lines */}
      {keys.map((key, ki) => (
        <path key={ki} d={toPath(key)}
          fill="none" stroke={colors[ki]} strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round" />
      ))}

      {/* Dots */}
      {keys.map((key, ki) =>
        data.map((d, i) => (
          <circle key={`${ki}-${i}`}
            cx={i * stepX} cy={H - ((d[key] || 0) / maxV) * H}
            r={4} fill={colors[ki]} stroke="#fff" strokeWidth={2} />
        ))
      )}

      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={i * stepX} y={H + 18}
          textAnchor="middle" fontSize={10} fill="#94a3b8">
          {d.month || d.label || i + 1}
        </text>
      ))}

      {/* Legend */}
      {keys.map((key, ki) => (
        <g key={ki}>
          <circle cx={10 + ki * 100} cy={H + 28} r={4} fill={colors[ki]} />
          <text x={18 + ki * 100} y={H + 32} fontSize={9} fill="#64748b">{key}</text>
        </g>
      ))}
    </svg>
  );
};

// ─── Kategoriya progress ──────────────────────────────────────────────────────
const CatBar = ({ category, amount, total }) => {
  const cfg = EXPENSE_CATEGORIES[category] || { label: category, color: "#94a3b8", emoji: "📦" };
  const pct = total ? Math.round((amount / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: 13 }}>{cfg.emoji} {cfg.label}</Text>
        <div style={{ display: "flex", gap: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{pct}%</Text>
          <Text style={{ fontSize: 12, color: "#94a3b8" }}>{formatCurrency(amount)}</Text>
        </div>
      </div>
      <Progress
        percent={pct} size="small" style={{ margin: 0 }}
        strokeColor={cfg.color} showInfo={false}
      />
    </div>
  );
};

// ─── ASOSIY KOMPONENT ─────────────────────────────────────────────────────────
export default function FounderFinance() {
  const [finData,   setFinData]   = useState(null);
  const [expenses,  setExpenses]  = useState({ results: [], count: 0 });
  const [payrolls,  setPayrolls]  = useState({ results: [], count: 0 });
  const [loading,   setLoading]   = useState(true);
  const [expLoad,   setExpLoad]   = useState(false);
  const [payLoad,   setPayLoad]   = useState(false);
  const [error,     setError]     = useState(null);

  // Filterlar
  const [year,      setYear]      = useState(dayjs().year());
  const [expCat,    setExpCat]    = useState(undefined);
  const [payStatus, setPayStatus] = useState(undefined);
  const [expPage,   setExpPage]   = useState(1);
  const [payPage,   setPayPage]   = useState(1);

  // Umumiy moliya ma'lumoti
  useEffect(() => {
    dashboardApi.getFounderFinance({ year })
      .then(setFinData)
      .catch((e) => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, [year]);

  // Xarajatlar
  const fetchExpenses = useCallback(() => {
    setExpLoad(true);
    expenseApi.getAll({
      category:  expCat    || undefined,
      page:      expPage,
      page_size: 15,
    })
      .then(setExpenses)
      .catch(() => {})
      .finally(() => setExpLoad(false));
  }, [expCat, expPage]);

  // Oylik maoshlar
  const fetchPayrolls = useCallback(() => {
    setPayLoad(true);
    payrollApi.getAll({
      status:    payStatus || undefined,
      page:      payPage,
      page_size: 15,
    })
      .then(setPayrolls)
      .catch(() => {})
      .finally(() => setPayLoad(false));
  }, [payStatus, payPage]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchPayrolls(); }, [fetchPayrolls]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spin size="large" /></div>;
  if (error)   return <Alert type="error" message={error} />;

  const {
    yearly_summary  = {},
    monthly_chart   = [],
    category_breakdown = [],
    payroll_summary = {},
  } = finData || {};

  const totalExp = category_breakdown.reduce((s, c) => s + (c.total || 0), 0);

  // Xarajatlar ustunlari
  const expCols = [
    { title: "#", key: "i", width: 50, render: (_, __, i) => (expPage - 1) * 15 + i + 1 },
    {
      title: "Sarlavha", dataIndex: "title", key: "title",
      render: (t, r) => (
        <div>
          <Text strong>{t}</Text>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.added_by_name || "—"}</div>
        </div>
      ),
    },
    {
      title: "Kategoriya", dataIndex: "category", key: "cat",
      render: (c) => {
        const cfg = EXPENSE_CATEGORIES[c] || { label: c, color: "#94a3b8", emoji: "📦" };
        return (
          <Tag style={{ borderRadius: 20, background: `${cfg.color}12`, color: cfg.color, border: "none", fontWeight: 700 }}>
            {cfg.emoji} {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "Miqdor", dataIndex: "amount", key: "amount",
      render: (v) => <Text strong style={{ color: "#ef4444" }}>{formatCurrency(v)}</Text>,
    },
    { title: "Sana", dataIndex: "date", key: "date", render: (d) => formatDate(d) },
  ];

  // Maosh ustunlari
  const payrollCols = [
    { title: "#", key: "i", width: 50, render: (_, __, i) => (payPage - 1) * 15 + i + 1 },
    {
      title: "Xodim", key: "emp",
      render: (_, r) => (
        <div>
          <Text strong>{r.employee_name || "—"}</Text>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.period || "—"}</div>
        </div>
      ),
    },
    {
      title: "Asosiy maosh", dataIndex: "base_salary", key: "base",
      render: (v) => formatCurrency(v),
    },
    {
      title: "Jarima", dataIndex: "penalty_amount", key: "pen",
      render: (v) => v > 0
        ? <Text style={{ color: "#ef4444", fontWeight: 700 }}>-{formatCurrency(v)}</Text>
        : <Text type="secondary">—</Text>,
    },
    {
      title: "Bonus", dataIndex: "bonus", key: "bonus",
      render: (v) => v > 0
        ? <Text style={{ color: "#10b981", fontWeight: 700 }}>+{formatCurrency(v)}</Text>
        : <Text type="secondary">—</Text>,
    },
    {
      title: "Net maosh", dataIndex: "net_salary", key: "net",
      render: (v) => <Text strong style={{ color: "#6366f1", fontSize: 14 }}>{formatCurrency(v)}</Text>,
    },
    {
      title: "Holat", dataIndex: "status", key: "status",
      render: (s) => {
        const cfg = PAYROLL_STATUS[s] || {};
        return (
          <Tag style={{ borderRadius: 20, background: cfg.bg, color: cfg.color, border: "none", fontWeight: 700 }}>
            {cfg.label}
          </Tag>
        );
      },
    },
  ];

  return (
    <div>
      {/* ── Sarlavha ── */}
      <div style={{
        background: "linear-gradient(135deg,#1e1e3a,#064e3b)",
        borderRadius: 20, padding: "22px 28px", marginBottom: 24,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 6px 24px rgba(16,185,129,0.20)",
      }}>
        <div>
          <Title level={4} style={{ color: "#fff", margin: "0 0 4px" }}>💰 Moliyaviy tahlil</Title>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
            Daromad, xarajat, maosh va sof foyda hisob-kitobi
          </Text>
        </div>
        <Select
          value={year} onChange={setYear}
          style={{ width: 120 }}
        >
          {[2022, 2023, 2024, 2025, 2026].map(y => (
            <Option key={y} value={y}>{y} yil</Option>
          ))}
        </Select>
      </div>

      {/* ── Yillik xulosа stat kartalar ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <StatCard emoji="💵" label="Yillik daromad"   value={formatMillions(yearly_summary.income)}  color="#10b981" />
        </Col>
        <Col span={6}>
          <StatCard emoji="💸" label="Yillik xarajat"   value={formatMillions(yearly_summary.expense)} color="#ef4444"
            sub={`Maosh: ${formatMillions(yearly_summary.payroll_total)}`} />
        </Col>
        <Col span={6}>
          <StatCard emoji="📈" label="Yillik sof foyda" value={formatMillions(yearly_summary.profit)}  color="#6366f1"
            sub={`Margin: ${yearly_summary.margin_pct || 0}%`} />
        </Col>
        <Col span={6}>
          <StatCard emoji="🎓" label="To'lov tushumlari" value={formatMillions(yearly_summary.payments_total)} color="#f59e0b"
            sub={`${yearly_summary.payments_count || 0} ta to'lov`} />
        </Col>
      </Row>

      {/* ── Grafik + Kategoriyalar ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={15}>
          <Card
            title={<span style={{ fontWeight: 700 }}>📊 Oylik daromad / xarajat dinamikasi</span>}
            bordered={false}
            style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <LineChart
              data={monthly_chart}
              keys={["income", "expense", "profit"]}
              colors={["#10b981", "#ef4444", "#6366f1"]}
            />
          </Card>
        </Col>

        <Col span={9}>
          <Card
            title={<span style={{ fontWeight: 700 }}>🗂 Xarajat kategoriyalari</span>}
            bordered={false}
            style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", height: "100%" }}
          >
            {category_breakdown.map((c, i) => (
              <CatBar key={i} category={c.category} amount={c.total || 0} total={totalExp} />
            ))}
            {!category_breakdown.length && (
              <Text type="secondary" style={{ fontSize: 13 }}>Ma'lumot yo'q</Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Maosh xulosasi ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { l: "Jami xodim", v: payroll_summary.total_employees || 0,              c: "#6366f1", emoji: "👥" },
          { l: "Jami maosh", v: formatCurrency(payroll_summary.total_base || 0),   c: "#3b82f6", emoji: "💰" },
          { l: "Jami jarima",v: formatCurrency(payroll_summary.total_penalty || 0),c: "#ef4444", emoji: "💸" },
          { l: "Jami net",   v: formatCurrency(payroll_summary.total_net || 0),    c: "#10b981", emoji: "✅" },
        ].map((s, i) => (
          <Col span={6} key={i}>
            <div style={{
              background: "#fff", borderRadius: 14, padding: "14px 18px",
              border: "1px solid #eef0f6",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 22 }}>{s.emoji}</span>
              <div>
                <Text style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.3, display: "block" }}>
                  {s.l.toUpperCase()}
                </Text>
                <div style={{ fontSize: 16, fontWeight: 900, color: s.c }}>{s.v}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── Tabs: Xarajatlar / Maoshlar ── */}
      <Tabs
        defaultActiveKey="expenses"
        style={{ background: "#fff", borderRadius: 16, padding: "0 20px" }}
        items={[

          // ── Xarajatlar jadvali ───────────────────────────────────────────
          {
            key: "expenses",
            label: "💸 Xarajatlar",
            children: (
              <div style={{ padding: "16px 0" }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <Select
                    placeholder="Kategoriya" allowClear value={expCat}
                    onChange={setExpCat} style={{ width: 200 }}
                  >
                    {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                      <Option key={k} value={k}>{v.emoji} {v.label}</Option>
                    ))}
                  </Select>
                  <Button icon={<ReloadOutlined />} onClick={fetchExpenses} style={{ borderRadius: 10 }}>
                    Yangilash
                  </Button>
                  <Button icon={<DownloadOutlined />} style={{ borderRadius: 10, marginLeft: "auto" }}>
                    Excel
                  </Button>
                </div>
                <Table
                  dataSource={expenses.results}
                  columns={expCols}
                  rowKey="id"
                  loading={expLoad}
                  size="small"
                  pagination={{
                    total: expenses.count, pageSize: 15, current: expPage,
                    onChange: setExpPage, showSizeChanger: false,
                  }}
                />
              </div>
            ),
          },

          // ── Oylik maoshlar jadvali ────────────────────────────────────────
          {
            key: "payroll",
            label: "💰 Oylik maoshlar",
            children: (
              <div style={{ padding: "16px 0" }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <Select
                    placeholder="Holat" allowClear value={payStatus}
                    onChange={setPayStatus} style={{ width: 180 }}
                  >
                    {Object.entries(PAYROLL_STATUS).map(([k, v]) => (
                      <Option key={k} value={k}>{v.label}</Option>
                    ))}
                  </Select>
                  <Button icon={<ReloadOutlined />} onClick={fetchPayrolls} style={{ borderRadius: 10 }}>
                    Yangilash
                  </Button>
                  <Button icon={<DownloadOutlined />} style={{ borderRadius: 10, marginLeft: "auto" }}>
                    Excel
                  </Button>
                </div>
                <Table
                  dataSource={payrolls.results}
                  columns={payrollCols}
                  rowKey="id"
                  loading={payLoad}
                  size="small"
                  pagination={{
                    total: payrolls.count, pageSize: 15, current: payPage,
                    onChange: setPayPage, showSizeChanger: false,
                  }}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}