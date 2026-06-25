import { useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1800, showConfirmButton: false });

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put('/me/profile', payload).then((r) => r.data),
    onSuccess: (data) => {
      // Refresh /api/me so Nav + useAuth reflect the updated name/photo instantly
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast(data.status ?? 'success', data.message ?? 'Profile updated!');
    },
    onError: (err) => {
      if (err?.response?.status !== 422) {
        toast('error', 'Failed to update profile.');
      }
    },
  });
}
