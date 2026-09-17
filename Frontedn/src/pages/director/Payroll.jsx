import { useEffect, useState, useCallback } from "react";
import {
  Table, Button, Select, Tag, Modal, Form, Row, Col,
  Input, Spin, Alert, message, Typography, Card,
} from "antd";
import { ReloadOutlined, CheckOutlined, DownloadOutlined } from "@ant-design/icons";
import { payrollApi } from "../../api/resources.api";
import { formatCurrency, formatDate, getInitials } from "../../utils/formatters";
import { PAYROLL_STATUS } from "../../utils/constants";

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Ava = ({ name, size = 34 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(99,102,241,0.4))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 800, color: "#6366f1", flexShrink: 0 }}>
    {getInitials(name)}
  </div>
);

// Tasdiqlash modali
function ApproveModal({ record, open, onClose, onSuccess }) {
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleApprove = async (values) => {
    setLoading(true);
    try {
      await payrollApi.approve(record.id, values);
      message.success("Maosh tasdiqlandi!"); onSuccess(); onClose();
    } catch (e) { message.error(e.response?.data?.detail || "Xatolik"); }
    finally { setLoading(false); }
  };

  if (!record) return null;
  return (
    <Modal title={<div><div style={{ fontWeight: 800 }}>Maosh tasdiqlash</div><div style={{ color: "#6366f1", fontSize: 13 }}>{record.employee_name} · {record.period}</div></div>}
      open={open} onCancel={onClose} footer={null} width={440}>
      {/* Hisob-kitob */}
      <div style={{ background: "#f8fafc", borderRadius: 14, padding: "16px", marginBottom: 16 }}>
        {[
          { l: "Asosiy maosh",  v: formatCurrency(record.base_salary),    c: "#1e1e3a", bold: false },
          { l: "Kechikish",     v: `${record.late_minutes || 0} daqiqa`,  c: "#f59e0b", bold: false },
          { l: "Jarima",        v: `-${formatCurrency(record.penalty_amount)}`, c: "#ef4444", bold: false },
          { l: "Bonus",         v: `+${formatCurrency(record.bonus || 0)}`,     c: "#10b981", bold: false },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
            <Text style={{ fontSize: 13, color: "#64748b" }}>{s.l}</Text>
            <Text style={{ fontSize: 13, fontWeight: 600, color: s.c }}>{s.v}</Text>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0" }}>
          <Text strong style={{ fontSize: 14 }}>Net maosh</Text>
          <Text strong style={{ fontSize: 16, color: "#6366f1" }}>{formatCurrency(record.net_salary)}</Text>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleApprove}>
        <Form.Item name="note" label="Izoh (ixtiyoriy)"><TextArea rows={2} placeholder="Izoh..." /></Form.Item>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={<CheckOutlined />}
            style={{ background: "#10b981", border: "none", borderRadius: 10 }}>
            Tasdiqlash
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export default function Payroll() {
  const [data,         setData]        = useState({ results: [], count: 0 });
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState(null);
  const [statusFilter, setStatusFilter]= useState(undefined);
  const [page,         setPage]        = useState(1);
  const [approveModal, setApproveModal]= useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    payrollApi.getAll({ status: statusFilter || undefined, page, page_size: 15 })
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Umumiy hisob
  const totalBase    = data.results.reduce((s, r) => s + (r.base_salary    || 0), 0);
  const totalPenalty = data.results.reduce((s, r) => s + (r.penalty_amount || 0), 0);
  const totalBonus   = data.results.reduce((s, r) => s + (r.bonus          || 0), 0);
  const totalNet     = data.results.reduce((s, r) => s + (r.net_salary     || 0), 0);

  const columns = [
    { title: "#", key: "i", width: 50, render: (_, __, i) => (page - 1) * 15 + i + 1 },
    { title: "Xodim", key: "emp", render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Ava name={r.employee_name || "?"} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{r.employee_name || "—"}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.period || "—"}</div>
          </div>
        </div>
      )
    },
    { title: "Asosiy maosh", dataIndex: "base_salary",    key: "base",    render: (v) => formatCurrency(v) },
    { title: "Jarima",       dataIndex: "penalty_amount", key: "penalty",
      render: (v) => v > 0 ? <Text style={{ color: "#ef4444", fontWeight: 700 }}>-{formatCurrency(v)}</Text> : <Text type="secondary">—</Text>
    },
    { title: "Bonus",        dataIndex: "bonus",          key: "bonus",
      render: (v) => v > 0 ? <Text style={{ color: "#10b981", fontWeight: 700 }}>+{formatCurrency(v)}</Text> : <Text type="secondary">—</Text>
    },
    { title: "Net maosh",    dataIndex: "net_salary",     key: "net",
      render: (v) => <Text strong style={{ color: "#6366f1", fontSize: 14 }}>{formatCurrency(v)}</Text>
    },
    { title: "Holat", dataIndex: "status", key: "status",
      render: (s) => {
        const cfg = PAYROLL_STATUS[s] || {};
        return <Tag style={{ borderRadius: 20, background: cfg.bg, color: cfg.color, border: "none", fontWeight: 700 }}>{cfg.label}</Tag>;
      }
    },
    { title: "", key: "action", render: (_, r) =>
        r.status === "draft" ? (
          <Button size="small" type="primary" icon={<CheckOutlined />}
            onClick={() => setApproveModal(r)}
            style={{ borderRadius: 8, background: "#10b981", border: "none", fontSize: 11 }}>
            Tasdiq
          </Button>
        ) : null
    },
  ];

  if (error) return <Alert type="error" message={error} />;

  return (
    <div>
      {/* Xulosа */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { l: "Asosiy maosh",  v: formatCurrency(totalBase),    c: "#6366f1", emoji: "💰" },
          { l: "Jami jarima",   v: formatCurrency(totalPenalty), c: "#ef4444", emoji: "💸" },
          { l: "Jami bonus",    v: formatCurrency(totalBonus),   c: "#10b981", emoji: "🎁" },
          { l: "Net to'lov",    v: formatCurrency(totalNet),     c: "#3b82f6", emoji: "✅" },
        ].map((s, i) => (
          <Col span={6} key={i}>
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", border: "1px solid #eef0f6", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>{s.emoji}</span>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>{s.l.toUpperCase()}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: s.c }}>{s.v}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <Select placeholder="Holat" allowClear value={statusFilter} onChange={setStatusFilter} style={{ width: 180 }}>
          {Object.entries(PAYROLL_STATUS).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
        </Select>
        <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ borderRadius: 10 }} />
        <Button icon={<DownloadOutlined />} style={{ marginLeft: "auto", borderRadius: 10 }}>Excel</Button>
      </div>

      <Table dataSource={data.results} columns={columns} rowKey="id" loading={loading} size="small"
        style={{ background: "#fff", borderRadius: 16 }}
        pagination={{ total: data.count, pageSize: 15, current: page, onChange: setPage, showSizeChanger: false, showTotal: (t) => `Jami: ${t} ta yozuv` }}
      />

      <ApproveModal record={approveModal} open={!!approveModal} onClose={() => setApproveModal(null)} onSuccess={fetchData} />
    </div>
  );
}