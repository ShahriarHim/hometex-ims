import CatalogList from '../components/CatalogList';
import { useSubCategories, useDeleteSubCategory } from '../api';

const config = {
  title:       'Sub Categories',
  entityLabel: 'Sub Category',
  createPath:  '/sub-category/create',
  editPath:    (id) => `/sub-category/edit/${id}`,
  breadcrumb:  [{ label: 'Home', to: '/' }, { label: 'Catalog' }, { label: 'Sub Categories' }],
  photoLabel:  'Photo',
  photoField:  'photo',
  parentLabel: 'Category',
  parentRender: (row) => row.category_name ?? row.category?.name ?? '—',
  useList:     useSubCategories,
  useDelete:   useDeleteSubCategory,
};

export default function SubCategoryListPage() {
  return <CatalogList config={config} />;
}
