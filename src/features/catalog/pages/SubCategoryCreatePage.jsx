import CatalogForm from '../components/CatalogForm';
import { useCreateSubCategory, useUpdateSubCategory, useSubCategory, useCategoryOptions } from '../api';

const config = {
  title:       'Add Sub Category',
  entityLabel: 'Sub Category',
  backPath:    '/sub-category',
  breadcrumb:  [{ label: 'Home', to: '/' }, { label: 'Catalog' }, { label: 'Sub Categories', to: '/sub-category' }, { label: 'Add' }],
  photoField:       'photo',
  photoPreviewField: 'photo_preview',
  photoLabel:       'Photo',
  parentField: {
    label:      'Category',
    key:        'category_id',
    useOptions: useCategoryOptions,
  },
  useItem:   useSubCategory,
  useCreate: useCreateSubCategory,
  useUpdate: useUpdateSubCategory,
};

export default function SubCategoryCreatePage() {
  return <CatalogForm config={config} />;
}
