import { useParams } from 'react-router-dom';
import CatalogForm from '../components/CatalogForm';
import { useChildSubCategory, useCreateChildSubCategory, useUpdateChildSubCategory, useSubCategoryOptions } from '../api';

export default function ChildSubCategoryEditPage() {
  const { id } = useParams();

  const config = {
    title:       'Edit Child Sub Category',
    entityLabel: 'Child Sub Category',
    backPath:    '/child-sub-category',
    breadcrumb:  [{ label: 'Home', to: '/' }, { label: 'Catalog' }, { label: 'Child Sub Categories', to: '/child-sub-category' }, { label: 'Edit' }],
    photoField:       'photo',
    photoPreviewField: 'photo_preview',
    photoLabel:       'Photo',
    parentField: {
      label:      'Sub Category',
      key:        'sub_category_id',
      useOptions: useSubCategoryOptions,
    },
    id,
    useItem:   useChildSubCategory,
    useCreate: useCreateChildSubCategory,
    useUpdate: useUpdateChildSubCategory,
  };

  return <CatalogForm config={config} />;
}
