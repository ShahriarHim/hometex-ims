import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import PageHeader from '../../../shared/components/PageHeader';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import ProductFormTabs from '../components/ProductFormTabs';
import { useProductFormData, useCreateProduct } from '../api';

const EMPTY_FORM = {
  name: '',
  slug: '',
  sku: '',
  status: 1,
  visibility: 'visible',
  type: 'simple',
  category_id: '',
  sub_category_id: '',
  child_sub_category_id: '',
  brand_id: '',
  country_id: '',
  supplier_id: '',
  short_description: '',
  description: '',
  isFeatured: 0,
  isNew: 0,
  isTrending: 0,
  is_bestseller: 0,
  is_limited_edition: 0,
  is_exclusive: 0,
  is_eco_friendly: 0,
  cost: '',
  price: '',
  discount_percent: '',
  discount_fixed: '',
  discount_start: '',
  discount_end: '',
  shop_quantities: [],
  stock: 0,
  attributes: {},
  specifications: {},
  weight: '',
  weight_unit: 'kg',
  length: '',
  width: '',
  height: '',
  dimension_unit: 'cm',
  shipping_class: '',
  meta_title: '',
  meta_description: '',
  og_image: '',
};

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const pendingPhotosRef = useRef([]);

  const { data: formMeta, isLoading: metaLoading } = useProductFormData();
  const createProduct = useCreateProduct();

  const handleChange = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const payload = { ...formData };
    if (pendingPhotosRef.current.length > 0) payload.photos = pendingPhotosRef.current;
    createProduct.mutate(payload, {
      onSuccess: (data) => navigate(`/product/${data.product_id}`),
      onError: (err) => {
        if (err.response?.status === 422) setErrors(err.response.data.errors ?? {});
      },
    });
  };

  if (metaLoading) return <LoadingSpinner fullPage />;

  return (
    <>
      <PageHeader
        title="Add Product"
        breadcrumb={[
          { label: 'Products', to: '/products' },
          { label: 'Add Product' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <ProductFormTabs
              formData={formData}
              onChange={handleChange}
              formMeta={formMeta ?? {}}
              errors={errors}
              onPendingPhotosChange={(photos) => { pendingPhotosRef.current = photos; }}
            />
          </Card.Body>
        </Card>

        <div className="d-flex gap-2 justify-content-end mb-4">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate('/products')}
            disabled={createProduct.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createProduct.isPending}
          >
            {createProduct.isPending ? 'Saving…' : 'Save Product'}
          </button>
        </div>
      </form>
    </>
  );
}
