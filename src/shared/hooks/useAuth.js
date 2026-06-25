import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import { getToken, clearSession } from '../utils/session';

function resolvePhotoUrl(photo) {
  if (!photo) return null;
  if (photo.startsWith('http')) return photo;
  // Fallback for stale sessions that still have a raw R2 key — backend now returns full URL
  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/api\/?$/, '');
  return `${base}/storage/${photo}`;
}

/**
 * Fetches the authenticated user from GET /api/me.
 * Server is the single source of truth — token only lives in sessionStorage.
 *
 * Backend returns:
 * { id, name, first_name, last_name, email, phone, photo,
 *   user_type, employee_type,
 *   roles: string[],        // Spatie role names e.g. ['admin']
 *   permissions: string[],  // all effective permission names e.g. ['products.create']
 *   branch: object | null }
 */
export function useAuth() {
  const hasToken = Boolean(getToken());

  const {
    data: user = null,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/me').then((r) => r.data),
    enabled: hasToken,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  if (isError) {
    clearSession();
  }

  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];

  const hasRole = (role) => roles.includes(role);
  const hasAnyRole = (roleList) => roleList.some((r) => roles.includes(r));
  const hasPermission = (perm) => permissions.includes(perm);
  const hasAnyPermission = (permList) => permList.some((p) => permissions.includes(p));

  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');
  const isProductManager = hasRole('product_manager');
  const isSalesStaff = hasRole('sales_staff');
  const isWarehouse = hasRole('warehouse');
  const isAnyStaff = isAdmin || isManager || isProductManager || isSalesStaff || isWarehouse;

  // branch is the full shop object from /api/me; assignedShopId is null for all-access users
  const assignedShopId = user?.branch?.id ?? null;

  return {
    user,
    photoUrl: resolvePhotoUrl(user?.photo),
    isLoading: hasToken && isLoading,
    isAuthenticated: Boolean(hasToken && user),
    roles,
    permissions,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    isAdmin,
    isManager,
    isProductManager,
    isSalesStaff,
    isWarehouse,
    isAnyStaff,
    assignedShopId,
  };
}
