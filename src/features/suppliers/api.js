import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

const get  = (path, params) => api.get(path, { params }).then((r) => r.data);
const post = (path, body)   => api.post(path, body).then((r) => r.data);
const put  = (path, body)   => api.put(path, body).then((r) => r.data);
const del  = (path)         => api.delete(path).then((r) => r.data);

export const SUPPLIER_KEYS = {
  list: (p)  => ['suppliers', 'list', p],
  item: (id) => ['suppliers', 'item', id],
};

export function useSuppliers(params) {
  return useQuery({
    queryKey: SUPPLIER_KEYS.list(params),
    queryFn:  () => get('/supplier', params),
    staleTime: 1000 * 60,
  });
}

export function useSupplier(id) {
  return useQuery({
    queryKey: SUPPLIER_KEYS.item(id),
    queryFn:  () => get(`/supplier/${id}`),
    enabled:  Boolean(id),
    staleTime: 0,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post('/supplier', body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['suppliers', 'list'] }),
  });
}

export function useUpdateSupplier(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => put(`/supplier/${id}`, body),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['suppliers', 'list'] });
      qc.invalidateQueries({ queryKey: SUPPLIER_KEYS.item(id) });
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => del(`/supplier/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['suppliers', 'list'] }),
  });
}
