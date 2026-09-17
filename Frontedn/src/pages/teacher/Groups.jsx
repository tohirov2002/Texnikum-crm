import { useEffect, useState, useCallback } from "react";
import {
  Row, Col, Card, Table, Tag, Button, Input, Modal,
  Alert, message, Typography, Progress, Badge, Tabs,
} from "antd";
import { SearchOutlined, EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { groupApi, studentApi, stdAttendanceApi } from "../../api/resources.api";
import { useDebounce } from "../../hooks/useDebounce";
import { formatDate, formatPhone, formatCurrency, getInitials } from "../../utils/formatters";
import { ATT_STATUS } from "../../utils/constants";

const { Text, Title } = Typography;
const COLOR = "#10b981";

const Ava = ({ name, color = COLOR, size = 36 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(135deg,${color}28,${color}55)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 800, color, flexShrink: 0 }}>
    {getInitials(name)}
  </div>
);

// ── Guruh karta ───────────────────────────────────────────────────────────────
const GroupCard = ({ group, onClick }) => {
  const pct = group.attendance_pct || 0;
  const barColor = pct >= 80 ? COLOR : pct >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <Card
      bordered={false}
      onClick={onClick}
      style={{
        borderRadius: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", cursor: "pointer",
        border: "1.5px solid #eef0f6", transition: "all 0.18s", height: "100%",
      }}
      styles={{ body: { padding: "20px" } }}
      hoverable
    >
      {/* Tepasi */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${COLOR}22,${COLOR}44)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, color: COLOR }}>
            {group.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1e1e3a" }}>{group.name}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>📖 {group.subject}</div>
          </div>
        </div>
        <Tag color={group.is_active ? "success" : "default"} style={{ borderRadius: 20, fontWeight: 700 }}>
          {group.is_active ? "Faol" : "Yopilgan"}
        </Tag>
      </div>

      {/* Statslar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { l: "Talabalar", v: group.students_count || 0, c: "#6366f1", emoji: "🎓" },
          { l: "Vaqt",      v: `${group.start_time?.slice(0,5) || "—"}`, c: "#3b82f6", emoji: "🕐" },
          { l: "Xona",      v: group.room || "—", c: "#f59e0b", emoji: "🚪" },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center", padding: "8px 6px", background: `${s.c}08`, borderRadius: 10 }}>
            <div style={{ fontSize: 13 }}>{s.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Davomat progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: "#64748b" }}>O'rtacha davomat</Text>
          <Text style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{pct}%</Text>
        </div>
        <Progress percent={pct} showInfo={false} size="small" strokeColor={barColor} trailColor="#f1f5f9" />
      </div>

      {/* To'lov foizi */}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: "#64748b" }}>To'lov holati</Text>
          <Text style={{ fontSize: 12, fontWeight: 700, color: group.payment_pct >= 80 ? COLOR : "#ef4444" }}>
            {group.payment_pct || 0}%
          </Text>
        </div>
        <Progress percent={group.payment_pct || 0} showInfo={false} size="small"
          strokeColor={group.payment_pct >= 80 ? COLOR : "#ef4444"} trailColor="#f1f5f9" />
      </div>

      <div style={{ marginTop: 14, textAlign: "right" }}>
        <Text style={{ color: COLOR, fontSize: 12, fontWeight: 700 }}>Batafsil ko'rish →</Text>
      </div>
    </Card>
  );
};

