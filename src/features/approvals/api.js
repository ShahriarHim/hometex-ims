import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

export const PAYMENT_TERMS_FALLBACK = [
  { value: 'prepaid', label: 'Prepaid' },
  { value: 'net_15',  label: 'Net 15 Days' },
  { value: 'net_30',  label: 'Net 30 Days' },
  { value: 'net_45',  label: 'Net 45 Days' },
  { value: 'net_60',  label: 'Net 60 Days' },
];

export const PAYMENT_TERMS = PAYMENT_TERMS_FALLBACK;

// Response shape: { success, data: { data: [...], current_page, total, per_page, last_page } }
const normalizeList = (res) => ({
  data: res.data.data.data ?? [],
  meta: {
    current_page: res.data.data.current_page,
    total:        res.data.data.total,
    per_page:     res.data.data.per_page,
    last_page:    res.data.data.last_page,
    from:         res.data.data.from,
  },
});

export const fetchCorporates = (params) =>
  api.get('/corporate', { params }).then(normalizeList);

export const approveCorporate = ({ id, ...body }) =>
  api.post(`/corporate/${id}/approve`, body).then((r) => r.data);

export const rejectCorporate = ({ id, rejection_reason }) =>
  api.post(`/corporate/${id}/reject`, { rejection_reason }).then((r) => r.data);

export const suspendCorporate = ({ id, suspension_reason }) =>
  api.post(`/corporate/${id}/suspend`, { suspension_reason }).then((r) => r.data);

export const reactivateCorporate = (id) =>
  api.post(`/corporate/${id}/reactivate`).then((r) => r.data);

export const updateCreditTerms = ({ id, credit_limit, payment_terms }) =>
  api.put(`/corporate/${id}/credit-terms`, { credit_limit, payment_terms }).then((r) => r.data);

// ── Fetch functions ────────────────────────────────────────────────────────

const fetchPaymentTerms = () =>
  api.get('/corporate/payment-terms-options').then((r) => r.data.data);

// ── Hooks ──────────────────────────────────────────────────────────────────

export const usePaymentTerms = () => {
  const { data } = useQuery({
    queryKey: ['corporate', 'payment-terms-options'],
    queryFn:  fetchPaymentTerms,
    staleTime: Infinity,
  });
  return data ?? PAYMENT_TERMS_FALLBACK;
};

export const useCorporates = (params) =>
  useQuery({
    queryKey: ['corporates', params],
    queryFn:  () => fetchCorporates(params),
  });

const invalidateCorporates = (qc) => qc.invalidateQueries({ queryKey: ['corporates'] });

export const useApproveCorporate = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: approveCorporate, onSuccess: () => invalidateCorporates(qc) });
};

export const useRejectCorporate = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: rejectCorporate, onSuccess: () => invalidateCorporates(qc) });
};

export const useSuspendCorporate = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: suspendCorporate, onSuccess: () => invalidateCorporates(qc) });
};

export const useReactivateCorporate = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: reactivateCorporate, onSuccess: () => invalidateCorporates(qc) });
};

export const useUpdateCreditTerms = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: updateCreditTerms, onSuccess: () => invalidateCorporates(qc) });
};
