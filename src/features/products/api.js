/**
 * Products feature — all API calls and React Query hooks.
 * Nothing in this feature imports axios directly; everything goes through api instance.
 *
 * Endpoints (all prefixed by VITE_API_URL):
 *   GET  /products                      → paginated product list
 *   GET  /product/:id                   → single product (full detail)
 *   POST /product                       → create
 *   PUT  /product/:id                   → update
 *   DELETE /product/:id                 → delete (single)
 *   GET  /get-add-product-data          → form dropdown data (categories, brands, shops, etc.)
 *   GET  /get-product-columns           → sortable column options for list
 *   POST /product/:id/photos            → upload product photos
 *   DELETE /product-photo/:photoId      → delete a product photo
 *
 * Duplicate endpoint (/product/duplicate/...) is NOT ported —
 * logged in BACKLOG.md as BE-004 pending a proper REST endpoint.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const PRODUCT_KEYS = {
  all: ['products'],
  list: (params) => ['products', 'list', params],
  detail: (id) => ['products', 'detail', id],
  formData: () => ['products', 'formData'],
  columns: () => ['products', 'columns'],
};

// ─── Fetchers (used inside hooks and also importable for prefetching) ────────

export const fetchProducts = (params) =>
  api
    .get('/products', { params: { paginate: 'yes', ...params } })
    .then((r) => r.data);

/**
 * GET /product/:id returns a deeply nested resource shaped for storefront/detail display
 * ({ success, message, data: { product: {...} } } with category/pricing/shipping/seo/badges
 * as sub-objects, reviews, analytics, etc.) — not the flat shape the create/edit form and
 * detail page work with. Flatten it once here so the rest of the feature can stay simple.
 */
function flattenProduct(resource) {
  if (!resource) return resource;
  const {
    category, sub_category, child_sub_category, brand, supplier,
    // Resource key is "country_of_origin", not "country".
    country_of_origin: country,
    pricing = {}, inventory = {}, shipping = {}, badges = {}, seo = {},
    attributes = [], specifications = [], ...rest
  } = resource;

  const attributesById = {};
  attributes.forEach((a, i) => {
    attributesById[a.id ?? i + 1] = {
      attribute_id: a.attribute_id ?? '',
      value_id: a.value_id ?? '',
      attribute_name: a.attribute_name ?? '',
      attribute_value: a.attribute_value ?? '',
      math_sign: a.math_sign ?? '+',
      number: a.number ?? '',
      attribute_cost: a.attribute_cost ?? '',
      attribute_weight: a.attribute_weight ?? '',
      attribute_mesarment: a.attribute_mesarment ?? '',
    };
  });

  const specificationsById = {};
  specifications.forEach((group, gi) =>
    (group.attributes ?? []).forEach((spec, si) => {
      specificationsById[`${gi}_${si}`] = { name: spec.name ?? '', value: spec.value ?? '' };
    })
  );

  return {
    ...rest,
    status: resource.status === 'active' ? 1 : 0,
    category_id: category?.id ?? '',
    category,
    sub_category_id: sub_category?.id ?? '',
    sub_category,
    child_sub_category_id: child_sub_category?.id ?? '',
    child_sub_category,
    brand_id: brand?.id ?? '',
    brand,
    supplier_id: supplier?.id ?? '',
    supplier,
    country_id: country?.id ?? '',
    country,
    cost: pricing.cost_price ?? 0,
    price: pricing.regular_price ?? 0,
    old_price: pricing.old_price ?? '',
    discount_fixed: pricing.discount?.fixed_amount ?? '',
    discount_percent: pricing.discount?.percent ?? '',
    // <input type="date"> requires YYYY-MM-DD; backend sends full ISO8601 with time/offset.
    discount_start: pricing.discount?.start_date?.slice(0, 10) ?? '',
    discount_end: pricing.discount?.end_date?.slice(0, 10) ?? '',
    stock: inventory.stock_quantity ?? 0,
    shop_quantities: (inventory.stock_by_location ?? []).map((s) => ({
      shop_id: s.shop_id, shop_name: s.shop_name ?? s.name ?? '', quantity: s.quantity ?? 0,
    })),
    weight: shipping.weight ?? '',
    weight_unit: shipping.weight_unit ?? 'kg',
    length: shipping.dimensions?.length ?? '',
    width: shipping.dimensions?.width ?? '',
    height: shipping.dimensions?.height ?? '',
    dimension_unit: shipping.dimensions?.unit ?? 'cm',
    shipping_class: shipping.shipping_class ?? '',
    isFeatured: badges.is_featured ? 1 : 0,
    isNew: badges.is_new ? 1 : 0,
    isTrending: badges.is_trending ? 1 : 0,
    is_bestseller: badges.is_bestseller ? 1 : 0,
    is_limited_edition: badges.is_limited_edition ? 1 : 0,
    is_exclusive: badges.is_exclusive ? 1 : 0,
    is_eco_friendly: badges.is_eco_friendly ? 1 : 0,
    meta_title: seo.meta_title ?? '',
    meta_description: seo.meta_description ?? '',
    og_image: seo.og_image ?? '',
    attributes: attributesById,
    specifications: specificationsById,
    photos: (resource.media?.gallery ?? []).map((p) => ({
      id: p.id, url: p.url ?? p.thumbnail, thumbnail: p.thumbnail,
      alt_text: p.alt_text ?? '', position: p.position ?? 0,
      is_primary: p.is_primary ?? (resource.media?.primary_image?.id === p.id),
    })),
  };
}

