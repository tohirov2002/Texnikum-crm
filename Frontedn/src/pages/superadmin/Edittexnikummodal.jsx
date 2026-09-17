import { useState, useEffect, useCallback } from "react";
import {
  Modal, Form, Input, DatePicker, Row, Col,
  Button, InputNumber, Divider, App, Alert, Spin, Select,
} from "antd";
import {
  EnvironmentOutlined, UserOutlined, BankOutlined,
  AimOutlined, CheckCircleOutlined, LoadingOutlined,
  EyeInvisibleOutlined, EyeTwoTone, PhoneOutlined,
  MailOutlined, LockOutlined, IdcardOutlined, EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import saasApi from "../../api/saas.api";

const { Option } = Select;

const STEPS = [
  { n: 1, icon: <BankOutlined />,        label: "Texnikum" },
  { n: 2, icon: <EnvironmentOutlined />, label: "GPS"      },
  { n: 3, icon: <UserOutlined />,        label: "Founder"  },
];

function StepBar({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
      {STEPS.map((s, i) => (
        <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "unset" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 700, transition: "all 0.3s",
              background: current === s.n ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : current > s.n ? "#10b981" : "#f1f5f9",
              color: current >= s.n ? "#fff" : "#94a3b8",
              boxShadow: current === s.n ? "0 4px 14px rgba(99,102,241,0.45)" : "none",
            }}>
              {current > s.n ? <CheckCircleOutlined /> : s.icon}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", color: current === s.n ? "#6366f1" : current > s.n ? "#10b981" : "#94a3b8" }}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, margin: "0 10px", marginBottom: 20, background: current > s.n ? "linear-gradient(90deg,#10b981,#6366f1)" : "#e2e8f0", transition: "background 0.4s", borderRadius: 2 }} />
          )}
        </div>
      ))}
    </div>
  );
}

