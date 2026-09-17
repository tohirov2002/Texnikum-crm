// ─── API BASE CONFIGURATION ───────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── TOKEN HELPERS ────────────────────────────────────────────────────────────
export const getAccessToken  = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");
export const getRole         = () => localStorage.getItem("role");
export const getFullName     = () => localStorage.getItem("full_name");
export const getTexnikumId   = () => localStorage.getItem("texnikum_id");

export const clearAuth = () => {
  ["access_token", "refresh_token", "role", "full_name", "user_id", "texnikum_id"]
    .forEach((k) => localStorage.removeItem(k));
};

// ─── TOKEN REFRESH ────────────────────────────────────────────────────────────
let isRefreshing = false;

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearAuth();
    window.location.href = "/login";
    return null;
  }
  const res  = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    clearAuth();
    window.location.href = "/login";
    return null;
  }
  const data = await res.json();
  localStorage.setItem("access_token", data.access);
  return data.access;
}

// ─── ASOSIY FETCH ─────────────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = getAccessToken();

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config = {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  };

  // FormData bo'lsa Content-Type ni o'chirish (browser o'zi qo'yadi)
  if (options.body instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  let res = await fetch(`${BASE_URL}${endpoint}`, config);

  // Token muddati o'tsa — refresh qilib qayta so'rov
  if (res.status === 401 && !isRefreshing) {
    isRefreshing = true;
    const newToken = await refreshAccessToken();
    isRefreshing = false;
    if (newToken) {
      config.headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${endpoint}`, config);
    }
  }

  return res;
}

// ─── JAVOBNI PARSE QILISH ─────────────────────────────────────────────────────
async function parseResponse(res) {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (!res.ok) throw json;
    return json;
  } catch (e) {
    if (!res.ok) throw { error: text || `HTTP ${res.status}` };
    return text;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════════════════════
export const authApi = {
  login: (data) =>
    apiFetch("/api/auth/login/", { method: "POST", body: JSON.stringify(data) })
      .then(parseResponse),

  logout: () =>
    apiFetch("/api/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh: getRefreshToken() }),
    }).then(parseResponse),

  me: () => apiFetch("/api/auth/me/").then(parseResponse),

  changePassword: (data) =>
    apiFetch("/api/auth/change-password/", {
      method: "POST",
      body: JSON.stringify(data),
    }).then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  FOYDALANUVCHILAR
// ═══════════════════════════════════════════════════════════════════════════════
export const usersApi = {
  list:   (params = {}) =>
    apiFetch(`/api/users/?${new URLSearchParams(params)}`).then(parseResponse),

  create: (data) =>
    apiFetch("/api/users/", { method: "POST", body: JSON.stringify(data) })
      .then(parseResponse),

  detail: (id) => apiFetch(`/api/users/${id}/`).then(parseResponse),

  update: (id, data) =>
    apiFetch(`/api/users/${id}/`, { method: "PUT", body: JSON.stringify(data) })
      .then(parseResponse),

  delete: (id) =>
    apiFetch(`/api/users/${id}/`, { method: "DELETE" }).then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TEXNIKUM
// ═══════════════════════════════════════════════════════════════════════════════
export const texnikumApi = {
  list:   () => apiFetch("/api/texnikum/").then(parseResponse),
  create: (data) =>
    apiFetch("/api/texnikum/", { method: "POST", body: JSON.stringify(data) })
      .then(parseResponse),
  detail: (id) => apiFetch(`/api/texnikum/${id}/`).then(parseResponse),
  update: (id, data) =>
    apiFetch(`/api/texnikum/${id}/`, { method: "PUT", body: JSON.stringify(data) })
      .then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  XODIMLAR
// ═══════════════════════════════════════════════════════════════════════════════
export const employeeApi = {
  list:   (params = {}) =>
    apiFetch(`/api/employees/?${new URLSearchParams(params)}`).then(parseResponse),

  create: (formData) =>
    apiFetch("/api/employees/", { method: "POST", body: formData })
      .then(parseResponse),

  detail: (id) => apiFetch(`/api/employees/${id}/`).then(parseResponse),

  update: (id, data) =>
    apiFetch(`/api/employees/${id}/`, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }).then(parseResponse),

  delete: (id) =>
    apiFetch(`/api/employees/${id}/`, { method: "DELETE" }).then(parseResponse),

  // Status (ta'til, kasallik)
  setStatus: (data) =>
    apiFetch("/api/employee-statuses/", { method: "POST", body: JSON.stringify(data) })
      .then(parseResponse),

  statuses: (employeeId) =>
    apiFetch(`/api/employee-statuses/?employee=${employeeId}`).then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  XODIM DAVOMATI
// ═══════════════════════════════════════════════════════════════════════════════
export const empAttendanceApi = {
  checkIn: (coords) =>
    apiFetch("/api/attendance/check-in/", {
      method: "POST",
      body: JSON.stringify(coords),
    }).then(parseResponse),

  checkOut: (coords) =>
    apiFetch("/api/attendance/check-out/", {
      method: "POST",
      body: JSON.stringify(coords),
    }).then(parseResponse),

  manual: (data) =>
    apiFetch("/api/attendance/manual/", {
      method: "POST",
      body: JSON.stringify(data),
    }).then(parseResponse),

  list: (params = {}) =>
    apiFetch(`/api/attendance/?${new URLSearchParams(params)}`).then(parseResponse),

  my: (params = {}) =>
    apiFetch(`/api/attendance/my/?${new URLSearchParams(params)}`).then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  OYLIK (PAYROLL)
// ═══════════════════════════════════════════════════════════════════════════════
export const payrollApi = {
  list: (params = {}) =>
    apiFetch(`/api/payroll/?${new URLSearchParams(params)}`).then(parseResponse),

  approve: (id, note = "") =>
    apiFetch(`/api/payroll/${id}/approve/`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }).then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  XARAJATLAR
// ═══════════════════════════════════════════════════════════════════════════════
export const expenseApi = {
  list: (params = {}) =>
    apiFetch(`/api/expenses/?${new URLSearchParams(params)}`).then(parseResponse),

  create: (formData) =>
    apiFetch("/api/expenses/", {
      method: "POST",
      body: formData instanceof FormData ? formData : JSON.stringify(formData),
    }).then(parseResponse),

  update: (id, data) =>
    apiFetch(`/api/expenses/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }).then(parseResponse),

  delete: (id) =>
    apiFetch(`/api/expenses/${id}/`, { method: "DELETE" }).then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  GURUHLAR
// ═══════════════════════════════════════════════════════════════════════════════
export const groupApi = {
  list:   (params = {}) =>
    apiFetch(`/api/groups/?${new URLSearchParams(params)}`).then(parseResponse),

  create: (data) =>
    apiFetch("/api/groups/", { method: "POST", body: JSON.stringify(data) })
      .then(parseResponse),

  detail: (id) => apiFetch(`/api/groups/${id}/`).then(parseResponse),

  update: (id, data) =>
    apiFetch(`/api/groups/${id}/`, { method: "PUT", body: JSON.stringify(data) })
      .then(parseResponse),

  delete: (id) =>
    apiFetch(`/api/groups/${id}/`, { method: "DELETE" }).then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TALABALAR
// ═══════════════════════════════════════════════════════════════════════════════
export const studentApi = {
  list:   (params = {}) =>
    apiFetch(`/api/students/?${new URLSearchParams(params)}`).then(parseResponse),

  create: (formData) =>
    apiFetch("/api/students/", {
      method: "POST",
      body: formData instanceof FormData ? formData : JSON.stringify(formData),
    }).then(parseResponse),

  detail: (id) => apiFetch(`/api/students/${id}/`).then(parseResponse),

  update: (id, data) =>
    apiFetch(`/api/students/${id}/`, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }).then(parseResponse),

  me: () => apiFetch("/api/students/me/").then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TO'LOVLAR
// ═══════════════════════════════════════════════════════════════════════════════
export const paymentApi = {
  list: (params = {}) =>
    apiFetch(`/api/payments/?${new URLSearchParams(params)}`).then(parseResponse),

  create: (data) =>
    apiFetch("/api/payments/", { method: "POST", body: JSON.stringify(data) })
      .then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  DARSLAR
// ═══════════════════════════════════════════════════════════════════════════════
export const lessonApi = {
  list:   (params = {}) =>
    apiFetch(`/api/lessons/?${new URLSearchParams(params)}`).then(parseResponse),

  create: (data) =>
    apiFetch("/api/lessons/", { method: "POST", body: JSON.stringify(data) })
      .then(parseResponse),

  detail: (id) => apiFetch(`/api/lessons/${id}/`).then(parseResponse),

  update: (id, data) =>
    apiFetch(`/api/lessons/${id}/`, { method: "PUT", body: JSON.stringify(data) })
      .then(parseResponse),

  liveBoard: (lessonId) =>
    apiFetch(`/api/lessons/${lessonId}/live-board/`).then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TALABA DAVOMATI
// ═══════════════════════════════════════════════════════════════════════════════
export const stdAttendanceApi = {
  checkIn: (data) =>
    apiFetch("/api/student-attendance/check-in/", {
      method: "POST",
      body: JSON.stringify(data),
    }).then(parseResponse),

  checkOut: (data) =>
    apiFetch("/api/student-attendance/check-out/", {
      method: "POST",
      body: JSON.stringify(data),
    }).then(parseResponse),

  bulk: (data) =>
    apiFetch("/api/student-attendance/bulk/", {
      method: "POST",
      body: JSON.stringify(data),
    }).then(parseResponse),

  markLeftEarly: (data) =>
    apiFetch("/api/student-attendance/left-early/", {
      method: "POST",
      body: JSON.stringify(data),
    }).then(parseResponse),

  list: (params = {}) =>
    apiFetch(`/api/student-attendance/?${new URLSearchParams(params)}`).then(parseResponse),

  my: (params = {}) =>
    apiFetch(`/api/student-attendance/my/?${new URLSearchParams(params)}`).then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  BILDIRISHNOMALAR
// ═══════════════════════════════════════════════════════════════════════════════
export const notificationApi = {
  list: (params = {}) =>
    apiFetch(`/api/notifications/?${new URLSearchParams(params)}`).then(parseResponse),

  create: (data) =>
    apiFetch("/api/notifications/", { method: "POST", body: JSON.stringify(data) })
      .then(parseResponse),

  markRead: (id) =>
    apiFetch(`/api/notifications/${id}/read/`, { method: "PUT" }).then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export const dashboardApi = {
  superAdmin: () =>
    apiFetch("/api/dashboard/superadmin/").then(parseResponse),

  superAdminTexnikum: (id) =>
    apiFetch(`/api/dashboard/superadmin/texnikum/${id}/`).then(parseResponse),

  founder: () =>
    apiFetch("/api/dashboard/founder/").then(parseResponse),

  founderHR: (params = {}) =>
    apiFetch(`/api/dashboard/founder/hr/?${new URLSearchParams(params)}`).then(parseResponse),

  founderFinance: (params = {}) =>
    apiFetch(`/api/dashboard/founder/finance/?${new URLSearchParams(params)}`).then(parseResponse),

  director: () =>
    apiFetch("/api/dashboard/director/").then(parseResponse),

  centerAdmin: () =>
    apiFetch("/api/dashboard/center-admin/").then(parseResponse),

  student: () =>
    apiFetch("/api/dashboard/student/").then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  SaaS
// ═══════════════════════════════════════════════════════════════════════════════
export const saasApi = {
  texnikumlar: () =>
    apiFetch("/api/saas/texnikumlar/").then(parseResponse),

  createTexnikum: (data) =>
    apiFetch("/api/saas/texnikumlar/", { method: "POST", body: JSON.stringify(data) })
      .then(parseResponse),

  updateSubscription: (id, data) =>
    apiFetch(`/api/saas/texnikumlar/${id}/subscription/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }).then(parseResponse),
};

// ═══════════════════════════════════════════════════════════════════════════════
//  LOGS
// ═══════════════════════════════════════════════════════════════════════════════
export const logsApi = {
  list: (params = {}) =>
    apiFetch(`/api/logs/?${new URLSearchParams(params)}`).then(parseResponse),
};