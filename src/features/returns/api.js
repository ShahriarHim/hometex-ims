import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

const get  = (path, params) => api.get(path, { params }).then((r) => r.data);
const post = (path, body)   => api.post(path, body).then((r) => r.data);

export const RETURN_KEYS = {
  list:        (p)                    => ['returns', 'list', p],
  search:      (q)                    => ['returns', 'search', q],
  orderDetail: (order_type, order_id) => ['returns', 'detail', order_type, order_id],
};

export function useReturnList(params) {
  return useQuery({
    queryKey: RETURN_KEYS.list(params),
    queryFn:  () => get('/returns', params),
    staleTime: 30 * 1000,
  });
}

export function useReturnSearch(q) {
  return useQuery({
    queryKey: RETURN_KEYS.search(q),
    queryFn:  () => get('/returns/search', /^\d{7,}$/.test(q)
      ? { phone: q }
      : { order_id: q }),
    enabled:   !!q,
    staleTime: 0,
  });
}

export function useReturnOrderDetail(order_type, order_id) {
  return useQuery({
    queryKey: RETURN_KEYS.orderDetail(order_type, order_id),
    queryFn:  () => get('/returns/order-details', { order_type, order_id }),
    enabled:   !!order_type && !!order_id,
    staleTime: 0,
    select:    (d) => d?.data ?? d,
  });
}

export function useSubmitReturn() {
  return useMutation({
    mutationFn: (body) => post('/returns/submit', body),
  });
}
