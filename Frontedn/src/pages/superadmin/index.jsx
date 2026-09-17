// ════════════════════════════════════════════════════════
//  pages/superadmin/Users.jsx
// ════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from "react";
import { Table, Button, Input, Tag, Modal, Form, Select, Space, Spin, Alert, message, Popconfirm, Switch } from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import usersApi from "../../api/users.api";
import { useDebounce } from "../../hooks/useDebounce";
import { formatDate } from "../../utils/formatters";
import { ROLE_META } from "../../utils/constants";

const { Option } = Select;

export function Users() {
  const [data,    setData]    = useState({ results: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [modal,   setModal]   = useState({ open: false, user: null });
  const [form]                = Form.useForm();
  const debouncedSearch       = useDebounce(search, 400);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    usersApi.getAll({ search: debouncedSearch, page, page_size: 15 })
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSave = async (values) => {
    try {
      if (modal.user) {
        await usersApi.update(modal.user.id, values);
        message.success("Yangilandi!");
      } else {
        await usersApi.create(values);
        message.success("Foydalanuvchi yaratildi!");
      }
      setModal({ open: false, user: null });
      form.resetFields();
      fetchUsers();
    } catch (e) {
      message.error(e.response?.data?.detail || "Xatolik");
    }
  };

  const handleDelete = async (id) => {
    try {
      await usersApi.delete(id);
      message.success("O'chirildi");
      fetchUsers();
    } catch { message.error("O'chirib bo'lmadi"); }
  };

  const handleToggle = async (id, checked) => {
    await usersApi.patch(id, { is_active: checked });
    fetchUsers();
  };

  const columns = [
    { title: "#", key: "idx", width: 50, render: (_, __, i) => (page - 1) * 15 + i + 1 },
    { title: "F.I.O", key: "name", render: (_, r) => <div><div style={{ fontWeight: 700 }}>{r.last_name} {r.first_name}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>@{r.username}</div></div> },
    { title: "Rol", dataIndex: "role", key: "role", render: (role) => {
        const m = ROLE_META[role] || {};
        return <Tag style={{ borderRadius: 20, background: m.bg, color: m.color, border: "none", fontWeight: 700 }}>{m.icon} {m.label}</Tag>;
      }
    },
    { title: "Texnikum", key: "texnikum", render: (_, r) => r.texnikum_name || "—" },
    { title: "Holat", dataIndex: "is_active", key: "active",
      render: (v, r) => <Switch checked={v} size="small" onChange={(c) => handleToggle(r.id, c)} /> },
    { title: "Qo'shilgan", dataIndex: "date_joined", key: "date", render: (d) => formatDate(d) },
    { title: "", key: "action", render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setModal({ open: true, user: r }); form.setFieldsValue(r); }} />
          <Popconfirm title="O'chirilsinmi?" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <Input prefix={<SearchOutlined />} placeholder="Ism, username qidirish..."
          value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300, borderRadius: 10 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ open: true, user: null })}
          style={{ marginLeft: "auto", borderRadius: 10, background: "#6366f1", border: "none" }}>
          Foydalanuvchi qo'shish
        </Button>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

      <Table
        dataSource={data.results} columns={columns} rowKey="id"
        loading={loading} size="small"
        style={{ background: "#fff", borderRadius: 16 }}
        pagination={{ total: data.count, pageSize: 15, current: page, onChange: setPage, showSizeChanger: false }}
      />

      <Modal
        title={modal.user ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}
        open={modal.open} onCancel={() => { setModal({ open: false, user: null }); form.resetFields(); }} footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          <Form.Item name="last_name" label="Familiya" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="first_name" label="Ism" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}><Input /></Form.Item>
          {!modal.user && (
            <Form.Item name="password" label="Parol" rules={[{ required: true, min: 8 }]}><Input.Password /></Form.Item>
          )}
          <Form.Item name="role" label="Rol" rules={[{ required: true }]}>
            <Select placeholder="Rol tanlang">
              {Object.entries(ROLE_META).map(([k, v]) => (
                <Option key={k} value={k}>{v.icon} {v.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="email" label="Email"><Input type="email" /></Form.Item>
          <Space>
            <Button onClick={() => { setModal({ open: false, user: null }); form.resetFields(); }}>Bekor</Button>
            <Button type="primary" htmlType="submit" style={{ background: "#6366f1", border: "none" }}>
              {modal.user ? "Saqlash" : "Yaratish"}
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  pages/superadmin/Logs.jsx
// ════════════════════════════════════════════════════════
import { logsApi } from "../../api/resources.api";

export function Logs() {
  const [data,    setData]    = useState({ results: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    logsApi.getAll({ page, page_size: 20 })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const ACTION_COLORS = { create: "success", update: "processing", delete: "error" };

  const columns = [
    { title: "Foydalanuvchi", dataIndex: "user", key: "user", render: (u) => <span style={{ fontWeight: 700 }}>@{u}</span> },
    { title: "Texnikum",      key: "texnikum",  render: (_, r) => r.texnikum_name || "—" },
    { title: "Amal turi",     dataIndex: "action_type", key: "type",
      render: (t) => <Tag color={ACTION_COLORS[t] || "default"} style={{ borderRadius: 20, fontWeight: 700 }}>{t?.toUpperCase()}</Tag> },
    { title: "Tavsif",        dataIndex: "description", key: "desc", render: (d) => <span style={{ fontSize: 12 }}>{d}</span> },
    { title: "Sana",          dataIndex: "created_at",  key: "time",
      render: (t) => t ? new Date(t).toLocaleString("uz-UZ") : "—" },
  ];

  return (
    <Table
      dataSource={data.results} columns={columns} rowKey="id"
      loading={loading} size="small"
      style={{ background: "#fff", borderRadius: 16 }}
      pagination={{ total: data.count, pageSize: 20, current: page, onChange: setPage }}
    />
  );
}

// ════════════════════════════════════════════════════════
//  pages/superadmin/SaaS.jsx — Obuna boshqaruv sahifasi
// ════════════════════════════════════════════════════════

export function SaaS() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [subModal, setSubModal] = useState(null);
  const [form] = Form.useForm();

  const fetchData = () => {
    saasApi.getTexnikumlar()
      .then((d) => setData(d.results || d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (subModal) {
      form.setFieldsValue({
        subscription_end: subModal.subscription_end ? dayjs(subModal.subscription_end) : null,
        is_active: subModal.is_active,
      });
    }
  }, [subModal, form]);

  const handleSave = async (values) => {
    try {
      await saasApi.updateSubscription(subModal.id, {
        subscription_end: values.subscription_end?.format("YYYY-MM-DD"),
        is_active: values.is_active,
      });
      message.success("Obuna yangilandi!");
      setSubModal(null);
      form.resetFields();
      fetchData();
    } catch { message.error("Xatolik"); }
  };

  const getDays = (date, isActive) => {
    const days = getDaysLeft(date);
    if (!isActive || days < 0) return { label: "Muddati o'tgan", color: "error" };
    if (days <= 7) return { label: `🔴 ${days} kun`, color: "error" };
    if (days <= 30) return { label: `⚠ ${days} kun`, color: "warning" };
    return { label: `✅ ${days} kun`, color: "success" };
  };

  const columns = [
    { title: "Texnikum", dataIndex: "name", key: "name", render: (n, r) => <div><div style={{ fontWeight: 700 }}>{n}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{r.founder_name}</div></div> },
    { title: "Obuna tugaydi", dataIndex: "subscription_end", key: "sub", render: (d) => formatDate(d) },
    { title: "Qolgan kunlar", key: "days", render: (_, r) => { const d = getDays(r.subscription_end, r.is_active); return <Tag color={d.color} style={{ borderRadius: 20, fontWeight: 700 }}>{d.label}</Tag>; } },
    { title: "Holat", dataIndex: "is_active", key: "active", render: (v) => <Tag color={v ? "success" : "default"}>{v ? "Aktiv" : "Nofaol"}</Tag> },
    { title: "", key: "action", render: (_, r) => <Button size="small" icon={<EditOutlined />} onClick={() => setSubModal(r)}>Yangilash</Button> },
  ];

  return (
    <div>
      {loading ? <Spin /> : (
        <Table dataSource={data} columns={columns} rowKey="id" size="small"
          style={{ background: "#fff", borderRadius: 16 }} pagination={false} />
      )}

      <Modal title={<div><div style={{ fontWeight: 800 }}>Obuna yangilash</div><div style={{ color: "#6366f1", fontSize: 13 }}>{subModal?.name}</div></div>}
        open={!!subModal} onCancel={() => { setSubModal(null); form.resetFields(); }} footer={null} width={400}>
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          <Form.Item name="subscription_end" label="Yangi tugash sanasi" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="is_active" label="Holat">
            <Select><Option value={true}>✅ Aktiv</Option><Option value={false}>❌ To'xtatilgan</Option></Select>
          </Form.Item>
          <Space>
            <Button onClick={() => setSubModal(null)}>Bekor</Button>
            <Button type="primary" htmlType="submit" style={{ background: "#6366f1", border: "none" }}>Saqlash</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}