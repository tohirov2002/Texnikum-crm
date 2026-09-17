import { useEffect, useState, useCallback } from "react";
import {
  Table, Button, Input, Tag, Modal, Form, Select, Row, Col,
  Space, Spin, Alert, message, Popconfirm, Switch, Avatar, Typography, Card,
} from "antd";
import {
  PlusOutlined, SearchOutlined, EditOutlined,
  DeleteOutlined, UserOutlined,
} from "@ant-design/icons";
import usersApi from "../../api/users.api";
import { useDebounce } from "../../hooks/useDebounce";
import { formatDate, getInitials } from "../../utils/formatters";
import { ROLE_META } from "../../utils/constants";

const { Text } = Typography;
const { Option } = Select;

// ─── Foydalanuvchi modali ─────────────────────────────────────────────────────
function UserModal({ user, open, onClose, onSuccess }) {
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit    = !!user;

  useEffect(() => {
    if (open) {
      if (user) {
        form.setFieldsValue({
          last_name:  user.last_name,
          first_name: user.first_name,
          username:   user.username,
          email:      user.email,
          role:       user.role,
          is_active:  user.is_active,
        });
      } else {
        form.resetFields();
      }
    }
  }, [user, open, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      if (isEdit) {
        await usersApi.update(user.id, values);
        message.success("Foydalanuvchi yangilandi!");
      } else {
        await usersApi.create(values);
        message.success("Foydalanuvchi yaratildi!");
      }
      onSuccess();
      onClose();
    } catch (e) {
      const err = e.response?.data;
      if (err?.username) message.error(`Username: ${err.username[0]}`);
      else if (err?.password) message.error(`Parol: ${err.password[0]}`);
      else message.error(err?.detail || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {isEdit ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}
          </div>
          {isEdit && (
            <div style={{ color: "#6366f1", fontSize: 13, fontWeight: 400 }}>
              @{user?.username}
            </div>
          )}
        </div>
      }
      width={480}
    >
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="last_name" label="Familiya" rules={[{ required: true, message: "Familiya kiriting!" }]}>
              <Input placeholder="Familiya" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="first_name" label="Ism" rules={[{ required: true, message: "Ism kiriting!" }]}>
              <Input placeholder="Ism" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="username" label="Username" rules={[{ required: true, message: "Username kiriting!" }]}>
          <Input prefix="@" placeholder="username" />
        </Form.Item>

        {!isEdit && (
          <Form.Item
            name="password"
            label="Parol"
            rules={[{ required: true, message: "Parol kiriting!" }, { min: 8, message: "Kamida 8 ta belgi!" }]}
          >
            <Input.Password placeholder="Kamida 8 ta belgi" />
          </Form.Item>
        )}

        <Form.Item name="email" label="Email (ixtiyoriy)">
          <Input type="email" placeholder="email@example.com" />
        </Form.Item>

        <Form.Item name="role" label="Rol" rules={[{ required: true, message: "Rol tanlang!" }]}>
          <Select placeholder="Rol tanlang">
            {Object.entries(ROLE_META).map(([key, meta]) => (
              <Option key={key} value={key}>
                {meta.icon} {meta.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {isEdit && (
          <Form.Item name="is_active" label="Holat" valuePropName="checked">
            <Switch checkedChildren="Aktiv" unCheckedChildren="Nofaol" />
          </Form.Item>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Button onClick={onClose} style={{ flex: 1 }}>Bekor</Button>
          <Button
            type="primary" htmlType="submit" loading={loading}
            style={{ flex: 2, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10 }}
          >
            {isEdit ? "💾 Saqlash" : "✅ Yaratish"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

// ─── ASOSIY KOMPONENT ─────────────────────────────────────────────────────────
export default function Users() {
  const [data,    setData]    = useState({ results: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState("");
  const [roleF,   setRoleF]   = useState(undefined);
  const [page,    setPage]    = useState(1);
  const [modal,   setModal]   = useState({ open: false, user: null });

  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(() => {
    setLoading(true);
    usersApi.getAll({
      search: debouncedSearch,
      role: roleF || undefined,
      page,
      page_size: 15,
    })
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, roleF, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    try {
      await usersApi.delete(id);
      message.success("Foydalanuvchi o'chirildi!");
      fetchData();
    } catch {
      message.error("O'chirib bo'lmadi!");
    }
  };

  const handleToggleActive = async (id, checked) => {
    try {
      await usersApi.patch(id, { is_active: checked });
      message.success(checked ? "Faollashtirildi" : "Bloklandi");
      fetchData();
    } catch {
      message.error("Xatolik");
    }
  };

  const columns = [
    {
      title: "#",
      key: "idx",
      width: 52,
      render: (_, __, i) => (
        <Text type="secondary" style={{ fontSize: 12 }}>{(page - 1) * 15 + i + 1}</Text>
      ),
    },
    {
      title: "Foydalanuvchi",
      key: "user",
      render: (_, r) => {
        const roleMeta = ROLE_META[r.role] || {};
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar
              size={34}
              style={{ background: `linear-gradient(135deg,${roleMeta.color || "#6366f1"},${roleMeta.color || "#8b5cf6"}aa)`, flexShrink: 0 }}
            >
              {getInitials(`${r.last_name} ${r.first_name}`)}
            </Avatar>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{r.last_name} {r.first_name}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>@{r.username}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Rol",
      dataIndex: "role",
      key: "role",
      render: (role) => {
        const m = ROLE_META[role] || {};
        return (
          <Tag
            style={{
              borderRadius: 20, background: m.bg, color: m.color,
              border: `1px solid ${m.color}30`, fontWeight: 700, fontSize: 11,
            }}
          >
            {m.icon} {m.label}
          </Tag>
        );
      },
    },
    {
      title: "Texnikum",
      key: "texnikum",
      render: (_, r) => r.texnikum_name
        ? <Text style={{ fontSize: 12 }}>{r.texnikum_name}</Text>
        : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (e) => e ? <Text style={{ fontSize: 12 }}>{e}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: "Holat",
      dataIndex: "is_active",
      key: "active",
      render: (v, r) => (
        <Switch
          checked={v}
          size="small"
          onChange={(checked) => handleToggleActive(r.id, checked)}
        />
      ),
    },
    {
      title: "Qo'shilgan",
      dataIndex: "date_joined",
      key: "joined",
      render: (d) => <Text style={{ fontSize: 12 }}>{formatDate(d)}</Text>,
    },
    {
      title: "",
      key: "actions",
      render: (_, r) => (
        <Space>
          <Button
            size="small" icon={<EditOutlined />}
            onClick={() => setModal({ open: true, user: r })}
            style={{ borderRadius: 8 }}
          />
          <Popconfirm
            title="Foydalanuvchi o'chirilsinmi?"
            description="Bu amal qaytarilmaydi!"
            onConfirm={() => handleDelete(r.id)}
            okText="Ha, o'chir"
            cancelText="Bekor"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (error) return <Alert type="error" message={error} style={{ marginBottom: 16 }} />;

  return (
    <div>
      {/* Toolbar */}
      <Card bordered={false} style={{ borderRadius: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            placeholder="Ism, username, email qidirish..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ maxWidth: 300, borderRadius: 10 }}
          />
          <Select
            placeholder="Rol filtri"
            allowClear
            value={roleF}
            onChange={(v) => { setRoleF(v); setPage(1); }}
            style={{ width: 200 }}
          >
            {Object.entries(ROLE_META).map(([key, meta]) => (
              <Option key={key} value={key}>{meta.icon} {meta.label}</Option>
            ))}
          </Select>
          <div style={{ marginLeft: "auto" }}>
            <Text type="secondary" style={{ fontSize: 12, marginRight: 12 }}>
              Jami: {data.count} ta
            </Text>
            <Button
              type="primary" icon={<PlusOutlined />}
              onClick={() => setModal({ open: true, user: null })}
              style={{
                borderRadius: 10,
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                border: "none",
                boxShadow: "0 4px 16px rgba(99,102,241,0.30)",
              }}
            >
              Foydalanuvchi qo'shish
            </Button>
          </div>
        </div>
      </Card>

      {/* Jadval */}
      <Card bordered={false} style={{ borderRadius: 16 }}>
        <Table
          dataSource={data.results}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            total: data.count,
            pageSize: 15,
            current: page,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            showTotal: (total) => `Jami ${total} ta`,
          }}
        />
      </Card>

      {/* Modal */}
      <UserModal
        user={modal.user}
        open={modal.open}
        onClose={() => setModal({ open: false, user: null })}
        onSuccess={fetchData}
      />
    </div>
  );
}