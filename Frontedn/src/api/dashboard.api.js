import api from "./axios";

const dashboardApi = {
  // ── SUPERADMIN ─────────────────────────────────────────────────────────────
  // GET /api/dashboard/superadmin/
  getSuperAdmin: () =>
    api.get("/api/dashboard/superadmin/").then((r) => r.data),

  // GET /api/dashboard/superadmin/texnikum/:id/
  getSuperAdminTexnikum: (id) =>
    api.get(`/api/dashboard/superadmin/texnikum/${id}/`).then((r) => r.data),

  // ── FOUNDER ────────────────────────────────────────────────────────────────
  // GET /api/dashboard/founder/
  getFounder: () =>
    api.get("/api/dashboard/founder/").then((r) => r.data),

  // GET /api/dashboard/founder/hr/?year=&month=
  getFounderHR: (params) =>
    api.get("/api/dashboard/founder/hr/", { params }).then((r) => r.data),

  // GET /api/dashboard/founder/finance/?year=
  getFounderFinance: (params) =>
    api.get("/api/dashboard/founder/finance/", { params }).then((r) => r.data),

  // ── DIRECTOR ───────────────────────────────────────────────────────────────
  // GET /api/dashboard/director/
  getDirector: () =>
    api.get("/api/dashboard/director/").then((r) => r.data),

  // ── CENTER ADMIN ───────────────────────────────────────────────────────────
  // GET /api/dashboard/center-admin/
  getCenterAdmin: () =>
    api.get("/api/dashboard/center-admin/").then((r) => r.data),

  // ── STUDENT ────────────────────────────────────────────────────────────────
  // GET /api/dashboard/student/
  getStudent: () =>
    api.get("/api/dashboard/student/").then((r) => r.data),
};

export default dashboardApi;