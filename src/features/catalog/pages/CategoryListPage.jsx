import CatalogList from '../components/CatalogList';
import { useCategories, useDeleteCategory } from '../api';

const config = {
  title:       'Categories',
  entityLabel: 'Category',
  createPath:  '/category/create',
  editPath:    (id) => `/category/edit/${id}`,
  breadcrumb:  [{ label: 'Home', to: '/' }, { label: 'Catalog' }, { label: 'Categories' }],
  photoLabel:  'Photo',
  photoField:  'photo',
  useList:     useCategories,
  useDelete:   useDeleteCategory,
};

export default function CategoryListPage() {
  return <CatalogList config={config} />;
}
