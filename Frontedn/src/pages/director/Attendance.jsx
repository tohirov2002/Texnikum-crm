import { useEffect, useState, useCallback } from "react";
import {
  Table, Card, Button, Input, Select, DatePicker,
  Tag, Modal, Form, Row, Col, Space, Spin, Alert, message, Typography,
} from "antd";
import { SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import { attendanceApi } from "../../api/resources.api";
import employeeApi from "../../api/employee.api";
import { useDebounce } from "../../hooks/useDebounce";
import { formatCurrency, formatDate, getInitials } from "../../utils/formatters";
import { ATT_STATUS } from "../../utils/constants";

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const Ava = ({ name, color = "#6366f1", size = 34 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(135deg,${color}28,${color}55)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 800, color, flexShrink: 0 }}>
    {getInitials(name)}
  </div>
);

const StatusBadge = ({ status }) => {
  const cfg = ATT_STATUS[status] || ATT_STATUS.absent;
  return <Tag style={{ borderRadius: 20, background: cfg.bg, color: cfg.color, border: "none", fontWeight: 700 }}>{cfg.emoji} {cfg.label}</Tag>;
};

// Qo'lda kiritish modali
function ManualModal({ open, onClose, onSuccess, employees = [] }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await attendanceApi.manual(values);
      message.success("Davomat qo'shildi!"); form.resetFields(); onSuccess(); onClose();
    } catch (e) { message.error(e.response?.data?.detail || "Xatolik"); }
    finally { setLoading(false); }
  };

  return (
    <Modal title={<div style={{ fontWeight: 800 }}>Qo'lda davomat kiritish</div>}
      open={open} onCancel={() => { form.resetFields(); onClose(); }} footer={null} width={460}>
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
        <Form.Item name="employee" label="Xodim" rules={[{ required: true }]}>
          <Select showSearch placeholder="Xodim tanlang" optionFilterProp="children">
            {employees.map(e => <Option key={e.id} value={e.id}>{e.last_name} {e.first_name}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="date" label="Sana" rules={[{ required: true }]}>
          <Input type="date" />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="check_in"  label="Kelish vaqti"><Input type="time" /></Form.Item></Col>
          <Col span={12}><Form.Item name="check_out" label="Ketish vaqti"><Input type="time" /></Form.Item></Col>
        </Row>
        <Form.Item name="status" label="Holat" rules={[{ required: true }]}>
          <Select placeholder="Holat tanlang">
            {Object.entries(ATT_STATUS).map(([k, v]) => <Option key={k} value={k}>{v.emoji} {v.label}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="note" label="Izoh"><TextArea rows={2} /></Form.Item>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button type="primary" htmlType="submit" loading={loading} style={{ background: "#6366f1", border: "none", borderRadius: 10 }}>Saqlash</Button>
        </div>
      </Form>
    </Modal>
  );
}

// Tahrirlash modali
function EditModal({ record, open, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record && open) form.setFieldsValue({ ...record });
  }, [record, open, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await attendanceApi.update(record.id, values);
      message.success("Yangilandi!"); onSuccess(); onClose();
    } catch (e) { message.error(e.response?.data?.detail || "Xatolik"); }
    finally { setLoading(false); }
  };

  return (
    <Modal title={<div><div style={{ fontWeight: 800 }}>Davomat tahrirlash</div><div style={{ color: "#6366f1", fontSize: 13 }}>{record?.employee_name}</div></div>}
      open={open} onCancel={onClose} footer={null} width={420}>
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="check_in"  label="Kelish vaqti"><Input type="time" /></Form.Item></Col>
          <Col span={12}><Form.Item name="check_out" label="Ketish vaqti"><Input type="time" /></Form.Item></Col>
        </Row>
        <Form.Item name="status" label="Holat" rules={[{ required: true }]}>
          <Select>
            {Object.entries(ATT_STATUS).map(([k, v]) => <Option key={k} value={k}>{v.emoji} {v.label}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="note" label="Izoh"><TextArea rows={2} /></Form.Item>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button type="primary" htmlType="submit" loading={loading} style={{ background: "#6366f1", border: "none", borderRadius: 10 }}>Saqlash</Button>
        </div>
      </Form>
    </Modal>
  );
}

export default function Attendance() {
  const [data,        setData]        = useState({ results: [], count: 0 });
  const [employees,   setEmployees]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [statusFilter,setStatusFilter]= useState(undefined);
  const [dateRange,   setDateRange]   = useState(null);
  const [page,        setPage]        = useState(1);
  const [manualModal, setManualModal] = useState(false);
  const [editModal,   setEditModal]   = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  // Xodimlar ro'yxati (modal uchun)
  useEffect(() => {
    employeeApi.getAll({ page_size: 100 }).then(d => setEmployees(d.results || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    attendanceApi.getAll({
      search:      debouncedSearch || undefined,
      status:      statusFilter    || undefined,
      date_after:  dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
      date_before: dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
      page, page_size: 15,
    })
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, statusFilter, dateRange, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Bugungi statistika
  const today = data.results;
  const todayPresent = today.filter(r => r.status === "present").length;
  const todayLate    = today.filter(r => r.status === "late").length;
  const todayAbsent  = today.filter(r => r.status === "absent").length;
  const totalPenalty = today.reduce((s, r) => s + (r.penalty_amount || 0), 0);

  const columns = [
    { title: "#", key: "i", width: 50, render: (_, __, i) => (page - 1) * 15 + i + 1 },
    { title: "Xodim", key: "emp", render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Ava name={r.employee_name || "?"} color={ATT_STATUS[r.status]?.color || "#94a3b8"} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{r.employee_name || "—"}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.department || "—"}</div>
          </div>
        </div>
      )
    },
    { title: "Sana",    dataIndex: "date",         key: "date",   render: (d) => formatDate(d) },
    { title: "Keldi",   dataIndex: "check_in",     key: "in",     render: (t) => t || "—" },
    { title: "Ketdi",   dataIndex: "check_out",    key: "out",    render: (t) => t || "—" },
    { title: "Kechikdi",dataIndex: "late_minutes", key: "late",
      render: (m) => m > 0 ? <Tag color="warning" style={{ borderRadius: 20 }}>{m} daq</Tag> : <Tag color="success" style={{ borderRadius: 20 }}>—</Tag>
    },
    { title: "Jarima", dataIndex: "penalty_amount", key: "pen",
      render: (v) => v > 0 ? <Text style={{ color: "#ef4444", fontWeight: 700 }}>{formatCurrency(v)}</Text> : <Text type="secondary">—</Text>
    },
    { title: "Holat",  dataIndex: "status",        key: "status", render: (s) => <StatusBadge status={s} /> },
    { title: "", key: "action", render: (_, r) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => setEditModal(r)} />
      )
    },
  ];

  if (error) return <Alert type="error" message={error} />;

  return (
    <div>
      {/* Kunlik statistika */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { l: "Keldi",      v: todayPresent, c: "#10b981", emoji: "✅" },
          { l: "Kechikdi",   v: todayLate,    c: "#f59e0b", emoji: "⏱"  },
          { l: "Kelmadi",    v: todayAbsent,  c: "#ef4444", emoji: "❌" },
          { l: "Jami jarima",v: formatCurrency(totalPenalty), c: "#6366f1", emoji: "💸" },
        ].map((s, i) => (
          <Col span={6} key={i}>
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", border: "1px solid #eef0f6", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>{s.emoji}</span>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>{s.l.toUpperCase()}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <Input prefix={<SearchOutlined style={{ color: "#94a3b8" }} />} placeholder="Xodim ismi..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220, borderRadius: 10 }} />
        <Select placeholder="Holat" allowClear value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }}>
          {Object.entries(ATT_STATUS).map(([k, v]) => <Option key={k} value={k}>{v.emoji} {v.label}</Option>)}
        </Select>
        <RangePicker value={dateRange} onChange={setDateRange} format="YYYY-MM-DD" style={{ borderRadius: 10 }} />
        <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ borderRadius: 10 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setManualModal(true)} style={{ marginLeft: "auto", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none" }}>
          Qo'lda kiritish
        </Button>
      </div>

      <Table dataSource={data.results} columns={columns} rowKey="id" loading={loading} size="small"
        style={{ background: "#fff", borderRadius: 16 }}
        pagination={{ total: data.count, pageSize: 15, current: page, onChange: setPage, showSizeChanger: false, showTotal: (t) => `Jami: ${t} ta yozuv` }}
      />

      <ManualModal open={manualModal} onClose={() => setManualModal(false)} onSuccess={fetchData} employees={employees} />
      <EditModal   record={editModal} open={!!editModal} onClose={() => setEditModal(null)} onSuccess={fetchData} />
    </div>
  );
}