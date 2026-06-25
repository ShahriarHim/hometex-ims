import api from '../../api/axiosInstance';

export const staffApi = {
  list: (params) => api.get('/staff', { params }).then((r) => r.data),
  get: (id) => api.get(`/staff/${id}`).then((r) => r.data),
  create: (data) => api.post('/staff', data).then((r) => r.data),
  update: (id, data) => api.put(`/staff/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/staff/${id}`).then((r) => r.data),

  getRoles: () => api.get('/roles').then((r) => r.data),
  getShops: () => api.get('/get-shop-list').then((r) => r.data),
};