export const fetchProduct = (id) =>
  api.get(`/product/${id}`).then((r) => flattenProduct(r.data?.data?.product ?? r.data));

export const fetchProductFormData = () =>
  api.get('/get-add-product-data').then((r) => {
    const d = r.data;
    // Backend returns snake_case / legacy-named keys (sub_categories, child_sub_categories,
    // providers) — normalize to the camelCase shape the form tabs consume.
    return {
      ...d,
      subCategories: d.sub_categories ?? [],
      childSubCategories: d.child_sub_categories ?? [],
      suppliers: d.providers ?? [],
    };
  });

export const fetchProductColumns = () =>
  api.get('/get-product-columns').then((r) => r.data);

// ─── Read hooks ──────────────────────────────────────────────────────────────

export function useProducts(params) {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(params),
    queryFn: () => fetchProducts(params),
    enabled: params !== null,
    placeholderData: (prev) => prev, // keep old data while fetching new page
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(id),
    queryFn: () => fetchProduct(id),
    enabled: Boolean(id),
  });
}

/**
 * Loads all dropdown data needed for the product create/edit form:
 * categories, brands, countries, suppliers, attributes,
 * subCategories, childSubCategories, shops.
 * (Raw API keys are snake_case/legacy-named; fetchProductFormData normalizes them.)
 * Cached for 10 minutes — this rarely changes.
 */
export function useProductFormData() {
  return useQuery({
    queryKey: PRODUCT_KEYS.formData(),
    queryFn: fetchProductFormData,
    staleTime: 1000 * 60 * 10,
  });
}

export function useProductColumns() {
  return useQuery({
    queryKey: PRODUCT_KEYS.columns(),
    queryFn: fetchProductColumns,
    staleTime: 1000 * 60 * 60, // column list rarely changes
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/product', payload).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      Swal.fire({
        icon: data.status ?? 'success',
        title: data.message ?? 'Product created!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      });
    },
    onError: (err) => {
      if (err?.response?.status !== 422) {
        Swal.fire({ icon: 'error', title: 'Failed to create product', toast: true,
          position: 'top-end', showConfirmButton: false, timer: 2000 });
      }
    },
  });
}

export function useUpdateProduct(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put(`/product/${id}`, payload).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      Swal.fire({
        icon: data.status ?? 'success',
        title: data.message ?? 'Product updated!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      });
    },
    onError: (err) => {
      if (err?.response?.status !== 422) {
        Swal.fire({ icon: 'error', title: 'Failed to update product', toast: true,
          position: 'top-end', showConfirmButton: false, timer: 2000 });
      }
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/product/${id}`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      Swal.fire({
        icon: data.status ?? 'success',
        title: data.message ?? 'Deleted',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      });
    },
  });
}

export function useUploadProductPhotos(productId) {
  const qc = useQueryClient();
  return useMutation({
    // payload: [{ photo: base64string, is_primary: 0|1, serial: number }]
    mutationFn: (photos) =>
      api.post(`/product/${productId}/photos`, { photos }).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(productId) });
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      Swal.fire({ icon: data.status ?? 'success', title: data.message ?? 'Photos uploaded',
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
    },
  });
}

export function useSetPrimaryPhoto(productId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId) => api.put(`/photo/${photoId}/primary`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(productId) });
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      Swal.fire({ icon: data.status ?? 'success', title: data.message ?? 'Primary photo set',
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1200 });
    },
  });
}

export function useReorderProductPhotos(productId) {
  const qc = useQueryClient();
  return useMutation({
    // payload: [{ id, position }]
    mutationFn: (photos) =>
      api.put(`/product/${productId}/photos/reorder`, { photos }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(productId) });
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}

export function useDeleteProductPhoto(productId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId) => api.delete(`/photo/${photoId}`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(productId) });
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      Swal.fire({ icon: data.status ?? 'success', title: data.message ?? 'Photo deleted',
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1200 });
    },
  });
}

export const fetchAllProductsForCsv = () =>
  api.get('/product').then((r) => r.data);

export function useAllProductsForCsv() {
  return useQuery({
    queryKey: ['products', 'csv-list'],
    queryFn: fetchAllProductsForCsv,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSaveCsv() {
  return useMutation({
    mutationFn: (selectedIds) => {
      const formData = new FormData();
      formData.append('selectedProductIds', JSON.stringify(selectedIds));
      return api.post('/save-csv', formData).then((r) => r.data);
    },
  });
}
