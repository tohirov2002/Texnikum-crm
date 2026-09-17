import api from "./axios";

// ─── XODIM DAVOMATI ───────────────────────────────────────────────────────────
export const attendanceApi = {
  getAll:    (params) => api.get("/api/attendance/", { params }).then((r) => r.data),
  getMy:     (params) => api.get("/api/attendance/my/", { params }).then((r) => r.data),
  checkIn:   (data)   => api.post("/api/attendance/check-in/", data).then((r) => r.data),
  checkOut:  (data)   => api.post("/api/attendance/check-out/", data).then((r) => r.data),
  manual:    (data)   => api.post("/api/attendance/manual/", data).then((r) => r.data),
  update:    (id, d)  => api.put(`/api/attendance/${id}/`, d).then((r) => r.data),
  delete:    (id)     => api.delete(`/api/attendance/${id}/`).then((r) => r.data),
};

// ─── OYLIK MAOSH ──────────────────────────────────────────────────────────────
export const payrollApi = {
  getAll:   (params) => api.get("/api/payroll/", { params }).then((r) => r.data),
  getById:  (id)     => api.get(`/api/payroll/${id}/`).then((r) => r.data),
  approve:  (id, d)  => api.post(`/api/payroll/${id}/approve/`, d).then((r) => r.data),
  reject:   (id, d)  => api.post(`/api/payroll/${id}/reject/`, d).then((r) => r.data),
};

// ─── XARAJATLAR ───────────────────────────────────────────────────────────────
export const expenseApi = {
  getAll:  (params) => api.get("/api/expenses/", { params }).then((r) => r.data),
  getById: (id)     => api.get(`/api/expenses/${id}/`).then((r) => r.data),
  create:  (data)   => api.post("/api/expenses/", data).then((r) => r.data),
  update:  (id, d)  => api.put(`/api/expenses/${id}/`, d).then((r) => r.data),
  delete:  (id)     => api.delete(`/api/expenses/${id}/`).then((r) => r.data),
};

// ─── GURUHLAR ─────────────────────────────────────────────────────────────────
export const groupApi = {
  getAll:  (params) => api.get("/api/groups/", { params }).then((r) => r.data),
  getById: (id)     => api.get(`/api/groups/${id}/`).then((r) => r.data),
  create:  (data)   => api.post("/api/groups/", data).then((r) => r.data),
  update:  (id, d)  => api.put(`/api/groups/${id}/`, d).then((r) => r.data),
  delete:  (id)     => api.delete(`/api/groups/${id}/`).then((r) => r.data),
};

// ─── TALABALAR ────────────────────────────────────────────────────────────────
export const studentApi = {
  getAll:  (params) => api.get("/api/students/", { params }).then((r) => r.data),
  getById: (id)     => api.get(`/api/students/${id}/`).then((r) => r.data),
  getMe:   ()       => api.get("/api/students/me/").then((r) => r.data),
  create:  (data)   => api.post("/api/students/", data).then((r) => r.data),
  update:  (id, d)  => api.put(`/api/students/${id}/`, d).then((r) => r.data),
  delete:  (id)     => api.delete(`/api/students/${id}/`).then((r) => r.data),
};

// ─── TO'LOVLAR ────────────────────────────────────────────────────────────────
export const paymentApi = {
  getAll:  (params) => api.get("/api/payments/", { params }).then((r) => r.data),
  getById: (id)     => api.get(`/api/payments/${id}/`).then((r) => r.data),
  create:  (data)   => api.post("/api/payments/", data).then((r) => r.data),
  delete:  (id)     => api.delete(`/api/payments/${id}/`).then((r) => r.data),
};

// ─── DARSLAR ──────────────────────────────────────────────────────────────────
export const lessonApi = {
  getAll:    (params) => api.get("/api/lessons/", { params }).then((r) => r.data),
  getById:   (id)     => api.get(`/api/lessons/${id}/`).then((r) => r.data),
  create:    (data)   => api.post("/api/lessons/", data).then((r) => r.data),
  update:    (id, d)  => api.put(`/api/lessons/${id}/`, d).then((r) => r.data),
  finish:    (id)     => api.post(`/api/lessons/${id}/finish/`).then((r) => r.data),
  liveBoard: (id)     => api.get(`/api/lessons/${id}/live-board/`).then((r) => r.data),
};

// ─── TALABA DAVOMATI ──────────────────────────────────────────────────────────
export const stdAttendanceApi = {
  getAll:      (params) => api.get("/api/student-attendance/", { params }).then((r) => r.data),
  getMy:       (params) => api.get("/api/student-attendance/my/", { params }).then((r) => r.data),
  checkIn:     (data)   => api.post("/api/student-attendance/check-in/", data).then((r) => r.data),
  checkOut:    (data)   => api.post("/api/student-attendance/check-out/", data).then((r) => r.data),
  bulk:        (data)   => api.post("/api/student-attendance/bulk/", data).then((r) => r.data),
  update:      (id, d)  => api.put(`/api/student-attendance/${id}/`, d).then((r) => r.data),
};

// ─── BILDIRISHNOMALAR ─────────────────────────────────────────────────────────
export const notificationApi = {
  getAll:   (params) => api.get("/api/notifications/", { params }).then((r) => r.data),
  markRead: (id)     => api.put(`/api/notifications/${id}/read/`).then((r) => r.data),
  markAllRead: ()    => api.put("/api/notifications/mark-all-read/").then((r) => r.data),
};

// ─── AUDIT LOGLAR ─────────────────────────────────────────────────────────────
export const logsApi = {
  getAll: (params) => api.get("/api/logs/", { params }).then((r) => r.data),
};