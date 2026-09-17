import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import { Provider } from "react-redux";
import store from "./store";

// ── Auth ──────────────────────────────────────────────
import LoginPage    from "./pages/auth/LoginPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AppLayout    from "./components/common/AppLayout";

// ── SuperAdmin ────────────────────────────────────────
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import Texnikumlar         from "./pages/superadmin/Texnikumlar";
import TexnikumDetail      from "./pages/superadmin/TexnikumDetail";
import SaaS               from "./pages/superadmin/SaaS";
import Users              from "./pages/superadmin/Users";
import Logs               from "./pages/superadmin/Logs";

// ── Director ──────────────────────────────────────────
import DirectorDashboard from "./pages/director/Dashboard";
import Employees         from "./pages/director/Employees";
import Attendance        from "./pages/director/Attendance";
import Payroll           from "./pages/director/Payroll";
import Expenses          from "./pages/director/Expenses";

// ── Founder ───────────────────────────────────────────
import FounderDashboard from "./pages/founder/Dashboard";
import FounderHR       from "./pages/founder/HR";
import FounderFinance  from "./pages/founder/Finance";

// ── CenterAdmin ───────────────────────────────────────
import AdminLayout     from "./pages/admin/AdminLayout";
import AdminDashboard  from "./pages/admin/Dashboard";
import Groups          from "./pages/admin/Groups";
import Students        from "./pages/admin/Students";
import Payments        from "./pages/admin/Payments";
import LiveAttendance  from "./pages/admin/LiveAttendance";

// ── Teacher ────────────────────────────────────────────
import TeacherLayout       from "./pages/teacher/TeacherLayout";
import TeacherDashboard    from "./pages/teacher/Dashboard";
import TeacherMyAttendance from "./pages/teacher/MyAttendance";
import TeacherLessons      from "./pages/teacher/Lessons";
import TeacherGroups       from "./pages/teacher/Groups";

// ── Student (keyinroq to'ldiriladi) ───────────────────
// import StudentDashboard, StudentAttendance, StudentPayments ...

// ── Ant Design global theme ───────────────────────────
const theme = {
  token: {
    colorPrimary: "#6366f1",
    borderRadius: 10,
    fontFamily:   "'Plus Jakarta Sans', sans-serif",
    colorBgBase:  "#ffffff",
  },
};

function Forbidden() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12 }}>
      <div style={{ fontSize: 64 }}>🚫</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#1e1e3a" }}>Ruxsat yo'q</div>
      <div style={{ color: "#94a3b8" }}>Bu sahifaga kirishga sizda ruxsat berilmagan</div>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12 }}>
      <div style={{ fontSize: 64 }}>🔍</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#1e1e3a" }}>404 — Sahifa topilmadi</div>
    </div>
  );
}

const W = ({ children, roles }) => (
  <ProtectedRoute allowedRoles={roles}>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

// CenterAdmin — AdminLayout bilan
const WA = ({ children }) => (
  <ProtectedRoute allowedRoles={["center_admin", "director", "founder", "superadmin"]}>
    <AdminLayout>{children}</AdminLayout>
  </ProtectedRoute>
);

// Teacher — TeacherLayout bilan
const WT = ({ children }) => (
  <ProtectedRoute allowedRoles={["teacher", "director", "founder", "superadmin"]}>
    <TeacherLayout>{children}</TeacherLayout>
  </ProtectedRoute>
);

const SA  = ["superadmin"];
const FO  = ["founder", "superadmin"];
const DI  = ["director", "founder", "superadmin"];
const CA  = ["center_admin", "director", "founder", "superadmin"];
const TE  = ["teacher"];
const ST  = ["student"];

export default function App() {
  return (
    <Provider store={store}>
      <ConfigProvider theme={theme}>
        <AntApp>
          <BrowserRouter>
            <Routes>
              {/* AUTH */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/"      element={<Navigate to="/login" replace />} />
              <Route path="/403"   element={<Forbidden />} />

              {/* SUPERADMIN */}
              <Route path="/superadmin/dashboard"   element={<W roles={SA}><SuperAdminDashboard /></W>} />
              <Route path="/superadmin/texnikumlar" element={<W roles={SA}><Texnikumlar /></W>} />
              <Route path="/superadmin/saas"        element={<W roles={SA}><SaaS /></W>} />
              <Route path="/superadmin/users"       element={<W roles={SA}><Users /></W>} />
              <Route path="/superadmin/logs"                    element={<W roles={SA}><Logs /></W>} />
              <Route path="/superadmin/texnikumlar/:id"        element={<W roles={SA}><TexnikumDetail /></W>} />

              {/* FOUNDER */}
              <Route path="/founder/dashboard"  element={<W roles={FO}><FounderDashboard /></W>} />
              <Route path="/founder/hr"         element={<W roles={FO}><FounderHR /></W>} />
              <Route path="/founder/finance"    element={<W roles={FO}><FounderFinance /></W>} />

              {/* DIRECTOR */}
              <Route path="/director/dashboard"  element={<W roles={DI}><DirectorDashboard /></W>} />
              <Route path="/director/employees"  element={<W roles={DI}><Employees /></W>} />
              <Route path="/director/attendance" element={<W roles={DI}><Attendance /></W>} />
              <Route path="/director/payroll"    element={<W roles={DI}><Payroll /></W>} />
              <Route path="/director/expenses"   element={<W roles={DI}><Expenses /></W>} />

              {/* CENTER ADMIN */}
              <Route path="/admin/dashboard"       element={<WA><AdminDashboard /></WA>} />
              <Route path="/admin/groups"          element={<WA><Groups /></WA>} />
              <Route path="/admin/students"        element={<WA><Students /></WA>} />
              <Route path="/admin/live-attendance" element={<WA><LiveAttendance /></WA>} />
              <Route path="/admin/payments"        element={<WA><Payments /></WA>} />

              {/* TEACHER */}
              <Route path="/teacher/dashboard"    element={<WT><TeacherDashboard /></WT>} />
              <Route path="/teacher/my-attendance" element={<WT><TeacherMyAttendance /></WT>} />
              <Route path="/teacher/lessons"        element={<WT><TeacherLessons /></WT>} />
              <Route path="/teacher/groups"         element={<WT><TeacherGroups /></WT>} />

              {/* STUDENT */}
              {/* <Route path="/student/dashboard"   element={<W roles={ST}><StudentDashboard /></W>} />
              <Route path="/student/attendance"  element={<W roles={ST}><StudentAttendance /></W>} />
              <Route path="/student/payments"    element={<W roles={ST}><StudentPayments /></W>} /> */}

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </Provider>
  );
}