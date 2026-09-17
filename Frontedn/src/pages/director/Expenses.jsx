import { useEffect, useState, useCallback } from "react";
import {
  Table, Button, Input, Select, DatePicker, Tag, Modal,
  Form, Row, Col, Spin, Alert, message, Popconfirm, Typography,
} from "antd";
import { PlusOutlined, SearchOutlined, DeleteOutlined, ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import { expenseApi } from "../../api/resources.api";
import { useDebounce } from "../../hooks/useDebounce";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { EXPENSE_CATEGORIES } from "../../utils/constants";

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

function ExpenseModal({ open, onClose, onSuccess }) {
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await expenseApi.create(values);
      message.success("Xarajat qo'shildi!"); form.resetFields(); onSuccess(); onClose();
    } catch (e) { message.error(e.response?.data?.detail || "Xatolik"); }
    finally { setLoading(false); }
  };

  return (
    <Modal title={<div style={{ fontWeight: 800 }}>Yangi xarajat qo'shish</div>}
      open={open} onCancel={() => { form.resetFields(); onClose(); }} footer={null} width={460}>
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
        <Form.Item name="title" label="Sarlavha" rules={[{ required: true }]}><Input placeholder="Xarajat sarlavhasi" /></Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="category" label="Kategoriya" rules={[{ required: true }]}>
              <Select placeholder="Tanlang">
                {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => <Option key={k} value={k}>{v.emoji} {v.label}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="amount" label="Miqdor (so'm)" rules={[{ required: true }]}><Input type="number" placeholder="0" /></Form.Item>
          </Col>
        </Row>
        <Form.Item name="date" label="Sana" rules={[{ required: true }]}><Input type="date" /></Form.Item>
        <Form.Item name="note" label="Izoh"><TextArea rows={2} placeholder="Ixtiyoriy izoh..." /></Form.Item>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button type="primary" htmlType="submit" loading={loading} style={{ background: "#6366f1", border: "none", borderRadius: 10 }}>➕ Qo'shish</Button>
        </div>
      </Form>
    </Modal>
  );
}

export default function Expenses() {
  const [data,       setData]       = useState({ results: [], count: 0 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState(undefined);
  const [dateRange,  setDateRange]  = useState(null);
  const [page,       setPage]       = useState(1);
  const [addModal,   setAddModal]   = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(() => {
    setLoading(true);
    expenseApi.getAll({
      search:      debouncedSearch || undefined,
      category:    catFilter       || undefined,
      date_after:  dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
      date_before: dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
      page, page_size: 15,
    })
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, catFilter, dateRange, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    try { await expenseApi.delete(id); message.success("O'chirildi"); fetchData(); }
    catch { message.error("O'chirib bo'lmadi"); }
  };

  // Kategoriya bo'yicha jami
  const catTotals = data.results.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + (r.amount || 0);
    return acc;
  }, {});

  const columns = [
    { title: "#", key: "i", width: 50, render: (_, __, i) => (page - 1) * 15 + i + 1 },
    { title: "Sarlavha", key: "title", render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{r.title}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.added_by_name || "—"}</div>
        </div>
      )
    },
    { title: "Kategoriya", dataIndex: "category", key: "cat",
      render: (c) => {
        const cfg = EXPENSE_CATEGORIES[c] || { label: c, color: "#94a3b8", emoji: "📦" };
        return <Tag style={{ borderRadius: 20, background: `${cfg.color}12`, color: cfg.color, border: "none", fontWeight: 700 }}>{cfg.emoji} {cfg.label}</Tag>;
      }
    },
    { title: "Miqdor", dataIndex: "amount", key: "amount",
      render: (v) => <Text strong style={{ color: "#ef4444" }}>{formatCurrency(v)}</Text>
    },
    { title: "Sana",  dataIndex: "date",  key: "date",  render: (d) => formatDate(d) },
    { title: "Izoh",  dataIndex: "note",  key: "note",  render: (n) => <Text type="secondary" style={{ fontSize: 12 }}>{n || "—"}</Text> },
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
      {/* Kategoriya bo'yicha summary */}
      <Row gutter={[10, 10]} style={{ marginBottom: 20 }}>
        {Object.entries(catTotals).slice(0, 4).map(([cat, total], i) => {
          const cfg = EXPENSE_CATEGORIES[cat] || { label: cat, color: "#94a3b8", emoji: "📦" };
          return (
            <Col span={6} key={i}>
              <div style={{ background: "#fff", borderRadius: 14, padding: "12px 16px", border: "1px solid #eef0f6", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{cfg.emoji}</span>
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>{cfg.label.toUpperCase()}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: cfg.color }}>{formatCurrency(total)}</div>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <Input prefix={<SearchOutlined style={{ color: "#94a3b8" }} />} placeholder="Sarlavha qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220, borderRadius: 10 }} />
        <Select placeholder="Kategoriya" allowClear value={catFilter} onChange={setCatFilter} style={{ width: 200 }}>
          {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => <Option key={k} value={k}>{v.emoji} {v.label}</Option>)}
        </Select>
        <RangePicker value={dateRange} onChange={setDateRange} format="YYYY-MM-DD" style={{ borderRadius: 10 }} />
        <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ borderRadius: 10 }} />
        <Button icon={<DownloadOutlined />} style={{ borderRadius: 10 }}>Excel</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)} style={{ marginLeft: "auto", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none" }}>
          Xarajat qo'shish
        </Button>
      </div>

      <Table dataSource={data.results} columns={columns} rowKey="id" loading={loading} size="small"
        style={{ background: "#fff", borderRadius: 16 }}
        pagination={{ total: data.count, pageSize: 15, current: page, onChange: setPage, showSizeChanger: false, showTotal: (t) => `Jami: ${t} ta yozuv` }}
      />

      <ExpenseModal open={addModal} onClose={() => setAddModal(false)} onSuccess={fetchData} />
    </div>
  );
}