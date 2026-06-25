import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

const getList = (path, params) => api.get(path, { params }).then((r) => r.data);
const getOne  = (path)         => api.get(path).then((r) => r.data.data);
const post    = (path, body)   => api.post(path, body).then((r) => r.data);
const put     = (path, body)   => api.put(path, body).then((r) => r.data);
const del     = (path)         => api.delete(path).then((r) => r.data);

export const CATALOG_KEYS = {
  brands:             (p)  => ['catalog', 'brand', 'list', p],
  brand:              (id) => ['catalog', 'brand', 'item', id],
  categories:         (p)  => ['catalog', 'category', 'list', p],
  category:           (id) => ['catalog', 'category', 'item', id],
  categoryOptions:    ()   => ['catalog', 'category', 'options'],
  subCategories:      (p)  => ['catalog', 'sub-category', 'list', p],
  subCategory:        (id) => ['catalog', 'sub-category', 'item', id],
  subCategoryOptions: ()   => ['catalog', 'sub-category', 'options'],
  childSubs:          (p)  => ['catalog', 'child-sub-category', 'list', p],
  childSub:           (id) => ['catalog', 'child-sub-category', 'item', id],
};

// ─── Brand ───────────────────────────────────────────────────────────────────

export function useBrands(params) {
  return useQuery({
    queryKey: CATALOG_KEYS.brands(params),
    queryFn:  () => getList('/brand', params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useBrand(id) {
  return useQuery({
    queryKey: CATALOG_KEYS.brand(id),
    queryFn:  () => getOne(`/brand/${id}`),
    enabled:  Boolean(id),
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post('/brand', body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['catalog', 'brand'] }),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => put(`/brand/${id}`, body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['catalog', 'brand'] }),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => del(`/brand/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['catalog', 'brand'] }),
  });
}

// ─── Category ────────────────────────────────────────────────────────────────

export function useCategories(params) {
  return useQuery({
    queryKey: CATALOG_KEYS.categories(params),
    queryFn:  () => getList('/category', params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCategory(id) {
  return useQuery({
    queryKey: CATALOG_KEYS.category(id),
    queryFn:  () => getOne(`/category/${id}`),
    enabled:  Boolean(id),
  });
}

export function useCategoryOptions() {
  return useQuery({
    queryKey: CATALOG_KEYS.categoryOptions(),
    queryFn:  () => getList('/category', { per_page: 1000, order_by: 'name', direction: 'asc' }),
    staleTime: 1000 * 60 * 10,
    select:   (d) => d?.data ?? [],
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post('/category', body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['catalog', 'category'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => put(`/category/${id}`, body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['catalog', 'category'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => del(`/category/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['catalog', 'category'] }),
  });
}

// ─── Sub Category ─────────────────────────────────────────────────────────────

export function useSubCategories(params) {
  return useQuery({
    queryKey: CATALOG_KEYS.subCategories(params),
    queryFn:  () => getList('/sub-category', params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useSubCategory(id) {
  return useQuery({
    queryKey: CATALOG_KEYS.subCategory(id),
    queryFn:  () => getOne(`/sub-category/${id}`),
    enabled:  Boolean(id),
  });
}

export function useSubCategoryOptions() {
  return useQuery({
    queryKey: CATALOG_KEYS.subCategoryOptions(),
    queryFn:  () => getList('/sub-category', { per_page: 1000, order_by: 'name', direction: 'asc' }),
    staleTime: 1000 * 60 * 10,
    select:   (d) => d?.data ?? [],
  });
}

export function useCreateSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post('/sub-category', body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['catalog', 'sub-category'] }),
  });
}

export function useUpdateSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => put(`/sub-category/${id}`, body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['catalog', 'sub-category'] }),
  });
}

export function useDeleteSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => del(`/sub-category/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['catalog', 'sub-category'] }),
  });
}

// ─── Child Sub Category ───────────────────────────────────────────────────────

export function useChildSubCategories(params) {
  return useQuery({
    queryKey: CATALOG_KEYS.childSubs(params),
    queryFn:  () => getList('/child-sub-category', params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useChildSubCategory(id) {
  return useQuery({
    queryKey: CATALOG_KEYS.childSub(id),
    queryFn:  () => getOne(`/child-sub-category/${id}`),
    enabled:  Boolean(id),
  });
}

export function useCreateChildSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post('/child-sub-category', body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['catalog', 'child-sub-category'] }),
  });
}

export function useUpdateChildSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => put(`/child-sub-category/${id}`, body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['catalog', 'child-sub-category'] }),
  });
}

export function useDeleteChildSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => del(`/child-sub-category/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['catalog', 'child-sub-category'] }),
  });
}
