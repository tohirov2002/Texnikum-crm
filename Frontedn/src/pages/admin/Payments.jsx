import { useEffect, useState, useCallback } from "react";
import {
  Table, Button, Input, Select, DatePicker, Tag, Modal, Form,
  Row, Col, Alert, message, Popconfirm, Typography,
} from "antd";
import { PlusOutlined, SearchOutlined, DeleteOutlined, ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import { paymentApi, groupApi } from "../../api/resources.api";
import { studentApi } from "../../api/resources.api";
import { useDebounce } from "../../hooks/useDebounce";
import { formatCurrency, formatDate, getInitials } from "../../utils/formatters";
import { PAYMENT_METHODS } from "../../utils/constants";

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const Ava = ({ name, size = 32 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.4))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 800, color: "#10b981", flexShrink: 0 }}>
    {getInitials(name)}
  </div>
);

// ── To'lov qo'shish modali ────────────────────────────────────────────────────
function PaymentModal({ open, onClose, onSuccess, students = [], groups = [] }) {
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selGroup, setSelGroup] = useState(undefined);

  const filteredStudents = selGroup
    ? students.filter(s => s.group === selGroup)
    : students;

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await paymentApi.create(values);
      message.success("To'lov qo'shildi!"); form.resetFields(); setSelGroup(undefined); onSuccess(); onClose();
    } catch (e) { message.error(e.response?.data?.detail || "Xatolik"); }
    finally { setLoading(false); }
  };

  return (
    <Modal
      title={<div style={{ fontWeight: 800 }}>Yangi to'lov qo'shish</div>}
      open={open} onCancel={() => { form.resetFields(); setSelGroup(undefined); onClose(); }} footer={null} width={480}
    >
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
        {/* Guruh filter (optional) */}
        <Form.Item label="Guruh (filter)">
          <Select placeholder="Guruh tanlang (ixtiyoriy)" allowClear value={selGroup} onChange={v => { setSelGroup(v); form.setFieldValue("student", undefined); }} style={{ width: "100%" }}>
            {groups.map(g => <Option key={g.id} value={g.id}>{g.name}</Option>)}
          </Select>
        </Form.Item>

        <Form.Item name="student" label="Talaba" rules={[{ required: true, message: "Talaba tanlang" }]}>
          <Select showSearch placeholder="Talaba tanlang" optionFilterProp="children">
            {filteredStudents.map(s => (
              <Option key={s.id} value={s.id}>
                {s.last_name} {s.first_name}
                {(s.debt_amount || 0) > 0 && <span style={{ color: "#ef4444", marginLeft: 8 }}>({formatCurrency(s.debt_amount)} qarzdor)</span>}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="amount" label="Miqdor (so'm)" rules={[{ required: true }]}>
              <Input type="number" placeholder="0" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="method" label="To'lov usuli" rules={[{ required: true }]}>
              <Select placeholder="Tanlang">
                {Object.entries(PAYMENT_METHODS).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="date" label="Sana" rules={[{ required: true }]}>
          <Input type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </Form.Item>
        <Form.Item name="note" label="Izoh"><TextArea rows={2} placeholder="Ixtiyoriy..." /></Form.Item>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button type="primary" htmlType="submit" loading={loading}
            style={{ background: "#10b981", border: "none", borderRadius: 10 }}>
            💳 To'lovni saqlash
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

// ── ASOSIY KOMPONENT ──────────────────────────────────────────────────────────
export default function Payments() {
  const [data,        setData]        = useState({ results: [], count: 0 });
  const [students,    setStudents]    = useState([]);
  const [groups,      setGroups]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [methodFilter,setMethodFilter]= useState(undefined);
  const [dateRange,   setDateRange]   = useState(null);
  const [page,        setPage]        = useState(1);
  const [addModal,    setAddModal]    = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  // Talabalar va guruhlar (modal uchun)
  useEffect(() => {
    studentApi.getAll({ page_size: 300 }).then(d => setStudents(d.results || [])).catch(() => {});
    groupApi.getAll({ page_size: 100 }).then(d => setGroups(d.results || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    paymentApi.getAll({
      search:      debouncedSearch || undefined,
      method:      methodFilter    || undefined,
      date_after:  dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
      date_before: dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
      page, page_size: 15,
    })
      .then(setData)
      .catch(e => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, methodFilter, dateRange, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    try { await paymentApi.delete(id); message.success("O'chirildi"); fetchData(); }
    catch { message.error("O'chirib bo'lmadi"); }
  };

  // Jami hisoblash
  const totalAmount = data.results.reduce((s, r) => s + (r.amount || 0), 0);

  const columns = [
    { title: "#", key: "i", width: 50, render: (_, __, i) => (page - 1) * 15 + i + 1 },
    { title: "Talaba", key: "student", render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Ava name={r.student_name || "?"} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{r.student_name || "—"}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.group_name || "—"}</div>
          </div>
        </div>
      )
    },
    { title: "Miqdor", dataIndex: "amount", key: "amount",
      render: v => <Text strong style={{ color: "#10b981", fontSize: 14 }}>{formatCurrency(v)}</Text>
    },
    { title: "Usul", dataIndex: "method", key: "method",
      render: m => {
        const cfg = PAYMENT_METHODS[m] || { label: m, color: "#94a3b8" };
        return <Tag style={{ borderRadius: 20, color: cfg.color, background: `${cfg.color}12`, border: "none", fontWeight: 700 }}>{cfg.label}</Tag>;
      }
    },
    { title: "Sana",      dataIndex: "date",         key: "date",  render: d => formatDate(d) },
    { title: "Qabul qildi", dataIndex: "received_by_name", key: "rec", render: n => <Text type="secondary" style={{ fontSize: 12 }}>{n || "—"}</Text> },
    { title: "Izoh",      dataIndex: "note",         key: "note",  render: n => <Text type="secondary" style={{ fontSize: 12 }}>{n || "—"}</Text> },
    { title: "", key: "action", render: (_, r) => (
        <Popconfirm title="O'chirilsinmi?" onConfirm={() => handleDelete(r.id)} okText="Ha" cancelText="Yo'q">
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    },
  ];

  if (error) return <Alert type="error" message={error} />;

  return (
    <div>
      {/* Summary */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { l: "Jami to'lovlar", v: data.count,                  c: "#6366f1", emoji: "📋" },
          { l: "Jami summa",     v: formatCurrency(totalAmount),  c: "#10b981", emoji: "💰" },
          ...Object.entries(PAYMENT_METHODS).map(([k, v]) => ({
            l: v.label,
            v: data.results.filter(r => r.method === k).length + " ta",
            c: v.color, emoji: k === "cash" ? "💵" : k === "card" ? "💳" : "🔄",
          })),
        ].slice(0, 4).map((s, i) => (
          <Col span={6} key={i}>
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", border: "1px solid #eef0f6", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>{s.emoji}</span>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>{s.l.toUpperCase()}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: s.c }}>{s.v}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <Input prefix={<SearchOutlined style={{ color: "#94a3b8" }} />} placeholder="Talaba ismi..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220, borderRadius: 10 }} />
        <Select placeholder="To'lov usuli" allowClear value={methodFilter} onChange={setMethodFilter} style={{ width: 160 }}>
          {Object.entries(PAYMENT_METHODS).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
        </Select>
        <RangePicker value={dateRange} onChange={setDateRange} format="YYYY-MM-DD" style={{ borderRadius: 10 }} />
        <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ borderRadius: 10 }} />
        <Button icon={<DownloadOutlined />} style={{ borderRadius: 10 }}>Excel</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}
          style={{ marginLeft: "auto", borderRadius: 10, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", boxShadow: "0 4px 16px rgba(16,185,129,0.35)" }}>
          To'lov qo'shish
        </Button>
      </div>

      <Table dataSource={data.results} columns={columns} rowKey="id" loading={loading} size="small"
        style={{ background: "#fff", borderRadius: 16 }}
        pagination={{ total: data.count, pageSize: 15, current: page, onChange: setPage, showSizeChanger: false, showTotal: t => `Jami: ${t} ta to'lov` }}
      />

      <PaymentModal open={addModal} onClose={() => setAddModal(false)} onSuccess={fetchData} students={students} groups={groups} />
    </div>
  );
}