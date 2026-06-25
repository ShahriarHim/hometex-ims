import { useParams } from 'react-router-dom';
import CatalogForm from '../components/CatalogForm';
import { useCategory, useCreateCategory, useUpdateCategory } from '../api';

export default function CategoryEditPage() {
  const { id } = useParams();

  const config = {
    title:       'Edit Category',
    entityLabel: 'Category',
    backPath:    '/category',
    breadcrumb:  [{ label: 'Home', to: '/' }, { label: 'Catalog' }, { label: 'Categories', to: '/category' }, { label: 'Edit' }],
    photoField:       'photo',
    photoPreviewField: 'photo_preview',
    photoLabel:       'Photo',
    id,
    useItem:   useCategory,
    useCreate: useCreateCategory,
    useUpdate: useUpdateCategory,
  };

  return <CatalogForm config={config} />;
}
