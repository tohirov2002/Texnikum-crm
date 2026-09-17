import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Input, Button, Tag, Modal, Form, Select,
  DatePicker, Space, Spin, Alert, Popconfirm, Typography, App } from "antd";

import {
  PlusOutlined, SearchOutlined, KeyOutlined, EyeOutlined,
  EditOutlined, DeleteOutlined
} from "@ant-design/icons";
import saasApi from "../../api/saas.api";
import { formatDate, getDaysLeft, getSubStatus, getInitials } from "../../utils/formatters";
import { SUB_STATUS } from "../../utils/constants";
import dayjs from "dayjs";
import CreateTexnikumModal from "./Createtexnikummodal";
import EditTexnikumModal from "./Edittexnikummodal";
const { Text, Title } = Typography;
const { Option } = Select;

// ─── Kichik Stat ─────────────────────────────────────────────────────────────
const MiniStat = ({ label, value, color }) => (
  <div style={{ flex: 1, textAlign: "center", padding: "10px 0", background: `${color}08`, borderRadius: 10 }}>
    <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{label}</div>
  </div>
);

// ─── Texnikum kartasi ─────────────────────────────────────────────────────────
const TexnikumCard = ({ t, onSubUpdate, onEdit, onDelete }) => {
  const navigate  = useNavigate();
  const days      = getDaysLeft(t.subscription_end);
  const subStatus = getSubStatus(t.subscription_end, t.is_active);
  const cfg       = SUB_STATUS[subStatus];

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 18,
        border: subStatus === "critical" ? "1.5px solid rgba(239,68,68,0.35)" : "1px solid #eef0f6",
        boxShadow: subStatus === "critical"
          ? "0 0 0 3px rgba(239,68,68,0.06), 0 2px 8px rgba(0,0,0,0.04)"
          : "0 2px 8px rgba(0,0,0,0.04)",
        opacity: t.is_active ? 1 : 0.65,
        height: "100%",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <Title level={5} style={{ margin: 0 }}>{t.name}</Title>
          <Text type="secondary" style={{ fontSize: 11 }}>📍 {t.address}</Text>
        </div>
        <Tag
          color={subStatus === "active" ? "success" : subStatus === "warning" ? "warning" : "error"}
          style={{ borderRadius: 20, fontSize: 11 }}
        >
          {cfg.label}
        </Tag>
      </div>

      {/* Founder */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "#f8fafc", borderRadius: 10, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: "#fff"
        }}>
          {getInitials(t.founder?.name)}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1e1e3a" }}>{t.founder?.name || "—"}</div>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>Ta'sischi</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <MiniStat label="Xodim"  value={t.stats?.employees || 0} color="#6366f1" />
        <MiniStat label="Talaba" value={t.stats?.students  || 0} color="#3b82f6" />
        <MiniStat label="Guruh"  value={t.stats?.groups    || 0} color="#10b981" />
      </div>

      {/* Obuna */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Obuna tugaydi:</Text>
        <Text strong style={{
          fontSize: 12,
          color: days < 0 ? "#ef4444" : days <= 7 ? "#ef4444" : days <= 30 ? "#f59e0b" : "#10b981"
        }}>
          {formatDate(t.subscription_end)} {days >= 0 ? `(${days} kun)` : "(muddati o'tgan)"}
        </Text>
      </div>

      {/* Tugmalar */}
      <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
        <Button
          size="small" icon={<EyeOutlined />}
          onClick={() => navigate(`/superadmin/texnikumlar/${t.id}`)}
          style={{ flex: 1, borderRadius: 9 }}
        >
          Ko'rish
        </Button>
        <Button
          size="small" icon={<EditOutlined />}
          onClick={() => onEdit(t)}
          style={{ flex: 1, borderRadius: 9 }}
        >
          Tahrir
        </Button>
        <Button
          size="small" icon={<KeyOutlined />} type="primary"
          onClick={() => onSubUpdate(t)}
          style={{
            flex: 1, borderRadius: 9,
            background: subStatus === "critical" || subStatus === "expired" ? "#ef4444" : "#6366f1",
            border: "none"
          }}
        >
          Obuna
        </Button>
        {/* <Popconfirm
          title="Texnikumni arxivlash"
          description="Texnikum o'chirilmaydi, faqat arxivlanadi. Davom etasizmi?"
          onConfirm={() => onDelete(t.id)}
          okText="Ha, arxivla"
          cancelText="Bekor"
          okButtonProps={{ danger: true }}
        > */}
        <Popconfirm
          title="Texnikumni o'chirish"
          description="Texnikum bazadan butunlay o'chiriladi! Davom etasizmi?"
          onConfirm={() => onDelete(t.id)}
          okText="Ha, o'chir"
          cancelText="Bekor"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" icon={<DeleteOutlined />} danger style={{ borderRadius: 9 }} />
        </Popconfirm>
      </div>
    </Card>
  );
};

