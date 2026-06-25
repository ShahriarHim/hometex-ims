import CatalogForm from '../components/CatalogForm';
import { useCreateCategory, useUpdateCategory, useCategory } from '../api';

const config = {
  title:       'Add Category',
  entityLabel: 'Category',
  backPath:    '/category',
  breadcrumb:  [{ label: 'Home', to: '/' }, { label: 'Catalog' }, { label: 'Categories', to: '/category' }, { label: 'Add' }],
  photoField:       'photo',
  photoPreviewField: 'photo_preview',
  photoLabel:       'Photo',
  useItem:   useCategory,
  useCreate: useCreateCategory,
  useUpdate: useUpdateCategory,
};

export default function CategoryCreatePage() {
  return <CatalogForm config={config} />;
}
