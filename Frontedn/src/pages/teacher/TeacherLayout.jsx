import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Layout, Avatar, Dropdown, Badge,
  Button, Typography, Space, message, Tooltip,
} from "antd";
import {
  BellOutlined, LogoutOutlined, UserOutlined,
  SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";
import { notificationApi, groupApi, attendanceApi } from "../../api/resources.api";
import { getInitials } from "../../utils/formatters";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const TEACHER_MENU = [
  { key: "/teacher/dashboard",    icon: "📊", label: "Bosh sahifa"  },
  { key: "/teacher/groups",       icon: "📚", label: "Mening guruhlarim" },
  { key: "/teacher/lessons",      icon: "🎯", label: "Darslar"      },
  { key: "/teacher/my-attendance",icon: "📅", label: "Mening davomatim" },
];

const COLOR    = "#10b981";
const COLOR2   = "#059669";
const GRADIENT = `linear-gradient(135deg, ${COLOR}, ${COLOR2})`;

// ── Pulsing dot ───────────────────────────────────────────────────────────────
const LiveDot = ({ color = "#10b981" }) => (
  <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, animation: "tping 1.4s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.6 }} />
    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }} />
    <style>{`@keyframes tping { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }`}</style>
  </span>
);

// ── Header stat pill ──────────────────────────────────────────────────────────
const StatPill = ({ emoji, value, label, color, onClick }) => (
  <div onClick={onClick}
    style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: `${color}0f`, border: `1px solid ${color}25`, cursor: onClick ? "pointer" : "default" }}>
    <span style={{ fontSize: 14 }}>{emoji}</span>
    <span style={{ fontWeight: 900, fontSize: 14, color }}>{value}</span>
    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{label}</span>
  </div>
);

