import { useEffect, useState, useCallback } from "react";
import {
  Table, Button, Input, Select, Tag, Modal, Form,
  Row, Col, Space, Spin, Alert, message, Popconfirm,
  Switch, Typography, Descriptions,
} from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import employeeApi from "../../api/employee.api";
import { useDebounce } from "../../hooks/useDebounce";
import { formatCurrency, formatDate, formatPhone, getInitials } from "../../utils/formatters";
import { ROLE_META } from "../../utils/constants";

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Ava = ({ name, color = "#6366f1", size = 36 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(135deg,${color}28,${color}55)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 800, color, flexShrink: 0 }}>
    {getInitials(name)}
  </div>
);

function EmployeeModal({ employee, open, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open) { employee ? form.setFieldsValue(employee) : form.resetFields(); }
  }, [open, employee, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      employee ? await employeeApi.update(employee.id, values) : await employeeApi.create(values);
      message.success(employee ? "Yangilandi!" : "Qo'shildi!");
      onSuccess(); onClose();
    } catch (e) { message.error(e.response?.data?.detail || "Xatolik"); }
    finally { setLoading(false); }
  };

  return (
    <Modal title={<div><div style={{ fontWeight: 800 }}>{employee ? "Xodimni tahrirlash" : "Yangi xodim"}</div>{employee && <div style={{ color: "#6366f1", fontSize: 13 }}>{employee.last_name} {employee.first_name}</div>}</div>}
      open={open} onCancel={onClose} footer={null} width={560}>
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="last_name"  label="Familiya" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="first_name" label="Ism"      rules={[{ required: true }]}><Input /></Form.Item></Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="phone"    label="Telefon" rules={[{ required: true }]}><Input placeholder="+998901234567" /></Form.Item></Col>
          <Col span={12}><Form.Item name="email"    label="Email"><Input type="email" /></Form.Item></Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="position"   label="Lavozim" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="department" label="Bo'lim"><Input /></Form.Item></Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="monthly_salary" label="Oylik maosh" rules={[{ required: true }]}><Input type="number" /></Form.Item></Col>
          <Col span={12}><Form.Item name="hire_date" label="Ishga kirgan"><Input type="date" /></Form.Item></Col>
        </Row>
        <Form.Item name="role" label="Tizim roli">
          <Select placeholder="Rol tanlang" allowClear>
            {["director","center_admin","teacher"].map(r => <Option key={r} value={r}>{ROLE_META[r]?.icon} {ROLE_META[r]?.label}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="address" label="Manzil"><TextArea rows={2} /></Form.Item>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button type="primary" htmlType="submit" loading={loading} style={{ background: "#6366f1", border: "none", borderRadius: 10 }}>
            {employee ? "💾 Saqlash" : "➕ Qo'shish"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

function DetailModal({ employee, open, onClose }) {
  if (!employee) return null;
  const m = ROLE_META[employee.role] || {};
  return (
    <Modal title={<div style={{ display: "flex", alignItems: "center", gap: 12 }}><Ava name={`${employee.last_name} ${employee.first_name}`} size={40} /><div><div style={{ fontWeight: 800 }}>{employee.last_name} {employee.first_name}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{employee.position}</div></div></div>}
      open={open} onCancel={onClose} footer={null} width={480}>
      <Descriptions column={2} size="small" style={{ marginTop: 16 }} labelStyle={{ color: "#94a3b8", fontWeight: 600 }}>
        <Descriptions.Item label="Telefon"  span={2}>{formatPhone(employee.phone)}</Descriptions.Item>
        <Descriptions.Item label="Email"    span={2}>{employee.email || "—"}</Descriptions.Item>
        <Descriptions.Item label="Lavozim">{employee.position || "—"}</Descriptions.Item>
        <Descriptions.Item label="Bo'lim">{employee.department || "—"}</Descriptions.Item>
        <Descriptions.Item label="Maosh"><Text strong style={{ color: "#10b981" }}>{formatCurrency(employee.monthly_salary)}</Text></Descriptions.Item>
        <Descriptions.Item label="Ishga kirgan">{formatDate(employee.hire_date)}</Descriptions.Item>
        <Descriptions.Item label="Rol">{m.label ? <Tag style={{ borderRadius: 20, background: m.bg, color: m.color, border: "none", fontWeight: 700 }}>{m.icon} {m.label}</Tag> : "—"}</Descriptions.Item>
        <Descriptions.Item label="Holat"><Tag color={employee.is_active ? "success" : "default"}>{employee.is_active ? "✅ Aktiv" : "❌ Nofaol"}</Tag></Descriptions.Item>
        <Descriptions.Item label="Manzil" span={2}>{employee.address || "—"}</Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

function StatusModal({ employee, open, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const handleSave = async (values) => {
    setLoading(true);
    try {
      await employeeApi.createStatus({ employee: employee.id, ...values });
      message.success("Status qo'shildi!"); form.resetFields(); onSuccess(); onClose();
    } catch (e) { message.error(e.response?.data?.detail || "Xatolik"); }
    finally { setLoading(false); }
  };
  return (
    <Modal title={<div><div style={{ fontWeight: 800 }}>Status qo'shish</div><div style={{ color: "#6366f1", fontSize: 13 }}>{employee?.last_name} {employee?.first_name}</div></div>}
      open={open} onCancel={onClose} footer={null} width={400}>
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
        <Form.Item name="status_type" label="Status turi" rules={[{ required: true }]}>
          <Select placeholder="Tanlang">
            <Option value="vacation">🏖 Ta'til</Option>
            <Option value="sick">🤒 Kasal</Option>
            <Option value="business_trip">✈ Xizmat safari</Option>
            <Option value="other">📋 Boshqa</Option>
          </Select>
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="start_date" label="Boshlanish" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
          <Col span={12}><Form.Item name="end_date"   label="Tugash"     rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
        </Row>
        <Form.Item name="note" label="Izoh"><TextArea rows={2} /></Form.Item>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button type="primary" htmlType="submit" loading={loading} style={{ background: "#8b5cf6", border: "none", borderRadius: 10 }}>Saqlash</Button>
        </div>
      </Form>
    </Modal>
  );
}

export default function Employees() {
  const [data,        setData]        = useState({ results: [], count: 0 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [roleFilter,  setRoleFilter]  = useState(undefined);
  const [page,        setPage]        = useState(1);
  const [editModal,   setEditModal]   = useState({ open: false, emp: null });
  const [detailModal, setDetailModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(() => {
    setLoading(true);
    employeeApi.getAll({ search: debouncedSearch || undefined, role: roleFilter || undefined, page, page_size: 15 })
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, roleFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    try { await employeeApi.delete(id); message.success("O'chirildi"); fetchData(); }
    catch { message.error("O'chirib bo'lmadi"); }
  };

  const handleToggle = async (id, checked) => { await employeeApi.patch(id, { is_active: checked }); fetchData(); };

  const columns = [
    { title: "#", key: "i", width: 50, render: (_, __, i) => (page - 1) * 15 + i + 1 },
    { title: "Xodim", key: "name", render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Ava name={`${r.last_name} ${r.first_name}`} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{r.last_name} {r.first_name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.position || "—"} · {r.department || "—"}</div>
          </div>
        </div>
      )
    },
    { title: "Telefon",  dataIndex: "phone",          key: "phone",  render: (p) => formatPhone(p) },
    { title: "Rol",      dataIndex: "role",            key: "role",
      render: (role) => { const m = ROLE_META[role] || {}; return m.label ? <Tag style={{ borderRadius: 20, background: m.bg, color: m.color, border: "none", fontWeight: 700 }}>{m.icon} {m.label}</Tag> : <Text type="secondary">—</Text>; }
    },
    { title: "Maosh", dataIndex: "monthly_salary", key: "salary", render: (v) => <Text strong style={{ color: "#10b981" }}>{formatCurrency(v)}</Text> },
    { title: "Holat", dataIndex: "is_active",      key: "active", render: (v, r) => <Switch checked={v} size="small" onChange={(c) => handleToggle(r.id, c)} /> },
    { title: "", key: "action", render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />}  onClick={() => setDetailModal(r)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditModal({ open: true, emp: r })} />
          <Button size="small" style={{ color: "#8b5cf6", borderColor: "#8b5cf6" }} onClick={() => setStatusModal(r)}>📋</Button>
          <Popconfirm title="O'chirilsinmi?" onConfirm={() => handleDelete(r.id)} okText="Ha" cancelText="Yo'q">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ];

  if (error) return <Alert type="error" message={error} />;

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[{ l: "Jami", v: data.count, c: "#6366f1" }, { l: "Aktiv", v: data.results.filter(e => e.is_active).length, c: "#10b981" }, { l: "Nofaol", v: data.results.filter(e => !e.is_active).length, c: "#94a3b8" }].map((s, i) => (
          <Col span={8} key={i}>
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", border: "1px solid #eef0f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: "#64748b" }}>{s.l}</Text>
              <Text style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.v}</Text>
            </div>
          </Col>
        ))}
      </Row>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <Input prefix={<SearchOutlined style={{ color: "#94a3b8" }} />} placeholder="Ism, lavozim qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 280, borderRadius: 10 }} />
        <Select placeholder="Rol" allowClear value={roleFilter} onChange={setRoleFilter} style={{ width: 180 }}>
          {["director","center_admin","teacher"].map(r => <Option key={r} value={r}>{ROLE_META[r]?.icon} {ROLE_META[r]?.label}</Option>)}
        </Select>
        <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ borderRadius: 10 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditModal({ open: true, emp: null })} style={{ marginLeft: "auto", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}>
          Xodim qo'shish
        </Button>
      </div>

      <Table dataSource={data.results} columns={columns} rowKey="id" loading={loading} size="small"
        style={{ background: "#fff", borderRadius: 16 }}
        pagination={{ total: data.count, pageSize: 15, current: page, onChange: setPage, showSizeChanger: false, showTotal: (t) => `Jami: ${t} ta xodim` }}
      />

      <EmployeeModal employee={editModal.emp} open={editModal.open} onClose={() => setEditModal({ open: false, emp: null })} onSuccess={fetchData} />
      <DetailModal   employee={detailModal}  open={!!detailModal}  onClose={() => setDetailModal(null)} />
      <StatusModal   employee={statusModal}  open={!!statusModal}  onClose={() => setStatusModal(null)} onSuccess={fetchData} />
    </div>
  );
}