// ── Guruh detail modali ────────────────────────────────────────────────────────
function GroupDetailModal({ group, open, onClose }) {
  const [students,  setStudents]  = useState([]);
  const [attData,   setAttData]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!open || !group) return;
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    Promise.allSettled([
      studentApi.getAll({ group: group.id, page_size: 100 }),
      stdAttendanceApi.getAll({ group: group.id, date: today, page_size: 100 }),
    ]).then(([stRes, attRes]) => {
      setStudents(stRes.status  === "fulfilled" ? (stRes.value.results  || []) : []);
      setAttData(attRes.status  === "fulfilled" ? (attRes.value.results || []) : []);
    }).finally(() => setLoading(false));
  }, [open, group]);

  if (!group) return null;

  // Bugungi holat
  const getStudentStatus = (studentId) => {
    const rec = attData.find(a => a.student === studentId);
    return rec?.status || null;
  };

  const filtered = students.filter(s =>
    `${s.last_name} ${s.first_name}`.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Xulosa
  const present = attData.filter(a => a.status === "present").length;
  const late    = attData.filter(a => a.status === "late").length;
  const absent  = attData.filter(a => a.status === "absent").length;
  const total   = students.length || 1;

  const studentCols = [
    { title: "#", key: "i", width: 44, render: (_, __, i) => <Text type="secondary" style={{ fontSize: 12 }}>{i + 1}</Text> },
    {
      title: "Talaba", key: "name",
      render: (_, r) => {
        const status = getStudentStatus(r.id);
        const cfg    = ATT_STATUS[status] || {};
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Ava name={`${r.last_name} ${r.first_name}`} color={cfg.color || "#94a3b8"} size={30} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{r.last_name} {r.first_name}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{formatPhone(r.phone)}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Davomat %", dataIndex: "attendance_pct", key: "att",
      render: v => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Progress percent={v || 0} size="small" style={{ width: 60, margin: 0 }}
            strokeColor={v >= 80 ? COLOR : v >= 60 ? "#f59e0b" : "#ef4444"} showInfo={false} />
          <Text style={{ fontSize: 12, fontWeight: 700, color: v >= 80 ? COLOR : v >= 60 ? "#f59e0b" : "#ef4444" }}>{v || 0}%</Text>
        </div>
      ),
    },
    {
      title: "Qarzdorlik", dataIndex: "debt_amount", key: "debt",
      render: v => v > 0
        ? <Text strong style={{ color: "#ef4444", fontSize: 12 }}>{formatCurrency(v)}</Text>
        : <Tag color="success" style={{ borderRadius: 20, fontSize: 11 }}>To'langan</Tag>,
    },
    {
      title: "Bugun", key: "today",
      render: (_, r) => {
        const status = getStudentStatus(r.id);
        if (!status) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
        const cfg = ATT_STATUS[status];
        return <Tag style={{ borderRadius: 20, background: cfg.bg, color: cfg.color, border: "none", fontWeight: 700, fontSize: 11 }}>{cfg.emoji} {cfg.label}</Tag>;
      },
    },
  ];

  const items = [
    {
      key: "students",
      label: `🎓 Talabalar (${students.length})`,
      children: (
        <div>
          <Input
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            placeholder="Ism qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 12, borderRadius: 10 }}
          />
          <Table
            dataSource={filtered}
            columns={studentCols}
            rowKey="id"
            loading={loading}
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
          />
        </div>
      ),
    },
    {
      key: "today",
      label: `📅 Bugungi davomat`,
      children: (
        <div>
          {/* Mini stats */}
          <Row gutter={[8, 8]} style={{ marginBottom: 14 }}>
            {[
              { l: "Keldi",    v: present, c: COLOR },
              { l: "Kechikdi", v: late,    c: "#f59e0b" },
              { l: "Kelmadi",  v: absent,  c: "#ef4444" },
              { l: "Belgilanmagan", v: total - present - late - absent, c: "#94a3b8" },
            ].map((s, i) => (
              <Col span={6} key={i}>
                <div style={{ textAlign: "center", padding: "10px", background: `${s.c}0d`, borderRadius: 10 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{s.l}</div>
                </div>
              </Col>
            ))}
          </Row>
          {/* Talabalar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
            {students.map(s => {
              const status = getStudentStatus(s.id);
              const cfg    = ATT_STATUS[status] || { label: "Belgilanmagan", color: "#94a3b8", bg: "#f8fafc", emoji: "—" };
              return (
                <div key={s.id} style={{ padding: "12px", background: cfg.bg || "#f8fafc", borderRadius: 12, border: `1.5px solid ${cfg.color}20`, textAlign: "center" }}>
                  <Ava name={`${s.last_name} ${s.first_name}`} color={cfg.color} size={32} />
                  <div style={{ fontWeight: 700, fontSize: 11, color: "#1e1e3a", marginTop: 6, lineHeight: 1.3 }}>
                    {s.last_name} {s.first_name}
                  </div>
                  <Tag style={{ borderRadius: 20, background: "transparent", color: cfg.color, border: "none", fontWeight: 700, fontSize: 11, marginTop: 4 }}>
                    {cfg.emoji} {cfg.label}
                  </Tag>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg,${COLOR}22,${COLOR}44)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: COLOR }}>
            {group.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{group.name}</div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>📖 {group.subject}</div>
          </div>
        </div>
      }
      open={open} onCancel={onClose} footer={null} width={680}
    >
      <Tabs items={items} style={{ marginTop: 8 }} />
    </Modal>
  );
}

// ── ASOSIY KOMPONENT ──────────────────────────────────────────────────────────
export default function TeacherGroups() {
  const [groups,      setGroups]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [detailModal, setDetailModal] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    groupApi.getAll({ my: true, page_size: 50 })
      .then(d => setGroups(d.results || []))
      .catch(e => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (error)   return <Alert type="error" message={error} />;

  // Umumiy statistika
  const totalStudents = groups.reduce((s, g) => s + (g.students_count || 0), 0);
  const avgAtt        = groups.length ? Math.round(groups.reduce((s, g) => s + (g.attendance_pct || 0), 0) / groups.length) : 0;
  const activeGroups  = groups.filter(g => g.is_active).length;

  return (
    <div>
      {/* ── Umumiy xulosa ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {[
          { emoji: "📚", l: "Mening guruhlarim", v: groups.length, c: "#6366f1" },
          { emoji: "✅", l: "Faol guruhlar",     v: activeGroups,  c: COLOR     },
          { emoji: "🎓", l: "Jami talabalar",    v: totalStudents, c: "#3b82f6" },
          { emoji: "📊", l: "O'rtacha davomat",  v: `${avgAtt}%`,  c: avgAtt >= 80 ? COLOR : "#f59e0b" },
        ].map((s, i) => (
          <Col span={6} key={i}>
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #eef0f6", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 26 }}>{s.emoji}</span>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>{s.l.toUpperCase()}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.v}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} style={{ borderRadius: 10 }}>
          Yangilash
        </Button>
      </div>

      {/* ── Guruh kartalar ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Yuklanmoqda...</div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <Title level={4} style={{ color: "#94a3b8" }}>Sizga biriktirilgan guruh yo'q</Title>
          <Text type="secondary">Administrator guruh biriktirgandan so'ng bu yerda ko'rinadi.</Text>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {groups.map(g => (
            <Col span={8} key={g.id}>
              <GroupCard group={g} onClick={() => setDetailModal(g)} />
            </Col>
          ))}
        </Row>
      )}

      {/* ── Detail modal ── */}
      <GroupDetailModal
        group={detailModal}
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
      />
    </div>
  );
}