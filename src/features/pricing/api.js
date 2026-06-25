import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

// ── Attributes ───────────────────────────────────────────────────────────────

export const useAttributes = (params) =>
  useQuery({
    queryKey: ['attributes', params],
    queryFn: () =>
      api.get('/attribute', { params }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

export const useCreateAttribute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/attribute', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attributes'] }),
  });
};

export const useUpdateAttribute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/attribute/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attributes'] }),
  });
};

export const useDeleteAttribute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/attribute/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attributes'] }),
  });
};

// ── Attribute Values ─────────────────────────────────────────────────────────

export const useCreateAttributeValue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/attribute-value', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attributes'] }),
  });
};

export const useUpdateAttributeValue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/attribute-value/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attributes'] }),
  });
};

export const useDeleteAttributeValue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/attribute-value/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attributes'] }),
  });
};

// ── Price Formulas ───────────────────────────────────────────────────────────

export const usePriceFormulas = (params) =>
  useQuery({
    queryKey: ['price-formulas', params],
    queryFn: () =>
      api.get('/formula', { params }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

export const usePriceFormula = (id) =>
  useQuery({
    queryKey: ['price-formula', id],
    queryFn: () => api.get(`/formula/${id}`).then((r) => r.data),
    enabled: !!id,
  });

export const useCreatePriceFormula = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/formula', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['price-formulas'] }),
  });
};

export const useUpdatePriceFormula = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/formula/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['price-formulas'] }),
  });
};

export const useDeletePriceFormula = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/formula/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['price-formulas'] }),
  });
};
