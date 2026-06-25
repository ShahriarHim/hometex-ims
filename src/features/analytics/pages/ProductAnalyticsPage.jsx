import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import PageHeader from '../../../shared/components/PageHeader';
import { SkeletonTable } from '../../../shared/components/Skeleton';
import Skeleton from '../../../shared/components/Skeleton';
import { useProductAnalytics } from '../api';
import { formatDate } from '../../../shared/utils/formatters';

const TYPE_META = {
  ecommerce_order: { label: 'Online Order',   cls: 'bg-primary',                color: '#2563eb' },
  store_order:     { label: 'In-Store Sale',  cls: 'bg-success',                color: '#16a34a' },
  pos_order:       { label: 'In-Store Sale',  cls: 'bg-success',                color: '#16a34a' },
  transfer_in:     { label: 'Transfer In',    cls: 'bg-info text-dark',          color: '#0891b2' },
  transfer_out:    { label: 'Transfer Out',   cls: 'bg-secondary',               color: '#64748b' },
  return:          { label: 'Return',         cls: 'bg-danger',                  color: '#dc2626' },
  restore:         { label: 'Restore',        cls: 'bg-info text-dark',          color: '#0891b2' },
  manual:          { label: 'Manual Adj.',    cls: 'bg-light text-dark border',  color: '#94a3b8' },
};

