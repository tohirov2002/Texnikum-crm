import { useEffect, useState, useCallback } from "react";
import {
  Table, Card, Row, Col, Tag, Button, Select,
  DatePicker, Alert, Typography, Progress,
} from "antd";
import { ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import { attendanceApi } from "../../api/resources.api";
import { formatDate, formatCurrency, formatMinutes } from "../../utils/formatters";
import { ATT_STATUS } from "../../utils/constants";

const { Text, Title } = Typography;
const { Option }      = Select;
const { RangePicker } = DatePicker;

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = ATT_STATUS[status] || { label: status, color: "#94a3b8", bg: "#f1f5f9", emoji: "—" };
  return (
    <Tag style={{ borderRadius: 20, background: cfg.bg, color: cfg.color, border: "none", fontWeight: 700 }}>
      {cfg.emoji} {cfg.label}
    </Tag>
  );
};

// ── Mini stat ─────────────────────────────────────────────────────────────────
const MiniStat = ({ emoji, label, value, color }) => (
  <div style={{ textAlign: "center", padding: "16px 12px", background: "#fff", borderRadius: 14, border: "1px solid #eef0f6" }}>
    <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 4 }}>{label.toUpperCase()}</div>
    <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
  </div>
);

export default function MyAttendance() {
  const [data,        setData]        = useState({ results: [], count: 0 });
  const [summary,     setSummary]     = useState({});
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [statusFilter,setStatusFilter]= useState(undefined);
  const [dateRange,   setDateRange]   = useState(null);
  const [page,        setPage]        = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);
    attendanceApi.getMy({
      status:      statusFilter || undefined,
      date_after:  dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
      date_before: dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
      page,
      page_size: 20,
    })
      .then(d => {
        setData(d);
        setSummary(d.summary || {});
      })
      .catch(e => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, [statusFilter, dateRange, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Oylik progress bar ────────────────────────────────────────────────────
  const presentDays = summary.present_days || 0;
  const lateDays    = summary.late_days    || 0;
  const absentDays  = summary.absent_days  || 0;
  const totalDays   = presentDays + lateDays + absentDays || 1;
  const presentPct  = Math.round((presentDays + lateDays) / totalDays * 100);

  const columns = [
    {
      title: "Sana", dataIndex: "date", key: "date",
      render: d => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{formatDate(d)}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {new Date(d).toLocaleDateString("uz-UZ", { weekday: "long" })}
          </div>
        </div>
      ),
    },
    {
      title: "Kelish", dataIndex: "check_in", key: "in",
      render: t => t
        ? <Text strong style={{ color: "#10b981", fontFamily: "monospace" }}>{t}</Text>
        : <Text type="secondary">—</Text>,
    },
    {
      title: "Ketish", dataIndex: "check_out", key: "out",
      render: t => t
        ? <Text style={{ fontFamily: "monospace" }}>{t}</Text>
        : <Text type="secondary">—</Text>,
    },
    {
      title: "Kechikish", dataIndex: "late_minutes", key: "late",
      render: m => m > 0
        ? <Tag color="warning" style={{ borderRadius: 20, fontWeight: 700 }}>{formatMinutes(m)}</Tag>
        : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
    },
    {
      title: "Jarima", dataIndex: "penalty_amount", key: "pen",
      render: v => v > 0
        ? <Text strong style={{ color: "#ef4444" }}>{formatCurrency(v)}</Text>
        : <Text type="secondary">—</Text>,
    },
    {
      title: "Holat", dataIndex: "status", key: "status",
      render: s => <StatusBadge status={s} />,
    },
    {
      title: "Izoh", dataIndex: "note", key: "note",
      render: n => <Text type="secondary" style={{ fontSize: 12 }}>{n || "—"}</Text>,
    },
  ];

  if (error) return <Alert type="error" message={error} />;

  return (
    <div>
      {/* ── Oylik xulosa ── */}
      <Card bordered={false} style={{ borderRadius: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 20 }}>
        <Row gutter={[24, 16]} align="middle">
          {/* Progress */}
          <Col span={6}>
            <div style={{ textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <Progress
                  type="circle" percent={presentPct} width={100}
                  strokeColor={{ "0%": "#10b981", "100%": "#059669" }}
                  trailColor="#f0faf4"
                  format={p => (
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#1e1e3a" }}>{p}%</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>davomat</div>
                    </div>
                  )}
                />
              </div>
            </div>
          </Col>

          {/* Statslar */}
          <Col span={18}>
            <Row gutter={[12, 12]}>
              <Col span={6}><MiniStat emoji="✅" label="Keldi"     value={presentDays} color="#10b981" /></Col>
              <Col span={6}><MiniStat emoji="⏱"  label="Kechikdi"  value={lateDays}    color="#f59e0b" /></Col>
              <Col span={6}><MiniStat emoji="❌" label="Kelmadi"   value={absentDays}  color="#ef4444" /></Col>
              <Col span={6}><MiniStat emoji="💸" label="Jami jarima" value={formatCurrency(summary.total_penalty || 0)} color="#6366f1" /></Col>
            </Row>

            {/* Progress barlar */}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { l: "Keldi",    v: presentDays, t: totalDays, c: "#10b981" },
                { l: "Kechikdi", v: lateDays,    t: totalDays, c: "#f59e0b" },
                { l: "Kelmadi",  v: absentDays,  t: totalDays, c: "#ef4444" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Text style={{ width: 70, fontSize: 12, color: "#64748b" }}>{s.l}</Text>
                  <Progress
                    percent={Math.round(s.v / s.t * 100)} showInfo={false} size="small"
                    style={{ flex: 1, margin: 0 }} strokeColor={s.c}
                    trailColor="#f1f5f9"
                  />
                  <Text style={{ width: 24, fontSize: 12, fontWeight: 700, color: s.c, textAlign: "right" }}>{s.v}</Text>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Card>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <Select placeholder="Holat" allowClear value={statusFilter} onChange={setStatusFilter} style={{ width: 170 }}>
          {Object.entries(ATT_STATUS).map(([k, v]) => (
            <Option key={k} value={k}>{v.emoji} {v.label}</Option>
          ))}
        </Select>
        <RangePicker value={dateRange} onChange={setDateRange} format="YYYY-MM-DD" style={{ borderRadius: 10 }} />
        <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ borderRadius: 10 }} />
        <Button icon={<DownloadOutlined />} style={{ marginLeft: "auto", borderRadius: 10 }}>Excel</Button>
      </div>

      {/* ── Jadval ── */}
      <Table
        dataSource={data.results}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        style={{ background: "#fff", borderRadius: 16 }}
        rowClassName={r => r.status === "absent" ? "row-absent" : r.status === "late" ? "row-late" : ""}
        pagination={{
          total: data.count, pageSize: 20, current: page,
          onChange: setPage, showSizeChanger: false,
          showTotal: t => `Jami: ${t} ta yozuv`,
        }}
      />
      <style>{`
        .row-absent td { background: rgba(239,68,68,0.03) !important; }
        .row-late   td { background: rgba(245,158,11,0.03) !important; }
      `}</style>
    </div>
  );
}