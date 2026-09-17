import { useState, useEffect } from "react";
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Typography, Space } from "antd";
import {
  DashboardOutlined, TeamOutlined, UserOutlined, CalendarOutlined,
  BankOutlined, BarChartOutlined, BellOutlined, SettingOutlined,
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  DollarOutlined, FileTextOutlined, BookOutlined, SafetyCertificateOutlined,
  GlobalOutlined, CrownOutlined, HomeOutlined, ClockCircleOutlined,
} from "@ant-design/icons";
import { authApi, notificationApi, getRole, getFullName, clearAuth } from "../services/api";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

// ─── Har bir rolga mos menyu elementlari ──────────────────────────────────────
const MENUS = {
  superadmin: [
    { key: "/superadmin/dashboard",  icon: <GlobalOutlined />,          label: "Bosh sahifa" },
    { key: "/superadmin/texnikumlar",icon: <BankOutlined />,            label: "Markazlar" },
    { key: "/superadmin/saas",       icon: <SafetyCertificateOutlined />,label: "SaaS / Obuna" },
    { key: "/superadmin/users",      icon: <TeamOutlined />,            label: "Foydalanuvchilar" },
    { key: "/superadmin/logs",       icon: <FileTextOutlined />,        label: "Audit loglar" },
    { key: "/superadmin/settings",   icon: <SettingOutlined />,         label: "Sozlamalar" },
  ],
  founder: [
    { key: "/founder/dashboard",     icon: <DashboardOutlined />,       label: "Bosh sahifa" },
    { key: "/founder/hr",            icon: <TeamOutlined />,            label: "HR & Xodimlar" },
    { key: "/founder/finance",       icon: <DollarOutlined />,          label: "Moliya" },
    { key: "/founder/attendance",    icon: <CalendarOutlined />,        label: "Davomat nazorati" },
    { key: "/founder/logs",          icon: <FileTextOutlined />,        label: "Harakat jurnali" },
    { key: "/founder/settings",      icon: <SettingOutlined />,         label: "Sozlamalar" },
  ],
  director: [
    { key: "/director/dashboard",    icon: <DashboardOutlined />,       label: "Bosh sahifa" },
    { key: "/director/employees",    icon: <TeamOutlined />,            label: "Xodimlar" },
    { key: "/director/attendance",   icon: <ClockCircleOutlined />,     label: "Davomat" },
    { key: "/director/payroll",      icon: <DollarOutlined />,          label: "Oylik maoshlar" },
    { key: "/director/expenses",     icon: <BarChartOutlined />,        label: "Xarajatlar" },
    { key: "/director/announcements",icon: <BellOutlined />,            label: "E'lonlar" },
  ],
  center_admin: [
    { key: "/admin/dashboard",       icon: <DashboardOutlined />,       label: "Bosh sahifa" },
    { key: "/admin/groups",          icon: <BookOutlined />,            label: "Guruhlar" },
    { key: "/admin/students",        icon: <UserOutlined />,            label: "Talabalar" },
    { key: "/admin/attendance",      icon: <CalendarOutlined />,        label: "Jonli davomat" },
    { key: "/admin/payments",        icon: <DollarOutlined />,          label: "To'lovlar" },
    { key: "/admin/announcements",   icon: <BellOutlined />,            label: "E'lonlar" },
  ],
  teacher: [
    { key: "/teacher/dashboard",     icon: <DashboardOutlined />,       label: "Bosh sahifa" },
    { key: "/teacher/my-attendance", icon: <ClockCircleOutlined />,     label: "Mening davomatim" },
    { key: "/teacher/lessons",       icon: <BookOutlined />,            label: "Darslarim" },
    { key: "/teacher/groups",        icon: <TeamOutlined />,            label: "Guruhlarim" },
  ],
  student: [
    { key: "/student/dashboard",     icon: <HomeOutlined />,            label: "Bosh sahifa" },
    { key: "/student/attendance",    icon: <CalendarOutlined />,        label: "Davomatim" },
    { key: "/student/grades",        icon: <BarChartOutlined />,        label: "Baholarim" },
    { key: "/student/schedule",      icon: <ClockCircleOutlined />,     label: "Dars jadvali" },
    { key: "/student/payments",      icon: <DollarOutlined />,          label: "To'lovlar" },
  ],
};

