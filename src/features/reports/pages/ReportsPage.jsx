import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import dayjs from 'dayjs';
import { useAuth } from '../../../shared/hooks/useAuth';
import {
  useReportSummary,
  useMonthlySales,
  useMonthlyPurchase,
  useTodayByBranch,
  useShopStock,
  useLowStock,
  useRecentOrders,
  useSalesTrend,
  useOrderStatus,
  useTopProducts,
} from '../api';
import { useProductRankings } from '../../analytics/api';

// ─── Order status display config ─────────────────────────────────────
const ORDER_STATUS_CONFIG = [
  { key: 'completed',  label: 'Delivered',   color: '#10b981' },
  { key: 'pending',    label: 'Pending',     color: '#f59e0b' },
  { key: 'processed',  label: 'Processing',  color: '#3b82f6' },
  { key: 'returned',   label: 'Returned',    color: '#ef4444' },
  { key: 'cancelled',  label: 'Cancelled',   color: '#94a3b8' },
];

// ─── Sub-components ───────────────────────────────────────────────────


function StatCardSkeleton() {
  return (
    <div className="stat-card-skeleton">
      <div className="skel-icon" />
      <div className="skel-body">
        <div className="skel-line w-60" />
        <div className="skel-line w-40" />
      </div>
    </div>
  );
}

