import CatalogForm from '../components/CatalogForm';
import { useCreateChildSubCategory, useUpdateChildSubCategory, useChildSubCategory, useSubCategoryOptions } from '../api';

const config = {
  title:       'Add Child Sub Category',
  entityLabel: 'Child Sub Category',
  backPath:    '/child-sub-category',
  breadcrumb:  [{ label: 'Home', to: '/' }, { label: 'Catalog' }, { label: 'Child Sub Categories', to: '/child-sub-category' }, { label: 'Add' }],
  photoField:       'photo',
  photoPreviewField: 'photo_preview',
  photoLabel:       'Photo',
  parentField: {
    label:      'Sub Category',
    key:        'sub_category_id',
    useOptions: useSubCategoryOptions,
  },
  useItem:   useChildSubCategory,
  useCreate: useCreateChildSubCategory,
  useUpdate: useUpdateChildSubCategory,
};

export default function ChildSubCategoryCreatePage() {
  return <CatalogForm config={config} />;
}