// Rol rangi va nomi
const ROLE_META = {
  superadmin:   { label: "Super Admin",      color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  founder:      { label: "Ta'sischi",        color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  director:     { label: "Direktor",         color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  center_admin: { label: "Texnikum Admini",  color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  teacher:      { label: "O'qituvchi",       color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  student:      { label: "Talaba",           color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
};

export default function AppLayout({ children, currentPath = "/" }) {
  const [collapsed, setCollapsed]           = useState(false);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [notifications, setNotifications]   = useState([]);

  const role     = getRole();
  const fullName = getFullName() || "Foydalanuvchi";
  const menuItems = MENUS[role] || [];
  const roleMeta  = ROLE_META[role] || ROLE_META.student;

  // Bildirishnomalarni yuklash
  useEffect(() => {
    notificationApi.list({ is_read: false })
      .then((data) => {
        setNotifications(data.results || []);
        setUnreadCount(data.count || 0);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    window.location.href = "/login";
  };

  // Profil dropdown
  const profileMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Profilim",
        onClick: () => window.location.href = `/${role}/profile`,
      },
      {
        key: "settings",
        icon: <SettingOutlined />,
        label: "Sozlamalar",
        onClick: () => window.location.href = `/${role}/settings`,
      },
      { type: "divider" },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Chiqish",
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  // Bildirishnomalar dropdown
  const notifMenu = {
    items: notifications.length
      ? [
          ...notifications.slice(0, 5).map((n) => ({
            key: n.id,
            label: (
              <div style={{ maxWidth: 260 }}>
                <Text strong style={{ fontSize: 13 }}>{n.title}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {n.body.slice(0, 80)}...
                </Text>
              </div>
            ),
            onClick: () => notificationApi.markRead(n.id),
          })),
          { type: "divider" },
          {
            key: "all",
            label: <Text style={{ color: "#6366f1" }}>Barchasini ko'rish</Text>,
            onClick: () => window.location.href = `/${role}/notifications`,
          },
        ]
      : [{ key: "empty", label: <Text type="secondary">Yangi bildirishnoma yo'q</Text> }],
  };

  return (
    <Layout style={styles.layout}>
      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        style={styles.sider}
      >
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>MT</div>
          {!collapsed && (
            <div>
              <div style={styles.logoName}>MET Texnikum</div>
              <div style={styles.logoSub}>CRM Tizimi</div>
            </div>
          )}
        </div>

        {/* Rol Badge */}
        {!collapsed && (
          <div style={{
            ...styles.roleBadge,
            color: roleMeta.color,
            background: roleMeta.bg,
            border: `1px solid ${roleMeta.color}30`,
          }}>
            <CrownOutlined style={{ fontSize: 11 }} />
            <span>{roleMeta.label}</span>
          </div>
        )}

        {/* Menyu */}
        <Menu
          mode="inline"
          selectedKeys={[currentPath]}
          items={menuItems.map((item) => ({
            ...item,
            onClick: () => window.location.href = item.key,
          }))}
          style={styles.menu}
          theme="dark"
        />

        {/* Collapse tugmasi */}
        <div style={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          {!collapsed && <span style={{ marginLeft: 8 }}>Yig'ish</span>}
        </div>
      </Sider>

      {/* ── ASOSIY QISM ─────────────────────────────────────────── */}
      <Layout style={styles.mainLayout}>
        {/* HEADER */}
        <Header style={styles.header}>
          {/* Sahifa nomi */}
          <div style={styles.headerLeft}>
            <Text style={styles.pageTitle}>
              {menuItems.find((m) => m.key === currentPath)?.label || "Bosh sahifa"}
            </Text>
          </div>

          {/* O'ng tomon */}
          <Space size={8} style={styles.headerRight}>
            {/* Bildirishnomalar */}
            <Dropdown menu={notifMenu} placement="bottomRight" trigger={["click"]}>
              <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  style={styles.iconBtn}
                />
              </Badge>
            </Dropdown>

            {/* Profil */}
            <Dropdown menu={profileMenu} placement="bottomRight" trigger={["click"]}>
              <div style={styles.profileWrap}>
                <Avatar
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", cursor: "pointer" }}
                  size={34}
                >
                  {fullName.charAt(0).toUpperCase()}
                </Avatar>
                <div style={styles.profileInfo}>
                  <Text style={styles.profileName}>{fullName}</Text>
                  <Text style={{ ...styles.profileRole, color: roleMeta.color }}>
                    {roleMeta.label}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* CONTENT */}
        <Content style={styles.content}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  layout: {
    minHeight: "100vh",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  sider: {
    background: "#0f0f1a",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    position: "fixed",
    height: "100vh",
    left: 0,
    top: 0,
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "20px 20px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 800,
    color: "#fff",
    flexShrink: 0,
  },
  logoName: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.2,
  },
  logoSub: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
  },
  roleBadge: {
    margin: "12px 16px 4px",
    padding: "5px 10px",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
    letterSpacing: 0.3,
  },
  menu: {
    background: "transparent",
    border: "none",
    flex: 1,
    padding: "8px 0",
    overflowY: "auto",
  },
  collapseBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 20px",
    color: "rgba(255,255,255,0.35)",
    cursor: "pointer",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    fontSize: 13,
    transition: "color 0.2s",
    marginTop: "auto",
  },

  // Main
  mainLayout: {
    marginLeft: 240,
    background: "#f5f6fa",
    transition: "margin-left 0.2s",
  },

  // Header
  header: {
    background: "#ffffff",
    borderBottom: "1px solid #f0f0f0",
    padding: "0 24px",
    height: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 99,
    boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  pageTitle: {
    fontWeight: 600,
    fontSize: 16,
    color: "#1a1a2e",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
  },
  iconBtn: {
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    color: "#64748b",
    fontSize: 16,
  },
  profileWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 10,
    transition: "background 0.2s",
  },
  profileInfo: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.2,
  },
  profileName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  profileRole: {
    fontSize: 11,
    fontWeight: 500,
  },

  // Content
  content: {
    padding: 24,
    minHeight: "calc(100vh - 60px)",
    background: "#f5f6fa",
  },
};