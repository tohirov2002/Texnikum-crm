import api from "./axios";

const saasApi = {
  // ─── TEXNIKUM ────────────────────────────────────────────────────────────

  // GET /api/saas/texnikumlar/
  getTexnikumlar: (params) =>
    api.get("/api/saas/texnikumlar/", { params }).then((r) => {
      console.log("GET RESPONSE:", r.data);
      return r.data;
    }),

  // POST /api/saas/texnikumlar/  — texnikum + founder yaratish
  createTexnikum: (data) =>
    api.post("/api/saas/texnikumlar/", data).then((r) => r.data),

  // GET /api/texnikum/:id/  ← URL o'zgartirildi (saas/texnikumlar/:id/ 404 beradi)
  getTexnikum: (id) =>
    api.get(`/api/texnikum/${id}/`).then((r) => r.data),

  // PUT /api/texnikum/:id/
  updateTexnikum: (id, data) =>
    api.put(`/api/texnikum/${id}/`, data).then((r) => r.data),

  // PUT /api/saas/texnikumlar/:id/subscription/
  updateSubscription: (id, data) =>
    api.put(`/api/saas/texnikumlar/${id}/subscription/`, data).then((r) => r.data),

  // DELETE /api/texnikum/:id/
  deleteTexnikum: (id) =>
    api.delete(`/api/texnikum/${id}/`).then((r) => r.data),

  // ─── TEXNIKUM FOYDALANUVCHILARI ──────────────────────────────────────────

  // GET /api/texnikum/:id/users/
  getTexnikumUsers: (texnikumId) =>
    api.get(`/api/texnikum/${texnikumId}/users/`).then((r) => r.data),

  // POST /api/texnikum/:id/users/create/
  createTexnikumUser: (texnikumId, data) =>
    api.post(`/api/texnikum/${texnikumId}/users/create/`, data).then((r) => r.data),

  // POST /api/texnikum/:id/users/assign/
  assignExistingUser: (texnikumId, data) =>
    api.post(`/api/texnikum/${texnikumId}/users/assign/`, data).then((r) => r.data),

  // PUT /api/texnikum/:id/users/:userId/
  // role: "founder" — backend har doim majburiy talab qiladi
  updateTexnikumUser: (texnikumId, userId, data) =>
    api.put(`/api/texnikum/${texnikumId}/users/${userId}/`, {
      role: "founder",
      ...data,
    }).then((r) => r.data),

  // DELETE /api/texnikum/:id/users/:userId/
  deleteTexnikumUser: (texnikumId, userId) =>
    api.delete(`/api/texnikum/${texnikumId}/users/${userId}/`).then((r) => r.data),

  // GET /api/texnikum/users/unassigned/
  getUnassignedUsers: () =>
    api.get("/api/texnikum/users/unassigned/").then((r) => r.data),
};

export default saasApi;