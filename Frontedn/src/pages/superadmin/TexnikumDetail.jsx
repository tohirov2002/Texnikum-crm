/**
 * TexnikumDetail.jsx — TO'LIQ MUKAMMAL VERSIYA
 *
 * Qo'shimchalar (oldingi versiyadan):
 *   ✅ "Foydalanuvchilar" tab — Director + Admin ro'yxati
 *   ✅ Yangi user yaratib qo'shish (username/parol bilan)
 *   ✅ Mavjud userdan tanlash (dropdown search)
 *   ✅ User tahrirlash modali
 *   ✅ User o'chirish (Popconfirm)
 *   ✅ GPS ma'lumoti header da ko'rinadi
 *   ✅ Barcha App.useApp() to'g'ri ishlatilgan
 *
 * saasApi da bo'lishi kerak:
 *   getTexnikumUsers(id)
 *   createTexnikumUser(id, data)
 *   assignExistingUser(id, data)
 *   updateTexnikumUser(id, userId, data)
 *   deleteTexnikumUser(id, userId)
 *   getUnassignedUsers()
 *   updateSubscription(id, data)
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Row, Col, Card, Tag, Button, Tabs, Table, Spin, Alert,
  Typography, Avatar, Descriptions, Modal, Form, DatePicker,
  Select, Statistic, Progress, Input, InputNumber, Popconfirm, Divider,
  Space, App, Badge,
} from "antd";
import {
  ArrowLeftOutlined, KeyOutlined,
  TeamOutlined, UserOutlined, BookOutlined, DollarOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined, UserAddOutlined,
  CrownOutlined, SettingOutlined, UserSwitchOutlined,
  PhoneOutlined, MailOutlined, LockOutlined, IdcardOutlined,
  EyeInvisibleOutlined, EyeTwoTone, EnvironmentOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, BankOutlined,
} from "@ant-design/icons";
import dashboardApi from "../../api/dashboard.api";
import saasApi      from "../../api/saas.api";
import {
  formatDate, formatCurrency, getDaysLeft, getSubStatus, getInitials,
} from "../../utils/formatters";
import { SUB_STATUS } from "../../utils/constants";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option }      = Select;

// ─────────────────────────────────────────────────────────────────────────────
//  KONSTANTALAR
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_CFG = {
  founder: {
    label: "Ta'sischi",
    color: "#8b5cf6",
    bg:    "#f5f3ff",
    border:"#ddd6fe",
    icon:  <CrownOutlined />,
  },
  director: {
    label: "Direktor",
    color: "#3b82f6",
    bg:    "#eff6ff",
    border:"#bfdbfe",
    icon:  <UserSwitchOutlined />,
  },
  center_admin: {
    label: "Texnikum Admin",
    color: "#10b981",
    bg:    "#f0fdf4",
    border:"#bbf7d0",
    icon:  <SettingOutlined />,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  OBUNA MODALI
// ─────────────────────────────────────────────────────────────────────────────
function SubModal({ texnikum, open, onClose, onSuccess }) {
  const { message } = App.useApp();
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (texnikum && open) {
      form.setFieldsValue({
        subscription_end: texnikum.subscription_end
          ? dayjs(texnikum.subscription_end)
          : null,
        is_active: texnikum.is_active,
      });
    }
  }, [texnikum, open, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await saasApi.updateSubscription(texnikum.id, {
        subscription_end: values.subscription_end?.format("YYYY-MM-DD"),
        is_active:        values.is_active,
      });
      message.success("✅ Obuna muvaffaqiyatli yangilandi!");
      onSuccess();
      onClose();
    } catch (e) {
      message.error(e?.response?.data?.error || "Xatolik yuz berdi!");
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
          <div style={{ fontWeight: 800, fontSize: 16 }}>Obuna boshqaruvi</div>
          <div style={{ color: "#6366f1", fontSize: 13, fontWeight: 400 }}>
            {texnikum?.name}
          </div>
        </div>
      }
      width={420}
    >
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
        <Form.Item
          name="subscription_end"
          label="Yangi tugash sanasi"
          rules={[{ required: true, message: "Sanani tanlang!" }]}
        >
          <DatePicker
            style={{ width: "100%", borderRadius: 10 }}
            format="DD.MM.YYYY"
            size="large"
            placeholder="Sanani tanlang"
          />
        </Form.Item>
        <Form.Item name="is_active" label="Texnikum holati">
          <Select size="large" style={{ borderRadius: 10 }}>
            <Option value={true}>✅ Aktiv</Option>
            <Option value={false}>❌ To'xtatilgan</Option>
          </Select>
        </Form.Item>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Button onClick={onClose} style={{ flex: 1, borderRadius: 10 }}>
            Bekor
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              flex: 2,
              borderRadius: 10,
              background: "#6366f1",
              border: "none",
              fontWeight: 700,
            }}
          >
            💾 Saqlash
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FOYDALANUVCHI QO'SHISH MODALI
// ─────────────────────────────────────────────────────────────────────────────
function AddUserModal({ texnikumId, open, onClose, onSuccess }) {
  const { message } = App.useApp();
  const [form]          = Form.useForm();
  const [mode,          setMode]          = useState("new");
  const [loading,       setLoading]       = useState(false);
  const [existUsers,    setExistUsers]    = useState([]);
  const [loadingUsers,  setLoadingUsers]  = useState(false);

  // Mavjud userlarni yuklash (mode=existing bo'lganda)
  useEffect(() => {
    if (open && mode === "existing") {
      setLoadingUsers(true);
      saasApi
        .getUnassignedUsers?.()
        .then((data) =>
          setExistUsers(Array.isArray(data) ? data : data?.results || [])
        )
        .catch(() => setExistUsers([]))
        .finally(() => setLoadingUsers(false));
    }
  }, [open, mode]);

  const handleClose = () => {
    form.resetFields();
    setMode("new");
    onClose();
  };

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      if (mode === "new") {
        await saasApi.createTexnikumUser(texnikumId, {
          role:       values.role,
          username:   values.username,
          password:   values.password,
          first_name: values.first_name,
          last_name:  values.last_name,
          email:      values.email || "",
        });
      } else {
        await saasApi.assignExistingUser(texnikumId, {
          user_id: values.user_id,
          role:    values.role,
        });
      }
      message.success("✅ Foydalanuvchi muvaffaqiyatli qo'shildi!");
      handleClose();
      onSuccess();
    } catch (e) {
      const errData = e?.response?.data;
      if (errData && typeof errData === "object" && !errData.error) {
        const fields = Object.entries(errData).map(([name, msgs]) => ({
          name,
          errors: Array.isArray(msgs) ? msgs : [String(msgs)],
        }));
        form.setFields(fields);
      } else {
        message.error(errData?.error || errData?.detail || "Xatolik yuz berdi!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      title={
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Foydalanuvchi qo'shish</div>
          <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 400 }}>
            Direktor yoki Texnikum Admin
          </div>
        </div>
      }
      width={520}
      destroyOnHidden
    >
      {/* ── Rejim tanlash ── */}
      <div style={{ display: "flex", gap: 8, margin: "12px 0 20px" }}>
        {[
          { key: "new",      icon: <UserAddOutlined />,    label: "Yangi user yaratish"  },
          { key: "existing", icon: <UserSwitchOutlined />, label: "Mavjuddan tanlash"    },
        ].map((m) => (
          <div
            key={m.key}
            onClick={() => {
              setMode(m.key);
              form.resetFields(["user_id","username","password","first_name","last_name","email"]);
            }}
            style={{
              flex: 1,
              padding: "10px",
              textAlign: "center",
              borderRadius: 12,
              cursor: "pointer",
              transition: "all 0.2s",
              background: mode === m.key ? "#6366f1" : "#f8fafc",
              color:      mode === m.key ? "#fff"    : "#64748b",
              border:     mode === m.key ? "none"    : "1.5px solid #e2e8f0",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              userSelect: "none",
            }}
          >
            {m.icon} {m.label}
          </div>
        ))}
      </div>

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {/* Rol — ikkalasida ham */}
        <Form.Item
          name="role"
          label="Lavozim"
          rules={[{ required: true, message: "Lavozimni tanlang!" }]}
        >
          <Select placeholder="Lavozim tanlang" size="large" style={{ borderRadius: 10 }}>
            <Option value="director">
              <Space>
                <UserSwitchOutlined style={{ color: "#3b82f6" }} />
                Direktor
              </Space>
            </Option>
            <Option value="center_admin">
              <Space>
                <SettingOutlined style={{ color: "#10b981" }} />
                Texnikum Admin
              </Space>
            </Option>
          </Select>
        </Form.Item>

        {/* ── YANGI USER ── */}
        {mode === "new" && (
          <>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="last_name"
                  label="Familiya"
                  rules={[{ required: true, message: "Familiya majburiy!" }]}
                >
                  <Input
                    prefix={<IdcardOutlined style={{ color: "#94a3b8" }} />}
                    placeholder="Familiya"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="first_name"
                  label="Ism"
                  rules={[{ required: true, message: "Ism majburiy!" }]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: "#94a3b8" }} />}
                    placeholder="Ism"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="username"
              label="Login (username)"
              rules={[
                { required: true, message: "Login majburiy!" },
                { min: 3, message: "Kamida 3 ta belgi!" },
                {
                  pattern: /^[a-zA-Z0-9_]+$/,
                  message: "Faqat lotin harf, raqam va _ belgisi!",
                },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#94a3b8" }} />}
                placeholder="director_login"
                style={{ borderRadius: 10 }}
                autoComplete="off"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Parol"
              rules={[
                { required: true, message: "Parol majburiy!" },
                { min: 8, message: "Kamida 8 ta belgi!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
                placeholder="Kamida 8 ta belgi"
                style={{ borderRadius: 10 }}
                autoComplete="new-password"
                iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={
                <span>
                  Email{" "}
                  <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 12 }}>
                    (ixtiyoriy)
                  </span>
                </span>
              }
              rules={[{ type: "email", message: "Email formati noto'g'ri!" }]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#94a3b8" }} />}
                placeholder="email@example.com"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>
          </>
        )}

        {/* ── MAVJUD USER ── */}
        {mode === "existing" && (
          <Form.Item
            name="user_id"
            label="Foydalanuvchini tanlang"
            rules={[{ required: true, message: "Foydalanuvchi tanlang!" }]}
          >
            <Select
              showSearch
              loading={loadingUsers}
              placeholder="Ism yoki login bo'yicha qidiring..."
              optionFilterProp="label"
              size="large"
              style={{ borderRadius: 10 }}
              notFoundContent={
                loadingUsers ? (
                  <Spin size="small" />
                ) : (
                  <div style={{ textAlign: "center", color: "#94a3b8", padding: 8 }}>
                    Topilmadi
                  </div>
                )
              }
              options={existUsers.map((u) => ({
                value: u.id,
                label: `${u.last_name} ${u.first_name} (@${u.username})`,
              }))}
            />
          </Form.Item>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Button onClick={handleClose} style={{ borderRadius: 10 }}>
            Bekor
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              flex: 1,
              borderRadius: 10,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              border: "none",
              fontWeight: 700,
            }}
          >
            ✅ Qo'shish
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FOYDALANUVCHI TAHRIRLASH MODALI (username + parol ham)
// ─────────────────────────────────────────────────────────────────────────────
function EditUserModal({ texnikumId, user, open, onClose, onSuccess }) {
  const { message } = App.useApp();
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && open) {
      form.setFieldsValue({
        last_name:  user.last_name,
        first_name: user.first_name,
        username:   user.username,
        email:      user.email || "",
        role:       user.role,
        is_active:  user.is_active !== undefined ? user.is_active : true,
        password:   "",
      });
    }
  }, [user, open, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      // Parol bo'sh bo'lsa yubormaymiz
      const payload = { ...values };
      if (!payload.password) delete payload.password;
      await saasApi.updateTexnikumUser(texnikumId, user.id, payload);
      message.success("✅ Foydalanuvchi muvaffaqiyatli yangilandi!");
      onSuccess();
      onClose();
    } catch (e) {
      const errData = e?.response?.data;
      if (errData && typeof errData === "object" && !errData.error) {
        const fields = Object.entries(errData).map(([name, msgs]) => ({
          name,
          errors: Array.isArray(msgs) ? msgs : [String(msgs)],
        }));
        form.setFields(fields);
      } else {
        message.error(errData?.error || "Xatolik yuz berdi!");
      }
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
          <div style={{ fontWeight: 800, fontSize: 16 }}>Foydalanuvchini tahrirlash</div>
          <div style={{ color: "#6366f1", fontSize: 13, fontWeight: 400 }}>@{user?.username}</div>
        </div>
      }
      width={520}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 14 }}>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="last_name" label="Familiya" rules={[{ required: true, message: "Majburiy!" }]}>
              <Input prefix={<IdcardOutlined style={{ color: "#94a3b8" }} />} style={{ borderRadius: 10 }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="first_name" label="Ism" rules={[{ required: true, message: "Majburiy!" }]}>
              <Input prefix={<UserOutlined style={{ color: "#94a3b8" }} />} style={{ borderRadius: 10 }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="username"
          label="Login (username)"
          rules={[
            { required: true, message: "Login majburiy!" },
            { min: 3, message: "Kamida 3 ta belgi!" },
            { pattern: /^[a-zA-Z0-9_]+$/, message: "Faqat lotin harf, raqam va _!" },
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: "#94a3b8" }} />}
            style={{ borderRadius: 10 }}
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={
            <span>
              Yangi parol{" "}
              <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 12 }}>
                (bo'sh qoldirsa o'zgarmaydi)
              </span>
            </span>
          }
          rules={[
            {
              validator: (_, val) =>
                !val || val.length >= 8
                  ? Promise.resolve()
                  : Promise.reject("Kamida 8 ta belgi!"),
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
            placeholder="Yangi parol kiriting (ixtiyoriy)"
            style={{ borderRadius: 10 }}
            autoComplete="new-password"
            iconRender={(v) => (v ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ type: "email", message: "Email formati noto'g'ri!" }]}
        >
          <Input prefix={<MailOutlined style={{ color: "#94a3b8" }} />} placeholder="email@example.com" style={{ borderRadius: 10 }} />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="role" label="Lavozim" rules={[{ required: true, message: "Majburiy!" }]}>
              <Select style={{ borderRadius: 10 }}>
                <Option value="director"><Space><UserSwitchOutlined style={{ color: "#3b82f6" }} />Direktor</Space></Option>
                <Option value="center_admin"><Space><SettingOutlined style={{ color: "#10b981" }} />Texnikum Admin</Space></Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="is_active" label="Holat">
              <Select style={{ borderRadius: 10 }}>
                <Option value={true}>✅ Aktiv</Option>
                <Option value={false}>❌ Nofaol</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <div style={{ display: "flex", gap: 10 }}>
          <Button onClick={onClose} style={{ borderRadius: 10 }}>Bekor</Button>
          <Button
            type="primary" htmlType="submit" loading={loading}
            style={{ flex: 1, borderRadius: 10, background: "#6366f1", border: "none", fontWeight: 700 }}
          >
            💾 Saqlash
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TEXNIKUM TAHRIRLASH MODALI
// ─────────────────────────────────────────────────────────────────────────────
function EditTexnikumModal({ texnikum, open, onClose, onSuccess }) {
  const { message } = App.useApp();
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (texnikum && open) {
      form.setFieldsValue({
        name:             texnikum.name,
        address:          texnikum.address,
        phone:            texnikum.phone,
        subscription_end: texnikum.subscription_end ? dayjs(texnikum.subscription_end) : null,
        is_active:        texnikum.is_active,
        latitude:         texnikum.latitude || "",
        longitude:        texnikum.longitude || "",
        gps_radius:       texnikum.gps_radius || 100,
      });
    }
  }, [texnikum, open, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await saasApi.updateTexnikum(texnikum.id, {
        ...values,
        subscription_end: values.subscription_end?.format("YYYY-MM-DD"),
        latitude:  values.latitude  ? parseFloat(values.latitude)  : null,
        longitude: values.longitude ? parseFloat(values.longitude) : null,
      });
      message.success("✅ Texnikum muvaffaqiyatli yangilandi!");
      onSuccess();
      onClose();
    } catch (e) {
      const errData = e?.response?.data;
      if (errData && typeof errData === "object" && !errData.error) {
        const fields = Object.entries(errData).map(([name, msgs]) => ({
          name,
          errors: Array.isArray(msgs) ? msgs : [String(msgs)],
        }));
        form.setFields(fields);
      } else {
        message.error(errData?.error || "Xatolik yuz berdi!");
      }
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
          <div style={{ fontWeight: 800, fontSize: 16 }}>Texnikumni tahrirlash</div>
          <div style={{ color: "#6366f1", fontSize: 13, fontWeight: 400 }}>{texnikum?.name}</div>
        </div>
      }
      width={580}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 14 }}>
        <Form.Item name="name" label="Texnikum nomi" rules={[{ required: true, message: "Majburiy!" }]}>
          <Input prefix={<BankOutlined style={{ color: "#94a3b8" }} />} size="large" style={{ borderRadius: 10 }} />
        </Form.Item>

        <Form.Item name="address" label="Manzil" rules={[{ required: true, message: "Majburiy!" }]}>
          <Input prefix={<EnvironmentOutlined style={{ color: "#94a3b8" }} />} size="large" style={{ borderRadius: 10 }} />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="phone" label="Telefon" rules={[{ required: true, message: "Majburiy!" }]}>
              <Input prefix={<PhoneOutlined style={{ color: "#94a3b8" }} />} size="large" style={{ borderRadius: 10 }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="subscription_end" label="Obuna tugash sanasi">
              <DatePicker style={{ width: "100%", borderRadius: 10 }} format="DD.MM.YYYY" size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="is_active" label="Holat">
              <Select size="large" style={{ borderRadius: 10 }}>
                <Option value={true}>✅ Aktiv</Option>
                <Option value={false}>❌ To'xtatilgan</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="gps_radius" label="GPS Radius (metr)">
              <InputNumber min={50} max={1000} step={10} style={{ width: "100%", borderRadius: 10 }} size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: "12px 0" }}>
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>GPS KOORDINATALARI</span>
        </Divider>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="latitude" label="Latitude">
              <Input placeholder="41.299496" style={{ borderRadius: 10 }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="longitude" label="Longitude">
              <Input placeholder="69.240073" style={{ borderRadius: 10 }} />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Button onClick={onClose} style={{ borderRadius: 10 }}>Bekor</Button>
          <Button
            type="primary" htmlType="submit" loading={loading}
            style={{ flex: 1, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", fontWeight: 700, height: 44 }}
          >
            💾 Saqlash
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  USERS TAB
// ─────────────────────────────────────────────────────────────────────────────
function UsersTab({ texnikumId }) {
  const { message } = App.useApp();
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [addModal,   setAddModal]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    saasApi
      .getTexnikumUsers?.(texnikumId)
      .then((data) =>
        setUsers(Array.isArray(data) ? data : data?.results || [])
      )
      .catch(() => {
        setUsers([]);
        message.error("Foydalanuvchilar yuklanmadi!");
      })
      .finally(() => setLoading(false));
  }, [texnikumId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId, userName) => {
    try {
      await saasApi.deleteTexnikumUser?.(texnikumId, userId);
      message.success(`✅ ${userName} texnikumdan chiqarildi!`);
      fetchUsers();
    } catch (e) {
      message.error(e?.response?.data?.error || "O'chirishda xatolik!");
    }
  };

  // ── Bir user kartasi ──
  const UserCard = ({ u }) => {
    const cfg = ROLE_CFG[u.role] || ROLE_CFG.center_admin;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 16px",
          borderRadius: 14,
          marginBottom: 10,
          background: "#fff",
          border: `1.5px solid ${cfg.border}`,
          boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          transition: "box-shadow 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)")
        }
      >
        {/* Avatar */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `linear-gradient(135deg,${cfg.color}90,${cfg.color})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
            boxShadow: `0 4px 10px ${cfg.color}40`,
          }}
        >
          {getInitials(`${u.first_name} ${u.last_name}`)}
        </div>

        {/* Ma'lumotlar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1e3a" }}>
            {u.last_name} {u.first_name}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            @{u.username}
            {u.email && (
              <span style={{ marginLeft: 8 }}>• {u.email}</span>
            )}
          </div>
        </div>

        {/* Rol + holat */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 5,
            flexShrink: 0,
          }}
        >
          <Tag
            style={{
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              background: cfg.bg,
              color:      cfg.color,
              border:     `1px solid ${cfg.border}`,
              padding:    "2px 10px",
              display:    "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {cfg.icon} {cfg.label}
          </Tag>
          <Tag
            color={u.is_active ? "success" : "default"}
            style={{ borderRadius: 20, fontSize: 10, margin: 0 }}
          >
            {u.is_active ? "Aktiv" : "Nofaol"}
          </Tag>
        </div>

        {/* Amallar */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditTarget(u)}
            style={{
              borderRadius: 8,
              borderColor: "#6366f1",
              color: "#6366f1",
              fontWeight: 600,
            }}
          >
            Tahrir
          </Button>
          <Popconfirm
            title="Foydalanuvchini chiqarish"
            description={`"${u.last_name} ${u.first_name}" texnikumdan chiqarilsinmi?`}
            onConfirm={() => handleDelete(u.id, `${u.last_name} ${u.first_name}`)}
            okText="Ha, chiqar"
            cancelText="Bekor"
            okButtonProps={{ danger: true }}
            placement="topRight"
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
              style={{ borderRadius: 8 }}
            />
          </Popconfirm>
        </div>
      </div>
    );
  };

  // ── Rol bo'yicha bo'lim ──
  const RoleSection = ({ role, label, color }) => {
    const list = users.filter((u) => u.role === role);
    return (
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: `2px solid ${color}25`,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 0 3px ${color}25`,
            }}
          />
          <Text style={{ fontWeight: 800, fontSize: 14, color }}>
            {label}
          </Text>
          <Tag
            style={{
              borderRadius: 20,
              background: `${color}15`,
              color,
              border: "none",
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            {list.length} ta
          </Tag>
        </div>

        {list.length === 0 ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              borderRadius: 12,
              background: "#f8fafc",
              border: "1.5px dashed #e2e8f0",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            Hali {label.toLowerCase()} qo'shilmagan
          </div>
        ) : (
          list.map((u) => <UserCard key={u.id} u={u} />)
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 0" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <Text style={{ fontWeight: 800, fontSize: 16, color: "#1e1e3a" }}>
            Texnikum foydalanuvchilari
          </Text>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
            Jami {users.length} ta foydalanuvchi
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddModal(true)}
          style={{
            borderRadius: 10,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            border: "none",
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
          }}
        >
          Foydalanuvchi qo'shish
        </Button>
      </div>

      {/* Rol bo'yicha bo'limlar */}
      <RoleSection role="director"     label="Direktorlar"       color="#3b82f6" />
      <RoleSection role="center_admin" label="Texnikum Adminlar" color="#10b981" />

      {/* Modallar */}
      <AddUserModal
        texnikumId={texnikumId}
        open={addModal}
        onClose={() => setAddModal(false)}
        onSuccess={fetchUsers}
      />
      <EditUserModal
        texnikumId={texnikumId}
        user={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ASOSIY SAHIFA
// ─────────────────────────────────────────────────────────────────────────────
export default function TexnikumDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [subModal, setSubModal] = useState(false);
  const [editTexModal, setEditTexModal] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    dashboardApi
      .getSuperAdminTexnikum(id)
      .then((res) => setData(res))
      .catch((e) =>
        setError(e?.response?.data?.error || "Ma'lumot yuklanmadi")
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  if (error)
    return (
      <Alert
        type="error"
        message={error}
        style={{ margin: 24, borderRadius: 12 }}
      />
    );
  if (!data) return null;

  const {
    texnikum,
    stats      = {},
    employees  = [],
    students   = [],
    groups     = [],
    recent_logs = [],
  } = data;

  const days      = getDaysLeft(texnikum?.subscription_end);
  const subStatus = getSubStatus(texnikum?.subscription_end, texnikum?.is_active);
  const subCfg    = SUB_STATUS[subStatus] || {};

  // ── Jadval ustunlari ──
  const empColumns = [
    { title: "#", key: "idx", width: 48, render: (_, __, i) => i + 1 },
    {
      title: "F.I.O",
      key: "name",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar size={30} style={{ background: "#6366f1", fontSize: 11 }}>
            {getInitials(r.full_name)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{r.full_name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.position || "—"}</div>
          </div>
        </div>
      ),
    },
    { title: "Maosh", dataIndex: "monthly_salary", key: "salary", render: (v) => formatCurrency(v) },
    {
      title: "Holat",
      dataIndex: "is_active",
      key: "active",
      render: (v) => (
        <Tag color={v ? "success" : "default"}>{v ? "Aktiv" : "Nofaol"}</Tag>
      ),
    },
  ];

  const stuColumns = [
    { title: "#", key: "idx", width: 48, render: (_, __, i) => i + 1 },
    {
      title: "F.I.O",
      key: "name",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar size={30} style={{ background: "#3b82f6", fontSize: 11 }}>
            {getInitials(r.full_name)}
          </Avatar>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{r.full_name}</span>
        </div>
      ),
    },
    { title: "Guruh", dataIndex: "group_name", key: "group", render: (v) => v || "—" },
    {
      title: "Qarz",
      dataIndex: "debt",
      key: "debt",
      render: (v) => (
        <Text type={v > 0 ? "danger" : "success"}>{formatCurrency(v)}</Text>
      ),
    },
    {
      title: "Qo'shilgan",
      dataIndex: "joined_date",
      key: "joined",
      render: (v) => formatDate(v),
    },
  ];

  const grpColumns = [
    {
      title: "Nomi",
      dataIndex: "name",
      key: "name",
      render: (v) => <Text strong>{v}</Text>,
    },
    { title: "O'qituvchi", dataIndex: "teacher_name", key: "teacher" },
    {
      title: "Talabalar",
      dataIndex: "students_count",
      key: "count",
      render: (v) => <Tag color="blue">{v} ta</Tag>,
    },
    { title: "Fan", dataIndex: "subject", key: "subject" },
    {
      title: "Holat",
      dataIndex: "is_active",
      key: "active",
      render: (v) => (
        <Tag color={v ? "success" : "default"}>{v ? "Aktiv" : "Tugagan"}</Tag>
      ),
    },
  ];

  const logColumns = [
    {
      title: "Foydalanuvchi",
      dataIndex: "user",
      key: "user",
      render: (u) => <Text strong>@{u}</Text>,
    },
    {
      title: "Amal",
      dataIndex: "description",
      key: "desc",
      render: (d) => <Text style={{ fontSize: 12 }}>{d}</Text>,
    },
    {
      title: "Turi",
      dataIndex: "action_type",
      key: "type",
      render: (t) => (
        <Tag
          color={
            t === "create" ? "success" : t === "delete" ? "error" : "processing"
          }
          style={{ borderRadius: 20 }}
        >
          {t?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Vaqt",
      dataIndex: "created_at",
      key: "time",
      render: (t) => (t ? new Date(t).toLocaleString("uz-UZ") : "—"),
    },
  ];

  const tabItems = [
    {
      key: "users",
      label: (
        <span>
          <UserAddOutlined /> Foydalanuvchilar
        </span>
      ),
      children: <UsersTab texnikumId={id} />,
    },
    {
      key: "employees",
      label: (
        <span>
          <TeamOutlined /> Xodimlar ({employees.length})
        </span>
      ),
      children: (
        <Table
          dataSource={employees}
          columns={empColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          style={{ marginTop: 8 }}
        />
      ),
    },
    {
      key: "students",
      label: (
        <span>
          <UserOutlined /> Talabalar ({students.length})
        </span>
      ),
      children: (
        <Table
          dataSource={students}
          columns={stuColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          style={{ marginTop: 8 }}
        />
      ),
    },
    {
      key: "groups",
      label: (
        <span>
          <BookOutlined /> Guruhlar ({groups.length})
        </span>
      ),
      children: (
        <Table
          dataSource={groups}
          columns={grpColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          style={{ marginTop: 8 }}
        />
      ),
    },
    {
      key: "logs",
      label: <span>📋 Loglar</span>,
      children: (
        <Table
          dataSource={recent_logs}
          columns={logColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          style={{ marginTop: 8 }}
        />
      ),
    },
  ];

  return (
    <div>
      {/* ── Orqaga ── */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/superadmin/texnikumlar")}
        style={{ marginBottom: 20, borderRadius: 10 }}
      >
        Texnikumlarga qaytish
      </Button>

      {/* ── Header karta ── */}
      <Card
        variant="borderless"
        style={{
          borderRadius: 20,
          marginBottom: 20,
          background: "linear-gradient(135deg,#1e1e3a,#312e81)",
          boxShadow: "0 8px 32px rgba(99,102,241,0.20)",
        }}
      >
        <Row align="middle" justify="space-between" gutter={24} wrap>
          <Col>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  background: "rgba(99,102,241,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                }}
              >
                🏛️
              </div>
              <div>
                <Title
                  level={3}
                  style={{ color: "#fff", margin: 0, lineHeight: 1.2 }}
                >
                  {texnikum?.name}
                </Title>
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                  <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                    📍 {texnikum?.address}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                    📞 {texnikum?.phone}
                  </Text>
                  {texnikum?.latitude && texnikum?.longitude ? (
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                      📌 GPS: {texnikum.latitude}, {texnikum.longitude} • {texnikum.gps_radius || 100}m radius
                    </Text>
                  ) : (
                    <Text style={{ color: "rgba(255,200,100,0.7)", fontSize: 12 }}>
                      ⚠️ GPS koordinatalari kiritilmagan
                    </Text>
                  )}
                </div>
              </div>
            </div>
          </Col>
          <Col>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  padding: "12px 20px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  textAlign: "center",
                  minWidth: 140,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color:
                      subStatus === "active"
                        ? "#6ee7b7"
                        : subStatus === "warning"
                        ? "#fcd34d"
                        : "#fca5a5",
                  }}
                >
                  {subCfg.label || "—"}
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {days >= 0 ? `${days} kun qoldi` : "Muddati o'tgan"}
                </div>
                <div
                  style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}
                >
                  {formatDate(texnikum?.subscription_end)}
                </div>
              </div>
              <Button
                icon={<EditOutlined />}
                onClick={() => setEditTexModal(true)}
                style={{
                  borderRadius: 12,
                  height: 46,
                  paddingInline: 18,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Tahrirlash
              </Button>
              <Button
                icon={<KeyOutlined />}
                onClick={() => setSubModal(true)}
                style={{
                  borderRadius: 12,
                  height: 46,
                  paddingInline: 18,
                  background:
                    subStatus === "critical" || subStatus === "expired"
                      ? "#ef4444"
                      : "#6366f1",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Obuna yangilash
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ── Statistika qatorlari ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={10}>
          <Card
            variant="borderless"
            title={<span style={{ fontWeight: 700 }}>📋 Texnikum ma'lumotlari</span>}
            style={{ borderRadius: 16, height: "100%" }}
          >
            <Descriptions column={1} size="small" styles={{ label: { color: "#94a3b8", fontSize: 12 } }}>
              <Descriptions.Item label="Texnikum nomi">
                <Text strong>{texnikum?.name || "—"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Telefon">
                {texnikum?.phone || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Manzil">
                {texnikum?.address || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="GPS koordinata">
                {texnikum?.latitude ? (
                  <Text style={{ color: "#10b981", fontSize: 12, fontWeight: 600 }}>
                    <CheckCircleOutlined style={{ marginRight: 4 }} />
                    {texnikum.latitude}, {texnikum.longitude} ({texnikum.gps_radius || 100}m)
                  </Text>
                ) : (
                  <Tag
                    icon={<ExclamationCircleOutlined />}
                    color="warning"
                    style={{ borderRadius: 8 }}
                  >
                    Kiritilmagan
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Obuna tugaydi">
                <Text
                  style={{
                    color:
                      days < 0
                        ? "#ef4444"
                        : days <= 7
                        ? "#ef4444"
                        : days <= 30
                        ? "#f59e0b"
                        : "#10b981",
                    fontWeight: 600,
                  }}
                >
                  {formatDate(texnikum?.subscription_end)}
                  {days >= 0 ? ` (${days} kun)` : " (muddati o'tgan)"}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            variant="borderless"
            title={<span style={{ fontWeight: 700 }}>📊 Umumiy statistika</span>}
            style={{ borderRadius: 16, height: "100%" }}
          >
            <Row gutter={[12, 12]}>
              {[
                { label: "Xodimlar",     value: stats?.total_employees || 0,           color: "#6366f1", icon: <TeamOutlined /> },
                { label: "Talabalar",    value: stats?.total_students  || 0,           color: "#3b82f6", icon: <UserOutlined /> },
                { label: "Guruhlar",     value: stats?.total_groups    || 0,           color: "#10b981", icon: <BookOutlined /> },
                { label: "Bu oy tushum", value: formatCurrency(stats?.monthly_income), color: "#f59e0b", icon: <DollarOutlined /> },
              ].map((s, i) => (
                <Col span={12} key={i}>
                  <div
                    style={{
                      padding: "14px",
                      borderRadius: 12,
                      background: `${s.color}08`,
                      border: `1px solid ${s.color}25`,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 22, color: s.color }}>{s.icon}</div>
                    <div>
                      <div
                        style={{ fontSize: 20, fontWeight: 900, color: s.color }}
                      >
                        {s.value}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          fontWeight: 600,
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>

            {/* Bugungi davomat */}
            <div style={{ marginTop: 16 }}>
              <Text
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                BUGUNGI DAVOMAT
              </Text>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {[
                  { l: "Keldi",    v: stats?.today_present || 0, c: "#10b981" },
                  { l: "Kechikdi", v: stats?.today_late    || 0, c: "#f59e0b" },
                  { l: "Kelmadi",  v: stats?.today_absent  || 0, c: "#ef4444" },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px 0",
                      background: `${s.c}08`,
                      borderRadius: 10,
                      border: `1px solid ${s.c}20`,
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 900, color: s.c }}>
                      {s.v}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <Progress
                percent={Math.round(stats?.today_attendance_pct || 0)}
                strokeColor={{ from: "#6366f1", to: "#10b981" }}
                style={{ marginTop: 10 }}
                format={(p) => `${p}%`}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Tabs ── */}
      <Card
        variant="borderless"
        style={{ borderRadius: 16 }}
        styles={{ body: { padding: "0 4px" } }}
      >
        <Tabs
          defaultActiveKey="users"
          items={tabItems}
          style={{ padding: "0 16px" }}
          tabBarStyle={{ marginBottom: 0 }}
        />
      </Card>

      {/* ── Texnikum tahrirlash modali ── */}
      <EditTexnikumModal
        texnikum={texnikum}
        open={editTexModal}
        onClose={() => setEditTexModal(false)}
        onSuccess={fetchData}
      />

      {/* ── Obuna modali ── */}
      <SubModal
        texnikum={texnikum}
        open={subModal}
        onClose={() => setSubModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}