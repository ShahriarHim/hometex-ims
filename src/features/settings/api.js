import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';

const SETTINGS_KEY = ['system-settings'];

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => api.get('/settings').then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings) => api.put('/settings', { settings }).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: SETTINGS_KEY });
      Swal.fire({ icon: data.status ?? 'success', title: data.message ?? 'Settings saved',
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
    },
  });
}
