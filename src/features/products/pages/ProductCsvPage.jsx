import { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import { SkeletonTable } from '../../../shared/components/Skeleton';
import { useAllProductsForCsv, useSaveCsv } from '../api';
import { useDebounce } from '../../../shared/hooks/useDebounce';

export default function ProductCsvPage() {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data: products = [], isLoading } = useAllProductsForCsv();
  const saveCsv = useSaveCsv();

  const filtered = useMemo(() => {
    if (!debouncedSearch) return products;
    const q = debouncedSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        p.brand?.name?.toLowerCase().includes(q),
    );
  }, [products, debouncedSearch]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.includes(p.id));

  const toggleAll = (checked) => {
    if (checked) {
      setSelected((prev) => [...new Set([...prev, ...filtered.map((p) => p.id)])]);
    } else {
      const filteredIds = new Set(filtered.map((p) => p.id));
      setSelected((prev) => prev.filter((id) => !filteredIds.has(id)));
    }
  };

  const toggleOne = (id, checked) => {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const handleExport = () => {
    if (selected.length === 0) {
      Swal.fire('No selection', 'Select at least one product to export.', 'warning');
      return;
    }
    saveCsv.mutate(selected, {
      onSuccess: (res) => {
        Swal.fire({
          icon: 'success',
          title: 'CSV Generated',
          html: `<p>${res.message}</p><p class="text-muted small mt-1">File saved on server as <code>csv_facebook_post/${res.file}</code></p>`,
        });
      },
      onError: () => {
        Swal.fire('Error', 'Failed to generate CSV. Please try again.', 'error');
      },
    });
  };

  return (
    <>
      <PageHeader title="Facebook / Instagram CSV Export" breadcrumb="Products / CSV Export" />

      <div className="card">
        <div className="card-body">
          <div className="row mb-3 align-items-center">
            <div className="col-md-5">
              <input
                className="form-control form-control-sm"
                placeholder="Search by name, ID or brand…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-7 text-end">
              <span className="text-muted small me-3">
                {selected.length} of {products.length} selected
              </span>
              <button
                className="btn btn-sm btn-secondary me-2"
                disabled={selected.length === 0}
                onClick={() => setSelected([])}
              >
                Clear selection
              </button>
            </div>
          </div>

          {isLoading ? (
            <SkeletonTable rows={10} cols={5} />
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                    </th>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.includes(product.id)}
                            onChange={(e) => toggleOne(product.id, e.target.checked)}
                          />
                        </td>
                        <td className="text-muted small">{product.id}</td>
                        <td>
                          {product.primary_photo ? (
                            <img
                              src={product.primary_photo}
                              alt={product.name}
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                background: '#e9ecef',
                                borderRadius: 4,
                              }}
                            />
                          )}
                        </td>
                        <td>{product.name}</td>
                        <td className="text-muted small">{product.brand?.name ?? '—'}</td>
                        <td className="text-muted small">
                          {product.price ? `৳${Number(product.price).toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card-footer d-flex align-items-center justify-content-between">
          <span className="text-muted small">
            CSV is saved on the server and used by Facebook/Instagram catalog sync.
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleExport}
            disabled={selected.length === 0 || saveCsv.isPending}
          >
            {saveCsv.isPending ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" />
                Generating…
              </>
            ) : (
              <>
                <i className="fa-solid fa-file-csv me-1" />
                Export {selected.length > 0 ? `${selected.length} Products` : 'CSV'}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