function MapPicker({ lat, lng, onSelect }) {
  const [status, setStatus] = useState("loading");
  const [comps,  setComps]  = useState(null);

  useEffect(() => {
    Promise.all([import("leaflet"), import("react-leaflet")])
      .then(([L, RL]) => {
        delete L.default.Icon.Default.prototype._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
        setComps({ MapContainer: RL.MapContainer, TileLayer: RL.TileLayer, Marker: RL.Marker, useMapEvents: RL.useMapEvents });
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") return (
    <div style={{ height: 260, borderRadius: 14, background: "#f8fafc", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#94a3b8" }}>
      <Spin indicator={<LoadingOutlined spin />} /><span style={{ fontSize: 13 }}>Xarita yuklanmoqda...</span>
    </div>
  );

  if (status === "error") return (
    <div style={{ height: 200, borderRadius: 14, background: "#fef2f2", border: "2px dashed #fca5a5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#ef4444", padding: 20, textAlign: "center" }}>
      <EnvironmentOutlined style={{ fontSize: 30 }} />
      <div style={{ fontSize: 13, fontWeight: 700 }}>Xarita yuklanmadi</div>
      <code style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, color: "#374151" }}>npm install leaflet react-leaflet</code>
    </div>
  );

  const { MapContainer, TileLayer, Marker, useMapEvents } = comps;
  const center = lat && lng ? [lat, lng] : [41.2995, 69.2401];

  function ClickHandler() {
    useMapEvents({ click(e) { onSelect(parseFloat(e.latlng.lat.toFixed(6)), parseFloat(e.latlng.lng.toFixed(6))); } });
    return null;
  }

  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1.5px solid #e2e8f0" }}>
      <MapContainer center={center} zoom={lat && lng ? 15 : 13} style={{ height: 260, width: "100%" }} key={`${lat}-${lng}`}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler />
        {lat && lng && <Marker position={[lat, lng]} />}
      </MapContainer>
    </div>
  );
}

function GpsStep({ gps, setGps, onNext, onBack }) {
  const [latStr,  setLatStr]  = useState("");
  const [lngStr,  setLngStr]  = useState("");
  const [radius,  setRadius]  = useState(100);
  const [locLoad, setLocLoad] = useState(false);
  const [err,     setErr]     = useState("");

  useEffect(() => {
    setLatStr(gps.lat != null ? String(gps.lat) : "");
    setLngStr(gps.lng != null ? String(gps.lng) : "");
    setRadius(gps.radius || 100);
  }, [gps.lat, gps.lng, gps.radius]);

  const handleMapSelect = useCallback((lat, lng) => {
    setLatStr(String(lat)); setLngStr(String(lng));
    setGps(p => ({ ...p, lat, lng })); setErr("");
  }, [setGps]);

  const applyManual = () => {
    if (!latStr && !lngStr) return;
    const lat = parseFloat(latStr), lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) { setErr("Koordinatalar raqam bo'lishi kerak!"); return; }
    if (lat < -90 || lat > 90)    { setErr("Latitude -90 dan 90 gacha!"); return; }
    if (lng < -180 || lng > 180)  { setErr("Longitude -180 dan 180 gacha!"); return; }
    setGps(p => ({ ...p, lat, lng })); setErr("");
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) { setErr("Geolokatsiya qo'llab-quvvatlanmaydi!"); return; }
    setLocLoad(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setLatStr(String(lat)); setLngStr(String(lng));
        setGps(p => ({ ...p, lat, lng })); setErr(""); setLocLoad(false);
      },
      () => { setErr("Joylashuv aniqlanmadi."); setLocLoad(false); },
      { timeout: 8000 }
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Joylashuvni yangilang (ixtiyoriy)</span>
        <Button size="small" icon={locLoad ? <LoadingOutlined /> : <AimOutlined />} onClick={getCurrentLocation} loading={locLoad}
          style={{ borderRadius: 8, borderColor: "#6366f1", color: "#6366f1", fontSize: 12, fontWeight: 600 }}>
          Joylashuvimni aniqlash
        </Button>
      </div>
      <MapPicker lat={gps.lat} lng={gps.lng} onSelect={handleMapSelect} />
      {gps.lat && gps.lng ? (
        <div style={{ marginTop: 8, padding: "8px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #86efac", fontSize: 12, color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          <CheckCircleOutlined /> Belgilandi: {gps.lat}, {gps.lng} - Radius: {radius}m
        </div>
      ) : (
        <div style={{ marginTop: 8, padding: "8px 14px", borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>
          Xaritadan tanlang yoki qo'lda kiriting. Bo'sh qolsa GPS o'zgarmaydi.
        </div>
      )}
      <Divider style={{ margin: "16px 0" }}>
        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: 1 }}>YOKI QO'LDA KIRITING</span>
      </Divider>
      <Row gutter={10}>
        <Col span={9}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Latitude</div>
          <Input value={latStr} onChange={e => setLatStr(e.target.value)} onBlur={applyManual} placeholder="41.299496" style={{ borderRadius: 9 }} prefix={<span style={{ fontSize: 11, color: "#94a3b8" }}>LAT</span>} />
        </Col>
        <Col span={9}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Longitude</div>
          <Input value={lngStr} onChange={e => setLngStr(e.target.value)} onBlur={applyManual} placeholder="69.240073" style={{ borderRadius: 9 }} prefix={<span style={{ fontSize: 11, color: "#94a3b8" }}>LNG</span>} />
        </Col>
        <Col span={6}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Radius (m)</div>
          <InputNumber value={radius} onChange={v => { setRadius(v); setGps(p => ({ ...p, radius: v })); }} min={50} max={1000} step={10} style={{ width: "100%", borderRadius: 9 }} />
        </Col>
      </Row>
      {err && <Alert type="error" message={err} showIcon style={{ marginTop: 12, borderRadius: 10 }} closable onClose={() => setErr("")} />}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <Button onClick={onBack} style={{ borderRadius: 10, height: 44, paddingInline: 20 }}>Orqaga</Button>
        <Button type="primary" block size="large" onClick={onNext}
          style={{ borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", height: 44, fontWeight: 700 }}>
          Keyingi - Founder
        </Button>
      </div>
    </div>
  );
}

export default function EditTexnikumModal({ texnikum, open, onClose, onSuccess }) {
  const { message } = App.useApp();
  const [form]     = Form.useForm();
  const [step,     setStep]     = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fullData, setFullData] = useState(null);
  const [gps,      setGps]      = useState({ lat: null, lng: null, radius: 100 });

  useEffect(() => {
    if (!texnikum?.id || !open) return;
    setFetching(true);
    setStep(1);

    saasApi.getTexnikum(texnikum.id)
      .then((data) => {
        console.log("EDIT full data:", JSON.stringify(data, null, 2));
        setFullData(data);

        let firstName = data.founder?.first_name || "";
        let lastName  = data.founder?.last_name  || "";
        if (!firstName && !lastName && data.founder?.name) {
          const parts = data.founder.name.trim().split(" ");
          lastName  = parts[0] || "";
          firstName = parts.slice(1).join(" ") || "";
        }

        form.setFieldsValue({
          name:             data.name    || "",
          address:          data.address || "",
          phone:            data.phone   || "",
          subscription_end: data.subscription_end ? dayjs(data.subscription_end) : null,
          is_active:        data.is_active ?? true,
          last_name:        lastName,
          first_name:       firstName,
          username:         data.founder?.username || "",
          email:            data.founder?.email    || "",
          password:         "",
        });

        setGps({
          lat:    data.latitude   ?? data.lat    ?? null,
          lng:    data.longitude  ?? data.lng    ?? null,
          radius: data.gps_radius ?? data.radius ?? 100,
        });
      })
      .catch(() => {
        const d = texnikum;
        let firstName = d.founder?.first_name || "";
        let lastName  = d.founder?.last_name  || "";
        if (!firstName && !lastName && d.founder?.name) {
          const parts = d.founder.name.trim().split(" ");
          lastName = parts[0] || ""; firstName = parts.slice(1).join(" ") || "";
        }
        form.setFieldsValue({
          name: d.name || "", address: d.address || "", phone: d.phone || "",
          subscription_end: d.subscription_end ? dayjs(d.subscription_end) : null,
          is_active: d.is_active ?? true,
          last_name: lastName, first_name: firstName,
          username: d.founder?.username || "", email: d.founder?.email || "", password: "",
        });
        setGps({ lat: d.latitude ?? null, lng: d.longitude ?? null, radius: d.gps_radius ?? 100 });
      })
      .finally(() => setFetching(false));
  }, [texnikum?.id, open]);

  const handleClose = () => {
    form.resetFields();
    setStep(1);
    setFullData(null);
    setGps({ lat: null, lng: null, radius: 100 });
    onClose();
  };

  const goStep2 = () => {
    form.validateFields(["name", "address", "phone", "subscription_end"])
      .then(() => setStep(2)).catch(() => {});
  };

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      // 1. Texnikum update
      const texPayload = {
        name:             values.name,
        address:          values.address,
        phone:            values.phone,
        subscription_end: values.subscription_end?.format("YYYY-MM-DD"),
        is_active:        values.is_active,
      };
      if (gps.lat != null && gps.lng != null) {
        texPayload.latitude   = gps.lat;
        texPayload.longitude  = gps.lng;
        texPayload.gps_radius = gps.radius;
      }
      await saasApi.updateTexnikum(texnikum.id, texPayload);

      // 2. Founder update - alohida try/catch
      const founderId = fullData?.founder?.id ?? texnikum?.founder?.id ?? null;
      if (founderId) {
        const founderPayload = {};
        if (values.first_name?.trim()) founderPayload.first_name = values.first_name.trim();
        if (values.last_name?.trim())  founderPayload.last_name  = values.last_name.trim();
        if (values.username?.trim())   founderPayload.username   = values.username.trim();
        if (values.email?.trim())      founderPayload.email      = values.email.trim();
        if (values.password && values.password.trim().length >= 8) {
          founderPayload.password = values.password.trim();
        }

        console.log("Founder payload:", JSON.stringify(founderPayload));

        if (Object.keys(founderPayload).length > 0) {
          try {
            await saasApi.updateTexnikumUser(texnikum.id, founderId, founderPayload);
          } catch (fe) {
            const fd = fe.response?.data;
            console.error("Founder update xato:", fd);
            // Texnikum saqlandi, founder xatosini alohida ko'rsatamiz
            message.warning(
              "Texnikum saqlandi, lekin founder yangilanmadi. Xato: " +
              (fd ? JSON.stringify(fd) : "server xatosi")
            );
            handleClose();
            onSuccess();
            return;
          }
        }
      }

      message.success("Texnikum muvaffaqiyatli yangilandi!");
      handleClose();
      onSuccess();
    } catch (e) {
      console.error("UPDATE XATO:", e.response?.status, e.response?.data);
      const errData = e?.response?.data;
      if (errData && typeof errData === "object") {
        const fields = Object.entries(errData).map(([name, msgs]) => ({
          name, errors: Array.isArray(msgs) ? msgs : [String(msgs)],
        }));
        if (fields.length > 0) {
          form.setFields(fields);
          message.error("Ma'lumotlarda xatolik bor!");
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <EditOutlined style={{ color: "#fff", fontSize: 16 }} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#1e1e3a" }}>Texnikumni tahrirlash</div>
            <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 500 }}>{texnikum?.name}</div>
          </div>
        </div>
      }
      open={open} onCancel={handleClose} footer={null} width={620}
      destroyOnHidden={false}
      styles={{ body: { paddingTop: 16, maxHeight: "80vh", overflowY: "auto" } }}
    >
      {fetching ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 12, padding: "60px 0" }}>
          <Spin size="large" />
          <span style={{ fontSize: 13, color: "#94a3b8" }}>Ma'lumotlar yuklanmoqda...</span>
        </div>
      ) : (
        <>
          <StepBar current={step} />
          <Form form={form} layout="vertical" onFinish={handleFinish}>

            {/* STEP 1 - Texnikum */}
            <div style={{ display: step === 1 ? "block" : "none" }}>
              <Form.Item name="name" label="Texnikum nomi" rules={[{ required: true, message: "Texnikum nomi majburiy!" }]}>
                <Input prefix={<BankOutlined style={{ color: "#94a3b8" }} />} placeholder="Toshkent Texnikumi" size="large" style={{ borderRadius: 10 }} />
              </Form.Item>
              <Form.Item name="address" label="Manzil" rules={[{ required: true, message: "Manzil majburiy!" }]}>
                <Input prefix={<EnvironmentOutlined style={{ color: "#94a3b8" }} />} placeholder="Shahar, ko'cha" size="large" style={{ borderRadius: 10 }} />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="phone" label="Telefon" rules={[{ required: true, message: "Telefon majburiy!" }]}>
                    <Input prefix={<PhoneOutlined style={{ color: "#94a3b8" }} />} placeholder="+998901234567" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="subscription_end" label="Obuna tugash sanasi" rules={[{ required: true, message: "Sana majburiy!" }]}>
                    <DatePicker style={{ width: "100%", borderRadius: 10 }} format="DD.MM.YYYY" size="large" placeholder="Sanani tanlang" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="is_active" label="Holati">
                <Select size="large">
                  <Option value={true}>Aktiv</Option>
                  <Option value={false}>To'xtatilgan</Option>
                </Select>
              </Form.Item>
              <Button type="primary" block size="large" onClick={goStep2}
                style={{ borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", height: 46, fontWeight: 700 }}>
                Keyingi - GPS
              </Button>
            </div>

            {/* STEP 2 - GPS */}
            {step === 2 && (
              <GpsStep gps={gps} setGps={setGps} onNext={() => setStep(3)} onBack={() => setStep(1)} />
            )}

            {/* STEP 3 - Founder */}
            <div style={{ display: step === 3 ? "block" : "none" }}>
              {gps.lat && gps.lng ? (
                <div style={{ padding: "9px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #86efac", marginBottom: 16, fontSize: 12, color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircleOutlined /> GPS: {gps.lat}, {gps.lng} - Radius: {gps.radius}m
                </div>
              ) : (
                <div style={{ padding: "9px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 16, fontSize: 12, color: "#64748b" }}>
                  GPS kiritilmagan - joylashuv o'zgarmaydi
                </div>
              )}
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", marginBottom: 16, fontSize: 12, color: "#2563eb" }}>
                Faqat o'zgartirmoqchi bo'lgan maydonlarni to'ldiring. Parol bo'sh qolsa o'zgarmaydi.
              </div>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="last_name" label="Familiya">
                    <Input prefix={<IdcardOutlined style={{ color: "#94a3b8" }} />} placeholder="Familiya" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="first_name" label="Ism">
                    <Input prefix={<UserOutlined style={{ color: "#94a3b8" }} />} placeholder="Ism" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="username" label="Login"
                rules={[{ min: 3, message: "Kamida 3 ta belgi!" }, { pattern: /^[a-zA-Z0-9_]+$/, message: "Faqat lotin, raqam va _!" }]}>
                <Input prefix={<UserOutlined style={{ color: "#94a3b8" }} />} placeholder="founder_login" size="large" style={{ borderRadius: 10 }} autoComplete="off" />
              </Form.Item>
              <Form.Item name="password" label="Yangi parol (ixtiyoriy)"
                rules={[{ validator: (_, v) => !v || v.trim() === "" || v.length >= 8 ? Promise.resolve() : Promise.reject(new Error("Kamida 8 ta belgi!")) }]}>
                <Input.Password prefix={<LockOutlined style={{ color: "#94a3b8" }} />} placeholder="Bo'sh qoldirsangiz o'zgarmaydi"
                  size="large" style={{ borderRadius: 10 }} iconRender={v => v ? <EyeTwoTone /> : <EyeInvisibleOutlined />} autoComplete="new-password" />
              </Form.Item>
              <Form.Item name="email" label="Email (ixtiyoriy)" rules={[{ type: "email", message: "Email formati noto'g'ri!" }]}>
                <Input prefix={<MailOutlined style={{ color: "#94a3b8" }} />} placeholder="founder@example.com" size="large" style={{ borderRadius: 10 }} />
              </Form.Item>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <Button onClick={() => setStep(2)} style={{ borderRadius: 10, height: 46, paddingInline: 20 }}>Orqaga</Button>
                <Button type="primary" htmlType="submit" loading={loading} size="large"
                  style={{ flex: 1, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", height: 46, fontWeight: 700 }}>
                  {loading ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
                </Button>
              </div>
            </div>

          </Form>
        </>
      )}
    </Modal>
  );
}