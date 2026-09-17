import { useState } from "react";
import { Form, Input, Button, message, Typography } from "antd";
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const ROLE_REDIRECTS = {
  superadmin: "/superadmin/dashboard",
  founder:    "/founder/dashboard",
  director:   "/director/dashboard",
  center_admin: "/admin/dashboard",
  teacher:    "/teacher/dashboard",
  student:    "/student/dashboard",
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        message.error(data.error || "Login yoki parol noto'g'ri!");
        return;
      }

      // Token va foydalanuvchi ma'lumotlarini saqlash
      localStorage.setItem("access_token",  data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("role",          data.role);
      localStorage.setItem("full_name",     data.full_name);
      localStorage.setItem("user_id",       data.user_id);
      localStorage.setItem("texnikum_id",   data.texnikum_id || "");

      message.success("Tizimga xush kelibsiz!");

      // Rolga qarab yo'naltirish
      const redirect = ROLE_REDIRECTS[data.role] || "/";
      window.location.href = redirect;

    } catch {
      message.error("Server bilan bog'lanishda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Fon naqshi */}
      <div style={styles.bgPattern} />

      {/* Chap tomon — brend */}
      <div style={styles.leftPanel}>
        <div style={styles.brandWrap}>
          <div style={styles.logoCircle}>
            <span style={styles.logoText}>MT</span>
          </div>
          <Title level={1} style={styles.brandTitle}>
            MET Texnikum
          </Title>
          <Text style={styles.brandSub}>
            Zamonaviy boshqaruv tizimi
          </Text>

          <div style={styles.featureList}>
            {[
              { icon: "📍", text: "GPS davomat — 100m radius" },
              { icon: "👥", text: "6 darajali rol tizimi" },
              { icon: "💰", text: "Avtomatik oylik hisob-kitob" },
              { icon: "📊", text: "Real-vaqt statistika" },
              { icon: "🔔", text: "Push bildirishnomalar" },
            ].map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <span style={styles.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* O'ng tomon — login forma */}
      <div style={styles.rightPanel}>
        <div style={styles.card}>
          {/* Sarlavha */}
          <div style={styles.cardHeader}>
            <div style={styles.cardLogo}>MT</div>
            <Title level={3} style={styles.cardTitle}>
              Tizimga kirish
            </Title>
            <Text style={styles.cardSub}>
              Login va parolingizni kiriting
            </Text>
          </div>

          {/* Forma */}
          <Form
            form={form}
            onFinish={handleLogin}
            layout="vertical"
            size="large"
            style={styles.form}
          >
            <Form.Item
              name="username"
              label={<span style={styles.label}>Foydalanuvchi nomi</span>}
              rules={[{ required: true, message: "Login kiriting!" }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#6366f1" }} />}
                placeholder="username"
                style={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={styles.label}>Parol</span>}
              rules={[{ required: true, message: "Parol kiriting!" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#6366f1" }} />}
                placeholder="••••••••"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                style={styles.input}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={styles.submitBtn}
                block
              >
                {loading ? "Tekshirilmoqda..." : "Kirish"}
              </Button>
            </Form.Item>
          </Form>

          {/* Rol ko'rsatgich */}
          <div style={styles.roleHint}>
            <Text style={styles.roleHintText}>
              Rollar: SuperAdmin · Founder · Direktor · Admin · O'qituvchi · Talaba
            </Text>
          </div>
        </div>

        {/* Footer */}
        <Text style={styles.footer}>
          © {new Date().getFullYear()} MET Texnikum. Barcha huquqlar himoyalangan.
        </Text>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    background: "#0f0f1a",
    position: "relative",
    overflow: "hidden",
  },
  bgPattern: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      radial-gradient(circle at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(139,92,246,0.10) 0%, transparent 40%),
      radial-gradient(circle at 60% 80%, rgba(59,130,246,0.08) 0%, transparent 40%)
    `,
    pointerEvents: "none",
  },

  // Chap panel
  leftPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 80px",
    position: "relative",
    zIndex: 1,
  },
  brandWrap: {
    maxWidth: 420,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    boxShadow: "0 0 40px rgba(99,102,241,0.4)",
  },
  logoText: {
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: -1,
  },
  brandTitle: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: 800,
    margin: 0,
    lineHeight: 1.1,
    letterSpacing: -1.5,
  },
  brandSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 16,
    display: "block",
    marginTop: 10,
    marginBottom: 48,
    letterSpacing: 0.3,
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 18px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.07)",
    backdropFilter: "blur(10px)",
    transition: "all 0.2s",
  },
  featureIcon: {
    fontSize: 20,
    minWidth: 28,
    textAlign: "center",
  },
  featureText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: 500,
  },

  // O'ng panel
  rightPanel: {
    width: 480,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 48px",
    position: "relative",
    zIndex: 1,
    background: "rgba(255,255,255,0.02)",
    borderLeft: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
  },
  card: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "40px 36px",
    backdropFilter: "blur(30px)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
  },
  cardHeader: {
    textAlign: "center",
    marginBottom: 32,
  },
  cardLogo: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    borderRadius: 14,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    fontSize: 18,
    fontWeight: 800,
    color: "#fff",
    marginBottom: 16,
    boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
  },
  cardTitle: {
    color: "#ffffff",
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  cardSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    display: "block",
    marginTop: 6,
  },

  // Forma
  form: {
    width: "100%",
  },
  label: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: 500,
  },
  input: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    color: "#fff",
    fontSize: 14,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    border: "none",
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: 0.3,
    boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
    transition: "all 0.2s",
  },
  roleHint: {
    marginTop: 20,
    padding: "10px 14px",
    background: "rgba(99,102,241,0.08)",
    borderRadius: 10,
    border: "1px solid rgba(99,102,241,0.20)",
    textAlign: "center",
  },
  roleHintText: {
    color: "rgba(255,255,255,0.30)",
    fontSize: 11,
  },
  footer: {
    color: "rgba(255,255,255,0.18)",
    fontSize: 12,
    marginTop: 32,
    textAlign: "center",
  },
};