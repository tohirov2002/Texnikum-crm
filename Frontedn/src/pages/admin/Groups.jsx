import { useEffect, useState, useCallback } from "react";
import {
  Table, Card, Button, Input, Tag, Modal, Form, Select,
  Row, Col, Space, Alert, message, Popconfirm, Typography, Descriptions,
} from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { groupApi } from "../../api/resources.api";
import employeeApi from "../../api/employee.api";
import { useDebounce } from "../../hooks/useDebounce";
import { getInitials } from "../../utils/formatters";

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Ava = ({ name, color = "#6366f1", size = 34 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(135deg,${color}28,${color}55)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 800, color, flexShrink: 0 }}>
    {getInitials(name)}
  </div>
);

// ── Guruh modali ──────────────────────────────────────────────────────────────
function GroupModal({ group, open, onClose, onSuccess, teachers = [] }) {
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) { group ? form.setFieldsValue(group) : form.resetFields(); }
  }, [open, group, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      group ? await groupApi.update(group.id, values) : await groupApi.create(values);
      message.success(group ? "Guruh yangilandi!" : "Guruh yaratildi!");
      onSuccess(); onClose();
    } catch (e) { message.error(e.response?.data?.detail || "Xatolik"); }
    finally { setLoading(false); }
  };

  return (
    <Modal
      title={<div><div style={{ fontWeight: 800 }}>{group ? "Guruhni tahrirlash" : "Yangi guruh"}</div>{group && <div style={{ color: "#6366f1", fontSize: 13 }}>{group.name}</div>}</div>}
      open={open} onCancel={onClose} footer={null} width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="name"    label="Guruh nomi"  rules={[{ required: true }]}><Input placeholder="Masalan: 1-IT-24" /></Form.Item></Col>
          <Col span={12}><Form.Item name="subject" label="Fan"         rules={[{ required: true }]}><Input placeholder="Masalan: Dasturlash" /></Form.Item></Col>
        </Row>
        <Form.Item name="teacher" label="O'qituvchi" rules={[{ required: true }]}>
          <Select showSearch placeholder="O'qituvchi tanlang" optionFilterProp="children">
            {teachers.map(t => <Option key={t.id} value={t.id}>{t.last_name} {t.first_name}</Option>)}
          </Select>
        </Form.Item>
        <Row gutter={12}>
          <Col span={8}> <Form.Item name="room"       label="Xona"     rules={[{ required: true }]}><Input placeholder="101" /></Form.Item></Col>
          <Col span={8}> <Form.Item name="start_time" label="Boshlanish"><Input type="time" /></Form.Item></Col>
          <Col span={8}> <Form.Item name="end_time"   label="Tugash">   <Input type="time" /></Form.Item></Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="start_date"     label="Boshlanish sanasi"><Input type="date" /></Form.Item></Col>
          <Col span={12}><Form.Item name="max_students"   label="Max talabalar"    ><Input type="number" placeholder="20" /></Form.Item></Col>
        </Row>
        <Form.Item name="monthly_fee" label="Oylik to'lov (so'm)" rules={[{ required: true }]}><Input type="number" placeholder="0" /></Form.Item>
        <Form.Item name="description" label="Tavsif"><TextArea rows={2} /></Form.Item>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button type="primary" htmlType="submit" loading={loading} style={{ background: "#6366f1", border: "none", borderRadius: 10 }}>
            {group ? "💾 Saqlash" : "➕ Yaratish"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

// ── Guruh detail modali ───────────────────────────────────────────────────────
function DetailModal({ group, open, onClose }) {
  if (!group) return null;
  return (
    <Modal
      title={<div style={{ display: "flex", alignItems: "center", gap: 12 }}><Ava name={group.name} size={40} /><div><div style={{ fontWeight: 800 }}>{group.name}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{group.subject}</div></div></div>}
      open={open} onCancel={onClose} footer={null} width={460}
    >
      <Descriptions column={2} size="small" style={{ marginTop: 16 }} labelStyle={{ color: "#94a3b8", fontWeight: 600 }}>
        <Descriptions.Item label="Fan"          span={2}>{group.subject || "—"}</Descriptions.Item>
        <Descriptions.Item label="O'qituvchi"  span={2}>{group.teacher_name || "—"}</Descriptions.Item>
        <Descriptions.Item label="Xona">        {group.room || "—"}</Descriptions.Item>
        <Descriptions.Item label="Talabalar">   <Text strong style={{ color: "#6366f1" }}>{group.students_count || 0}</Text></Descriptions.Item>
        <Descriptions.Item label="Dars vaqti">  {group.start_time} – {group.end_time}</Descriptions.Item>
        <Descriptions.Item label="Oylik to'lov"><Text strong style={{ color: "#10b981" }}>{group.monthly_fee?.toLocaleString()} so'm</Text></Descriptions.Item>
        <Descriptions.Item label="Boshlanish">  {group.start_date || "—"}</Descriptions.Item>
        <Descriptions.Item label="Holat">       <Tag color={group.is_active ? "success" : "default"}>{group.is_active ? "✅ Faol" : "❌ Yopilgan"}</Tag></Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

// ── ASOSIY KOMPONENT ──────────────────────────────────────────────────────────
export default function Groups() {
  const [data,       setData]       = useState({ results: [], count: 0 });
  const [teachers,   setTeachers]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [editModal,  setEditModal]  = useState({ open: false, group: null });
  const [detailModal,setDetailModal]= useState(null);
  const [page,       setPage]       = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    employeeApi.getAll({ role: "teacher", page_size: 100 })
      .then(d => setTeachers(d.results || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    groupApi.getAll({ search: debouncedSearch || undefined, page, page_size: 12 })
      .then(setData)
      .catch(e => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    try { await groupApi.delete(id); message.success("Guruh o'chirildi"); fetchData(); }
    catch { message.error("O'chirib bo'lmadi"); }
  };

  const columns = [
    { title: "#", key: "i", width: 50, render: (_, __, i) => (page - 1) * 12 + i + 1 },
    { title: "Guruh", key: "name", render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Ava name={r.name} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.subject}</div>
          </div>
        </div>
      )
    },
    { title: "O'qituvchi", dataIndex: "teacher_name", key: "teacher", render: n => n || "—" },
    { title: "Xona",       dataIndex: "room",          key: "room",    render: r => <Tag style={{ borderRadius: 20 }}>🚪 {r}</Tag> },
    { title: "Vaqt", key: "time", render: (_, r) => <Text style={{ fontSize: 12 }}>{r.start_time} – {r.end_time}</Text> },
    { title: "Talabalar", dataIndex: "students_count", key: "st", render: v => <Text strong style={{ color: "#6366f1" }}>{v || 0}</Text> },
    { title: "Oylik to'lov", dataIndex: "monthly_fee", key: "fee", render: v => <Text style={{ color: "#10b981", fontWeight: 600 }}>{v?.toLocaleString()} so'm</Text> },
    { title: "Holat", dataIndex: "is_active", key: "active", render: v => <Tag color={v ? "success" : "default"}>{v ? "Faol" : "Yopilgan"}</Tag> },
    { title: "", key: "action", render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />}  onClick={() => setDetailModal(r)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditModal({ open: true, group: r })} />
          <Popconfirm title="Guruh o'chirilsinmi?" onConfirm={() => handleDelete(r.id)} okText="Ha" cancelText="Yo'q">
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
          { l: "Jami guruhlar", v: data.count, c: "#6366f1" },
          { l: "Faol",          v: data.results.filter(g => g.is_active).length, c: "#10b981" },
          { l: "Yopilgan",      v: data.results.filter(g => !g.is_active).length, c: "#94a3b8" },
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
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <Input prefix={<SearchOutlined style={{ color: "#94a3b8" }} />} placeholder="Guruh nomi, fan..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280, borderRadius: 10 }} />
        <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ borderRadius: 10 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditModal({ open: true, group: null })}
          style={{ marginLeft: "auto", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}>
          Guruh qo'shish
        </Button>
      </div>

      <Table dataSource={data.results} columns={columns} rowKey="id" loading={loading} size="small"
        style={{ background: "#fff", borderRadius: 16 }}
        pagination={{ total: data.count, pageSize: 12, current: page, onChange: setPage, showSizeChanger: false, showTotal: t => `Jami: ${t} ta guruh` }}
      />

      <GroupModal  group={editModal.group} open={editModal.open} onClose={() => setEditModal({ open: false, group: null })} onSuccess={fetchData} teachers={teachers} />
      <DetailModal group={detailModal}     open={!!detailModal}  onClose={() => setDetailModal(null)} />
    </div>
  );
}