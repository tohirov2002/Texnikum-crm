import api from "./axios";

const usersApi = {
  // GET /api/users/
  getAll: (params) =>
    api.get("/api/users/", { params }).then((r) => r.data),

  // GET /api/users/:id/
  getById: (id) =>
    api.get(`/api/users/${id}/`).then((r) => r.data),

  // POST /api/users/
  create: (data) =>
    api.post("/api/users/", data).then((r) => r.data),

  // PUT /api/users/:id/
  update: (id, data) =>
    api.put(`/api/users/${id}/`, data).then((r) => r.data),

  // PATCH /api/users/:id/
  patch: (id, data) =>
    api.patch(`/api/users/${id}/`, data).then((r) => r.data),

  // DELETE /api/users/:id/
  delete: (id) =>
    api.delete(`/api/users/${id}/`).then((r) => r.data),

  // POST /api/users/:id/toggle-active/
  toggleActive: (id) =>
    api.post(`/api/users/${id}/toggle-active/`).then((r) => r.data),
};

export default usersApi;