function StatCard({ icon, iconClass, label, value, sub, onClick, variant, loading }) {
  if (loading) return <StatCardSkeleton />;
  return (
    <div
      className={`stat-card${onClick ? ' clickable' : ''}${variant ? ` stat-${variant}` : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className={`stat-icon ${iconClass}`}>
        <i className={`fa-solid ${icon}`} />
      </div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value ?? '—'}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      {onClick && (
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem', color: '#cbd5e1', flexShrink: 0 }} />
      )}
    </div>
  );
}

// CSS-based sales trend bar chart — no library needed
function SalesTrendChart({ data }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  const fmt = (n) => n >= 1000 ? `৳${(n / 1000).toFixed(0)}k` : `৳${n}`;

  return (
    <div className="trend-chart-wrap">
      <div className="trend-bars">
        {data.map((d, i) => {
          const label = d.date ?? d.label;
          return (
            <div key={i} className="trend-bar-col">
              <div className="trend-tooltip">{label}<br />{fmt(d.amount)}</div>
              <div
                className={`trend-bar${i === data.length - 1 ? ' today' : ''}`}
                style={{ height: `${Math.max((d.amount / max) * 100, 4)}%` }}
              />
              {(i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1) && (
                <div className="trend-label">{label}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Horizontal status bar list
function OrderStatusPanel({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="status-bar-list">
      {data.map((d) => (
        <div key={d.label} className="status-row">
          <div className="status-dot" style={{ background: d.color }} />
          <span className="status-name">{d.label}</span>
          <div className="status-track">
            <div
              className="status-fill"
              style={{ width: `${(d.count / total) * 100}%`, background: d.color }}
            />
          </div>
          <span className="status-count">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

// Drilldown modal wrapper
function DrillModal({ show, title, onHide, isLoading, children }) {
  return (
    <Modal show={show} onHide={onHide} centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '0.95rem', fontWeight: 600 }}>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: 0 }}>
        {isLoading ? (
          <div className="p-4 text-center text-muted" style={{ fontSize: '0.82rem' }}>
            <span className="spinner-border spinner-border-sm me-2" />
            Loading…
          </div>
        ) : children}
      </Modal.Body>
    </Modal>
  );
}

function DrillTable({ cols, rows, renderRow, emptyText = 'No data.' }) {
  if (!rows?.length) {
    return <p className="text-muted p-4 mb-0" style={{ fontSize: '0.82rem' }}>{emptyText}</p>;
  }
  return (
    <table className="table table-sm table-hover mb-0">
      <thead>
        <tr>{cols.map((c) => <th key={c.key} className={c.right ? 'text-end' : ''}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => renderRow(row, i))}
      </tbody>
    </table>
  );
}

// ─── Order status badge ───────────────────────────────────────────────
const STATUS_MAP = {
  pending:    { label: 'Pending',    bg: '#fef3c7', color: '#d97706' },
  processing: { label: 'Processing', bg: '#dbeafe', color: '#2563eb' },
  delivered:  { label: 'Delivered',  bg: '#d1fae5', color: '#059669' },
  returned:   { label: 'Returned',   bg: '#fee2e2', color: '#dc2626' },
  cancelled:  { label: 'Cancelled',  bg: '#f3f4f6', color: '#6b7280' },
};

function OrderBadge({ status }) {
  const s = STATUS_MAP[status?.toLowerCase()] ?? { label: status, bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 500, padding: '2px 7px', borderRadius: 4,
      background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

// ─── Panel skeleton ───────────────────────────────────────────────────
function ListSkeleton({ rows = 5 }) {
  return (
    <div className="p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="d-flex gap-2 py-2 border-bottom">
          <div style={{ width: 56, height: 10, background: '#f1f5f9', borderRadius: 3 }} />
          <div style={{ flex: 1, height: 10, background: '#f1f5f9', borderRadius: 3 }} />
          <div style={{ width: 60, height: 10, background: '#f1f5f9', borderRadius: 3 }} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────
const HOT_BADGE_META = {
  hot:                { cls: 'bg-danger',   icon: 'fa-fire',              label: 'Hot' },
  trending:           { cls: 'bg-warning text-dark', icon: 'fa-arrow-trend-up', label: 'Trending' },
  low_stock:          { cls: 'bg-secondary', icon: 'fa-triangle-exclamation', label: 'Low Stock' },
  discount_candidate: { cls: 'bg-info text-dark',    icon: 'fa-tag',         label: 'Discount?' },
  normal:             { cls: 'bg-light text-dark border', icon: 'fa-circle', label: 'Normal' },
};

export default function ReportsPage() {
  const navigate = useNavigate();
  const { isAdmin, hasPermission } = useAuth();
  const canCreateOrder = isAdmin || hasPermission('orders.create');
  const today = dayjs().format('dddd, D MMMM YYYY');

  const { data: s, isLoading: sumLoading }        = useReportSummary();
  const { data: branchData, isLoading: branchL }  = useTodayByBranch();
  const { data: stockData,  isLoading: stockL }   = useShopStock();
  const { data: lowStockD,  isLoading: lowL }     = useLowStock();
  const { data: recentOrds, isLoading: recentL }  = useRecentOrders();
  const { data: trendData,  isLoading: trendL }   = useSalesTrend(14);
  const { data: orderStatusData, isLoading: osL } = useOrderStatus();
  const { data: topProductsData, isLoading: tpL } = useTopProducts(30, 5);
  const { data: hotProductsData, isLoading: hotL } = useProductRankings({ days: 30, limit: 5 });

  // Modal drilldowns (monthly detail — still modal-based)
  const [modal, setModal] = useState(null);
  const open  = (name) => setModal(name);
  const close = ()      => setModal(null);

  const monthlySales    = useMonthlySales(modal === 'monthlySales');
  const monthlyPurchase = useMonthlyPurchase(modal === 'monthlyPurchase');

  // Merge branch today sales + shop stock for the branch performance panel
  const branchRows = (branchData ?? []).map((b) => {
    const stock = (stockData ?? []).find((s) => s.shop_id === b.shop_id);
    return { ...b, total_stock: stock?.total_stock ?? '—' };
  });

  // Recent orders — support both paginated (data.data) and flat array shapes
  const recentList = Array.isArray(recentOrds) ? recentOrds : (recentOrds?.data ?? []);

  // Low stock — show first 6 inline, rest in modal
  const lowStockList = (lowStockD ?? []).slice(0, 6);
  const lowStockMore = Math.max(0, (lowStockD?.length ?? 0) - 6);

  return (
    <>
      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="page-header-row mb-3">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{today}</div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {canCreateOrder && (
            <Link to="/orders/create" className="btn btn-sm btn-primary">
              <i className="fa-solid fa-plus me-1" />New Sale
            </Link>
          )}
          {isAdmin && (
            <Link to="/product/create" className="btn btn-sm btn-outline-secondary">
              <i className="fa-solid fa-box me-1" />Add Product
            </Link>
          )}
          {isAdmin && (
            <Link to="/approvals" className="btn btn-sm btn-outline-secondary">
              <i className="fa-solid fa-clipboard-check me-1" />Approvals
            </Link>
          )}
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────── */}
      <div className="section-label">Overview</div>
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard loading={sumLoading} icon="fa-hand-holding-dollar" iconClass="icon-blue"
            label="Today's Sales" value={s?.total_sales_today}
            onClick={() => open('todayByBranchModal')} />
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard loading={sumLoading} icon="fa-cart-shopping" iconClass="icon-teal"
            label="Total Sales" value={s?.total_sales}
            onClick={() => open('monthlySales')} />
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard loading={sumLoading} icon="fa-warehouse" iconClass="icon-purple"
            label="Inventory Cost" value={s?.total_purchase} />
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard loading={sumLoading} icon="fa-box-open" iconClass="icon-slate"
            label="Total Products" value={s?.total_product} />
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard loading={sumLoading} icon="fa-boxes-stacked" iconClass="icon-teal"
            label="Total Stock" value={s?.total_stock}
            onClick={() => open('shopStockModal')} />
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard loading={sumLoading} icon="fa-battery-quarter" iconClass="icon-red"
            label="Low Stock" value={s?.low_stock}
            variant={s?.low_stock > 0 ? 'danger' : undefined}
            onClick={() => open('lowStockModal')} />
        </div>
      </div>

      {/* ── Charts row ────────────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        {/* Sales trend */}
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-header">Sales Trend — last 14 days</div>
            <div className="card-body" style={{ paddingBottom: 8 }}>
              {trendL ? (
                <div style={{ height: 120 }} className="d-flex align-items-end gap-1 px-2">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} style={{ flex: 1, height: `${30 + Math.random() * 50}%`, background: '#f1f5f9', borderRadius: '3px 3px 0 0' }} />
                  ))}
                </div>
              ) : (trendData ?? []).length === 0 ? (
                <p className="text-muted py-3 mb-0" style={{ fontSize: '0.82rem' }}>No sales data yet.</p>
              ) : (
                <SalesTrendChart data={trendData} />
              )}
            </div>
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header">Order Status</div>
            <div className="card-body">
              {osL ? (
                <ListSkeleton rows={5} />
              ) : !orderStatusData ? (
                <p className="text-muted py-3 mb-0" style={{ fontSize: '0.82rem' }}>No data.</p>
              ) : (() => {
                const rows = ORDER_STATUS_CONFIG.map((c) => ({
                  ...c,
                  count: orderStatusData[c.key] ?? 0,
                })).filter((r) => r.count > 0);
                const total = rows.reduce((s, r) => s + r.count, 0);
                return (
                  <>
                    <OrderStatusPanel data={rows} />
                    <div className="mt-3 pt-2 border-top" style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      Total:{' '}
                      <strong style={{ color: '#1e293b' }}>{total}</strong>{' '}
                      orders all-time
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent orders + Low stock alerts ──────────────────────── */}
      <div className="row g-3 mb-4">
        {/* Recent orders */}
        <div className="col-md-7">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span>Recent Orders</span>
              <Link to="/orders" style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none' }}>
                View all <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.65rem' }} />
              </Link>
            </div>
            <div className="card-body" style={{ padding: '0 16px' }}>
              {recentL ? (
                <ListSkeleton rows={6} />
              ) : recentList.length === 0 ? (
                <p className="text-muted py-3 mb-0" style={{ fontSize: '0.82rem' }}>No orders yet.</p>
              ) : (
                recentList.map((ord) => (
                  <Link key={ord.id} to={`/order/${ord.id}`} style={{ textDecoration: 'none' }}>
                    <div className="recent-order-row">
                      <span className="order-id">#{ord.id}</span>
                      <span className="order-customer">{ord.customer_name ?? ord.customer?.name ?? 'Walk-in'}</span>
                      <span className="order-amount">{ord.total_price ?? ord.total ?? '—'}</span>
                      <OrderBadge status={ord.status} />
                      <span className="order-time">
                        {ord.created_at ? dayjs(ord.created_at).fromNow() : ''}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Low stock alerts — visible panel, not modal */}
        <div className="col-md-5">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span>
                Low Stock Alerts
                {(s?.low_stock > 0) && (
                  <span className="ms-2 badge" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.65rem' }}>
                    {s.low_stock}
                  </span>
                )}
              </span>
              {lowStockMore > 0 && (
                <button
                  className="btn btn-link btn-sm p-0"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => open('lowStockModal')}
                >
                  +{lowStockMore} more
                </button>
              )}
            </div>
            <div className="card-body" style={{ padding: '0 16px' }}>
              {lowL ? (
                <ListSkeleton rows={5} />
              ) : lowStockList.length === 0 ? (
                <div className="py-4 text-center" style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: '1.5rem', color: '#10b981', display: 'block', marginBottom: 8 }} />
                  All products adequately stocked
                </div>
              ) : (
                lowStockList.map((item) => (
                  <div key={item.product_id} className="low-stock-row">
                    <i className="fa-solid fa-triangle-exclamation ls-icon" />
                    <Link to={`/product/${item.product_id}`} className="ls-name" style={{ textDecoration: 'none', color: '#374151' }}>
                      {item.name}
                    </Link>
                    <span className="ls-sku">{item.sku}</span>
                    <span className="ls-qty">{item.total_quantity} left</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top products + Branch performance + Shop stock ────────── */}
      <div className="row g-3 mb-4">
        {/* Top selling products */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header">Top Selling (30 days)</div>
            <div className="card-body" style={{ padding: '0 16px' }}>
              {tpL ? (
                <ListSkeleton rows={5} />
              ) : (topProductsData ?? []).length === 0 ? (
                <p className="text-muted py-3 mb-0" style={{ fontSize: '0.82rem' }}>No sales data yet.</p>
              ) : (
                (topProductsData ?? []).map((p, i) => (
                  <div key={p.id} className="top-product-row">
                    <span className="tp-rank">{i + 1}</span>
                    <Link to={`/product/${p.id}`} className="tp-name" style={{ textDecoration: 'none', color: '#374151' }}>
                      {p.name}
                    </Link>
                    <span className="tp-rev">৳{Number(p.revenue ?? 0).toLocaleString('en-BD')}</span>
                    <span className="tp-sold">{p.sold} sold</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Branch today performance */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header">Branch Sales — Today</div>
            <div className="card-body" style={{ padding: '0 16px' }}>
              {branchL ? <ListSkeleton rows={4} /> : branchRows.length === 0 ? (
                <p className="text-muted py-3 mb-0" style={{ fontSize: '0.82rem' }}>No branch sales recorded today.</p>
              ) : (
                branchRows.map((b) => (
                  <div key={b.shop_id} className="branch-row">
                    <div>
                      <div className="branch-name">{b.shop_name}</div>
                    </div>
                    <div className="text-end">
                      <div className="branch-sales">{b.total_formatted ?? b.total}</div>
                      <div className="branch-stock">{b.total_stock} units</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Shop stock summary */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header">Stock by Shop</div>
            <div className="card-body" style={{ padding: '0 16px' }}>
              {stockL ? <ListSkeleton rows={4} /> : (stockData ?? []).length === 0 ? (
                <p className="text-muted py-3 mb-0" style={{ fontSize: '0.82rem' }}>No stock data available.</p>
              ) : (
                (stockData ?? []).map((shop) => {
                  const total = (stockData ?? []).reduce((s, sh) => s + (sh.total_stock || 0), 0);
                  const pct = total ? Math.round((shop.total_stock / total) * 100) : 0;
                  return (
                    <div key={shop.shop_id} className="branch-row">
                      <div className="branch-name">{shop.shop_name}</div>
                      <div className="text-end">
                        <div className="branch-sales">{shop.total_stock} units</div>
                        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, marginTop: 4, width: 60 }}>
                          <div style={{ height: 4, background: '#3b82f6', borderRadius: 2, width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Product intelligence quick-view ───────────────────────── */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span>
                <i className="fa-solid fa-fire me-2 text-danger" />
                Product Intelligence
                <span className="ms-2 text-muted" style={{ fontSize: '0.75rem', fontWeight: 400 }}>Last 30 days</span>
              </span>
              <button
                className="btn btn-link btn-sm p-0"
                style={{ fontSize: '0.78rem' }}
                onClick={() => navigate('/analytics/products')}
              >
                View all rankings →
              </button>
            </div>
            <div className="card-body p-0">
              {hotL ? (
                <ListSkeleton rows={5} />
              ) : (hotProductsData?.data ?? []).length === 0 ? (
                <div className="py-4 text-center" style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
                  No sales data yet — seed some orders to see rankings.
                </div>
              ) : (
                <table className="table table-sm table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 32 }}>#</th>
                      <th>Product</th>
                      <th className="text-center">Badge</th>
                      <th className="text-center" style={{ width: 100 }}>Heat</th>
                      <th className="text-end">Sold</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-center" style={{ width: 60 }}>Stock</th>
                      <th style={{ width: 44 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {(hotProductsData?.data ?? []).slice(0, 5).map((r, i) => {
                      const bm = HOT_BADGE_META[r.badge] ?? HOT_BADGE_META.normal;
                      const stockColor = r.stock <= 0 ? 'text-danger' : r.stock <= 10 ? 'text-warning' : '';
                      return (
                        <tr key={r.id}>
                          <td className="text-muted small">{i + 1}</td>
                          <td>
                            <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{r.name}</div>
                            <small className="text-muted">{r.sku}</small>
                          </td>
                          <td className="text-center">
                            <span className={`badge ${bm.cls}`} style={{ fontSize: '0.65rem' }}>
                              <i className={`fa-solid ${bm.icon} me-1`} />{bm.label}
                            </span>
                          </td>
                          <td className="text-center" style={{ minWidth: 80 }}>
                            <div className="progress" style={{ height: 6 }}>
                              <div
                                className={`progress-bar ${r.heat >= 75 ? 'bg-danger' : r.heat >= 45 ? 'bg-warning' : 'bg-secondary'}`}
                                style={{ width: `${r.heat}%` }}
                              />
                            </div>
                            <small className="text-muted">{r.heat}%</small>
                          </td>
                          <td className="text-end fw-semibold">{r.units_sold}</td>
                          <td className="text-end">৳{Number(r.revenue ?? 0).toLocaleString('en-BD')}</td>
                          <td className={`text-center fw-semibold ${stockColor}`} style={{ fontSize: '0.85rem' }}>{r.stock}</td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-primary py-0 px-1"
                              title="View analytics"
                              onClick={() => navigate(`/analytics/products/${r.id}`)}
                              style={{ fontSize: '0.7rem' }}
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
        </div>
      </div>

      {/* ── Financial summary ─────────────────────────────────────── */}
      <div className="section-label">Financials</div>
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <StatCard loading={sumLoading} icon="fa-warehouse" iconClass="icon-slate"
            label="Inventory Cost" value={s?.total_purchase}
            sub={`Today additions: ${s?.total_purchase_today ?? '—'}`} />
        </div>
        <div className="col-md-3 col-6">
          <StatCard loading={sumLoading} icon="fa-money-bill-wave" iconClass="icon-amber"
            label="Cost of Goods Sold" value={s?.total_expense}
            sub={`Today: ${s?.total_expense_today ?? '—'}`} />
        </div>
        <div className="col-md-3 col-6">
          <StatCard loading={sumLoading} icon="fa-chart-line" iconClass="icon-teal"
            label="Total Revenue" value={s?.total_sales}
            sub={`Today: ${s?.total_sales_today ?? '—'}`} />
        </div>
        <div className="col-md-3 col-6">
          <StatCard loading={sumLoading} icon="fa-arrow-trend-up" iconClass="icon-green"
            label="Gross Profit" value={s?.total_profit}
            sub={`Today: ${s?.total_profit_today ?? '—'}`}
            variant={s?.total_profit?.startsWith('-') ? 'danger' : 'success'} />
        </div>
      </div>

      <div className="row g-3 mb-2">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Stock Valuation</div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted">Stock Value at Cost (Buy)</td>
                    <td className="text-end fw-medium">{sumLoading ? '…' : (s?.buy_value ?? '—')}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Stock Value at Selling Price</td>
                    <td className="text-end fw-medium">{sumLoading ? '…' : (s?.sale_value ?? '—')}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Possible Profit (if all sold)</td>
                    <td className="text-end fw-medium" style={{ color: '#16a34a' }}>
                      {sumLoading ? '…' : (s?.possible_profit ?? '—')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Drilldown modals ──────────────────────────────────────── */}
      <DrillModal show={modal === 'monthlySales'} title="Monthly Sales" onHide={close} isLoading={monthlySales.isLoading}>
        <DrillTable
          cols={[{ key: 'month', label: 'Month' }, { key: 'total', label: 'Total', right: true }]}
          rows={monthlySales.data}
          renderRow={(row, i) => (
            <tr key={i}><td>{row.month}</td><td className="text-end">{row.total_formatted ?? row.total}</td></tr>
          )}
        />
      </DrillModal>

      <DrillModal show={modal === 'monthlyPurchase'} title="Monthly Purchase" onHide={close} isLoading={monthlyPurchase.isLoading}>
        <DrillTable
          cols={[{ key: 'month', label: 'Month' }, { key: 'total', label: 'Total', right: true }]}
          rows={monthlyPurchase.data}
          renderRow={(row, i) => (
            <tr key={i}><td>{row.month}</td><td className="text-end">{row.total_formatted ?? row.total}</td></tr>
          )}
        />
      </DrillModal>

      <DrillModal show={modal === 'todayByBranchModal'} title="Today's Sales by Branch" onHide={close} isLoading={branchL}>
        <DrillTable
          cols={[{ key: 'shop', label: 'Branch' }, { key: 'total', label: 'Total', right: true }]}
          rows={branchData}
          renderRow={(row, i) => (
            <tr key={i}><td>{row.shop_name}</td><td className="text-end">{row.total_formatted ?? row.total}</td></tr>
          )}
        />
      </DrillModal>

      <DrillModal show={modal === 'shopStockModal'} title="Stock by Shop" onHide={close} isLoading={stockL}>
        <DrillTable
          cols={[{ key: 'shop', label: 'Shop' }, { key: 'stock', label: 'Stock', right: true }]}
          rows={stockData}
          renderRow={(row, i) => (
            <tr key={i}><td>{row.shop_name}</td><td className="text-end">{row.total_stock}</td></tr>
          )}
        />
      </DrillModal>

      <DrillModal show={modal === 'lowStockModal'} title="All Low Stock Products" onHide={close} isLoading={lowL}>
        <DrillTable
          cols={[
            { key: 'name', label: 'Product' },
            { key: 'sku',  label: 'SKU' },
            { key: 'qty',  label: 'Qty', right: true },
          ]}
          rows={lowStockD}
          renderRow={(row, i) => (
            <tr key={i}>
              <td>
                <Link to={`/product/${row.product_id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                  {row.name}
                </Link>
              </td>
              <td className="text-muted">{row.sku}</td>
              <td className="text-end fw-bold" style={{ color: '#dc2626' }}>{row.total_quantity}</td>
            </tr>
          )}
        />
      </DrillModal>
    </>
  );
}
