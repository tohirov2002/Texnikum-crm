import { useEffect, useState, useCallback } from "react";
import {
  Table, Card, Tag, Input, Select, DatePicker, Row, Col,
  Typography, Spin, Alert, Button, Avatar, Space,
} from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { logsApi } from "../../api/resources.api";
import { formatDateTime, getInitials } from "../../utils/formatters";
import { ROLE_META } from "../../utils/constants";
import { useDebounce } from "../../hooks/useDebounce";

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ACTION_TYPES = {
  create: { label: "YARATILDI", color: "success"    },
  update: { label: "YANGILANDI",color: "processing"  },
  delete: { label: "O'CHIRILDI",color: "error"       },
  login:  { label: "KIRDI",     color: "cyan"        },
  logout: { label: "CHIQDI",    color: "default"     },
};

export default function Logs() {
  const [data,       setData]       = useState({ results: [], count: 0 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [actionType, setActionType] = useState(undefined);
  const [dateRange,  setDateRange]  = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {
      page,
      page_size: 20,
      search: debouncedSearch || undefined,
      action_type: actionType || undefined,
      date_from: dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
      date_to:   dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
    };
    logsApi.getAll(params)
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || "Yuklanmadi"))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, actionType, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    {
      title: "#",
      key: "idx",
      width: 52,
      render: (_, __, i) => (
        <Text type="secondary" style={{ fontSize: 12 }}>{(page - 1) * 20 + i + 1}</Text>
      ),
    },
    {
      title: "Foydalanuvchi",
      key: "user",
      render: (_, r) => {
        const roleMeta = ROLE_META[r.user_role] || {};
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Avatar
              size={30}
              style={{ background: `linear-gradient(135deg,${roleMeta.color || "#6366f1"},${roleMeta.color || "#8b5cf6"}aa)`, fontSize: 11, flexShrink: 0 }}
            >
              {getInitials(r.user_full_name || r.user)}
            </Avatar>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>
                {r.user_full_name || r.user}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>@{r.user}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Rol",
      dataIndex: "user_role",
      key: "role",
      render: (role) => {
        const m = ROLE_META[role] || {};
        return m.label ? (
          <Tag
            style={{ borderRadius: 20, background: m.bg, color: m.color, border: `1px solid ${m.color}30`, fontSize: 10, fontWeight: 700 }}
          >
            {m.icon} {m.label}
          </Tag>
        ) : <Text type="secondary">—</Text>;
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
      title: "Tavsif",
      dataIndex: "description",
      key: "desc",
      render: (d) => <Text style={{ fontSize: 12 }}>{d || "—"}</Text>,
    },
    {
      title: "Amal turi",
      dataIndex: "action_type",
      key: "type",
      render: (t) => {
        const cfg = ACTION_TYPES[t] || { label: t?.toUpperCase(), color: "default" };
        return (
          <Tag color={cfg.color} style={{ borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "Sana & Vaqt",
      dataIndex: "created_at",
      key: "time",
      render: (t) => (
        <Text style={{ fontSize: 11, color: "#64748b" }}>
          {t ? formatDateTime(t) : "—"}
        </Text>
      ),
    },
  ];

  if (error) return <Alert type="error" message={error} />;

  return (
    <div>
      {/* Filter panel */}
      <Card bordered={false} style={{ borderRadius: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            placeholder="Foydalanuvchi, amal qidirish..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ maxWidth: 260, borderRadius: 10 }}
          />
          <Select
            placeholder="Amal turi"
            allowClear
            value={actionType}
            onChange={(v) => { setActionType(v); setPage(1); }}
            style={{ width: 180 }}
          >
            {Object.entries(ACTION_TYPES).map(([k, v]) => (
              <Option key={k} value={k}>{v.label}</Option>
            ))}
          </Select>
          <RangePicker
            format="YYYY-MM-DD"
            value={dateRange}
            onChange={(v) => { setDateRange(v); setPage(1); }}
            style={{ borderRadius: 10 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            style={{ borderRadius: 10, marginLeft: "auto" }}
          >
            Yangilash
          </Button>
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
            pageSize: 20,
            current: page,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            showTotal: (total) => `Jami ${total} ta harakat`,
          }}
        />
      </Card>
    </div>
  );
}