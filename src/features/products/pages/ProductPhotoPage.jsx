import { useParams, Link } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import PageHeader from '../../../shared/components/PageHeader';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import PhotosTab from '../components/tabs/PhotosTab';
import { useProduct } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

export default function ProductPhotoPage() {
  const { id } = useParams();
  const { isAdmin, hasPermission } = useAuth();
  const canEdit = isAdmin || hasPermission('products.edit');
  const { isLoading, data: product } = useProduct(id);

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!canEdit) return (
    <div className="text-center py-5 text-muted">
      <i className="fa-solid fa-lock fa-2x mb-2 d-block opacity-25" />
      You don't have permission to manage product photos.
    </div>
  );

  return (
    <>
      <PageHeader
        title="Manage Photos"
        breadcrumb={[
          { label: 'Products', to: '/products' },
          { label: product?.name ?? `#${id}`, to: `/product/${id}` },
          { label: 'Photos' },
        ]}
      />

      <Card className="shadow-sm mb-3">
        <Card.Body>
          <PhotosTab productId={id} />
        </Card.Body>
      </Card>

      <Link to={`/product/${id}`} className="btn btn-outline-secondary btn-sm">
        <i className="fa-solid fa-arrow-left me-1" />Back to Product
      </Link>
    </>
  );
}
