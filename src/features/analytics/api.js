import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

const get = (path, params) => api.get(path, { params }).then((r) => r.data);

export const ANALYTICS_KEYS = {
  rankings: (p) => ['analytics', 'rankings', p],
  detail:   (id, p) => ['analytics', 'product', id, p],
};

export function useProductRankings(params) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.rankings(params),
    queryFn:  () => get('/analytics/products', params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useProductAnalytics(id, params) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.detail(id, params),
    queryFn:  () => get(`/analytics/products/${id}`, params),
    enabled:  Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}
