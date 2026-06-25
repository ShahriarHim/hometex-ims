import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import { SkeletonTable } from '../../../shared/components/Skeleton';
import { useProductRankings } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

const BADGE_META = {
  hot:                { cls: 'bg-danger',   icon: 'fa-fire',         label: 'Hot Sale' },
  trending:           { cls: 'bg-warning text-dark', icon: 'fa-arrow-trend-up', label: 'Trending' },
  low_stock:          { cls: 'bg-secondary', icon: 'fa-triangle-exclamation', label: 'Low Stock' },
  discount_candidate: { cls: 'bg-info text-dark',    icon: 'fa-tag',          label: 'Discount?' },
  normal:             { cls: 'bg-light text-dark border', icon: 'fa-circle',   label: 'Normal' },
};

export default function ProductRankingsPage() {
  const navigate = useNavigate();
  const { isAdmin, hasPermission } = useAuth();
  const canView = isAdmin || hasPermission('analytics.view');
  const [days,    setDays]    = useState(30);
  const [limit,   setLimit]   = useState(20);
  const [channel, setChannel] = useState('');
  const [badge,   setBadge]   = useState('');

  const { data, isLoading } = useProductRankings({
    days, limit, type: channel || undefined,
  });

  if (!canView) return (
    <div className="text-center py-5 text-muted">
      <i className="fa-solid fa-lock fa-2x mb-2 d-block opacity-25" />
      You don't have permission to view analytics.
    </div>
  );

  const rows = (data?.data ?? []).filter((r) => !badge || r.badge === badge);

  return (
    <>
      <PageHeader
        title="Product Rankings"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Analytics' }, { label: 'Product Rankings' }]}
      />

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="row g-2 align-items-end">
            <div className="col-auto">
              <label className="form-label mb-1 small fw-semibold">Period</label>
              <select className="form-select form-select-sm" value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ width: 130 }}>
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            <div className="col-auto">
              <label className="form-label mb-1 small fw-semibold">Channel</label>
              <select className="form-select form-select-sm" value={channel} onChange={(e) => setChannel(e.target.value)} style={{ width: 140 }}>
                <option value="">All channels</option>
                <option value="ecommerce_order">Online</option>
                <option value="store_order">In-Store</option>
              </select>
            </div>
            <div className="col-auto">
              <label className="form-label mb-1 small fw-semibold">Badge</label>
              <select className="form-select form-select-sm" value={badge} onChange={(e) => setBadge(e.target.value)} style={{ width: 160 }}>
                <option value="">All badges</option>
                {Object.entries(BADGE_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="col-auto">
              <label className="form-label mb-1 small fw-semibold">Show</label>
              <select className="form-select form-select-sm" value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={{ width: 90 }}>
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Badge summary chips */}
      {!isLoading && data?.data && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {Object.entries(BADGE_META).map(([key, meta]) => {
            const count = data.data.filter((r) => r.badge === key).length;
            if (!count) return null;
            return (
              <button
                key={key}
                className={`btn btn-sm ${badge === key ? meta.cls : 'btn-outline-secondary'}`}
                onClick={() => setBadge(badge === key ? '' : key)}
              >
                <i className={`fa-solid ${meta.icon} me-1`} />
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <SkeletonTable rows={10} cols={6} />
          ) : (
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Product</th>
                  <th className="text-center">Badge</th>
                  <th className="text-center">Heat</th>
                  <th className="text-end">Units Sold</th>
                  <th className="text-end">Online / In-Store</th>
                  <th className="text-end">Revenue (৳)</th>
                  <th className="text-center">Stock</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={9} className="text-center text-muted py-4">No products found for this filter.</td></tr>
                )}
                {rows.map((r, i) => {
                  const bm = BADGE_META[r.badge] ?? BADGE_META.normal;
                  const stockColor = r.stock <= 0 ? 'text-danger' : r.stock <= 10 ? 'text-warning' : 'text-theme';
                  return (
                    <tr key={r.id}>
                      <td className="text-muted small">{i + 1}</td>
                      <td>
                        <div className="fw-semibold text-theme">{r.name}</div>
                        <small className="text-muted">{r.sku}</small>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${bm.cls}`}>
                          <i className={`fa-solid ${bm.icon} me-1`} />{bm.label}
                        </span>
                      </td>
                      <td className="text-center" style={{ minWidth: 80 }}>
                        <div className="progress" style={{ height: 8 }}>
                          <div
                            className={`progress-bar ${r.heat >= 75 ? 'bg-danger' : r.heat >= 45 ? 'bg-warning' : 'bg-secondary'}`}
                            style={{ width: `${r.heat}%` }}
                          />
                        </div>
                        <small className="text-muted">{r.heat}%</small>
                      </td>
                      <td className="text-end fw-semibold">{r.units_sold}</td>
                      <td className="text-end">
                        <small>
                          <span className="text-primary me-2">Online {r.ecom_units}</span>
                          <span className="text-success">In-Store {r.store_units}</span>
                        </small>
                      </td>
                      <td className="text-end">৳{(r.revenue ?? 0).toLocaleString()}</td>
                      <td className={`text-center fw-semibold ${stockColor}`}>{r.stock}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/analytics/products/${r.id}`)}
                          title="View analytics"
                        >
                          <i className="fa-solid fa-chart-line" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