export default function ProductAnalyticsPage() {
  const { id } = useParams();
  const { isAdmin, hasPermission } = useAuth();
  const canView = isAdmin || hasPermission('analytics.view');
  const [days, setDays] = useState(30);

  const { data, isLoading } = useProductAnalytics(id, { days });

  if (!canView) return (
    <div className="text-center py-5 text-muted">
      <i className="fa-solid fa-lock fa-2x mb-2 d-block opacity-25" />
      You don't have permission to view analytics.
    </div>
  );

  const product         = data?.product;
  const summary         = data?.summary ?? {};
  const dailyTrend      = data?.daily_trend ?? [];
  const channelBreakdown = data?.channel_breakdown ?? [];
  const shopBreakdown   = data?.shop_breakdown ?? [];
  const shopStock       = data?.shop_stock ?? [];
  const movements       = data?.movements ?? [];

  const channelPie = channelBreakdown.map((c) => ({
    name:  TYPE_META[c.type]?.label ?? c.type,
    value: c.units,
    color: TYPE_META[c.type]?.color ?? '#94a3b8',
  }));

  return (
    <>
      <PageHeader
        title={product ? product.name : 'Product Analytics'}
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Analytics', to: '/analytics/products' },
          { label: product?.name ?? '...' },
        ]}
      />

      {/* Period selector */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <span className="text-muted small">Period:</span>
        {[7, 14, 30, 60, 90].map((d) => (
          <button
            key={d}
            className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setDays(d)}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-3">
        {[
          { label: 'Units Sold',         value: summary.total_sold,            icon: 'fa-cart-shopping', color: 'text-primary' },
          { label: 'Returns',            value: summary.total_returned,         icon: 'fa-rotate-left',   color: 'text-danger' },
          { label: 'Transferred Out',    value: summary.total_transferred_out,  icon: 'fa-arrow-right',   color: 'text-secondary' },
          { label: 'Transferred In',     value: summary.total_transferred_in,   icon: 'fa-arrow-left',    color: 'text-info' },
          { label: 'Current Total Stock',value: product?.stock ?? '—',          icon: 'fa-boxes-stacked', color: 'text-success' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="col-6 col-md-4 col-lg-2-4" style={{ flex: '0 0 20%' }}>
            <div className="card h-100">
              <div className="card-body py-3 px-3">
                {isLoading ? <Skeleton height={40} /> : (
                  <>
                    <div className={`fs-4 fw-bold ${color}`}>{value ?? 0}</div>
                    <div className="text-muted small">
                      <i className={`fa-solid ${icon} me-1`} />{label}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-3">
        {/* Daily sales trend */}
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header fw-semibold">
              <i className="fa-solid fa-chart-line me-2 text-primary" />
              Daily Sales Trend (last {days} days)
            </div>
            <div className="card-body">
              {isLoading ? <Skeleton height={200} /> : dailyTrend.length === 0 ? (
                <div className="text-muted text-center py-5">No sales in this period.</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="units" stroke="#2563eb" fill="url(#trendGrad)" name="Units sold" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Channel pie */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header fw-semibold">
              <i className="fa-solid fa-chart-pie me-2 text-warning" />
              Channel Mix
            </div>
            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              {isLoading ? <Skeleton height={200} /> : channelPie.length === 0 ? (
                <div className="text-muted small text-center py-4">No sales data.</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={channelPie} dataKey="value" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {channelPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v + ' units', n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="d-flex flex-wrap gap-2 justify-content-center mt-1">
                    {channelPie.map((c) => (
                      <span key={c.name} className="small d-flex align-items-center gap-1">
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: c.color, display: 'inline-block' }} />
                        {c.name}: {c.value}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        {/* Per-shop sales bar */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header fw-semibold">
              <i className="fa-solid fa-shop me-2 text-success" />
              Sales by Shop
            </div>
            <div className="card-body">
              {isLoading ? <Skeleton height={160} /> : shopBreakdown.length === 0 ? (
                <div className="text-muted small text-center py-4">No data.</div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={shopBreakdown} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="shop_name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="units_sold" name="Units sold" fill="#2563eb" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Current stock per shop */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header fw-semibold">
              <i className="fa-solid fa-boxes-stacked me-2 text-info" />
              Current Stock per Shop
            </div>
            <div className="card-body p-0">
              {isLoading ? <SkeletonTable rows={3} cols={2} /> : (
                <table className="table table-sm mb-0">
                  <thead className="table-light">
                    <tr><th>Shop</th><th className="text-end">Qty</th></tr>
                  </thead>
                  <tbody>
                    {shopStock.length === 0 && (
                      <tr><td colSpan={2} className="text-muted text-center py-3">Not assigned to any shop.</td></tr>
                    )}
                    {shopStock.map((s) => {
                      const color = s.quantity <= 0 ? 'text-danger' : s.quantity <= 10 ? 'text-warning' : 'text-theme';
                      return (
                        <tr key={s.shop_id}>
                          <td>{s.shop_name}</td>
                          <td className={`text-end fw-semibold ${color}`}>{s.quantity}</td>
                        </tr>
                      );
                    })}
                    {shopStock.length > 0 && (
                      <tr className="table-light fw-semibold">
                        <td>Total</td>
                        <td className="text-end">{shopStock.reduce((s, r) => s + r.quantity, 0)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full movement log */}
      <div className="card">
        <div className="card-header fw-semibold d-flex justify-content-between align-items-center">
          <span><i className="fa-solid fa-list me-2" />Movement Log (last {days} days)</span>
          <small className="text-muted">{movements.length} entries</small>
        </div>
        <div className="card-body p-0">
          {isLoading ? <SkeletonTable rows={8} cols={6} /> : (
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Shop</th>
                  <th className="text-center">Change</th>
                  <th>Reference</th>
                  <th>Notes / Staff</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 && (
                  <tr><td colSpan={6} className="text-muted text-center py-4">No movements in this period.</td></tr>
                )}
                {movements.map((m) => {
                  const meta = TYPE_META[m.type] ?? { label: m.type, cls: 'bg-light text-dark border' };
                  const isPos = m.quantity_change > 0;
                  return (
                    <tr key={m.id}>
                      <td><small className="text-muted">{formatDate(m.created_at)}</small></td>
                      <td><span className={`badge ${meta.cls}`}>{meta.label}</span></td>
                      <td><small>{m.shop}</small></td>
                      <td className={`text-center fw-semibold ${isPos ? 'text-success' : 'text-danger'}`}>
                        {isPos ? '+' : ''}{m.quantity_change}
                      </td>
                      <td><small className="text-muted">{m.reference ?? '—'}</small></td>
                      <td>
                        <small className="text-muted">
                          {m.notes ?? ''}
                          {m.created_by && <span className="ms-1 text-theme">· {m.created_by}</span>}
                        </small>
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
