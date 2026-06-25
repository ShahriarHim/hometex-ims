import CatalogList from '../components/CatalogList';
import { useChildSubCategories, useDeleteChildSubCategory } from '../api';

const config = {
  title:       'Child Sub Categories',
  entityLabel: 'Child Sub Category',
  createPath:  '/child-sub-category/create',
  editPath:    (id) => `/child-sub-category/edit/${id}`,
  breadcrumb:  [{ label: 'Home', to: '/' }, { label: 'Catalog' }, { label: 'Child Sub Categories' }],
  photoLabel:  'Photo',
  photoField:  'photo',
  parentLabel: 'Sub Category',
  parentRender: (row) => row.sub_category_name ?? row.sub_category?.name ?? '—',
  useList:     useChildSubCategories,
  useDelete:   useDeleteChildSubCategory,
};

export default function ChildSubCategoryListPage() {
  return <CatalogList config={config} />;
}
