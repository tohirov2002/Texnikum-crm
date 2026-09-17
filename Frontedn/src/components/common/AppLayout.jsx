import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Typography, Space, message } from "antd";
import {
  BellOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  LogoutOutlined, UserOutlined, SettingOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";
import { SIDEBAR_MENUS } from "../../utils/constants";
import { notificationApi } from "../../api/resources.api";
import { getInitials } from "../../utils/formatters";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

export default function AppLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { role, fullName, roleMeta, logout } = useAuth();

  const [collapsed,    setCollapsed]    = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,  setUnreadCount]  = useState(0);

  const menuItems = SIDEBAR_MENUS[role] || [];
  const currentKey = location.pathname;

  // Bildirishnomalarni yuklash
  useEffect(() => {
    notificationApi.getAll({ is_read: false, page_size: 5 })
      .then((data) => {
        setNotifications(data.results || []);
        setUnreadCount(data.count || 0);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    message.success("Tizimdan chiqildi");
  };

  // Profil dropdown
  const profileDropdown = {
    items: [
      { key: "profile", icon: <UserOutlined />,   label: "Profilim",  onClick: () => navigate(`/${role}/profile`) },
      { key: "settings",icon: <SettingOutlined />, label: "Sozlamalar",onClick: () => navigate(`/${role}/settings`) },
      { type: "divider" },
      { key: "logout",  icon: <LogoutOutlined />,  label: "Chiqish",   danger: true, onClick: handleLogout },
    ],
  };

  // Bildirishnomalar dropdown
  const notifDropdown = {
    items: notifications.length
      ? [
          ...notifications.map((n) => ({
            key: String(n.id),
            label: (
              <div style={{ maxWidth: 260 }}>
                <Text strong style={{ fontSize: 13 }}>{n.title}</Text><br/>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {n.body?.slice(0, 70)}...
                </Text>
              </div>
            ),
            onClick: () => notificationApi.markRead(n.id),
          })),
          { type: "divider" },
          { key: "all", label: <Text style={{ color: "#6366f1" }}>Barchasini ko'rish</Text>, onClick: () => navigate(`/${role}/notifications`) },
        ]
      : [{ key: "empty", label: <Text type="secondary">Yangi bildirishnoma yo'q</Text> }],
  };

  return (
    <Layout style={{ minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ── SIDEBAR ── */}
      <Sider
        collapsible collapsed={collapsed}
        onCollapse={setCollapsed} trigger={null}
        width={240}
        style={{
          background: "#0c0c1d",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          position: "fixed", height: "100vh", left: 0, top: 0, zIndex: 100,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: collapsed ? "18px 16px" : "18px 20px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "#fff",
          }}>TF</div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.2, whiteSpace: "nowrap" }}>
                TimeFast
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>CRM Tizimi</div>
            </div>
          )}
        </div>

        {/* Rol badge */}
        {!collapsed && (
          <div style={{
            margin: "10px 14px 4px",
            padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
            color: roleMeta.color, background: roleMeta.bg,
            border: `1px solid ${roleMeta.color}30`,
            display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
          }}>
            <span>{roleMeta.icon}</span>
            <span>{roleMeta.label}</span>
          </div>
        )}

        {/* Menyu */}
        <Menu
          mode="inline" theme="dark"
          selectedKeys={[currentKey]}
          style={{ background: "transparent", border: "none", flex: 1, padding: "6px 0", overflowY: "auto" }}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: <span style={{ fontSize: 17 }}>{item.icon}</span>,
            label: item.label,
            onClick: () => navigate(item.key),
            style: {
              borderLeft: currentKey === item.key ? "2.5px solid #6366f1" : "2.5px solid transparent",
              borderRadius: currentKey === item.key ? "0 8px 8px 0" : 0,
            },
          }))}
        />

        {/* Foydalanuvchi + Collapse tugma */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {!collapsed && (
            <div style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "12px 16px",
            }}>
              <Avatar size={30} style={{ background: `linear-gradient(135deg,${roleMeta.color},${roleMeta.color}aa)`, flexShrink: 0 }}>
                {getInitials(fullName)}
              </Avatar>
              <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {fullName}
                </div>
                <div style={{ color: roleMeta.color, fontSize: 10 }}>{roleMeta.label}</div>
              </div>
            </div>
          )}
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "12px", color: "rgba(255,255,255,0.3)", cursor: "pointer",
              fontSize: 16, borderTop: "1px solid rgba(255,255,255,0.06)",
              transition: "color 0.2s",
            }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            {!collapsed && <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 600 }}>Yig'ish</span>}
          </div>
        </div>
      </Sider>

      {/* ── ASOSIY QISM ── */}
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: "margin-left 0.2s", background: "#f4f5f9" }}>
        {/* HEADER */}
        <Header style={{
          background: "#fff", borderBottom: "1px solid #eef0f6",
          padding: "0 24px", height: 60,
          paddingTop: "80px",
          paddingBottom: "50px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 99,
          boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e1e3a" }}>
              {menuItems.find((m) => m.key === currentKey)?.icon}{" "}
              {menuItems.find((m) => m.key === currentKey)?.label || "Bosh sahifa"}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          <Space size={8}>
            {/* Bildirishnomalar */}
            <Dropdown menu={notifDropdown} placement="bottomRight" trigger={["click"]}>
              <Badge count={unreadCount} size="small">
                <Button type="text" icon={<BellOutlined />} style={{ width: 36, height: 36, borderRadius: 10 }} />
              </Badge>
            </Dropdown>

            {/* Profil */}
            <Dropdown menu={profileDropdown} placement="bottomRight" trigger={["click"]}>
              <Space style={{ cursor: "pointer", padding: "4px 8px", borderRadius: 10, transition: "background 0.2s" }}>
                <Avatar size={32} style={{ background: `linear-gradient(135deg,${roleMeta.color},${roleMeta.color}aa)` }}>
                  {getInitials(fullName)}
                </Avatar>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e1e3a", lineHeight: 1.2 }}>{fullName}</div>
                  <div style={{ fontSize: 10, color: roleMeta.color, fontWeight: 600 }}>{roleMeta.label}</div>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* CONTENT */}
        <Content style={{ padding: 24, minHeight: "calc(100vh - 60px)" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}