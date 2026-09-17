import api from "./axios";

const employeeApi = {
  getAll:   (params) => api.get("/api/employees/", { params }).then((r) => r.data),
  getById:  (id)     => api.get(`/api/employees/${id}/`).then((r) => r.data),
  create:   (data)   => api.post("/api/employees/", data).then((r) => r.data),
  update:   (id, d)  => api.put(`/api/employees/${id}/`, d).then((r) => r.data),
  patch:    (id, d)  => api.patch(`/api/employees/${id}/`, d).then((r) => r.data),
  delete:   (id)     => api.delete(`/api/employees/${id}/`).then((r) => r.data),

  // Status (ta'til, kasallik)
  getStatuses:  (params) => api.get("/api/employee-statuses/", { params }).then((r) => r.data),
  createStatus: (data)   => api.post("/api/employee-statuses/", data).then((r) => r.data),
  deleteStatus: (id)     => api.delete(`/api/employee-statuses/${id}/`).then((r) => r.data),
};

export default employeeApi;