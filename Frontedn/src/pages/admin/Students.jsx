import { useEffect, useState, useCallback } from "react";
import {
  Table, Button, Input, Select, Tag, Modal, Form, Row, Col,
  Space, Alert, message, Popconfirm, Typography, Descriptions, Switch,
} from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { studentApi, groupApi } from "../../api/resources.api";
import { useDebounce } from "../../hooks/useDebounce";
import { formatCurrency, formatDate, formatPhone, getInitials } from "../../utils/formatters";

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Ava = ({ name, color = "#3b82f6", size = 34 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(135deg,${color}28,${color}55)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 800, color, flexShrink: 0 }}>
    {getInitials(name)}
  </div>
);

// ── Talaba modali ─────────────────────────────────────────────────────────────
function StudentModal({ student, open, onClose, onSuccess, groups = [] }) {
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) { student ? form.setFieldsValue(student) : form.resetFields(); }
  }, [open, student, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      student ? await studentApi.update(student.id, values) : await studentApi.create(values);
      message.success(student ? "Talaba yangilandi!" : "Talaba qo'shildi!");
      onSuccess(); onClose();
    } catch (e) { message.error(e.response?.data?.detail || "Xatolik"); }
    finally { setLoading(false); }
  };

  return (
    <Modal
      title={<div><div style={{ fontWeight: 800 }}>{student ? "Talabani tahrirlash" : "Yangi talaba"}</div>{student && <div style={{ color: "#3b82f6", fontSize: 13 }}>{student.last_name} {student.first_name}</div>}</div>}
      open={open} onCancel={onClose} footer={null} width={540}
    >
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="last_name"  label="Familiya" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="first_name" label="Ism"      rules={[{ required: true }]}><Input /></Form.Item></Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="phone"        label="Telefon"         rules={[{ required: true }]}><Input placeholder="+998901234567" /></Form.Item></Col>
          <Col span={12}><Form.Item name="parent_phone" label="Ota-ona telefon" ><Input placeholder="+998901234567" /></Form.Item></Col>
        </Row>
        <Form.Item name="group" label="Guruh" rules={[{ required: true }]}>
          <Select showSearch placeholder="Guruh tanlang" optionFilterProp="children">
            {groups.map(g => <Option key={g.id} value={g.id}>{g.name} — {g.subject}</Option>)}
          </Select>
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="birth_date"  label="Tug'ilgan sana"><Input type="date" /></Form.Item></Col>
          <Col span={12}><Form.Item name="gender"      label="Jins">
            <Select placeholder="Tanlang">
              <Option value="male">👦 Erkak</Option>
              <Option value="female">👧 Ayol</Option>
            </Select>
          </Form.Item></Col>
        </Row>
        <Form.Item name="address" label="Manzil"><TextArea rows={2} /></Form.Item>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button type="primary" htmlType="submit" loading={loading} style={{ background: "#3b82f6", border: "none", borderRadius: 10 }}>
            {student ? "💾 Saqlash" : "➕ Qo'shish"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

// ── Talaba detail modali ──────────────────────────────────────────────────────
function DetailModal({ student, open, onClose }) {
  if (!student) return null;
  const debtColor = (student.debt_amount || 0) > 0 ? "#ef4444" : "#10b981";
  return (
    <Modal
      title={<div style={{ display: "flex", alignItems: "center", gap: 12 }}><Ava name={`${student.last_name} ${student.first_name}`} size={40} /><div><div style={{ fontWeight: 800 }}>{student.last_name} {student.first_name}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{student.group_name}</div></div></div>}
      open={open} onCancel={onClose} footer={null} width={480}
    >
      <Descriptions column={2} size="small" style={{ marginTop: 16 }} labelStyle={{ color: "#94a3b8", fontWeight: 600 }}>
        <Descriptions.Item label="Guruh"         span={2}>{student.group_name || "—"}</Descriptions.Item>
        <Descriptions.Item label="Telefon"        >{formatPhone(student.phone)}</Descriptions.Item>
        <Descriptions.Item label="Ota-ona tel"    >{formatPhone(student.parent_phone)}</Descriptions.Item>
        <Descriptions.Item label="Tug'ilgan"      >{formatDate(student.birth_date)}</Descriptions.Item>
        <Descriptions.Item label="Jins"            >{student.gender === "male" ? "👦 Erkak" : "👧 Ayol"}</Descriptions.Item>
        <Descriptions.Item label="Davomat"         ><Text strong style={{ color: student.attendance_pct >= 80 ? "#10b981" : "#ef4444" }}>{student.attendance_pct || 0}%</Text></Descriptions.Item>
        <Descriptions.Item label="Qarzdorlik"      ><Text strong style={{ color: debtColor }}>{formatCurrency(student.debt_amount || 0)}</Text></Descriptions.Item>
        <Descriptions.Item label="Qo'shilgan" span={2}>{formatDate(student.created_at)}</Descriptions.Item>
        <Descriptions.Item label="Manzil"     span={2}>{student.address || "—"}</Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

// ── ASOSIY KOMPONENT ──────────────────────────────────────────────────────────
export default function Students() {
  const [data,        setData]        = useState({ results: [], count: 0 });
  const [groups,      setGroups]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [groupFilter, setGroupFilter] = useState(undefined);
  const [debtFilter,  setDebtFilter]  = useState(undefined);
  const [page,        setPage]        = useState(1);
  const [editModal,   setEditModal]   = useState({ open: false, student: null });
  const [detailModal, setDetailModal] = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    groupApi.getAll({ page_size: 100 }).then(d => setGroups(d.results || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    studentApi.getAll({
      search:    debouncedSearch || undefined,
      group:     groupFilter     || undefined,
      has_debt:  debtFilter      || undefined,
      page, page_size: 15,
    })
      .then(setData)
      .catch(e => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, groupFilter, debtFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    try { await studentApi.delete(id); message.success("Talaba o'chirildi"); fetchData(); }
    catch { message.error("O'chirib bo'lmadi"); }
  };

  const columns = [
    { title: "#", key: "i", width: 50, render: (_, __, i) => (page - 1) * 15 + i + 1 },
    { title: "Talaba", key: "name", render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Ava name={`${r.last_name} ${r.first_name}`} color={(r.debt_amount || 0) > 0 ? "#ef4444" : "#3b82f6"} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{r.last_name} {r.first_name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.group_name || "—"}</div>
          </div>
        </div>
      )
    },
    { title: "Telefon",   dataIndex: "phone",          key: "phone",  render: p => formatPhone(p) },
    { title: "Davomat",   dataIndex: "attendance_pct", key: "att",
      render: v => <Tag color={v >= 80 ? "success" : v >= 60 ? "warning" : "error"} style={{ borderRadius: 20 }}>{v || 0}%</Tag>
    },
    { title: "Qarzdorlik", dataIndex: "debt_amount", key: "debt",
      render: v => v > 0
        ? <Text strong style={{ color: "#ef4444" }}>{formatCurrency(v)}</Text>
        : <Tag color="success" style={{ borderRadius: 20 }}>✅ To'langan</Tag>
    },
    { title: "Holat", dataIndex: "is_active", key: "active",
      render: v => <Tag color={v ? "success" : "default"}>{v ? "Aktiv" : "Nofaol"}</Tag>
    },
    { title: "", key: "action", render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />}  onClick={() => setDetailModal(r)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditModal({ open: true, student: r })} />
          <Popconfirm title="Talaba o'chirilsinmi?" onConfirm={() => handleDelete(r.id)} okText="Ha" cancelText="Yo'q">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ];

  if (error) return <Alert type="error" message={error} />;

  return (
    <div>
      {/* Summary */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { l: "Jami talabalar", v: data.count, c: "#3b82f6" },
          { l: "Qarzdorlar",     v: data.results.filter(s => (s.debt_amount || 0) > 0).length, c: "#ef4444" },
          { l: "To'lagan",       v: data.results.filter(s => (s.debt_amount || 0) === 0).length, c: "#10b981" },
        ].map((s, i) => (
          <Col span={8} key={i}>
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", border: "1px solid #eef0f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: "#64748b" }}>{s.l}</Text>
              <Text style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.v}</Text>
            </div>
          </Col>
        ))}
      </Row>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <Input prefix={<SearchOutlined style={{ color: "#94a3b8" }} />} placeholder="Ism, telefon qidirish..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 250, borderRadius: 10 }} />
        <Select placeholder="Guruh" allowClear value={groupFilter} onChange={setGroupFilter} style={{ width: 180 }}>
          {groups.map(g => <Option key={g.id} value={g.id}>{g.name}</Option>)}
        </Select>
        <Select placeholder="To'lov holati" allowClear value={debtFilter} onChange={setDebtFilter} style={{ width: 160 }}>
          <Option value="true">⚠ Qarzdorlar</Option>
          <Option value="false">✅ To'lagan</Option>
        </Select>
        <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ borderRadius: 10 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditModal({ open: true, student: null })}
          style={{ marginLeft: "auto", borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#6366f1)", border: "none", boxShadow: "0 4px 16px rgba(59,130,246,0.35)" }}>
          Talaba qo'shish
        </Button>
      </div>

      <Table dataSource={data.results} columns={columns} rowKey="id" loading={loading} size="small"
        style={{ background: "#fff", borderRadius: 16 }}
        pagination={{ total: data.count, pageSize: 15, current: page, onChange: setPage, showSizeChanger: false, showTotal: t => `Jami: ${t} ta talaba` }}
      />

      <StudentModal student={editModal.student} open={editModal.open} onClose={() => setEditModal({ open: false, student: null })} onSuccess={fetchData} groups={groups} />
      <DetailModal  student={detailModal}       open={!!detailModal}  onClose={() => setDetailModal(null)} />
    </div>
  );
}