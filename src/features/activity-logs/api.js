import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

export function useStaffRoles() {
  return useQuery({
    queryKey: ['roles-list-simple'],
    queryFn: () => api.get('/roles').then((r) => {
      const rows = r.data?.data ?? r.data ?? [];
      return rows.filter((ro) => !['customer', 'corporate'].includes(ro.name));
    }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActivityLogs(params) {
  return useQuery({
    queryKey: ['activity-logs', params],
    queryFn: () => api.get('/activity-logs', { params }).then((r) => r.data),
    staleTime: 30 * 1000,
  });
}

export function useActivityLogActions() {
  return useQuery({
    queryKey: ['activity-logs', 'actions'],
    queryFn: () => api.get('/activity-logs/actions').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActivityLogStaff(params) {
  return useQuery({
    queryKey: ['activity-logs', 'staff-list', params],
    queryFn: () => api.get('/activity-logs/staff', { params }).then((r) => r.data),
    staleTime: 30 * 1000,
  });
}

export function useStaffActivity(userId, params) {
  return useQuery({
    queryKey: ['activity-logs', 'staff', userId, params],
    queryFn: () => api.get(`/staff/${userId}/activity`, { params }).then((r) => r.data),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}
