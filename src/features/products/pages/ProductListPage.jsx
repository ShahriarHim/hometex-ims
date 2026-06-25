import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useTableParams } from '../../../shared/hooks/useTableParams';
import { useProducts, useDeleteProduct, PRODUCT_KEYS } from '../api';
import { useShopListForTransfer } from '../../inventory/api';
import { useCategoryOptions, useBrands } from '../../catalog/api';
import { formatDate } from '../../../shared/utils/formatters';
import { useAuth } from '../../../shared/hooks/useAuth';

export default function ProductListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission, isAdmin } = useAuth();
  const canCreate   = isAdmin || hasPermission('products.create');
  const canEdit     = isAdmin || hasPermission('products.edit');
  const canDelete   = isAdmin || hasPermission('products.delete');
  const canTransfer = isAdmin || hasPermission('inventory.transfer.create');
  const canBarcode  = isAdmin || hasPermission('barcode.generate');
  const canImport   = isAdmin || hasPermission('products.import');
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchInput, setSearchInput]   = useState('');
  const [shopFilter, setShopFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter]   = useState('');
  const [stockFilter, setStockFilter]   = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  const { params, setPage, setSort, setPerPage } = useTableParams({
    orderBy: 'id',
    direction: 'desc',
    perPage: 10,
  });

  const { data: shopList = [] }          = useShopListForTransfer();
  const { data: categoryOptions = [] }   = useCategoryOptions();
  const { data: brandRes }               = useBrands({ per_page: 1000, order_by: 'name', direction: 'asc' });

  const brandOptions = brandRes?.data ?? [];

  const filters = {
    search:       debouncedSearch || undefined,
    shop_id:      shopFilter      || undefined,
    status:       statusFilter    !== '' ? statusFilter : undefined,
    category_id:  categoryFilter  || undefined,
    brand_id:     brandFilter     || undefined,
    stock_status: stockFilter     || undefined,
  };

  const { data, isLoading } = useProducts({ ...params, ...filters });

  const resetFilters = () => {
    setSearchInput(''); setShopFilter(''); setStatusFilter('');
    setCategoryFilter(''); setBrandFilter(''); setStockFilter('');
    setPage(1);
  };

  const hasActiveFilters = shopFilter || statusFilter || categoryFilter || brandFilter || stockFilter || searchInput;
  const deleteMutation = useDeleteProduct();

  const products = data?.data?.products ?? [];
  const pagination = data?.data?.pagination ?? null;
  const meta = pagination
    ? { total: pagination.total, per_page: pagination.per_page, current_page: pagination.current_page, from: pagination.from, last_page: pagination.last_page }
    : null;

  // ─── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSelectAll = (e) =>
    setSelectedIds(e.target.checked ? products.map((p) => p.id) : []);

  const handleBulkDelete = () => {
    if (!selectedIds.length) return;
    Swal.fire({
      title: 'Delete selected products?',
      text: `${selectedIds.length} product(s) will be permanently deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Delete',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      await Promise.allSettled(selectedIds.map((id) => deleteMutation.mutateAsync(id)));
      setSelectedIds([]);
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Delete this product?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) deleteMutation.mutate(id);
    });
  };

  // ─── Columns ─────────────────────────────────────────────────────────────────

  const columns = [
    {
      label: (
        <input
          type="checkbox"
          checked={products.length > 0 && selectedIds.length === products.length}
          onChange={toggleSelectAll}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleSelect(row.id)}
        />
      ),
      className: 'text-center',
    },
    {
      key: 'name',
      label: 'Name / Slug',
      sortable: true,
      render: (row) => (
        <>
          <p className="text-theme mb-0 fw-semibold">{row.name}</p>
          <small className="text-success">{row.slug}</small>
          {row.attributes?.length > 0 && (
            <div className="mt-1">
              {row.attributes.map((attr, i) => (
                <small key={i} className="text-muted d-block">
                  {attr.name}: {attr.value}
                </small>
              ))}
            </div>
          )}
        </>
      ),
    },
    {
      label: 'Price / Cost',
      render: (row) => (
        <>
          <p className="text-theme mb-0">
            <strong>
              Sale: {row.sell_price?.price} {row.sell_price?.symbol}
            </strong>
          </p>
          <small className="text-muted">Price: {row.price}</small>
          <br />
          <small className="text-success">
            Disc: {row.discount_percent}% + {row.discount_fixed}
          </small>
          <br />
          <small className="text-theme">Cost: {row.cost}</small>
        </>
      ),
    },
    {
      label: 'Status / SKU',
      render: (row) => {
        const shopMatch  = shopFilter
          ? row.shops?.find((s) => String(s.shop_id) === String(shopFilter))
          : null;
        const displayQty = shopFilter ? (shopMatch?.shop_quantity ?? 0) : row.stock;
        const stockColor = displayQty <= 0 ? 'text-danger' : displayQty <= 10 ? 'text-warning' : 'text-theme';
        return (
          <>
            <span className={`badge mb-1 ${row.status === 'active' || row.status === 1 ? 'bg-success' : 'bg-secondary'}`}>
              {row.status}
            </span>
            <br />
            <small className="text-muted">SKU: {row.sku}</small>
            <br />
            <small className={stockColor}>
              Stock: <strong>{displayQty}</strong>
              {displayQty <= 0 && <span className="ms-1">(out)</span>}
              {displayQty > 0 && displayQty <= 10 && <span className="ms-1">(low)</span>}
              {shopFilter && displayQty > 0 && <span className="text-muted ms-1">(this shop)</span>}
            </small>
          </>
        );
      },
    },
    {
      label: 'Category / Brand',
      render: (row) => (
        <>
          <small className="text-theme d-block">Cat: {row.category?.name}</small>
          <small className="text-success d-block">Sub: {row.sub_category?.name}</small>
          <small className="text-theme d-block">Brand: {row.brand?.name}</small>
          <small className="text-muted d-block">Supplier: {row.supplier?.name}</small>
        </>
      ),
    },
    {
      label: 'Photo',
      render: (row) =>
        row.primary_photo ? (
          <img
            src={row.primary_photo}
            alt={row.name}
            className="img-thumbnail table-image"
            style={{ maxWidth: 60, maxHeight: 60, objectFit: 'cover' }}
          />
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'created_at',
      label: 'Dates',
      sortable: true,
      render: (row) => (
        <>
          <small className="text-theme d-block">Created: {formatDate(row.created_at)}</small>
          <small className="text-success d-block">Updated: {formatDate(row.updated_at)}</small>
          {row.created_by && (
            <small className="text-muted d-block">By: {row.created_by}</small>
          )}
        </>
      ),
    },
    {
      label: 'Actions',
      render: (row) => (
        <div className="d-flex flex-wrap gap-1">
          <Link to={`/product/${row.id}`}>
            <button className="btn btn-sm btn-info" title="View">
              <i className="fa-solid fa-eye" />
            </button>
          </Link>
          {canEdit && (
            <Link to={`/product/edit/${row.id}`}>
              <button className="btn btn-sm btn-warning btn-icon" title="Edit">
                <i className="fa-solid fa-pen-to-square" />
              </button>
            </Link>
          )}
          {canTransfer && (
            <Link to={`/product/transfer/form/${row.id}`}>
              <button className="btn btn-sm btn-outline-success btn-icon" title="Transfer stock">
                <i className="fa fa-exchange" />
              </button>
            </Link>
          )}
          {canBarcode && (
            <button
              className="btn btn-sm btn-outline-dark btn-icon"
              title="Generate barcode"
              onClick={() => navigate('/generate-bar-code', { state: { productSKU: row } })}
            >
              <i className="fa-solid fa-barcode" />
            </button>
          )}
          {canDelete && (
            <button
              className="btn btn-sm btn-danger btn-icon"
              title="Delete"
              onClick={() => handleDelete(row.id)}
              disabled={deleteMutation.isPending}
            >
              <i className="fa-solid fa-trash" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title="Product List"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Products' }]}
        actionLabel={canCreate ? 'Add Product' : undefined}
        actionTo={canCreate ? '/product/create' : undefined}
      />

      <div className="card">
        <div className="card-header">
          {/* Row 1 — search + dropdowns */}
          <div className="row g-2 align-items-end mb-2">
            <div className="col-md-3">
              <label className="form-label mb-1 small fw-semibold">Search</label>
              <input
                className="form-control form-control-sm"
                type="search"
                placeholder="Name or SKU…"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1 small fw-semibold">Category</label>
              <select
                className="form-select form-select-sm"
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              >
                <option value="">All categories</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1 small fw-semibold">Brand</label>
              <select
                className="form-select form-select-sm"
                value={brandFilter}
                onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }}
              >
                <option value="">All brands</option>
                {brandOptions.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1 small fw-semibold">Shop</label>
              <select
                className="form-select form-select-sm"
                value={shopFilter}
                onChange={(e) => { setShopFilter(e.target.value); setPage(1); }}
              >
                <option value="">All shops</option>
                {shopList.map((s) => (
                  <option key={s.id ?? s.shop_id} value={s.id ?? s.shop_id}>
                    {s.name ?? s.shop_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-1">
              <label className="form-label mb-1 small fw-semibold">Status</label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1 small fw-semibold">Stock level</label>
              <select
                className="form-select form-select-sm"
                value={stockFilter}
                onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
              >
                <option value="">Any stock</option>
                <option value="in">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
            </div>
          </div>

          {/* Row 2 — actions + active filter badges */}
          <div className="row g-2 align-items-center">
            <div className="col-auto">
              <select
                className="form-select form-select-sm"
                value={params.per_page}
                onChange={(e) => setPerPage(Number(e.target.value))}
                style={{ width: 80 }}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n} / page</option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <div className="col-auto">
                <button className="btn btn-sm btn-outline-secondary" onClick={resetFilters}>
                  <i className="fa-solid fa-xmark me-1" />
                  Clear filters
                </button>
              </div>
            )}
            {canImport && (
              <div className="col-auto">
                <Link to="/product/csv" className="btn btn-sm btn-outline-secondary">
                  <i className="fa-solid fa-file-csv me-1" />
                  Export CSV
                </Link>
              </div>
            )}
            {canDelete && selectedIds.length > 0 && (
              <div className="col-auto ms-auto">
                <button
                  className="btn btn-sm btn-danger"
                  onClick={handleBulkDelete}
                  disabled={deleteMutation.isPending}
                >
                  <i className="fa-solid fa-trash me-1" />
                  Delete selected ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card-body p-0 p-md-3">
          <DataTable
            columns={columns}
            data={products}
            isLoading={isLoading}
            meta={meta}
            onPageChange={setPage}
            showSerial
            orderBy={params.order_by}
            direction={params.direction}
            onSort={setSort}
            emptyText="No products found. Add your first product."
          />
        </div>
      </div>
    </>
  );
}
