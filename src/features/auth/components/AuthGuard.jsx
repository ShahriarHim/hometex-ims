import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';

/**
 * Wraps all protected routes.
 *
 * Flow:
 * 1. No token in sessionStorage → redirect to /login immediately (no spinner)
 * 2. Token exists, /me in-flight → show full-page spinner
 * 3. /me returns user → render protected layout
 * 4. /me returns 401 → axiosInstance interceptor clears session + redirects to /login
 */
export default function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
