/**
 * CreateTexnikumModal.jsx — TO'LIQ MUKAMMAL VERSIYA
 *
 * O'rnatish:
 *   npm install leaflet react-leaflet
 *
 * main.jsx yoki App.jsx ga qo'shing:
 *   import 'leaflet/dist/leaflet.css'
 *
 * Ishlatish:
 *   import CreateTexnikumModal from './CreateTexnikumModal'
 *   <CreateTexnikumModal open={open} onClose={...} onSuccess={...} />
 */

import { useState, useEffect, useCallback } from "react";
import {
  Modal, Form, Input, DatePicker, Row, Col,
  Button, InputNumber, Divider, App, Alert, Spin, Tooltip,
} from "antd";
import {
  EnvironmentOutlined, UserOutlined, BankOutlined,
  AimOutlined, CheckCircleOutlined, LoadingOutlined,
  EyeInvisibleOutlined, EyeTwoTone, PhoneOutlined,
  MailOutlined, LockOutlined, IdcardOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import saasApi from "../../api/saas.api";

// ─────────────────────────────────────────────────────────────────────────────
//  STEP KONFIGURATSIYA
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, icon: <BankOutlined />,       label: "Texnikum"      },
  { n: 2, icon: <EnvironmentOutlined />, label: "GPS"           },
  { n: 3, icon: <UserOutlined />,       label: "Founder"       },
];

