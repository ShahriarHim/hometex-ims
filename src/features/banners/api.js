import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';

const KEYS = {
  all:    ['banners'],
  list:   () => ['banners', 'list'],
  config: () => ['banners', 'config'],
};

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1800, showConfirmButton: false });

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useBanners() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: () => api.get('/banners').then((r) => r.data.data ?? []),
  });
}

export function useBannerConfig() {
  return useQuery({
    queryKey: KEYS.config(),
    queryFn: () => api.get('/banner-config').then((r) => r.data.data),
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/banners', payload).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast(data.status ?? 'success', data.message ?? 'Slide created!');
    },
    onError: () => toast('error', 'Failed to create slide.'),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/banners/${id}`, payload).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast(data.status ?? 'success', data.message ?? 'Slide updated!');
    },
    onError: () => toast('error', 'Failed to update slide.'),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/banners/${id}`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast(data.status ?? 'success', data.message ?? 'Slide deleted.');
    },
    onError: () => toast('error', 'Failed to delete slide.'),
  });
}

export function useReorderBanners() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slides) => api.put('/banners/reorder', { slides }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateBannerConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put('/banner-config', payload).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.config() });
      toast(data.status ?? 'success', data.message ?? 'Config saved.');
    },
    onError: () => toast('error', 'Failed to save config.'),
  });
}
