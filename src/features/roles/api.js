import api from '../../api/axiosInstance';

export const rolesApi = {
  list: () => api.get('/roles').then((r) => r.data),
  get: (id) => api.get(`/roles/${id}`).then((r) => r.data),
  create: (data) => api.post('/roles', data).then((r) => r.data),
  update: (id, data) => api.put(`/roles/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/roles/${id}`).then((r) => r.data),
  syncPermissions: (id, permissions) => api.put(`/roles/${id}/permissions`, { permissions }).then((r) => r.data),
  allPermissions: () => api.get('/permissions').then((r) => r.data),
};
