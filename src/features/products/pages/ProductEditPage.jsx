import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import PageHeader from '../../../shared/components/PageHeader';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import ProductFormTabs from '../components/ProductFormTabs';
import { useProduct, useProductFormData, useUpdateProduct } from '../api';

function productToForm(product) {
  return {
    name: product.name ?? '',
    slug: product.slug ?? '',
    sku: product.sku ?? '',
    status: product.status ?? 1,
    visibility: product.visibility ?? 'visible',
    type: product.type ?? 'simple',
    category_id: product.category_id ?? '',
    sub_category_id: product.sub_category_id ?? '',
    child_sub_category_id: product.child_sub_category_id ?? '',
    brand_id: product.brand_id ?? '',
    country_id: product.country_id ?? '',
    supplier_id: product.supplier_id ?? '',
    short_description: product.short_description ?? '',
    description: product.description ?? '',
    isFeatured: product.isFeatured ?? 0,
    isNew: product.isNew ?? 0,
    isTrending: product.isTrending ?? 0,
    is_bestseller: product.is_bestseller ?? 0,
    is_limited_edition: product.is_limited_edition ?? 0,
    is_exclusive: product.is_exclusive ?? 0,
    is_eco_friendly: product.is_eco_friendly ?? 0,
    cost: product.cost ?? '',
    price: product.price ?? '',
    discount_percent: product.discount_percent ?? '',
    discount_fixed: product.discount_fixed ?? '',
    discount_start: product.discount_start ?? '',
    discount_end: product.discount_end ?? '',
    shop_quantities: product.shop_quantities ?? [],
    stock: product.stock ?? 0,
    attributes: product.attributes ?? {},
    specifications: product.specifications ?? {},
    weight: product.weight ?? '',
    weight_unit: product.weight_unit ?? 'kg',
    length: product.length ?? '',
    width: product.width ?? '',
    height: product.height ?? '',
    dimension_unit: product.dimension_unit ?? 'cm',
    shipping_class: product.shipping_class ?? '',
    meta_title: product.meta_title ?? '',
    meta_description: product.meta_description ?? '',
    og_image: product.og_image ?? '',
  };
}

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [errors, setErrors] = useState({});

  const { data: product, isLoading: productLoading } = useProduct(id);
  const { data: formMeta, isLoading: metaLoading } = useProductFormData();
  const updateProduct = useUpdateProduct(id);

  useEffect(() => {
    if (product) setFormData(productToForm(product));
  }, [product]);

  const handleChange = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    updateProduct.mutate(formData, {
      onSuccess: () => navigate(`/product/${id}`),
      onError: (err) => {
        if (err.response?.status === 422) setErrors(err.response.data.errors ?? {});
      },
    });
  };

  if (productLoading || metaLoading || !formData) return <LoadingSpinner fullPage />;

  return (
    <>
      <PageHeader
        title="Edit Product"
        breadcrumb={[
          { label: 'Products', to: '/products' },
          { label: product?.name ?? `#${id}`, to: `/product/${id}` },
          { label: 'Edit' },
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
              productId={id}
            />
          </Card.Body>
        </Card>

        <div className="d-flex gap-2 justify-content-end mb-4">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate(`/product/${id}`)}
            disabled={updateProduct.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={updateProduct.isPending}
          >
            {updateProduct.isPending ? 'Saving…' : 'Update Product'}
          </button>
        </div>
      </form>
    </>
  );
}
