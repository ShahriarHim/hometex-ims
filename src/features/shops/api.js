import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

const get  = (path, params) => api.get(path, { params }).then((r) => r.data);
const post = (path, body)   => api.post(path, body).then((r) => r.data);
const put  = (path, body)   => api.put(path, body).then((r) => r.data);
const del  = (path)         => api.delete(path).then((r) => r.data);

export const SHOP_KEYS = {
  list: (p)  => ['shops', 'list', p],
  item: (id) => ['shops', 'item', id],
};

export function useShops(params) {
  return useQuery({
    queryKey: SHOP_KEYS.list(params),
    queryFn:  () => get('/shop', params),
    staleTime: 1000 * 60,
  });
}

export function useShop(id) {
  return useQuery({
    queryKey: SHOP_KEYS.item(id),
    queryFn:  () => get(`/shop/${id}`),
    enabled:  Boolean(id),
    staleTime: 0,
  });
}

export function useCreateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post('/shop', body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['shops', 'list'] }),
  });
}

export function useUpdateShop(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => put(`/shop/${id}`, body),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['shops', 'list'] });
      qc.invalidateQueries({ queryKey: SHOP_KEYS.item(id) });
    },
  });
}

export function useDeleteShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => del(`/shop/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['shops', 'list'] }),
  });
}
