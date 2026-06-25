import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

export const fetchCategories = () =>
  api.get('/get-category-list').then((r) => r.data);

export const fetchSubCategories = (categoryId) =>
  api.get(`/get-sub-category-list/${categoryId}`).then((r) => r.data);

export const fetchChildSubCategories = (subCategoryId) =>
  api.get(`/get-child-sub-category-list/${subCategoryId}`).then((r) => r.data);

export const fetchProductsForBarcode = (params) =>
  api.get('/get-product-list-for-bar-code', { params }).then((r) => r.data.data ?? []);

export const useCategories = () =>
  useQuery({ queryKey: ['barcode', 'categories'], queryFn: fetchCategories, staleTime: 5 * 60 * 1000 });

export const useSubCategories = (categoryId) =>
  useQuery({
    queryKey: ['barcode', 'sub-categories', categoryId],
    queryFn: () => fetchSubCategories(categoryId),
    enabled: Boolean(categoryId),
    staleTime: 5 * 60 * 1000,
  });

export const useChildSubCategories = (subCategoryId) =>
  useQuery({
    queryKey: ['barcode', 'child-sub-categories', subCategoryId],
    queryFn: () => fetchChildSubCategories(subCategoryId),
    enabled: Boolean(subCategoryId),
    staleTime: 5 * 60 * 1000,
  });

export const useBarcodeProducts = (params) =>
  useQuery({
    queryKey: ['barcode', 'products', params],
    queryFn: () => fetchProductsForBarcode(params),
    enabled: false,
  });
