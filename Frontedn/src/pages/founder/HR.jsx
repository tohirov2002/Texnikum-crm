import { useEffect, useState, useCallback } from "react";
import {
  Row, Col, Card, Table, Tag, Input, Select, DatePicker,
  Spin, Alert, Typography, Progress, Button, Space, Tabs, Badge,
} from "antd";
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import dashboardApi  from "../../api/dashboard.api";
import { attendanceApi } from "../../api/resources.api";
import { useDebounce } from "../../hooks/useDebounce";
import {
  formatCurrency, formatDate, formatDateTime,
  formatMinutes, getInitials,
} from "../../utils/formatters";
import { ATT_STATUS } from "../../utils/constants";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Ava = ({ name, color = "#6366f1", size = 34 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.28,
    background: `linear-gradient(135deg,${color}30,${color}60)`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.33, fontWeight: 800, color, flexShrink: 0,
  }}>
    {getInitials(name)}
  </div>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = ATT_STATUS[status] || ATT_STATUS.absent;
  return (
    <Tag style={{
      borderRadius: 20, background: cfg.bg,
      color: cfg.color, border: "none", fontWeight: 700, fontSize: 11,
    }}>
      {cfg.emoji} {cfg.label}
    </Tag>
  );
};

// ─── Mini progress row ────────────────────────────────────────────────────────
const PctRow = ({ label, value, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
    <Text style={{ fontSize: 12, color: "#64748b", minWidth: 90 }}>{label}</Text>
    <Progress
      percent={value} size="small" style={{ flex: 1, margin: 0 }}
      strokeColor={color} showInfo={false}
    />
    <Text style={{ fontSize: 12, fontWeight: 700, color, minWidth: 36, textAlign: "right" }}>
      {value}%
    </Text>
  </div>
);

// ─── ASOSIY KOMPONENT ─────────────────────────────────────────────────────────
export default function FounderHR() {
  const [hrData,   setHrData]   = useState(null);
  const [attData,  setAttData]  = useState({ results: [], count: 0 });
  const [loading,  setLoading]  = useState(true);
  const [attLoad,  setAttLoad]  = useState(false);
  const [error,    setError]    = useState(null);

  // Filterlar
  const [search,      setSearch]      = useState("");
  const [statusFilter,setStatusFilter]= useState(undefined);
  const [dateRange,   setDateRange]   = useState(null);
  const [page,        setPage]        = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  // HR umumiy ma'lumot
  useEffect(() => {
    dashboardApi.getFounderHR()
      .then(setHrData)
      .catch((e) => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  // Davomat jadvali
  const fetchAtt = useCallback(() => {
    setAttLoad(true);
    const params = {
      search:     debouncedSearch || undefined,
      status:     statusFilter    || undefined,
      date_after: dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
      date_before:dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
      page,
      page_size: 15,
    };
    attendanceApi.getAll(params)
      .then(setAttData)
      .catch(() => {})
      .finally(() => setAttLoad(false));
  }, [debouncedSearch, statusFilter, dateRange, page]);

  useEffect(() => { fetchAtt(); }, [fetchAtt]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spin size="large" /></div>;
  if (error)   return <Alert type="error" message={error} />;

  const {
    department_stats = [],
    kechikuvchilar   = [],
    top_present      = [],
    top_absent       = [],
    month_summary    = {},
  } = hrData || {};

  // Davomat jadvali ustunlari
  const attCols = [
    {
      title: "Xodim", key: "emp",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Ava name={r.employee_name || "?"} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{r.employee_name || "—"}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.department || "—"}</div>
          </div>
        </div>
      ),
    },
    { title: "Sana",     dataIndex: "date",        key: "date",  render: (d) => formatDate(d) },
    { title: "Keldi",    dataIndex: "check_in",    key: "in",    render: (t) => t || "—" },
    { title: "Ketdi",    dataIndex: "check_out",   key: "out",   render: (t) => t || "—" },
    {
      title: "Kechikdi", dataIndex: "late_minutes", key: "late",
      render: (m) => m > 0
        ? <Tag color="warning" style={{ borderRadius: 20 }}>{m} daq</Tag>
        : <Tag color="success" style={{ borderRadius: 20 }}>O'z vaqtida</Tag>,
    },
    {
      title: "Jarima", dataIndex: "penalty_amount", key: "penalty",
      render: (v) => v > 0
        ? <Text style={{ color: "#ef4444", fontWeight: 700 }}>{formatCurrency(v)}</Text>
        : <Text type="secondary">—</Text>,
    },
    { title: "Holat", dataIndex: "status", key: "status", render: (s) => <StatusBadge status={s} /> },
  ];

  // Kechikuvchilar ustunlari
  const lateCols = [
    { title: "#", key: "i", width: 40, render: (_, __, i) => <Text type="secondary">{i + 1}</Text> },
    {
      title: "Xodim", key: "name",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Ava name={r.employee_name || "?"} color="#f59e0b" size={30} />
          <Text strong style={{ fontSize: 13 }}>{r.employee_name}</Text>
        </div>
      ),
    },
    { title: "Jami kechikish", dataIndex: "total_late_minutes", key: "min",
      render: (m) => <Text style={{ color: "#f59e0b", fontWeight: 700 }}>{formatMinutes(m)}</Text> },
    { title: "Marta",          dataIndex: "late_count",          key: "cnt",
      render: (v) => <Tag color="warning" style={{ borderRadius: 20 }}>{v} marta</Tag> },
    { title: "Jami jarima",    dataIndex: "total_penalty",       key: "pen",
      render: (v) => <Text style={{ color: "#ef4444", fontWeight: 700 }}>{formatCurrency(v)}</Text> },
  ];

  // Bo'lim statistikasi ustunlari
  const deptCols = [
    { title: "Bo'lim", dataIndex: "name", key: "name",
      render: (n) => <Text strong>{n}</Text> },
    { title: "Xodimlar", dataIndex: "employees_count", key: "emp",
      render: (v) => <Text style={{ color: "#6366f1", fontWeight: 700 }}>{v}</Text> },
    {
      title: "Davomat foizi", dataIndex: "attendance_pct", key: "pct",
      render: (v) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Progress
            percent={v || 0} size="small" style={{ width: 100, margin: 0 }}
            strokeColor={v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : "#ef4444"}
            showInfo={false}
          />
          <Text style={{ fontSize: 12, fontWeight: 700,
            color: v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : "#ef4444" }}>
            {v || 0}%
          </Text>
        </div>
      ),
    },
    { title: "Kechikuvchilar", dataIndex: "late_count",  key: "late",
      render: (v) => v > 0 ? <Tag color="warning">{v} ta</Tag> : <Tag color="success">0</Tag> },
    { title: "Jami jarima",    dataIndex: "total_penalty", key: "pen",
      render: (v) => <Text style={{ color: "#ef4444", fontWeight: 700 }}>{formatCurrency(v || 0)}</Text> },
  ];

  return (
    <div>
      {/* ── Sarlavha ── */}
      <div style={{
        background: "linear-gradient(135deg,#1e1e3a,#4c1d95)",
        borderRadius: 20, padding: "22px 28px", marginBottom: 24,
        boxShadow: "0 6px 24px rgba(139,92,246,0.20)",
      }}>
        <Title level={4} style={{ color: "#fff", margin: "0 0 4px" }}>👥 HR & Xodimlar nazorati</Title>
        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
          Davomat tarixi, jarima hisob-kitobi, bo'lim statistikasi
        </Text>
      </div>

      {/* ── Oy xulosasi ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { l: "Jami xodim",        v: month_summary.total_employees  || 0,  c: "#6366f1", emoji: "👥" },
          { l: "O'rtacha davomat",  v: `${month_summary.avg_attendance_pct || 0}%`, c: "#10b981", emoji: "📅" },
          { l: "Jami kechikishlar", v: `${month_summary.total_late_count || 0} marta`, c: "#f59e0b", emoji: "⏱"  },
          { l: "Jami jarimalar",    v: formatCurrency(month_summary.total_penalties || 0), c: "#ef4444", emoji: "💸" },
        ].map((s, i) => (
          <Col span={6} key={i}>
            <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.c}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  {s.emoji}
                </div>
                <div>
                  <Text style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.5, display: "block" }}>
                    {s.l.toUpperCase()}
                  </Text>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Tabs ── */}
      <Tabs
        defaultActiveKey="attendance"
        style={{ background: "#fff", borderRadius: 16, padding: "0 20px" }}
        items={[

          // ── 1. Davomat jadvali ──────────────────────────────────────────
          {
            key: "attendance",
            label: "📅 Davomat tarixi",
            children: (
              <div style={{ padding: "16px 0" }}>
                {/* Filterlar */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  <Input
                    prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                    placeholder="Xodim ismi..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 220, borderRadius: 10 }}
                  />
                  <Select
                    placeholder="Holat" allowClear value={statusFilter}
                    onChange={setStatusFilter} style={{ width: 150 }}
                  >
                    {Object.entries(ATT_STATUS).map(([k, v]) => (
                      <Option key={k} value={k}>{v.emoji} {v.label}</Option>
                    ))}
                  </Select>
                  <RangePicker
                    value={dateRange} onChange={setDateRange}
                    format="YYYY-MM-DD"
                    style={{ borderRadius: 10 }}
                  />
                  <Button icon={<ReloadOutlined />} onClick={fetchAtt} style={{ borderRadius: 10 }}>
                    Yangilash
                  </Button>
                  <Button icon={<DownloadOutlined />} style={{ borderRadius: 10, marginLeft: "auto" }}>
                    Excel
                  </Button>
                </div>

                <Table
                  dataSource={attData.results}
                  columns={attCols}
                  rowKey="id"
                  loading={attLoad}
                  size="small"
                  pagination={{
                    total: attData.count, pageSize: 15, current: page,
                    onChange: setPage, showSizeChanger: false,
                    showTotal: (t) => `Jami: ${t} ta yozuv`,
                  }}
                />
              </div>
            ),
          },

          // ── 2. Kechikuvchilar ────────────────────────────────────────────
          {
            key: "late",
            label: (
              <span>
                ⏱ Kechikuvchilar
                {kechikuvchilar.length > 0 && (
                  <Badge count={kechikuvchilar.length} size="small" style={{ marginLeft: 6 }} />
                )}
              </span>
            ),
            children: (
              <div style={{ padding: "16px 0" }}>
                {kechikuvchilar.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                    ✅ Bu oy kechikuvchilar yo'q
                  </div>
                ) : (
                  <Table
                    dataSource={kechikuvchilar}
                    columns={lateCols}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                  />
                )}
              </div>
            ),
          },

          // ── 3. Bo'lim statistikasi ───────────────────────────────────────
          {
            key: "departments",
            label: "🏢 Bo'limlar",
            children: (
              <div style={{ padding: "16px 0" }}>
                {/* Progress bars */}
                <Card bordered={false} style={{ background: "#f8fafc", borderRadius: 14, marginBottom: 16 }}>
                  <Title level={5} style={{ marginBottom: 14 }}>Bo'limlar bo'yicha davomat foizi</Title>
                  {department_stats.map((d, i) => (
                    <PctRow
                      key={i}
                      label={d.name}
                      value={d.attendance_pct || 0}
                      color={d.attendance_pct >= 80 ? "#10b981" : d.attendance_pct >= 60 ? "#f59e0b" : "#ef4444"}
                    />
                  ))}
                </Card>

                <Table
                  dataSource={department_stats}
                  columns={deptCols}
                  rowKey="name"
                  size="small"
                  pagination={false}
                />
              </div>
            ),
          },

          // ── 4. Eng yaxshi / yomon ────────────────────────────────────────
          {
            key: "ranking",
            label: "🏆 Reyting",
            children: (
              <div style={{ padding: "16px 0" }}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card
                      title={<span style={{ fontWeight: 700, color: "#10b981" }}>🏆 Eng faol xodimlar</span>}
                      bordered={false} style={{ borderRadius: 14, border: "1px solid rgba(16,185,129,0.20)" }}
                    >
                      {top_present.map((e, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 0",
                          borderBottom: i < top_present.length - 1 ? "1px solid #f4f5f9" : "none",
                        }}>
                          <Text style={{ fontSize: 16, fontWeight: 900, color: "#10b981", minWidth: 24 }}>
                            {i + 1}
                          </Text>
                          <Ava name={e.full_name || "?"} color="#10b981" size={32} />
                          <div style={{ flex: 1 }}>
                            <Text strong style={{ fontSize: 13 }}>{e.full_name}</Text>
                            <Progress
                              percent={e.attendance_pct || 0} size="small"
                              strokeColor="#10b981" showInfo={false} style={{ margin: "2px 0 0" }}
                            />
                          </div>
                          <Text style={{ fontWeight: 700, color: "#10b981" }}>{e.attendance_pct}%</Text>
                        </div>
                      ))}
                    </Card>
                  </Col>

                  <Col span={12}>
                    <Card
                      title={<span style={{ fontWeight: 700, color: "#ef4444" }}>⚠ Ko'p qolganlar</span>}
                      bordered={false} style={{ borderRadius: 14, border: "1px solid rgba(239,68,68,0.20)" }}
                    >
                      {top_absent.map((e, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 0",
                          borderBottom: i < top_absent.length - 1 ? "1px solid #f4f5f9" : "none",
                        }}>
                          <Text style={{ fontSize: 16, fontWeight: 900, color: "#ef4444", minWidth: 24 }}>
                            {i + 1}
                          </Text>
                          <Ava name={e.full_name || "?"} color="#ef4444" size={32} />
                          <div style={{ flex: 1 }}>
                            <Text strong style={{ fontSize: 13 }}>{e.full_name}</Text>
                            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                              {e.absent_count} marta kelmadi
                            </Text>
                          </div>
                          <Text style={{ fontWeight: 700, color: "#ef4444" }}>{formatCurrency(e.total_penalty)}</Text>
                        </div>
                      ))}
                    </Card>
                  </Col>
                </Row>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}