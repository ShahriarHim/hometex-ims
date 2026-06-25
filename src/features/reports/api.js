import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

const get = (path, params) => api.get(path, { params }).then((r) => r.data);

export const REPORT_KEYS = {
  summary:         ['reports', 'summary'],
  monthlySales:    ['reports', 'monthly-sales'],
  monthlyPurchase: ['reports', 'monthly-purchase'],
  todayByBranch:   ['reports', 'today-by-branch'],
  shopStock:       ['reports', 'shop-stock'],
  lowStock:        ['reports', 'low-stock'],
  salesTrend:      ['reports', 'sales-trend'],      // BE-007
  orderStatus:     ['reports', 'order-status'],      // BE-006
  topProducts:     ['reports', 'top-products'],      // BE-008
  recentOrders:    ['reports', 'recent-orders'],     // uses existing /orders
};

// ─── Existing endpoints ───────────────────────────────────────────────

export function useReportSummary() {
  return useQuery({
    queryKey: REPORT_KEYS.summary,
    queryFn: () => get('/get-reports'),
    staleTime: 1000 * 60 * 5,
  });
}

export function useMonthlySales(enabled = false) {
  return useQuery({
    queryKey: REPORT_KEYS.monthlySales,
    queryFn: () => get('/get-reports/monthly-sales'),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMonthlyPurchase(enabled = false) {
  return useQuery({
    queryKey: REPORT_KEYS.monthlyPurchase,
    queryFn: () => get('/get-reports/monthly-purchase'),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

// Always-on for dashboard panels (not modal-gated)
export function useTodayByBranch() {
  return useQuery({
    queryKey: REPORT_KEYS.todayByBranch,
    queryFn: () => get('/get-reports/sales-today-by-branch'),
    staleTime: 1000 * 60 * 2,
  });
}

export function useShopStock() {
  return useQuery({
    queryKey: REPORT_KEYS.shopStock,
    queryFn: () => get('/get-reports/shop-stock-summary'),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: REPORT_KEYS.lowStock,
    queryFn: () => get('/get-reports/low-stock-detail'),
    staleTime: 1000 * 60 * 5,
  });
}

// Recent orders — uses existing /orders endpoint (latest 10)
export function useRecentOrders() {
  return useQuery({
    queryKey: REPORT_KEYS.recentOrders,
    queryFn: () => get('/order', { per_page: 10, order_by: 'created_at', direction: 'desc', page: 1 }),
    staleTime: 1000 * 60 * 2,
  });
}

// ─── New endpoints (BE-006 / BE-007 / BE-008) ────────────────────────

export function useSalesTrend(days = 14) {
  return useQuery({
    queryKey: [...REPORT_KEYS.salesTrend, days],
    queryFn: () => get('/dashboard/sales-trend', { days }),
    staleTime: 1000 * 60 * 5,
  });
}

export function useOrderStatus() {
  return useQuery({
    queryKey: REPORT_KEYS.orderStatus,
    queryFn: () => get('/dashboard/order-status'),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTopProducts(days = 30, limit = 10) {
  return useQuery({
    queryKey: [...REPORT_KEYS.topProducts, days, limit],
    queryFn: () => get('/dashboard/top-products', { days, limit }),
    staleTime: 1000 * 60 * 5,
  });
}
