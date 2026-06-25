import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

const get  = (path, params) => api.get(path, { params }).then((r) => r.data);
const post = (path, body)   => api.post(path, body).then((r) => r.data);
const put  = (path, body)   => api.put(path, body).then((r) => r.data);
const del  = (path)         => api.delete(path).then((r) => r.data);

export const ORDER_KEYS = {
  orders:         (p)  => ['orders', 'list', p],
  order:          (id) => ['orders', 'item', id],
  storeOrders:    (p)  => ['store-orders', 'list', p],
  storeOrder:     (id) => ['store-orders', 'item', id],
  customers:      (p)  => ['customers', 'list', p],
  customerOrders: (id) => ['customers', 'orders', id],
  shopList:       ()   => ['shops', 'list'],
  paymentMethods: () => ['payment-methods'],
  salesManagers:  () => ['sales-managers'],
  shopProducts:   (shopId, p) => ['shop-products', shopId, p],
  addProductData: () => ['add-product-data'],
};

// ─── Regular Orders ───────────────────────────────────────────────────────────

export function useOrders(params) {
  return useQuery({
    queryKey: ORDER_KEYS.orders(params),
    queryFn:  () => get('/order', params),
    staleTime: 1000 * 60,
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: ORDER_KEYS.order(id),
    queryFn:  () => get(`/order/${id}`).then((r) => r.data),
    enabled:  Boolean(id),
    staleTime: 0,
  });
}

export function useUpdateOrderPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paid_amount }) => put(`/order/${id}/payment`, { paid_amount }),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ORDER_KEYS.order(id) }),
  });
}

export function useUpdateOrderAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => put(`/order/${id}/address`, body),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ORDER_KEYS.order(id) }),
  });
}

export function useAddOrderItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, ...body }) => post(`/order/${orderId}/items`, body),
    onSuccess: (_, { orderId }) => qc.invalidateQueries({ queryKey: ORDER_KEYS.order(orderId) }),
  });
}

export function useUpdateOrderItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, detailId, quantity }) =>
      put(`/order/${orderId}/items/${detailId}`, { quantity }),
    onSuccess: (_, { orderId }) => qc.invalidateQueries({ queryKey: ORDER_KEYS.order(orderId) }),
  });
}

export function useRemoveOrderItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, detailId }) => del(`/order/${orderId}/items/${detailId}`),
    onSuccess: (_, { orderId }) => qc.invalidateQueries({ queryKey: ORDER_KEYS.order(orderId) }),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => post(`/order/${id}/cancel`, {}),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: ORDER_KEYS.order(id) }),
  });
}

// ─── Store Orders ─────────────────────────────────────────────────────────────

export function useStoreOrders(params) {
  return useQuery({
    queryKey: ORDER_KEYS.storeOrders(params),
    queryFn:  () => get('/storecustomer', params),
    staleTime: 1000 * 60,
  });
}

export function useStoreOrder(id) {
  return useQuery({
    queryKey: ORDER_KEYS.storeOrder(id),
    queryFn:  () => get(`/storecustomer/${id}`),
    enabled:  Boolean(id),
    staleTime: 0,
  });
}

export function useCreateStoreOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post('/storecustomer', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-orders'] }),
  });
}

export function useCancelStoreOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post('/storecustomer/cancel', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-orders'] }),
  });
}

// ─── Customers ────────────────────────────────────────────────────────────────

export function useCustomers(params) {
  return useQuery({
    queryKey: ORDER_KEYS.customers(params),
    queryFn:  () => get('/customer', params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCustomerOrders(id) {
  return useQuery({
    queryKey: ORDER_KEYS.customerOrders(id),
    queryFn:  () => get(`/customer/${id}/orders`),
    enabled:  Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post('/customer', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

// ─── Reference data (payment methods, shops, sales managers) ─────────────────

export function usePaymentMethods() {
  return useQuery({
    queryKey: ORDER_KEYS.paymentMethods(),
    queryFn:  () => api.get('/get-payment-methods').then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });
}

export function useShopList() {
  return useQuery({
    queryKey: ORDER_KEYS.shopList(),
    queryFn:  () => api.get('/get-shop-list').then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSalesManagers() {
  return useQuery({
    queryKey: ORDER_KEYS.salesManagers(),
    queryFn:  () => get('/sales-manager', { per_page: 100 }).then((d) => d?.data ?? d),
    staleTime: 1000 * 60 * 10,
    select: (d) => (Array.isArray(d) ? d : d?.data ?? []),
  });
}

export function useShopProducts(shopId, params) {
  return useQuery({
    queryKey: ORDER_KEYS.shopProducts(shopId, params),
    queryFn:  () => get(`/shops/${shopId}`, params).then((d) => {
      const payload = d?.data ?? d;
      return Array.isArray(payload?.products) ? payload.products : (Array.isArray(payload) ? payload : []);
    }),
    enabled:  Boolean(shopId),
    staleTime: 1000 * 30,
  });
}

export function useAddProductData() {
  return useQuery({
    queryKey: ORDER_KEYS.addProductData(),
    queryFn:  () => api.get('/get-add-product-data').then((r) => r.data),
    staleTime: 1000 * 60 * 5,
    select: (d) => ({
      categories: Array.isArray(d?.categories) ? d.categories : [],
      subCategories: Array.isArray(d?.sub_categories) ? d.sub_categories : [],
      childSubCategories: Array.isArray(d?.child_sub_categories) ? d.child_sub_categories : [],
    }),
  });
}
