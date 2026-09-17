import { useState } from "react";
import { Form, Input, Button, message, Typography } from "antd";
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";

const { Title, Text } = Typography;

const FEATURES = [
  { icon: "📍", text: "GPS davomat — 100m radius" },
  { icon: "👥", text: "6 darajali rol tizimi" },
  { icon: "💰", text: "Avtomatik oylik hisob-kitob" },
  { icon: "📊", text: "Real-vaqt statistika" },
  { icon: "🔔", text: "Celery bildirishnomalar" },
];

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    const result = await login(values);
    if (!result.success) {
      message.error(result.error?.error || "Login yoki parol noto'g'ri!");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#080812",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
      padding: "20px",
    }}>
      {/* Fon effektlari */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: "5%", top: "10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", right: "5%", bottom: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }} />
        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.02,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }} />
      </div>

      {/* Asosiy container - markazlashtirilgan */}
      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: 1300,
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        gap: 24,
        padding: 24,
      }}>
        
        {/* CHAP TOMON - Brend va Featurelar */}
        <div style={{
          flex: 1.2,
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          borderRadius: 48,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "48px 40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 900, color: "#fff",
              boxShadow: "0 10px 30px rgba(99,102,241,0.5)",
            }}>TF</div>
            <div>
              <div style={{ color: "#fff", fontSize: 28, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.2 }}>TimeFast</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, letterSpacing: 0.3 }}>CRM · ERP · Boshqaruv Tizimi</div>
            </div>
          </div>

          {/* Sarlavha */}
          <h1 style={{
            color: "#fff",
            fontSize: 52,
            fontWeight: 900,
            margin: "0 0 20px",
            lineHeight: 1.1,
            letterSpacing: -2,
          }}>
            Zamonaviy<br/>
            <span style={{
              background: "linear-gradient(135deg, #6366f1, #c084fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>ta'lim boshqaruvi</span>
          </h1>
          
          <p style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 16,
            margin: "0 0 48px",
            lineHeight: 1.7,
            maxWidth: 450,
          }}>
            GPS davomat, avtomatik oylik hisob-kitob va real-vaqt statistika — hammasi bitta platformada.
          </p>

          {/* Feature-lar grid ko'rinishida */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
            maxWidth: 550,
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.2s ease",
                cursor: "default",
                backdropFilter: "blur(10px)",
              }}>
                <span style={{
                  fontSize: 20,
                  background: "rgba(99,102,241,0.2)",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                }}>{f.icon}</span>
                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* O'NG TOMON - Login Forma */}
        <div style={{
          flex: 0.9,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            width: "100%",
            maxWidth: 440,
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            borderRadius: 48,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "48px 40px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}>
            {/* Karta sarlavhasi */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18, margin: "0 auto 20px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 900, color: "#fff",
                boxShadow: "0 8px 20px rgba(99,102,241,0.4)",
              }}>MT</div>
              <Title level={3} style={{
                color: "#fff",
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: -0.5,
              }}>
                Xush kelibsiz
              </Title>
              <Text style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 14,
                display: "block",
                marginTop: 8,
              }}>
                Tizimga kirish uchun ma'lumotlaringizni kiriting
              </Text>
            </div>

            {/* Xato */}
            {error && (
              <div style={{
                marginBottom: 24,
                padding: "12px 16px",
                background: "rgba(239,68,68,0.12)",
                borderRadius: 16,
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#fca5a5",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span> {error}
              </div>
            )}

            {/* Forma */}
            <Form form={form} onFinish={handleSubmit} layout="vertical">
              <Form.Item
                name="username"
                label={<span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>FOYDALANUVCHI NOMI</span>}
                rules={[{ required: true, message: "Login kiriting!" }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "#6366f1", fontSize: 16 }} />}
                  placeholder="username"
                  size="large"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 16,
                    color: "#fff",
                    height: 52,
                    fontSize: 15,
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>PAROL</span>}
                rules={[{ required: true, message: "Parol kiriting!" }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#6366f1", fontSize: 16 }} />}
                  placeholder="••••••••"
                  size="large"
                  iconRender={(v) => v ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 16,
                    color: "#fff",
                    height: 52,
                  }}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 32, marginBottom: 24 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  style={{
                    height: 56,
                    borderRadius: 18,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none",
                    fontSize: 16,
                    fontWeight: 700,
                    boxShadow: "0 10px 25px rgba(99,102,241,0.4)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {loading ? "Tekshirilmoqda..." : "Kirish →"}
                </Button>
              </Form.Item>
            </Form>

            <div style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "rgba(99,102,241,0.08)",
              borderRadius: 16,
              border: "1px solid rgba(99,102,241,0.2)",
              textAlign: "center",
            }}>
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                6 darajali rol 
              </Text>
            </div>

            <Text style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: 12,
              display: "block",
              textAlign: "center",
              marginTop: 32,
            }}>
              © {new Date().getFullYear()} TimeFast. Barcha huquqlar himoyalangan.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}