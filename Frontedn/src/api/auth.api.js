import api from "./axios";

const authApi = {
  // POST /api/auth/login/
  login: (credentials) =>
    api.post("/api/auth/login/", credentials).then((r) => r.data),

  // POST /api/auth/logout/
  logout: () =>
    api
      .post("/api/auth/logout/", {
        refresh: localStorage.getItem("refresh_token"),
      })
      .then((r) => r.data),

  // GET /api/auth/me/
  me: () => api.get("/api/auth/me/").then((r) => r.data),

  // POST /api/auth/change-password/
  changePassword: (data) =>
    api.post("/api/auth/change-password/", data).then((r) => r.data),

  // POST /api/auth/token/refresh/
  refreshToken: (refresh) =>
    api
      .post("/api/auth/token/refresh/", { refresh })
      .then((r) => r.data),
};

export default authApi;