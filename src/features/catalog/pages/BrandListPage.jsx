import CatalogList from '../components/CatalogList';
import { useBrands, useDeleteBrand } from '../api';

const config = {
  title:       'Brands',
  entityLabel: 'Brand',
  createPath:  '/brand/create',
  editPath:    (id) => `/brand/edit/${id}`,
  breadcrumb:  [{ label: 'Home', to: '/' }, { label: 'Catalog' }, { label: 'Brands' }],
  photoLabel:  'Logo',
  photoField:  'logo',
  useList:     useBrands,
  useDelete:   useDeleteBrand,
};

export default function BrandListPage() {
  return <CatalogList config={config} />;
}
