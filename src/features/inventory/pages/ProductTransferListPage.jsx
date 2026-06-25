import { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import { SkeletonTable } from '../../../shared/components/Skeleton';
import { useTableParams } from '../../../shared/hooks/useTableParams';
import { useTransfers, useApproveTransfer, useRejectTransfer } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

const STATUS_CLS = {
  pending:  'bg-warning text-dark',
  approved: 'bg-success',
  rejected: 'bg-danger',
};

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1400, showConfirmButton: false });

export default function ProductTransferListPage() {
  const { hasPermission, isAdmin } = useAuth();
  const canApprove = isAdmin || hasPermission('inventory.transfer.approve');
  const canCreate  = isAdmin || hasPermission('inventory.transfer.create');

  const [statusFilter, setStatusFilter]   = useState('');
  const [confirmItem, setConfirmItem]     = useState(null); // { id, action: 'approve'|'reject' }

  const { params, setPage, setPerPage } = useTableParams({ orderBy: 'id', direction: 'desc', perPage: 15 });

  const queryParams = { ...params, status: statusFilter || undefined };
  const { data, isLoading } = useTransfers(queryParams);

  const { mutate: approve, isPending: approving } = useApproveTransfer();
  const { mutate: reject,  isPending: rejecting  } = useRejectTransfer();

  const rows = data?.data ?? (Array.isArray(data) ? data : []);
  const meta = data?.meta ?? null;

  const handleConfirm = () => {
    if (!confirmItem) return;
    const fn = confirmItem.action === 'approve' ? approve : reject;
    fn(confirmItem.id, {
      onSuccess: (res) => {
        toast(res?.status ?? 'success', res?.message ?? `Transfer ${confirmItem.action}d`);
        setConfirmItem(null);
      },
      onError: () => {
        toast('error', `Failed to ${confirmItem.action} transfer`);
        setConfirmItem(null);
      },
    });
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (row) => <span className="text-muted small">#{row.id}</span>,
    },
    {
      label: 'Product',
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.product?.name ?? `#${row.product_id}`}</div>
          {row.attribute && (
            <small className="text-muted">
              {row.attribute.attributes?.name} — {row.attribute.attribute_value?.name}
            </small>
          )}
        </div>
      ),
    },
    { label: 'From Shop', render: (row) => row.from_shop?.name ?? '—' },
    { label: 'To Shop',   render: (row) => row.to_shop?.name   ?? '—' },
    {
      key: 'quantity',
      label: 'Qty',
      className: 'text-center',
      render: (row) => <span className="badge bg-secondary">{row.quantity}</span>,
    },
    {
      label: 'Status',
      render: (row) => (
        <span className={`badge ${STATUS_CLS[row.status] ?? 'bg-secondary'}`}>
          {row.status}
        </span>
      ),
    },
    {
      label: 'Actions',
      className: 'text-center',
      render: (row) =>
        row.status === 'pending' ? (
          <div className="d-flex gap-1 justify-content-center">
            {canApprove && (
              <>
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => setConfirmItem({ id: row.id, action: 'approve' })}
                >
                  Approve
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => setConfirmItem({ id: row.id, action: 'reject' })}
                >
                  Reject
                </button>
              </>
            )}
            {!canApprove && <span className="text-muted small">View only</span>}
          </div>
        ) : (
          <span className="text-muted small">—</span>
        ),
    },
  ];

  if (isLoading) return <SkeletonTable rows={10} cols={7} />;

  return (
    <div>
      <PageHeader
        title="Product Transfers"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Transfers' }]}
        actionLabel="Products"
        actionTo="/products"
        actionIcon="fa-boxes-stacked"
      />

      <div className="card">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
            <div className="d-flex gap-2 align-items-center">
              <label className="text-muted small mb-0">Status</label>
              <select
                className="form-select form-select-sm"
                style={{ width: 140 }}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); }}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="d-flex align-items-center gap-2">
              <label className="text-muted small mb-0">Show</label>
              <select
                className="form-select form-select-sm"
                style={{ width: 70 }}
                value={params.per_page}
                onChange={(e) => setPerPage(Number(e.target.value))}
              >
                {[10, 15, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            meta={meta}
            onPageChange={setPage}
            emptyText="No transfers found."
          />
        </div>
      </div>

      <ConfirmDialog
        show={Boolean(confirmItem)}
        title={confirmItem?.action === 'approve' ? 'Approve Transfer?' : 'Reject Transfer?'}
        message={
          confirmItem?.action === 'approve'
            ? 'This will move stock from the source shop to the destination shop.'
            : 'This transfer will be marked as rejected and no stock will move.'
        }
        confirmLabel={confirmItem?.action === 'approve' ? 'Approve' : 'Reject'}
        variant={confirmItem?.action === 'approve' ? 'success' : 'danger'}
        isLoading={approving || rejecting}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmItem(null)}
      />
    </div>
  );
}
