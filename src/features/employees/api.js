import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

const get  = (path, params) => api.get(path, { params }).then((r) => r.data);
const post = (path, body)   => api.post(path, body).then((r) => r.data);
const put  = (path, body)   => api.put(path, body).then((r) => r.data);
const del  = (path)         => api.delete(path).then((r) => r.data);

export const EMPLOYEE_KEYS = {
  list:  (p)  => ['employees', 'list', p],
  item:  (id) => ['employees', 'item', id],
  shops: ()   => ['employees', 'shops'],
};

export const EMPLOYEE_TYPES = {
  1: 'Manager',
  2: 'General Employee',
  3: 'Product Manager',
  4: 'Sales Only',
};

export function useEmployees(params) {
  return useQuery({
    queryKey: EMPLOYEE_KEYS.list(params),
    queryFn:  () => get('/sales-manager', params),
    staleTime: 1000 * 60,
  });
}

export function useEmployee(id) {
  return useQuery({
    queryKey: EMPLOYEE_KEYS.item(id),
    queryFn:  () => get(`/sales-manager/${id}`),
    enabled:  Boolean(id),
    staleTime: 0,
  });
}

export function useEmployeeShops() {
  return useQuery({
    queryKey: EMPLOYEE_KEYS.shops(),
    queryFn:  () => get('/get-shop-list'),
    select:   (d) => (Array.isArray(d) ? d : d?.data ?? []),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post('/sales-manager', body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['employees', 'list'] }),
  });
}

export function useUpdateEmployee(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => put(`/sales-manager/${id}`, body),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['employees', 'list'] });
      qc.invalidateQueries({ queryKey: EMPLOYEE_KEYS.item(id) });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => del(`/sales-manager/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['employees', 'list'] }),
  });
}