// ─── Yangi Texnikum modali ────────────────────────────────────────────────────
const CreateModal = ({ open, onClose, onSuccess }) => {
  const { message } = App.useApp();  // ← qo'shing
  const [form]    = Form.useForm();
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      await saasApi.createTexnikum({
        texnikum: {
          name:             values.name,
          address:          values.address,
          phone:            values.phone,
          subscription_end: values.subscription_end?.format("YYYY-MM-DD"),
        },
        founder: {
          username:   values.username,
          password:   values.password,
          first_name: values.first_name,
          last_name:  values.last_name,
          email:      values.email || "",
        },
      });
      message.success("Texnikum va founder muvaffaqiyatli yaratildi!");
      form.resetFields();
      setStep(1);
      onSuccess();
      onClose();
    } catch (e) {
      message.error(e.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setStep(1);
    onClose();
  };

  return (
    <Modal
      title={
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Yangi Texnikum</div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>Texnikum + Founder bir vaqtda yaratiladi</div>
        </div>
      }
      open={open} onCancel={handleClose} footer={null} width={520}
    >
      {/* Steps indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[{ n: 1, l: "Texnikum ma'lumotlari" }, { n: 2, l: "Founder hisobi" }].map((s) => (
          <div
            key={s.n}
            onClick={() => setStep(s.n)}
            style={{
              flex: 1, padding: "8px", textAlign: "center", borderRadius: 10, cursor: "pointer",
              background: step === s.n ? "#6366f1" : "#f1f5f9",
              color: step === s.n ? "#fff" : "#94a3b8",
              fontSize: 12, fontWeight: 700, transition: "all 0.2s",
            }}
          >
            {s.n}. {s.l}
          </div>
        ))}
      </div>

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {/* STEP 1 — yashiramiz, o'chirmaymiz */}
        <div style={{ display: step === 1 ? "block" : "none" }}>
          <Form.Item name="name"    label="Texnikum nomi" rules={[{ required: true, message: "Texnikum nomi majburiy!" }]}>
            <Input placeholder="Masalan: Toshkent Texnikumi" />
          </Form.Item>
          <Form.Item name="address" label="Manzil"        rules={[{ required: true, message: "Manzil majburiy!" }]}>
            <Input placeholder="Shahar, ko'cha" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="phone" label="Telefon" rules={[{ required: true, message: "Telefon majburiy!" }]}>
                <Input placeholder="+998 XX XXX XX XX" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="subscription_end" label="Obuna tugash sanasi" rules={[{ required: true, message: "Sana majburiy!" }]}>
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" disabledDate={(d) => d < dayjs()} />
              </Form.Item>
            </Col>
          </Row>
          <Button
            type="primary" block size="large"
            style={{ borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none" }}
            onClick={() =>
              form.validateFields(["name", "address", "phone", "subscription_end"])
                .then(() => setStep(2))
            }
          >
            Keyingi — Founder →
          </Button>
        </div>

        {/* STEP 2 — yashiramiz, o'chirmaymiz */}
        <div style={{ display: step === 2 ? "block" : "none" }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="last_name"  label="Familiya" rules={[{ required: true, message: "Familiya majburiy!" }]}>
                <Input placeholder="Familiya" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="first_name" label="Ism" rules={[{ required: true, message: "Ism majburiy!" }]}>
                <Input placeholder="Ism" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="username" label="Login (username)" rules={[{ required: true, message: "Login majburiy!" }]}>
            <Input placeholder="founder_login" />
          </Form.Item>
          <Form.Item
            name="password" label="Parol"
            rules={[{ required: true, min: 8, message: "Kamida 8 ta belgi!" }]}
          >
            <Input.Password placeholder="Kamida 8 ta belgi" />
          </Form.Item>
          <Form.Item name="email" label="Email (ixtiyoriy)">
            <Input placeholder="email@example.com" />
          </Form.Item>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => setStep(1)} style={{ borderRadius: 12 }}>← Orqaga</Button>
            <Button
              type="primary" htmlType="submit" loading={loading} size="large"
              style={{ flex: 1, borderRadius: 12, background: "linear-gradient(135deg,#10b981,#059669)", border: "none" }}
            >
              ✅ Texnikum yaratish
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

// ─── Obuna yangilash modali ───────────────────────────────────────────────────
const SubUpdateModal = ({ texnikum, open, onClose, onSuccess }) => {
  const { message } = App.useApp();  // ← qo'shing
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (texnikum) {
      form.setFieldsValue({
        subscription_end: texnikum.subscription_end ? dayjs(texnikum.subscription_end) : null,
        is_active:        texnikum.is_active,
      });
    }
  }, [texnikum, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await saasApi.updateSubscription(texnikum.id, {
        subscription_end: values.subscription_end?.format("YYYY-MM-DD"),
        is_active:        values.is_active,
      });
      message.success("Obuna yangilandi!");
      onSuccess();
      onClose();
    } catch (e) {
      message.error(e.response?.data?.error || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div>
          <div style={{ fontWeight: 800 }}>Obuna boshqaruvi</div>
          <div style={{ color: "#6366f1", fontSize: 13 }}>{texnikum?.name}</div>
        </div>
      }
      open={open} onCancel={onClose} footer={null} width={420}
    >
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item name="subscription_end" label="Yangi tugash sanasi" rules={[{ required: true }]}>
          <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item name="is_active" label="Texnikum holati">
          <Select>
            <Option value={true}>✅ Aktiv</Option>
            <Option value={false}>❌ To'xtatilgan</Option>
          </Select>
        </Form.Item>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button
            type="primary" htmlType="submit" loading={loading}
            style={{ flex: 1, background: "#6366f1", border: "none", borderRadius: 10 }}
          >
            💾 Saqlash
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

// ─── Texnikumni tahrirlash modali ─────────────────────────────────────────────
const EditModal = ({ texnikum, open, onClose, onSuccess }) => {
  const { message } = App.useApp();  // ← qo'shing
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (texnikum) {
      form.setFieldsValue({
        name:             texnikum.name,
        address:          texnikum.address,
        phone:            texnikum.phone,
        subscription_end: texnikum.subscription_end ? dayjs(texnikum.subscription_end) : null,
        is_active:        texnikum.is_active,
      });
    }
  }, [texnikum, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await saasApi.updateTexnikum(texnikum.id, {
        name:             values.name,
        address:          values.address,
        phone:            values.phone,
        subscription_end: values.subscription_end?.format("YYYY-MM-DD"),
        is_active:        values.is_active,
      });
      message.success("Texnikum yangilandi!");
      onSuccess();
      onClose();
    } catch (e) {
      message.error(e.response?.data?.error || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div>
          <div style={{ fontWeight: 800 }}>Texnikumni tahrirlash</div>
          <div style={{ color: "#6366f1", fontSize: 13 }}>{texnikum?.name}</div>
        </div>
      }
      open={open} onCancel={onClose} footer={null} width={480}
    >
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item name="name"    label="Texnikum nomi" rules={[{ required: true, message: "Texnikum nomi majburiy!" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="address" label="Manzil"        rules={[{ required: true, message: "Manzil majburiy!" }]}>
          <Input />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="phone" label="Telefon" rules={[{ required: true, message: "Telefon majburiy!" }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="subscription_end" label="Obuna tugash sanasi" rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="is_active" label="Holati">
          <Select>
            <Option value={true}>✅ Aktiv</Option>
            <Option value={false}>❌ Arxivlangan</Option>
          </Select>
        </Form.Item>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={onClose} style={{ borderRadius: 10 }}>Bekor</Button>
          <Button
            type="primary" htmlType="submit" loading={loading}
            style={{ flex: 1, borderRadius: 10, background: "#6366f1", border: "none" }}
          >
            💾 Saqlash
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

// ─── ASOSIY KOMPONENT ─────────────────────────────────────────────────────────
export default function Texnikumlar() {
  const { message } = App.useApp();  // ← qo'shing
  const [texnikumlar, setTexnikumlar] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [filterSub,   setFilterSub]   = useState("all");
  const [createModal, setCreateModal] = useState(false);
  const [subModal,    setSubModal]    = useState(null);
  const [editModal,   setEditModal]   = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    saasApi.getTexnikumlar()
      .then((data) => {
        setTexnikumlar(Array.isArray(data?.texnikumlar) ? data.texnikumlar : []);
      })
      .catch((e) => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = useCallback(async (id) => {
    try {
      await saasApi.deleteTexnikum(id);
      message.success("Texnikum o'chirildi!");
      fetchData();
    } catch (e) {
      console.log("DELETE XATO:", e.response?.status, e.response?.data); // ← qo'shing
      message.error(e.response?.data?.error || "Xatolik");
    }
  }, [fetchData]);

  const filtered = (Array.isArray(texnikumlar) ? texnikumlar : []).filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.founder?.name || "").toLowerCase().includes(search.toLowerCase());
    if (filterSub === "all") return matchSearch;
    const s = getSubStatus(t.subscription_end, t.is_active);
    return matchSearch && s === filterSub;
  });

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spin size="large" /></div>;
  if (error)   return <Alert type="error" message={error} />;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <Input
          prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
          placeholder="Texnikum yoki founder nomi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320, borderRadius: 10 }}
        />
        <Space>
          {[
            { v: "all",      l: "Barchasi",        color: undefined   },
            { v: "active",   l: "✅ Aktiv",         color: "success"   },
            { v: "warning",  l: "⚠ Ogohlantirish", color: "warning"   },
            { v: "critical", l: "🔴 Kritik",        color: "error"     },
            { v: "expired",  l: "Muddati o'tgan",   color: "default"   },
          ].map((f) => (
            <Tag
              key={f.v}
              color={filterSub === f.v ? (f.color || "processing") : undefined}
              onClick={() => setFilterSub(f.v)}
              style={{
                cursor: "pointer", borderRadius: 20, padding: "3px 12px",
                fontSize: 12, fontWeight: 600,
                border: filterSub === f.v ? undefined : "1px solid #eef0f6"
              }}
            >
              {f.l}
            </Tag>
          ))}
        </Space>
        <Button
          type="primary" icon={<PlusOutlined />}
          onClick={() => setCreateModal(true)}
          style={{
            marginLeft: "auto", borderRadius: 10,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            border: "none", boxShadow: "0 4px 16px rgba(99,102,241,0.35)"
          }}
        >
          Yangi Texnikum
        </Button>
      </div>

      {/* Summary */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { l: "Jami",            v: texnikumlar.length,                                                                              c: "#6366f1" },
          { l: "Aktiv",           v: texnikumlar.filter(t => t.is_active).length,                                                     c: "#10b981" },
          { l: "⚠ Ogohlantirish", v: texnikumlar.filter(t => getSubStatus(t.subscription_end, t.is_active) === "warning").length,    c: "#f59e0b" },
          { l: "🔴 Kritik",       v: texnikumlar.filter(t => getSubStatus(t.subscription_end, t.is_active) === "critical").length,   c: "#ef4444" },
        ].map((s, i) => (
          <Col span={6} key={i}>
            <div style={{
              background: "#fff", borderRadius: 14, padding: "14px 18px",
              border: "1px solid #eef0f6", display: "flex",
              justifyContent: "space-between", alignItems: "center"
            }}>
              <Text style={{ fontSize: 12, color: "#64748b" }}>{s.l}</Text>
              <Text style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.v}</Text>
            </div>
          </Col>
        ))}
      </Row>

      {/* Kartalar */}
      <Row gutter={[16, 16]}>
        {filtered.map((t) => (
          <Col span={8} key={t.id}>
            <TexnikumCard
              t={t}
              onSubUpdate={(t) => setSubModal(t)}
              onEdit={(t) => setEditModal(t)}
              onDelete={handleDelete}
            />
          </Col>
        ))}
      </Row>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
          Hech narsa topilmadi 🔍
        </div>
      )}

      {/* Modallar */}
      <CreateTexnikumModal open={createModal} onClose={() => setCreateModal(false)} onSuccess={fetchData} />
      <SubUpdateModal
        texnikum={subModal}
        open={!!subModal}
        onClose={() => setSubModal(null)}
        onSuccess={fetchData}
      />
      <EditTexnikumModal
        texnikum={editModal}
        open={!!editModal}
        onClose={() => setEditModal(null)}
        onSuccess={fetchData}
      />
    </div>
  );
}