// ─────────────────────────────────────────────────────────────────────────────
//  STEP BAR
// ─────────────────────────────────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
      {STEPS.map((s, i) => (
        <div
          key={s.n}
          style={{
            display: "flex",
            alignItems: "center",
            flex: i < STEPS.length - 1 ? 1 : "unset",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 700,
                transition: "all 0.3s",
                background:
                  current === s.n
                    ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                    : current > s.n
                    ? "#10b981"
                    : "#f1f5f9",
                color: current >= s.n ? "#fff" : "#94a3b8",
                boxShadow:
                  current === s.n
                    ? "0 4px 14px rgba(99,102,241,0.45)"
                    : "none",
              }}
            >
              {current > s.n ? <CheckCircleOutlined /> : s.icon}
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color:
                  current === s.n
                    ? "#6366f1"
                    : current > s.n
                    ? "#10b981"
                    : "#94a3b8",
                whiteSpace: "nowrap",
              }}
            >
              {s.label}
            </span>
          </div>

          {i < STEPS.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                margin: "0 10px",
                marginBottom: 20,
                background:
                  current > s.n
                    ? "linear-gradient(90deg,#10b981,#6366f1)"
                    : "#e2e8f0",
                transition: "background 0.4s",
                borderRadius: 2,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  XARITA KOMPONENT (Leaflet — dinamik yuklash)
// ─────────────────────────────────────────────────────────────────────────────
function MapPicker({ lat, lng, onSelect }) {
  const [status, setStatus]   = useState("loading"); // "loading" | "ready" | "error"
  const [comps,  setComps]    = useState(null);

  useEffect(() => {
    Promise.all([import("leaflet"), import("react-leaflet")])
      .then(([L, RL]) => {
        // Leaflet default icon fix
        delete L.default.Icon.Default.prototype._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
        setComps({
          MapContainer:  RL.MapContainer,
          TileLayer:     RL.TileLayer,
          Marker:        RL.Marker,
          useMapEvents:  RL.useMapEvents,
        });
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  // Yuklanmoqda
  if (status === "loading") {
    return (
      <div
        style={{
          height: 280,
          borderRadius: 14,
          background: "#f8fafc",
          border: "1.5px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          color: "#94a3b8",
        }}
      >
        <Spin indicator={<LoadingOutlined spin />} />
        <span style={{ fontSize: 13 }}>Xarita yuklanmoqda...</span>
      </div>
    );
  }

  // Xato (leaflet o'rnatilmagan)
  if (status === "error") {
    return (
      <div
        style={{
          height: 280,
          borderRadius: 14,
          background: "#fef2f2",
          border: "2px dashed #fca5a5",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          color: "#ef4444",
          padding: 20,
          textAlign: "center",
        }}
      >
        <EnvironmentOutlined style={{ fontSize: 36 }} />
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          Xarita yuklanmadi
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          Terminal: <code style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, color: "#374151" }}>
            npm install leaflet react-leaflet
          </code>
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>
          O'rnatib, sahifani yangilang. Koordinatalarni qo'lda ham kiritishingiz mumkin.
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, useMapEvents } = comps;
  const center = lat && lng ? [lat, lng] : [41.2995, 69.2401];

  // Xaritada bosish uchun ichki komponent
  function ClickHandler() {
    useMapEvents({
      click(e) {
        onSelect(
          parseFloat(e.latlng.lat.toFixed(6)),
          parseFloat(e.latlng.lng.toFixed(6))
        );
      },
    });
    return null;
  }

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1.5px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <MapContainer
        center={center}
        zoom={lat && lng ? 15 : 13}
        style={{ height: 280, width: "100%" }}
        key={`${lat}-${lng}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler />
        {lat && lng && <Marker position={[lat, lng]} />}
      </MapContainer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  GPS STEP
// ─────────────────────────────────────────────────────────────────────────────
function GpsStep({ gps, setGps, onNext, onBack }) {
  const [latStr,  setLatStr]  = useState(gps.lat ? String(gps.lat) : "");
  const [lngStr,  setLngStr]  = useState(gps.lng ? String(gps.lng) : "");
  const [radius,  setRadius]  = useState(gps.radius || 100);
  const [locLoad, setLocLoad] = useState(false);
  const [err,     setErr]     = useState("");

  // Xaritadan tanlaganda
  const handleMapSelect = useCallback(
    (lat, lng) => {
      setLatStr(String(lat));
      setLngStr(String(lng));
      setGps((prev) => ({ ...prev, lat, lng }));
      setErr("");
    },
    [setGps]
  );

  // Qo'lda kiritilganda (blur)
  const applyManual = () => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (latStr && lngStr) {
      if (isNaN(lat) || isNaN(lng)) {
        setErr("Koordinatalar raqam bo'lishi kerak!");
        return;
      }
      if (lat < -90 || lat > 90) {
        setErr("Latitude -90 dan 90 gacha bo'lishi kerak!");
        return;
      }
      if (lng < -180 || lng > 180) {
        setErr("Longitude -180 dan 180 gacha bo'lishi kerak!");
        return;
      }
      setGps((prev) => ({ ...prev, lat, lng }));
      setErr("");
    }
  };

  // Joriy joylashuvni aniqlash
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErr("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi!");
      return;
    }
    setLocLoad(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setLatStr(String(lat));
        setLngStr(String(lng));
        setGps((prev) => ({ ...prev, lat, lng }));
        setErr("");
        setLocLoad(false);
      },
      () => {
        setErr("Joylashuv aniqlanmadi. Brauzer ruxsatini tekshiring.");
        setLocLoad(false);
      },
      { timeout: 8000 }
    );
  };

  // Radius o'zgarganda
  const handleRadiusChange = (val) => {
    setRadius(val);
    setGps((prev) => ({ ...prev, radius: val }));
  };

  const handleNext = () => {
    if (!gps.lat || !gps.lng) {
      setErr("GPS koordinatalarini kiriting yoki xaritadan tanlang!");
      return;
    }
    setErr("");
    onNext();
  };

  return (
    <div>
      {/* Xarita sarlavhasi */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
          🗺️ Xaritada texnikum joylashuvini bosing
        </span>
        <Button
          size="small"
          icon={locLoad ? <LoadingOutlined /> : <AimOutlined />}
          onClick={getCurrentLocation}
          loading={locLoad}
          style={{
            borderRadius: 8,
            borderColor: "#6366f1",
            color: "#6366f1",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Joylashuvimni aniqlash
        </Button>
      </div>

      {/* Xarita */}
      <MapPicker lat={gps.lat} lng={gps.lng} onSelect={handleMapSelect} />

      {/* Tanlangan koordinatlar */}
      {gps.lat && gps.lng ? (
        <div
          style={{
            marginTop: 8,
            padding: "8px 14px",
            borderRadius: 10,
            background: "#f0fdf4",
            border: "1px solid #86efac",
            fontSize: 12,
            color: "#16a34a",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <CheckCircleOutlined />
          Belgilandi: {gps.lat}, {gps.lng} • Radius: {radius}m
        </div>
      ) : (
        <div
          style={{
            marginTop: 8,
            padding: "8px 14px",
            borderRadius: 10,
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            fontSize: 12,
            color: "#3b82f6",
            fontWeight: 600,
          }}
        >
          👆 Xaritada texnikum binosi ustiga bosing yoki quyida qo'lda kiriting
        </div>
      )}

      <Divider style={{ margin: "16px 0" }}>
        <span
          style={{
            fontSize: 11,
            color: "#94a3b8",
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          YOKI QO'LDA KIRITING
        </span>
      </Divider>

      {/* Qo'lda kiritish */}
      <Row gutter={10}>
        <Col span={9}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 5,
            }}
          >
            Latitude (Kenglik)
          </div>
          <Input
            value={latStr}
            onChange={(e) => setLatStr(e.target.value)}
            onBlur={applyManual}
            placeholder="41.299496"
            style={{ borderRadius: 9 }}
            prefix={<span style={{ fontSize: 11, color: "#94a3b8" }}>LAT</span>}
          />
        </Col>
        <Col span={9}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 5,
            }}
          >
            Longitude (Uzunlik)
          </div>
          <Input
            value={lngStr}
            onChange={(e) => setLngStr(e.target.value)}
            onBlur={applyManual}
            placeholder="69.240073"
            style={{ borderRadius: 9 }}
            prefix={<span style={{ fontSize: 11, color: "#94a3b8" }}>LNG</span>}
          />
        </Col>
        <Col span={6}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 5,
            }}
          >
            Radius (metr)
          </div>
          <Tooltip title="Davomat qabul qilinadigan masofa (odatda 100m)">
            <InputNumber
              value={radius}
              onChange={handleRadiusChange}
              min={50}
              max={1000}
              step={10}
              style={{ width: "100%", borderRadius: 9 }}
            />
          </Tooltip>
        </Col>
      </Row>

      {err && (
        <Alert
          type="error"
          message={err}
          showIcon
          style={{ marginTop: 12, borderRadius: 10 }}
          closable
          onClose={() => setErr("")}
        />
      )}

      {/* Navigatsiya */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <Button onClick={onBack} style={{ borderRadius: 10, height: 44, paddingInline: 20 }}>
          ← Orqaga
        </Button>
        <Button
          type="primary"
          block
          size="large"
          onClick={handleNext}
          style={{
            borderRadius: 12,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            border: "none",
            height: 44,
            fontWeight: 700,
          }}
        >
          Keyingi — Founder →
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ASOSIY MODAL
// ─────────────────────────────────────────────────────────────────────────────
export default function CreateTexnikumModal({ open, onClose, onSuccess }) {
  const { message } = App.useApp();
  const [form]    = Form.useForm();
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [gps,     setGps]     = useState({ lat: null, lng: null, radius: 100 });

  // Modal yopilganda reset
  const handleClose = () => {
    form.resetFields();
    setStep(1);
    setGps({ lat: null, lng: null, radius: 100 });
    onClose();
  };

  // Step 1 → 2
  const goStep2 = () => {
    form
      .validateFields(["name", "address", "phone", "subscription_end"])
      .then(() => setStep(2))
      .catch(() => {});
  };

  // Step 3 → Submit
  const handleFinish = async (values) => {
    setLoading(true);
    try {
      await saasApi.createTexnikum({
        texnikum: {
          name:             values.name,
          address:          values.address,
          phone:            values.phone,
          subscription_end: values.subscription_end?.format("YYYY-MM-DD"),
          latitude:         gps.lat,
          longitude:        gps.lng,
          gps_radius:       gps.radius,
        },
        founder: {
          username:   values.username,
          password:   values.password,
          first_name: values.first_name,
          last_name:  values.last_name,
          email:      values.email || "",
        },
      });
      message.success("✅ Texnikum va Founder muvaffaqiyatli yaratildi!");
      handleClose();
      onSuccess();
    } catch (e) {
      const errData = e?.response?.data;
      if (errData && typeof errData === "object") {
        // Field bo'yicha xatolarni formga ko'rsatish
        const fields = Object.entries(errData).map(([name, msgs]) => ({
          name,
          errors: Array.isArray(msgs) ? msgs : [String(msgs)],
        }));
        if (fields.length > 0) {
          form.setFields(fields);
          // Agar username/parol xatosi bo'lsa step 3 ga o'tish
          const step3Fields = ["username", "password", "first_name", "last_name"];
          if (fields.some((f) => step3Fields.includes(f.name))) {
            setStep(3);
          }
        } else {
          message.error(errData?.error || errData?.detail || "Xatolik yuz berdi!");
        }
      } else {
        message.error("Server bilan bog'lanishda xatolik!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ paddingBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1e1e3a" }}>
            Yangi Texnikum qo'shish
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400, marginTop: 2 }}>
            Texnikum + GPS joylashuv + Founder hisobi
          </div>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={600}
      destroyOnHidden={false}
      styles={{ body: { paddingTop: 16, maxHeight: "80vh", overflowY: "auto" } }}
    >
      <StepBar current={step} />

      <Form form={form} layout="vertical" onFinish={handleFinish}>

        {/* ══════════════════════════════════════════
            STEP 1 — Texnikum ma'lumotlari
        ══════════════════════════════════════════ */}
        <div style={{ display: step === 1 ? "block" : "none" }}>
          <Form.Item
            name="name"
            label="Texnikum nomi"
            rules={[{ required: true, message: "Texnikum nomi majburiy!" }]}
          >
            <Input
              prefix={<BankOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Masalan: Toshkent Texnikumi"
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item
            name="address"
            label="To'liq manzil"
            rules={[{ required: true, message: "Manzil majburiy!" }]}
          >
            <Input
              prefix={<EnvironmentOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Shahar, ko'cha, uy raqami"
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Telefon raqami"
                rules={[
                  { required: true, message: "Telefon majburiy!" },
                  {
                    pattern: /^[\+\d\s\-\(\)]{9,15}$/,
                    message: "Telefon formati noto'g'ri!",
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: "#94a3b8" }} />}
                  placeholder="+998 90 123 45 67"
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="subscription_end"
                label="Obuna tugash sanasi"
                rules={[{ required: true, message: "Sana majburiy!" }]}
              >
                <DatePicker
                  style={{ width: "100%", borderRadius: 10 }}
                  format="DD.MM.YYYY"
                  size="large"
                  placeholder="Sanani tanlang"
                  disabledDate={(d) => d && d < dayjs().startOf("day")}
                />
              </Form.Item>
            </Col>
          </Row>

          <Button
            type="primary"
            block
            size="large"
            onClick={goStep2}
            style={{
              borderRadius: 12,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              border: "none",
              height: 46,
              fontWeight: 700,
              fontSize: 15,
              marginTop: 4,
            }}
          >
            Keyingi — GPS Joylashuv →
          </Button>
        </div>

        {/* ══════════════════════════════════════════
            STEP 2 — GPS (alohida komponent)
        ══════════════════════════════════════════ */}
        {step === 2 && (
          <GpsStep
            gps={gps}
            setGps={setGps}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {/* ══════════════════════════════════════════
            STEP 3 — Founder hisobi
        ══════════════════════════════════════════ */}
        <div style={{ display: step === 3 ? "block" : "none" }}>
          {/* GPS holati xabari */}
          {gps.lat && gps.lng ? (
            <div
              style={{
                padding: "9px 14px",
                borderRadius: 10,
                background: "#f0fdf4",
                border: "1px solid #86efac",
                marginBottom: 16,
                fontSize: 12,
                color: "#16a34a",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircleOutlined style={{ fontSize: 14 }} />
              GPS tayyor: {gps.lat}, {gps.lng} • Radius: {gps.radius}m
            </div>
          ) : (
            <div
              style={{
                padding: "9px 14px",
                borderRadius: 10,
                background: "#fffbeb",
                border: "1px solid #fde68a",
                marginBottom: 16,
                fontSize: 12,
                color: "#b45309",
                fontWeight: 600,
              }}
            >
              ⚠️ GPS kiritilmagan — keyinroq texnikum sozlamalaridan kiritishingiz mumkin
            </div>
          )}

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="last_name"
                label="Familiya"
                rules={[{ required: true, message: "Familiya majburiy!" }]}
              >
                <Input
                  prefix={<IdcardOutlined style={{ color: "#94a3b8" }} />}
                  placeholder="Familiya"
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="first_name"
                label="Ism"
                rules={[{ required: true, message: "Ism majburiy!" }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "#94a3b8" }} />}
                  placeholder="Ism"
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="username"
            label="Login (username)"
            rules={[
              { required: true, message: "Login majburiy!" },
              { min: 3, message: "Kamida 3 ta belgi!" },
              {
                pattern: /^[a-zA-Z0-9_]+$/,
                message: "Faqat lotin harflar, raqamlar va _ belgisi!",
              },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#94a3b8" }} />}
              placeholder="founder_login"
              size="large"
              style={{ borderRadius: 10 }}
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Parol"
            rules={[
              { required: true, message: "Parol majburiy!" },
              { min: 8, message: "Kamida 8 ta belgi!" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Kamida 8 ta belgi"
              size="large"
              style={{ borderRadius: 10 }}
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={
              <span>
                Email{" "}
                <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 12 }}>
                  (ixtiyoriy)
                </span>
              </span>
            }
            rules={[{ type: "email", message: "Email formati noto'g'ri!" }]}
          >
            <Input
              prefix={<MailOutlined style={{ color: "#94a3b8" }} />}
              placeholder="founder@example.com"
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Button
              onClick={() => setStep(2)}
              style={{ borderRadius: 10, height: 46, paddingInline: 20 }}
            >
              ← Orqaga
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{
                flex: 1,
                borderRadius: 12,
                background: "linear-gradient(135deg,#10b981,#059669)",
                border: "none",
                height: 46,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {loading ? "Yaratilmoqda..." : "✅ Texnikum yaratish"}
            </Button>
          </div>
        </div>

      </Form>
    </Modal>
  );
}