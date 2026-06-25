import { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import { SkeletonTable } from '../../../shared/components/Skeleton';
import { useTableParams } from '../../../shared/hooks/useTableParams';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useAuth } from '../../../shared/hooks/useAuth';
import {
  useCategories, useDeleteCategory,
  useSubCategories, useDeleteSubCategory,
  useChildSubCategories, useDeleteChildSubCategory,
} from '../../catalog/api';

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 2000, showConfirmButton: false });

const TABS = [
  { key: 'root',  label: 'Root',  level: 1 },
  { key: 'sub',   label: 'Sub',   level: 2 },
  { key: 'child', label: 'Child', level: 3 },
];

function MenuTable({ useList, useDelete, level, editBasePath, canManage }) {
  const [searchInput, setSearchInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(searchInput, 400);
  const { params, setPage, setSort } = useTableParams({ orderBy: 'serial', direction: 'asc', perPage: 15 });

  const queryParams = {
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    order_by: params.order_by,
    direction: params.direction,
  };

  const { data, isLoading } = useList(queryParams);
  const deleteMutation = useDelete();

  const items = data?.data ?? [];
  const meta  = data?.meta ?? null;

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: (res) => {
        toast(res?.status ?? 'success', res?.message ?? 'Deleted');
        setDeleteTarget(null);
      },
      onError: (err) => {
        const msg = err?.response?.data?.message ?? 'Cannot delete this menu item.';
        toast('error', msg);
        setDeleteTarget(null);
      },
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.name}</div>
          {row.parent_name && (
            <small className="text-muted">
              <i className="fa-solid fa-turn-up fa-rotate-90 me-1" />
              {row.parent_name}
            </small>
          )}
        </div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (row) => (
        <code className="bg-light px-2 py-1 rounded text-muted" style={{ fontSize: '0.78rem' }}>
          {row.slug}
        </code>
      ),
    },
    {
      key: 'serial',
      label: 'Order',
      sortable: true,
      className: 'text-center',
      render: (row) => <span className="badge bg-light text-dark border">{row.serial}</span>,
    },
    {
      label: 'Status',
      className: 'text-center',
      render: (row) => {
        const active = row.status === 1 || row.status === 'Active';
        return (
          <span className={`badge ${active ? 'bg-success' : 'bg-secondary'}`}>
            {active ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      label: 'Actions',
      className: 'text-center',
      render: (row) => (
        <div className="d-flex gap-1 justify-content-center">
          {canManage && (
            <Link
              to={`${editBasePath}/${row.id}/edit`}
              className="btn btn-sm btn-outline-primary btn-icon"
              title="Edit"
            >
              <i className="fa-solid fa-pen" />
            </Link>
          )}
          {canManage && (
            <button
              className="btn btn-sm btn-outline-danger btn-icon"
              title="Delete"
              onClick={() => setDeleteTarget(row)}
            >
              <i className="fa-solid fa-trash" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <SkeletonTable rows={8} cols={5} />;

  return (
    <>
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <div className="input-group" style={{ maxWidth: 280 }}>
          <span className="input-group-text"><i className="fa-solid fa-magnifying-glass" /></span>
          <input
            type="text"
            className="form-control"
            placeholder="Search…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        {canManage && (
          <Link
            to={`/ecommerce/menu/create?level=${level}`}
            className="btn btn-sm btn-primary"
          >
            <i className="fa-solid fa-plus me-1" />
            Add {TABS[level - 1].label}
          </Link>
        )}
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={false}
        meta={meta}
        onPageChange={setPage}
        orderBy={params.order_by}
        direction={params.direction}
        onSort={setSort}
        emptyText="No menu items found."
      />

      <ConfirmDialog
        show={Boolean(deleteTarget)}
        title="Delete Menu Item?"
        message={`Remove "${deleteTarget?.name}"? This will fail if it has child items.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

export default function EcommerceMenuListPage() {
  const { isAdmin, hasPermission } = useAuth();
  const canManage = isAdmin || hasPermission('catalog.create');

  const [activeTab, setActiveTab] = useState('root');

  return (
    <div>
      <PageHeader
        title="E-commerce Menus"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'E-commerce' }, { label: 'Menus' }]}
        actionLabel={canManage ? 'Add Menu' : undefined}
        actionTo={canManage ? '/ecommerce/menu/create' : undefined}
      />

      <div className="card">
        <div className="card-body">
          <ul className="nav nav-tabs mb-3">
            {TABS.map((t) => (
              <li key={t.key} className="nav-item">
                <button
                  className={`nav-link${activeTab === t.key ? ' active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>

          {activeTab === 'root' && (
            <MenuTable
              useList={useCategories}
              useDelete={useDeleteCategory}
              level={1}
              editBasePath="/ecommerce/menu/root"
              canManage={canManage}
            />
          )}
          {activeTab === 'sub' && (
            <MenuTable
              useList={useSubCategories}
              useDelete={useDeleteSubCategory}
              level={2}
              editBasePath="/ecommerce/menu/sub"
              canManage={canManage}
            />
          )}
          {activeTab === 'child' && (
            <MenuTable
              useList={useChildSubCategories}
              useDelete={useDeleteChildSubCategory}
              level={3}
              editBasePath="/ecommerce/menu/child"
              canManage={canManage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
