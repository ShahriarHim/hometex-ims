import CatalogForm from '../components/CatalogForm';
import { useCreateBrand, useUpdateBrand, useBrand } from '../api';

const config = {
  title:       'Add Brand',
  entityLabel: 'Brand',
  backPath:    '/brand',
  breadcrumb:  [{ label: 'Home', to: '/' }, { label: 'Catalog' }, { label: 'Brands', to: '/brand' }, { label: 'Add' }],
  photoField:       'logo',
  photoPreviewField: 'logo_preview',
  photoLabel:       'Logo',
  useItem:   useBrand,
  useCreate: useCreateBrand,
  useUpdate: useUpdateBrand,
};

export default function BrandCreatePage() {
  return <CatalogForm config={config} />;
}
