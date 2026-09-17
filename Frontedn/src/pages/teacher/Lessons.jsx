import { useEffect, useState, useCallback } from "react";
import {
  Table, Card, Row, Col, Tag, Button, Select, Modal,
  Form, Input, Alert, message, Typography, Badge, Tabs, Progress,
} from "antd";
import {
  PlusOutlined, PlayCircleOutlined, CheckCircleOutlined,
  ReloadOutlined, EyeOutlined,
} from "@ant-design/icons";
import { lessonApi, stdAttendanceApi, groupApi } from "../../api/resources.api";
import { formatDate, getInitials } from "../../utils/formatters";
import { ATT_STATUS } from "../../utils/constants";

const { Text }    = Typography;
const { Option }  = Select;
const { TextArea } = Input;

const COLOR = "#10b981";

const Ava = ({ name, color = COLOR, size = 32 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(135deg,${color}28,${color}55)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 800, color, flexShrink: 0 }}>
    {getInitials(name)}
  </div>
);

// ── Davomat belgilash modali ───────────────────────────────────────────────────
function AttendanceModal({ lesson, open, onClose, onSuccess }) {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    if (!open || !lesson) return;
    setLoading(true);
    // Dars talabalari va mavjud davomat
    stdAttendanceApi.getAll({ lesson: lesson.id, page_size: 100 })
      .then(d => {
        const list = d.results || [];
        setStudents(list);
        // Mavjud holatlarni oldindan to'ldirish
        const init = {};
        list.forEach(r => { init[r.student] = r.status || "present"; });
        setStatuses(init);
      })
      .catch(() => message.error("Talabalar yuklanmadi"))
      .finally(() => setLoading(false));
  }, [open, lesson]);

  const toggleStatus = (studentId, status) => {
    setStatuses(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await stdAttendanceApi.bulk({
        lesson: lesson.id,
        records: students.map(s => ({
          student: s.student,
          status:  statuses[s.student] || "present",
        })),
      });
      message.success("Davomat saqlandi!");
      onSuccess();
      onClose();
    } catch (e) {
      message.error(e.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const counts = {
    present: students.filter(s => statuses[s.student] === "present").length,
    late:    students.filter(s => statuses[s.student] === "late").length,
    absent:  students.filter(s => statuses[s.student] === "absent").length,
  };

  return (
    <Modal
      title={
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>📋 Davomat belgilash</div>
          <div style={{ color: "#10b981", fontSize: 13, fontWeight: 500 }}>
            {lesson?.group_name} · {lesson?.topic || "Mavzusiz"}
          </div>
        </div>
      }
      open={open} onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Bekor</Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}
          style={{ background: COLOR, border: "none", borderRadius: 10 }}>
          💾 Saqlash
        </Button>,
      ]}
      width={580}
    >
      {/* Statistika */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[
          { l: "Keldi",    v: counts.present, c: "#10b981" },
          { l: "Kechikdi", v: counts.late,    c: "#f59e0b" },
          { l: "Kelmadi",  v: counts.absent,  c: "#ef4444" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px", background: `${s.c}0d`, borderRadius: 10, border: `1px solid ${s.c}25` }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Talabalar ro'yxati */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Yuklanmoqda...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
          {students.map(s => {
            const cur = statuses[s.student] || "present";
            return (
              <div key={s.student}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #eef0f6" }}>
                <Ava name={s.student_name || "?"} color={ATT_STATUS[cur]?.color || "#94a3b8"} />
                <Text style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{s.student_name}</Text>
                {/* Status tugmalari */}
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(ATT_STATUS).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => toggleStatus(s.student, k)}
                      style={{
                        padding: "4px 10px", borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: 700,
                        background: cur === k ? v.bg     : "#fff",
                        color:      cur === k ? v.color  : "#94a3b8",
                        border:     cur === k ? `1.5px solid ${v.color}` : "1.5px solid #eef0f6",
                        transition: "all 0.15s",
                      }}
                    >
                      {v.emoji} {v.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ── Yangi dars modali ─────────────────────────────────────────────────────────
function CreateLessonModal({ open, onClose, onSuccess, groups = [] }) {
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await lessonApi.create(values);
      message.success("Dars yaratildi!");
      form.resetFields();
      onSuccess();
      onClose();
    } catch (e) {
      message.error(e.response?.data?.detail || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<div style={{ fontWeight: 800 }}>🎯 Yangi dars yaratish</div>}
      open={open} onCancel={() => { form.resetFields(); onClose(); }}
      footer={null} width={460}
    >
      <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
        <Form.Item name="group" label="Guruh" rules={[{ required: true }]}>
          <Select placeholder="Guruh tanlang" showSearch optionFilterProp="children">
            {groups.map(g => <Option key={g.id} value={g.id}>{g.name} — {g.subject}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="topic" label="Dars mavzusi" rules={[{ required: true }]}>
          <Input placeholder="Masalan: HTML asoslari" />
        </Form.Item>
        <Form.Item name="date" label="Sana" rules={[{ required: true }]}>
          <Input type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="start_time" label="Boshlanish" rules={[{ required: true }]}>
              <Input type="time" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="end_time" label="Tugash" rules={[{ required: true }]}>
              <Input type="time" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="room" label="Xona">
          <Input placeholder="101" />
        </Form.Item>
        <Form.Item name="note" label="Izoh">
          <TextArea rows={2} placeholder="Ixtiyoriy..." />
        </Form.Item>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button type="primary" htmlType="submit" loading={loading}
            style={{ background: COLOR, border: "none", borderRadius: 10 }}>
            ➕ Yaratish
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

// ── Dars detail modali ────────────────────────────────────────────────────────
function LessonDetailModal({ lesson, open, onClose }) {
  const [attData, setAttData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !lesson) return;
    setLoading(true);
    stdAttendanceApi.getAll({ lesson: lesson.id, page_size: 100 })
      .then(d => setAttData(d.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, lesson]);

  if (!lesson) return null;

  const present = attData.filter(r => r.status === "present").length;
  const late    = attData.filter(r => r.status === "late").length;
  const absent  = attData.filter(r => r.status === "absent").length;
  const total   = attData.length || 1;

  return (
    <Modal
      title={
        <div>
          <div style={{ fontWeight: 800 }}>{lesson.topic || "Mavzusiz dars"}</div>
          <div style={{ color: "#10b981", fontSize: 13 }}>{lesson.group_name} · {formatDate(lesson.date)}</div>
        </div>
      }
      open={open} onCancel={onClose} footer={null} width={500}
    >
      {/* Info */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[
          { l: "Vaqt",  v: `${lesson.start_time} – ${lesson.end_time}`, emoji: "🕐" },
          { l: "Xona",  v: lesson.room || "—",                           emoji: "🚪" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: "10px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #eef0f6" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{s.l}</div>
            <div style={{ fontWeight: 700, marginTop: 2 }}>{s.emoji} {s.v}</div>
          </div>
        ))}
      </div>

      {/* Davomat xulosa */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { l: "Keldi",    v: present, c: "#10b981" },
          { l: "Kechikdi", v: late,    c: "#f59e0b" },
          { l: "Kelmadi",  v: absent,  c: "#ef4444" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px", background: `${s.c}0d`, borderRadius: 10, border: `1px solid ${s.c}25` }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Talabalar ro'yxati */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
        {attData.map(r => {
          const cfg = ATT_STATUS[r.status] || {};
          return (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 10 }}>
              <Ava name={r.student_name || "?"} color={cfg.color || "#94a3b8"} size={28} />
              <Text style={{ flex: 1, fontSize: 13 }}>{r.student_name}</Text>
              <Tag style={{ borderRadius: 20, background: cfg.bg, color: cfg.color, border: "none", fontWeight: 700 }}>
                {cfg.emoji} {cfg.label}
              </Tag>
            </div>
          );
        })}
        {attData.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>Davomat belgilanmagan</div>
        )}
      </div>
    </Modal>
  );
}

// ── ASOSIY KOMPONENT ──────────────────────────────────────────────────────────
export default function Lessons() {
  const [data,          setData]          = useState({ results: [], count: 0 });
  const [groups,        setGroups]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [groupFilter,   setGroupFilter]   = useState(undefined);
  const [statusFilter,  setStatusFilter]  = useState(undefined);
  const [page,          setPage]          = useState(1);
  const [createModal,   setCreateModal]   = useState(false);
  const [attModal,      setAttModal]      = useState(null);
  const [detailModal,   setDetailModal]   = useState(null);

  // Guruhlar (filter + modal uchun)
  useEffect(() => {
    groupApi.getAll({ my: true, page_size: 50 })
      .then(d => setGroups(d.results || []))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    lessonApi.getAll({
      my:       true,
      group:    groupFilter  || undefined,
      status:   statusFilter || undefined,
      page,
      page_size: 15,
    })
      .then(setData)
      .catch(e => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, [groupFilter, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFinish = async (id) => {
    try {
      await lessonApi.finish(id);
      message.success("Dars tugatildi!");
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.detail || "Xatolik");
    }
  };

  // Jami hisob
  const todayCount    = data.results.filter(r => r.date === new Date().toISOString().slice(0, 10)).length;
  const finishedCount = data.results.filter(r => r.status === "finished").length;
  const pendingCount  = data.results.filter(r => r.status === "pending").length;

  const getLessonStatusTag = (status) => {
    const map = {
      finished: { label: "Tugadi",          color: "#10b981", bg: "rgba(16,185,129,0.10)",  emoji: "✅" },
      ongoing:  { label: "Davom etmoqda",   color: "#6366f1", bg: "rgba(99,102,241,0.10)",  emoji: "🔴" },
      pending:  { label: "Kutilmoqda",      color: "#94a3b8", bg: "rgba(148,163,184,0.10)", emoji: "🕐" },
      cancelled:{ label: "Bekor qilindi",   color: "#ef4444", bg: "rgba(239,68,68,0.10)",   emoji: "❌" },
    };
    const cfg = map[status] || map.pending;
    return (
      <Tag style={{ borderRadius: 20, background: cfg.bg, color: cfg.color, border: "none", fontWeight: 700 }}>
        {cfg.emoji} {cfg.label}
      </Tag>
    );
  };

  const columns = [
    {
      title: "Dars", key: "lesson",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{r.topic || "Mavzusiz"}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            📅 {formatDate(r.date)} · 🕐 {r.start_time} – {r.end_time}
          </div>
        </div>
      ),
    },
    {
      title: "Guruh", dataIndex: "group_name", key: "group",
      render: n => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#6366f1" }}>
            {n?.slice(0, 2).toUpperCase()}
          </div>
          <Text style={{ fontWeight: 600 }}>{n}</Text>
        </div>
      ),
    },
    {
      title: "Xona", dataIndex: "room", key: "room",
      render: r => r ? <Tag style={{ borderRadius: 20 }}>🚪 {r}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "Talabalar", dataIndex: "students_count", key: "st",
      render: (v, r) => {
        const present = r.present_count || 0;
        const total   = v || 0;
        const pct     = total ? Math.round(present / total * 100) : 0;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Text style={{ color: "#6366f1", fontWeight: 700 }}>{present}/{total}</Text>
            {total > 0 && (
              <Progress percent={pct} size="small" style={{ width: 50, margin: 0 }}
                strokeColor={pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444"}
                showInfo={false} />
            )}
          </div>
        );
      },
    },
    {
      title: "Holat", dataIndex: "status", key: "status",
      render: s => getLessonStatusTag(s),
    },
    {
      title: "", key: "action",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailModal(r)} style={{ borderRadius: 8 }} />
          {r.status !== "finished" && (
            <>
              <Button size="small" onClick={() => setAttModal(r)}
                style={{ borderRadius: 8, color: COLOR, borderColor: COLOR, fontWeight: 700, fontSize: 11 }}>
                📋 Davomat
              </Button>
              <Button size="small" type="primary" onClick={() => handleFinish(r.id)}
                style={{ borderRadius: 8, background: "#6366f1", border: "none", fontWeight: 700, fontSize: 11 }}>
                ✅ Tugatish
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (error) return <Alert type="error" message={error} />;

  return (
    <div>
      {/* ── Summary ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { emoji: "🎯", l: "Jami darslar",  v: data.count,    c: "#6366f1" },
          { emoji: "📅", l: "Bugun",          v: todayCount,    c: "#3b82f6" },
          { emoji: "✅", l: "Tugagan",        v: finishedCount, c: "#10b981" },
          { emoji: "🕐", l: "Kutilmoqda",     v: pendingCount,  c: "#f59e0b" },
        ].map((s, i) => (
          <Col span={6} key={i}>
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", border: "1px solid #eef0f6", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>{s.emoji}</span>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>{s.l.toUpperCase()}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.v}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <Select placeholder="Guruh" allowClear value={groupFilter} onChange={setGroupFilter} style={{ width: 200 }}>
          {groups.map(g => <Option key={g.id} value={g.id}>{g.name}</Option>)}
        </Select>
        <Select placeholder="Holat" allowClear value={statusFilter} onChange={setStatusFilter} style={{ width: 180 }}>
          <Option value="pending">🕐 Kutilmoqda</Option>
          <Option value="ongoing">🔴 Davom etmoqda</Option>
          <Option value="finished">✅ Tugagan</Option>
          <Option value="cancelled">❌ Bekor</Option>
        </Select>
        <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ borderRadius: 10 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}
          style={{ marginLeft: "auto", borderRadius: 10, background: `linear-gradient(135deg,${COLOR},#059669)`, border: "none", boxShadow: `0 4px 16px ${COLOR}35` }}>
          Dars qo'shish
        </Button>
      </div>

      {/* ── Jadval ── */}
      <Table
        dataSource={data.results}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        style={{ background: "#fff", borderRadius: 16 }}
        pagination={{
          total: data.count, pageSize: 15, current: page,
          onChange: setPage, showSizeChanger: false,
          showTotal: t => `Jami: ${t} ta dars`,
        }}
      />

      {/* ── Modallar ── */}
      <CreateLessonModal
        open={createModal}
        onClose={() => setCreateModal(false)}
        onSuccess={fetchData}
        groups={groups}
      />
      <AttendanceModal
        lesson={attModal}
        open={!!attModal}
        onClose={() => setAttModal(null)}
        onSuccess={fetchData}
      />
      <LessonDetailModal
        lesson={detailModal}
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
      />
    </div>
  );
}