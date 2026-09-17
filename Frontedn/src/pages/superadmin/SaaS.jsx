import { useEffect, useState, useCallback } from "react";
import {
  Table, Card, Tag, Button, Modal, Form, DatePicker,
  Select, Row, Col, Statistic, Spin, Alert, message, Typography, Space,
} from "antd";
import { EditOutlined, WarningOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import saasApi from "../../api/saas.api";
import { formatDate, getDaysLeft, getSubStatus } from "../../utils/formatters";
import { SUB_STATUS } from "../../utils/constants";
import dayjs from "dayjs";

const { Text } = Typography;
const { Option } = Select;

// ─── Obuna yangilash modali ───────────────────────────────────────────────────
function SubUpdateModal({ texnikum, open, onClose, onSuccess }) {
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (texnikum && open) {
      form.setFieldsValue({
        subscription_end: texnikum.subscription_end ? dayjs(texnikum.subscription_end) : null,
        is_active: texnikum.is_active,
      });
    }
  }, [texnikum, open, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await saasApi.updateSubscription(texnikum.id, {
        subscription_end: values.subscription_end?.format("YYYY-MM-DD"),
        is_active: values.is_active,
      });
      message.success("Obuna muvaffaqiyatli yangilandi!");
      onSuccess();
      onClose();
    } catch (e) {
      message.error(e.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const days      = getDaysLeft(texnikum?.subscription_end);
  const subStatus = getSubStatus(texnikum?.subscription_end, texnikum?.is_active);
  const subCfg    = SUB_STATUS[subStatus];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>🔑 Obuna boshqaruvi</div>
          <div style={{ color: "#6366f1", fontSize: 13, fontWeight: 400 }}>{texnikum?.name}</div>
        </div>
      }
      width={440}
    >
      {/* Hozirgi holat */}
      <div style={{
        display: "flex", gap: 12, marginBottom: 20, padding: "14px",
        background: "#f8fafc", borderRadius: 12, border: "1px solid #eef0f6",
      }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>HOZIRGI HOLAT</div>
          <Tag
            color={subStatus === "active" ? "success" : subStatus === "warning" ? "warning" : "error"}
            style={{ borderRadius: 20, fontWeight: 700 }}
          >
            {subCfg.label}
          </Tag>
        </div>
        <div style={{ flex: 1, textAlign: "center", borderLeft: "1px solid #eef0f6" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>TUGASH SANASI</div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{formatDate(texnikum?.subscription_end)}</div>
        </div>
        <div style={{ flex: 1, textAlign: "center", borderLeft: "1px solid #eef0f6" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>QOLGAN KUN</div>
          <div style={{
            fontWeight: 900, fontSize: 18,
            color: days < 0 ? "#ef4444" : days <= 7 ? "#ef4444" : days <= 30 ? "#f59e0b" : "#10b981",
          }}>
            {days >= 0 ? days : "O'tgan"}
          </div>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item
          name="subscription_end"
          label="Yangi tugash sanasi"
          rules={[{ required: true, message: "Sanani tanlang!" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="YYYY-MM-DD"
            disabledDate={(d) => d < dayjs().subtract(1, "day")}
          />
        </Form.Item>
        <Form.Item name="is_active" label="Texnikum holati">
          <Select>
            <Option value={true}>✅ Aktiv — foydalanuvchilar kira oladi</Option>
            <Option value={false}>❌ To'xtatilgan — kirish bloklanadi</Option>
          </Select>
        </Form.Item>
        <div style={{ display: "flex", gap: 10 }}>
          <Button onClick={onClose} style={{ flex: 1 }}>Bekor</Button>
          <Button
            type="primary" htmlType="submit" loading={loading}
            style={{ flex: 2, background: "#6366f1", border: "none", borderRadius: 10 }}
          >
            💾 Saqlash
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

// ─── ASOSIY KOMPONENT ─────────────────────────────────────────────────────────
export default function SaaS() {
  const [data,     setData]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    saasApi.getTexnikumlar()
      // .then((d) => setData(d.results || d))
      .then((d) => setData(Array.isArray(d?.texnikumlar) ? d.texnikumlar : []))
      .catch((e) => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Hisob-kitoblar ──
  const counts = {
    total:    data.length,
    active:   data.filter((t) => getSubStatus(t.subscription_end, t.is_active) === "active").length,
    warning:  data.filter((t) => getSubStatus(t.subscription_end, t.is_active) === "warning").length,
    critical: data.filter((t) => getSubStatus(t.subscription_end, t.is_active) === "critical").length,
    expired:  data.filter((t) => getSubStatus(t.subscription_end, t.is_active) === "expired").length,
  };

  const columns = [
    { title: "#", key: "idx", width: 48, render: (_, __, i) => i + 1 },
    {
      title: "Texnikum",
      dataIndex: "name",
      key: "name",
      render: (name, r) => (
        <div>
          <div style={{ fontWeight: 700 }}>{name}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.founder_name}</div>
        </div>
      ),
    },
    {
      title: "Obuna tugaydi",
      dataIndex: "subscription_end",
      key: "sub_end",
      render: (d) => formatDate(d),
      sorter: (a, b) => new Date(a.subscription_end) - new Date(b.subscription_end),
    },
    {
      title: "Qolgan kun",
      key: "days_left",
      sorter: (a, b) => getDaysLeft(a.subscription_end) - getDaysLeft(b.subscription_end),
      defaultSortOrder: "ascend",
      render: (_, r) => {
        const days = getDaysLeft(r.subscription_end);
        const status = getSubStatus(r.subscription_end, r.is_active);
        return (
          <Tag
            color={status === "active" ? "success" : status === "warning" ? "warning" : "error"}
            style={{ borderRadius: 20, fontWeight: 700 }}
          >
            {days >= 0 ? `${days} kun` : "Muddati o'tgan"}
          </Tag>
        );
      },
    },
    {
      title: "Holat",
      dataIndex: "is_active",
      key: "is_active",
      render: (v) => (
        <Tag color={v ? "success" : "default"} style={{ borderRadius: 20 }}>
          {v ? "✅ Aktiv" : "❌ Nofaol"}
        </Tag>
      ),
    },
    {
      title: "Amal",
      key: "action",
      render: (_, r) => (
        <Button
          size="small" icon={<EditOutlined />}
          onClick={() => setSelected(r)}
          style={{ borderRadius: 8 }}
        >
          Yangilash
        </Button>
      ),
    },
  ];

  // Qator rangi
  const rowClassName = (r) => {
    const s = getSubStatus(r.subscription_end, r.is_active);
    if (s === "critical") return "row-critical";
    if (s === "expired")  return "row-expired";
    return "";
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spin size="large" /></div>;
  if (error)   return <Alert type="error" message={error} />;

  return (
    <div>
      {/* ── Stat kartalar ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { title: "Jami Markazlar",  value: counts.total,    icon: <CheckCircleOutlined />, color: "#6366f1" },
          { title: "Aktiv",             value: counts.active,   icon: <CheckCircleOutlined />, color: "#10b981" },
          { title: "⚠ Ogohlantirish",  value: counts.warning,  icon: <WarningOutlined />,     color: "#f59e0b" },
          { title: "🔴 Kritik / O'tgan",value: counts.critical + counts.expired, icon: <CloseCircleOutlined />, color: "#ef4444" },
        ].map((s, i) => (
          <Col span={6} key={i}>
            <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <Statistic
                title={<Text style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{s.title}</Text>}
                value={s.value}
                valueStyle={{ fontSize: 28, fontWeight: 900, color: s.color }}
                prefix={<span style={{ color: s.color, marginRight: 6 }}>{s.icon}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Jadval ── */}
      <Card
        bordered={false}
        title={<span style={{ fontWeight: 700 }}>🔑 Obuna holatlari</span>}
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            Muddati yaqinlar yuqorida ko'rsatiladi
          </Text>
        }
        style={{ borderRadius: 16 }}
      >
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          size="small"
          rowClassName={rowClassName}
          pagination={{ pageSize: 15, showSizeChanger: false }}
        />
      </Card>

      {/* ── Qator rangi uchun style ── */}
      <style>{`
        .row-critical td { background: rgba(239,68,68,0.04) !important; }
        .row-expired  td { background: rgba(148,163,184,0.06) !important; }
      `}</style>

      {/* ── Modal ── */}
      <SubUpdateModal
        texnikum={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onSuccess={() => { fetchData(); setSelected(null); }}
      />
    </div>
  );
}