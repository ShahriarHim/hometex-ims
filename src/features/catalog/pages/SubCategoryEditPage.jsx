import { useParams } from 'react-router-dom';
import CatalogForm from '../components/CatalogForm';
import { useSubCategory, useCreateSubCategory, useUpdateSubCategory, useCategoryOptions } from '../api';

export default function SubCategoryEditPage() {
  const { id } = useParams();

  const config = {
    title:       'Edit Sub Category',
    entityLabel: 'Sub Category',
    backPath:    '/sub-category',
    breadcrumb:  [{ label: 'Home', to: '/' }, { label: 'Catalog' }, { label: 'Sub Categories', to: '/sub-category' }, { label: 'Edit' }],
    photoField:       'photo',
    photoPreviewField: 'photo_preview',
    photoLabel:       'Photo',
    parentField: {
      label:      'Category',
      key:        'category_id',
      useOptions: useCategoryOptions,
    },
    id,
    useItem:   useSubCategory,
    useCreate: useCreateSubCategory,
    useUpdate: useUpdateSubCategory,
  };

  return <CatalogForm config={config} />;
}
