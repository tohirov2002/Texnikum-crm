import api from './axios';

export const attendanceApi = {
  getMy:    (p) => api.get('/api/attendance/my/',         { params: p }).then(r => r.data),
  getAll:   (p) => api.get('/api/attendance/',            { params: p }).then(r => r.data),
  checkIn:  (d) => api.post('/api/attendance/check-in/',  d).then(r => r.data),
  checkOut: (d) => api.post('/api/attendance/check-out/', d).then(r => r.data),
  manual:   (d) => api.post('/api/attendance/manual/',    d).then(r => r.data),
};

export const groupApi = {
  getAll:  (p) => api.get('/api/groups/',          { params: p }).then(r => r.data),
  getById: (id)=> api.get(`/api/groups/${id}/`).then(r => r.data),
  create:  (d) => api.post('/api/groups/',          d).then(r => r.data),
  update:  (id,d)=> api.put(`/api/groups/${id}/`,   d).then(r => r.data),
  delete:  (id)=> api.delete(`/api/groups/${id}/`).then(r => r.data),
};

export const studentApi = {
  getAll:  (p) => api.get('/api/students/',         { params: p }).then(r => r.data),
  getById: (id)=> api.get(`/api/students/${id}/`).then(r => r.data),
  getMe:   ()  => api.get('/api/students/me/').then(r => r.data),
};

export const lessonApi = {
  getAll:  (p) => api.get('/api/lessons/',          { params: p }).then(r => r.data),
  getById: (id)=> api.get(`/api/lessons/${id}/`).then(r => r.data),
  create:  (d) => api.post('/api/lessons/',          d).then(r => r.data),
  finish:  (id)=> api.post(`/api/lessons/${id}/finish/`).then(r => r.data),
};

export const stdAttendanceApi = {
  getAll: (p) => api.get('/api/student-attendance/',        { params: p }).then(r => r.data),
  getMy:  (p) => api.get('/api/student-attendance/my/',     { params: p }).then(r => r.data),
  checkIn:(d) => api.post('/api/student-attendance/check-in/', d).then(r => r.data),
  checkOut:(d) => api.post('/api/student-attendance/check-out/', d).then(r => r.data),
  bulk:   (d) => api.post('/api/student-attendance/bulk/',  d).then(r => r.data),
};

export const paymentApi = {
  getAll: (p) => api.get('/api/payments/',          { params: p }).then(r => r.data),
  getMy:  (p) => api.get('/api/payments/my/',       { params: p }).then(r => r.data),
  create: (d) => api.post('/api/payments/',          d).then(r => r.data),
};

export const gradeApi = {
  getAll: (p) => api.get('/api/grades/', { params: p }).then(r => r.data),
  getMy:  (p) => api.get('/api/grades/my/', { params: p }).then(r => r.data),
};

export const payrollApi = {
  getMy:  (p) => api.get('/api/payroll/my/',        { params: p }).then(r => r.data),
  getAll: (p) => api.get('/api/payroll/',           { params: p }).then(r => r.data),
};

export const employeeApi = {
  getAll:  (p) => api.get('/api/employees/',        { params: p }).then(r => r.data),
  getMe:   ()  => api.get('/api/employees/me/').then(r => r.data),
  update:  (id,d)=> api.put(`/api/employees/${id}/`, d).then(r => r.data),
};

export const notificationApi = {
  getAll:      (p) => api.get('/api/notifications/',             { params: p }).then(r => r.data),
  markRead:    (id)=> api.put(`/api/notifications/${id}/read/`).then(r => r.data),
  markAllRead: ()  => api.put('/api/notifications/mark-all-read/').then(r => r.data),
};

export const dashboardApi = {
  getFounder:  () => api.get('/api/dashboard/founder/').then(r => r.data),
  getFounderHR: (p) => api.get('/api/dashboard/founder/hr/', { params: p }).then(r => r.data),
  getFounderFin:(p) => api.get('/api/dashboard/founder/finance/', { params: p }).then(r => r.data),
  getDirector: () => api.get('/api/dashboard/director/').then(r => r.data),
  getAdmin:    () => api.get('/api/dashboard/center-admin/').then(r => r.data),
  getTeacher:  () => api.get('/api/dashboard/teacher/').then(r => r.data),
  getStudent:  () => api.get('/api/dashboard/student/').then(r => r.data),
};