// ── ASOSIY KOMPONENT ──────────────────────────────────────────────────────────
export default function TeacherLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { fullName, logout } = useAuth();

  const [collapsed,     setCollapsed]     = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [time,          setTime]          = useState(new Date());
  const [stats,         setStats]         = useState({ groups: 0, todayLesson: false, attStatus: null });
  const timerRef = useRef(null);

  const currentKey  = location.pathname;
  const currentMenu = TEACHER_MENU.find(m => m.key === currentKey);

  // Soat
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Bildirishnomalar
  useEffect(() => {
    notificationApi.getAll({ is_read: false, page_size: 5 })
      .then(d => { setNotifications(d.results || []); setUnreadCount(d.count || 0); })
      .catch(() => {});
  }, []);

  // Header statistika
  const fetchStats = () => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.allSettled([
      groupApi.getAll({ my: true, page_size: 1 }),
      attendanceApi.getMy({ date: today }),
    ]).then(([grRes, attRes]) => {
      const groups      = grRes.status  === "fulfilled" ? (grRes.value.count  || 0) : 0;
      const myAtt       = attRes.status === "fulfilled" ? (attRes.value.results?.[0] || null) : null;
      setStats({ groups, attStatus: myAtt?.status || null });
    });
  };

  useEffect(() => {
    fetchStats();
    timerRef.current = setInterval(fetchStats, 30000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleLogout = async () => { await logout(); message.success("Tizimdan chiqildi"); };

  const profileItems = {
    items: [
      { key: "profile",  icon: <UserOutlined />,   label: "Profilim",   onClick: () => navigate("/teacher/profile") },
      { key: "settings", icon: <SettingOutlined />, label: "Sozlamalar", onClick: () => navigate("/teacher/settings") },
      { type: "divider" },
      { key: "logout",   icon: <LogoutOutlined />,  label: "Chiqish", danger: true, onClick: handleLogout },
    ],
  };

  const notifItems = {
    items: notifications.length
      ? [
          ...notifications.map(n => ({
            key: String(n.id),
            label: (<div style={{ maxWidth: 260 }}><Text strong style={{ fontSize: 13 }}>{n.title}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{n.body?.slice(0, 70)}</Text></div>),
            onClick: () => notificationApi.markRead(n.id),
          })),
          { type: "divider" },
          { key: "all", label: <Text style={{ color: COLOR }}>Barchasini ko'rish</Text>, onClick: () => navigate("/teacher/notifications") },
        ]
      : [{ key: "empty", label: <Text type="secondary">Yangi bildirishnoma yo'q</Text> }],
  };

  // Bugungi davomat holati rangi
  const attColor = stats.attStatus === "present" ? "#10b981"
    : stats.attStatus === "late"    ? "#f59e0b"
    : stats.attStatus === "absent"  ? "#ef4444"
    : "#94a3b8";

  const attLabel = stats.attStatus === "present" ? "Keldim"
    : stats.attStatus === "late"    ? "Kechikdim"
    : stats.attStatus === "absent"  ? "Kelmadim"
    : "Belgilanmagan";

  return (
    <Layout style={{ minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} trigger={null} width={240}
        style={{ background: "#071a0f", borderRight: "1px solid rgba(16,185,129,0.10)", position: "fixed", height: "100vh", left: 0, top: 0, zIndex: 100, overflow: "hidden" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "18px 16px" : "18px 20px 14px", borderBottom: "1px solid rgba(16,185,129,0.10)", overflow: "hidden" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff", boxShadow: `0 4px 12px ${COLOR}40` }}>MT</div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1.2, whiteSpace: "nowrap" }}>MET Texnikum</div>
              <div style={{ color: "rgba(16,185,129,0.5)", fontSize: 11, fontWeight: 600 }}>O'qituvchi paneli</div>
            </div>
          )}
        </div>

        {/* O'qituvchi badge */}
        {!collapsed && (
          <div style={{ margin: "10px 14px 4px", padding: "7px 12px", borderRadius: 10, background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>📚</span>
            <div>
              <div style={{ color: COLOR, fontSize: 12, fontWeight: 700 }}>O'qituvchi</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>{fullName}</div>
            </div>
          </div>
        )}

        {/* Bugungi holat */}
        {!collapsed && (
          <div style={{ margin: "8px 14px", padding: "8px 12px", borderRadius: 10, background: `${attColor}0d`, border: `1px solid ${attColor}22`, display: "flex", alignItems: "center", gap: 8 }}>
            <LiveDot color={attColor} />
            <Text style={{ color: attColor, fontSize: 11, fontWeight: 700 }}>{attLabel.toUpperCase()}</Text>
            <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginLeft: "auto" }}>
              {time.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </div>
        )}

        {/* Menyu */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {TEACHER_MENU.map(item => {
            const isActive = currentKey === item.key;
            return (
              <Tooltip key={item.key} title={collapsed ? item.label : ""} placement="right">
                <div onClick={() => navigate(item.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: collapsed ? 0 : 10,
                    padding: collapsed ? "12px 0" : "10px 16px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    margin: "2px 8px", borderRadius: 10, cursor: "pointer",
                    background: isActive ? `linear-gradient(135deg,${COLOR}22,${COLOR2}18)` : "transparent",
                    border: isActive ? `1px solid ${COLOR}35` : "1px solid transparent",
                    transition: "all 0.15s",
                  }}>
                  <span style={{ fontSize: 18, lineHeight: 1, filter: isActive ? "none" : "grayscale(0.3) opacity(0.7)" }}>{item.icon}</span>
                  {!collapsed && (
                    <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                  )}
                  {isActive && !collapsed && (
                    <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: COLOR, boxShadow: `0 0 6px ${COLOR}` }} />
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>

        {/* Guruhlar soni */}
        {!collapsed && stats.groups > 0 && (
          <div style={{ margin: "8px 14px", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>MENING GURUHLARIM</Text>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>📚</span>
              <span style={{ fontWeight: 900, fontSize: 22, color: COLOR }}>{stats.groups}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>ta guruh</span>
            </div>
          </div>
        )}

        {/* Foydalanuvchi + Collapse */}
        <div style={{ borderTop: "1px solid rgba(16,185,129,0.10)" }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 16px" }}>
              <Avatar size={32} style={{ background: GRADIENT, flexShrink: 0, boxShadow: `0 2px 8px ${COLOR}40` }}>{getInitials(fullName)}</Avatar>
              <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fullName}</div>
                <div style={{ color: COLOR, fontSize: 10, fontWeight: 600 }}>O'qituvchi</div>
              </div>
            </div>
          )}
          <div onClick={() => setCollapsed(!collapsed)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 15, borderTop: "1px solid rgba(16,185,129,0.10)", transition: "color 0.2s" }}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            {!collapsed && <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 600 }}>Yig'ish</span>}
          </div>
        </div>
      </Sider>

      {/* ── ASOSIY QISM ── */}
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: "margin-left 0.2s", background: "#f0faf4" }}>

        {/* HEADER */}
        <Header style={{ background: "#fff", borderBottom: "1px solid #e6f7ef", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 99, boxShadow: "0 1px 0 rgba(16,185,129,0.08)" }}>

          {/* Sahifa sarlavhasi */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e1e3a", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>{currentMenu?.icon}</span>
              {currentMenu?.label || "Bosh sahifa"}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
              {time.toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          {/* O'rta stat pilllar */}
          <Space size={8}>
            <StatPill emoji="📚" value={stats.groups} label="guruh" color="#6366f1" onClick={() => navigate("/teacher/groups")} />
            <StatPill emoji="📅" value={attLabel} label="bugun" color={attColor} onClick={() => navigate("/teacher/my-attendance")} />
          </Space>

          {/* O'ng */}
          <Space size={8}>
            <Dropdown menu={notifItems} placement="bottomRight" trigger={["click"]}>
              <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <Button type="text" icon={<BellOutlined />} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #eef0f6" }} />
              </Badge>
            </Dropdown>

            <Dropdown menu={profileItems} placement="bottomRight" trigger={["click"]}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 12, cursor: "pointer", border: "1px solid #eef0f6", background: "#fff" }}>
                <Avatar size={30} style={{ background: GRADIENT, boxShadow: `0 2px 8px ${COLOR}30` }}>{getInitials(fullName)}</Avatar>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1e1e3a", lineHeight: 1.2 }}>{fullName}</div>
                  <div style={{ fontSize: 10, color: COLOR, fontWeight: 600 }}>O'qituvchi</div>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* CONTENT */}
        <Content style={{ padding: 24, minHeight: "calc(100vh - 64px)", background: "#f0faf4" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}