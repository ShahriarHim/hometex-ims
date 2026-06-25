import { useParams } from 'react-router-dom';
import CatalogForm from '../components/CatalogForm';
import { useBrand, useCreateBrand, useUpdateBrand } from '../api';

export default function BrandEditPage() {
  const { id } = useParams();

  const config = {
    title:       'Edit Brand',
    entityLabel: 'Brand',
    backPath:    '/brand',
    breadcrumb:  [{ label: 'Home', to: '/' }, { label: 'Catalog' }, { label: 'Brands', to: '/brand' }, { label: 'Edit' }],
    photoField:       'logo',
    photoPreviewField: 'logo_preview',
    photoLabel:       'Logo',
    id,
    useItem:   useBrand,
    useCreate: useCreateBrand,
    useUpdate: useUpdateBrand,
  };

  return <CatalogForm config={config} />;
}
