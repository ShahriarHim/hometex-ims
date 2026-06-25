import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

const get  = (path, params) => api.get(path, { params }).then((r) => r.data);
const post = (path, body)   => api.post(path, body).then((r) => r.data);
const put  = (path)         => api.put(path).then((r) => r.data);

export const INVENTORY_KEYS = {
  transfers: (p)  => ['transfers', 'list', p],
  transfer:  (id) => ['transfers', 'item', id],
  shopList:  ()   => ['shops', 'list'],
};

// ─── Transfers ────────────────────────────────────────────────────────────────

export function useTransfers(params) {
  return useQuery({
    queryKey: INVENTORY_KEYS.transfers(params),
    queryFn:  () => get('/transfers', params),
    staleTime: 1000 * 60,
  });
}

export function useShopListForTransfer() {
  return useQuery({
    queryKey: INVENTORY_KEYS.shopList(),
    queryFn:  () => get('/get-shop-list'),
    select:   (d) => (Array.isArray(d) ? d : d?.data ?? []),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post('/transfers', body),
    onSuccess:  ()     => qc.invalidateQueries({ queryKey: ['transfers', 'list'] }),
  });
}

export function useApproveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => put(`/transfers/${id}/approve`),
    onSuccess:  ()   => qc.invalidateQueries({ queryKey: ['transfers', 'list'] }),
  });
}

export function useRejectTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => put(`/transfers/${id}/reject`),
    onSuccess:  ()   => qc.invalidateQueries({ queryKey: ['transfers', 'list'] }),
  });
}

// ─── Adjustments ─────────────────────────────────────────────────────────────
// BE-005: POST /api/adjustments — manual stock adjustment endpoint (pending backend)

export function useCreateAdjustment() {
  return useMutation({
    mutationFn: (body) => post('/adjustments', body),
  });
}
