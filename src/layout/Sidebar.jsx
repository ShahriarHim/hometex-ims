import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth';
import logo from '../assets/img/hometex-logo.png';

function NavItem({ to, icon, label }) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link className={`sidebar-item${active ? ' active' : ''}`} to={to}>
      <i className={`sidebar-icon ${icon}`} style={{ width: 18, textAlign: 'center', fontSize: '0.82rem', flexShrink: 0, opacity: active ? 1 : 0.7 }} />
      <span className="item-label">{label}</span>
    </Link>
  );
}

function NavGroup({ icon, label, children, matchPrefixes = [] }) {
  const { pathname } = useLocation();
  const isMatch = matchPrefixes.some((p) => pathname.startsWith(p));
  const [open, setOpen] = useState(isMatch);

  return (
    <>
      <button
        className={`sidebar-item${open ? ' group-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <i className={icon} style={{ width: 18, textAlign: 'center', fontSize: '0.82rem', flexShrink: 0, opacity: 0.7 }} />
        <span className="item-label">{label}</span>
        <i className="fa-solid fa-chevron-right item-chevron" />
      </button>
      {open && <div className="sidebar-subnav">{children}</div>}
    </>
  );
}

function SubItem({ to, label }) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link className={`sidebar-subitem${active ? ' active' : ''}`} to={to}>
      {label}
    </Link>
  );
}

function GroupLabel({ children }) {
  return <span className="sidebar-group-label">{children}</span>;
}

function SoonItem({ icon, label }) {
  return (
    <span className="sidebar-item" style={{ cursor: 'default', opacity: 0.55 }}>
      <i className={icon} style={{ width: 18, textAlign: 'center', fontSize: '0.82rem', flexShrink: 0 }} />
      <span className="item-label">{label}</span>
      <span className="badge bg-secondary" style={{ fontSize: '0.6rem' }}>Soon</span>
    </span>
  );
}

export default function Sidebar() {
  const { user, isAdmin, isManager, isProductManager, isSalesStaff, isWarehouse, hasPermission } = useAuth();

  const canViewProducts   = hasPermission('products.view') || isAdmin || isManager || isProductManager || isWarehouse;
  const canViewOrders     = hasPermission('orders.view') || isAdmin || isManager || isSalesStaff;
  const canViewStoreOrders = hasPermission('store_orders.view') || isAdmin || isManager || isSalesStaff;
  const canViewCustomers  = hasPermission('customers.view') || isAdmin || isManager;
  const canViewReturns    = hasPermission('returns.view') || isAdmin || isManager;
  const canViewInventory  = hasPermission('inventory.transfer.create') || hasPermission('inventory.transfer.approve') || hasPermission('inventory.adjust') || isAdmin || isWarehouse;
  const canViewCatalog    = hasPermission('catalog.create') || hasPermission('catalog.edit') || isAdmin || isManager;
  const canViewSuppliers  = hasPermission('suppliers.view') || isAdmin || isManager;
  const canViewShops      = hasPermission('shops.view') || isAdmin || isManager;
  const canViewApprovals  = hasPermission('approvals.view') || isAdmin || isManager;
  const canViewReports    = hasPermission('reports.view') || isAdmin || isManager;
  const canViewAnalytics  = hasPermission('analytics.view') || isAdmin;
  const canViewBarcode    = hasPermission('barcode.generate') || isAdmin || isProductManager || isWarehouse;
  const canViewAttributes = hasPermission('attributes.manage') || isAdmin || isProductManager;
  const canViewPricing    = hasPermission('pricing.manage') || isAdmin || isProductManager;
  const canViewStaff      = hasPermission('staff.view') || isAdmin;
  const canViewRoles      = isAdmin;

  const roleLabel = isAdmin ? 'Admin'
    : isManager ? 'Manager'
    : isProductManager ? 'Product Manager'
    : isSalesStaff ? 'Sales Staff'
    : isWarehouse ? 'Warehouse'
    : 'Staff';

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="Hometex" />
        <span className="brand-name">Hometex</span>
      </div>

      <div className="sidebar-scroll">
        <GroupLabel>Main</GroupLabel>
        <NavItem to="/" icon="fa-solid fa-gauge" label="Dashboard" />

        {canViewApprovals && (
          <NavItem to="/approvals" icon="fa-solid fa-clipboard-check" label="Approvals" />
        )}

        {/* Inventory */}
        {(canViewProducts || canViewInventory) && (
          <>
            <GroupLabel>Inventory</GroupLabel>

            {canViewProducts && (
              <NavGroup icon="fa-solid fa-box" label="Products" matchPrefixes={['/products', '/product']}>
                <SubItem to="/products" label="All Products" />
                {hasPermission('products.create') || isAdmin || isProductManager ? (
                  <SubItem to="/product/create" label="Add Product" />
                ) : null}
                {canViewBarcode && <SubItem to="/generate-bar-code" label="Barcode Generator" />}
              </NavGroup>
            )}

            {canViewInventory && (
              <NavGroup icon="fa-solid fa-arrows-rotate" label="Transfers" matchPrefixes={['/product/transfer']}>
                <SubItem to="/product/transfer/list" label="Transfer List" />
              </NavGroup>
            )}
          </>
        )}

        {/* Sales */}
        {(canViewOrders || canViewStoreOrders || canViewCustomers || canViewReturns) && (
          <>
            <GroupLabel>Sales</GroupLabel>

            {(canViewOrders || canViewStoreOrders) && (
              <NavGroup icon="fa-solid fa-receipt" label="Orders" matchPrefixes={['/orders', '/order', '/store-orders', '/store-order']}>
                {canViewOrders && <SubItem to="/orders" label="Online Orders" />}
                {canViewStoreOrders && <SubItem to="/store-orders" label="Store Orders" />}
                {hasPermission('orders.create') || isAdmin || isSalesStaff ? (
                  <SubItem to="/orders/create" label="New Sale" />
                ) : null}
              </NavGroup>
            )}

            {canViewReturns && (
              <NavGroup icon="fa-solid fa-rotate-left" label="Returns" matchPrefixes={['/returns', '/return']}>
                <SubItem to="/returns" label="New Return" />
                <SubItem to="/return/log" label="Return Log" />
              </NavGroup>
            )}

            {canViewCustomers && (
              <NavItem to="/customers" icon="fa-solid fa-users" label="Customers" />
            )}

            {(hasPermission('inventory.adjust') || isAdmin) && (
              <NavItem to="/adjustments" icon="fa-solid fa-sliders" label="Adjustments" />
            )}
          </>
        )}

        {/* Management */}
        {(canViewCatalog || canViewSuppliers || canViewShops || canViewAttributes || canViewPricing || canViewReports || canViewStaff || canViewRoles) && (
          <>
            <GroupLabel>Management</GroupLabel>

            {canViewCatalog && (
              <>
                <NavGroup icon="fa-solid fa-tags" label="Categories" matchPrefixes={['/category', '/sub-category', '/child-sub-category']}>
                  <SubItem to="/category" label="Categories" />
                  <SubItem to="/sub-category" label="Sub-Categories" />
                  <SubItem to="/child-sub-category" label="Child Sub-Categories" />
                </NavGroup>

                <NavGroup icon="fa-solid fa-star" label="Brands" matchPrefixes={['/brand']}>
                  <SubItem to="/brand" label="Brand List" />
                  {(hasPermission('catalog.create') || isAdmin) && <SubItem to="/brand/create" label="Add Brand" />}
                </NavGroup>
              </>
            )}

            {canViewSuppliers && (
              <NavGroup icon="fa-solid fa-truck" label="Suppliers" matchPrefixes={['/supplier']}>
                <SubItem to="/suppliers" label="Supplier List" />
                {(hasPermission('suppliers.create') || isAdmin) && <SubItem to="/supplier/create" label="Add Supplier" />}
              </NavGroup>
            )}

            {canViewShops && (
              <NavGroup icon="fa-solid fa-store" label="Shops" matchPrefixes={['/shop']}>
                <SubItem to="/shops" label="Shop List" />
                {(hasPermission('shops.create') || isAdmin) && <SubItem to="/shop/create" label="Add Shop" />}
              </NavGroup>
            )}

            {canViewStaff && (
              <NavItem to="/staff" icon="fa-solid fa-user-tie" label="Staff Management" />
            )}
          </>
        )}

        {/* Catalog settings */}
        {(canViewAttributes || canViewPricing) && (
          <>
            <GroupLabel>Catalog</GroupLabel>
            {canViewAttributes && (
              <NavItem to="/product-attributes" icon="fa-solid fa-list-check" label="Attributes" />
            )}
            {canViewPricing && (
              <NavGroup icon="fa-solid fa-circle-dollar-to-slot" label="Pricing" matchPrefixes={['/price-formulas']}>
                <SubItem to="/price-formulas" label="Price Formulas" />
              </NavGroup>
            )}
          </>
        )}

        {(canViewReports || canViewAnalytics) && (
          <>
            <GroupLabel>Analytics</GroupLabel>
            {canViewReports && (
              <NavGroup icon="fa-solid fa-chart-bar" label="Reports" matchPrefixes={['/reports']}>
                <SubItem to="/reports" label="Summary Report" />
              </NavGroup>
            )}
            {canViewAnalytics && (
              <NavGroup icon="fa-solid fa-fire" label="Product Analytics" matchPrefixes={['/analytics']}>
                <SubItem to="/analytics/products" label="Product Rankings" />
              </NavGroup>
            )}
          </>
        )}

        {/* Admin-only settings */}
        {(canViewRoles || isAdmin || hasPermission('catalog.create') || hasPermission('banners.view') || hasPermission('banners.manage')) && (
          <>
            <GroupLabel>Settings</GroupLabel>

            <NavGroup icon="fa-solid fa-gear" label="E-commerce" matchPrefixes={['/ecommerce', '/banners']}>
              {(isAdmin || hasPermission('catalog.create')) && <SubItem to="/ecommerce/menu-list" label="Menu List" />}
              {(isAdmin || hasPermission('catalog.create')) && <SubItem to="/ecommerce/menu/create" label="Add Menu" />}
              {(isAdmin || hasPermission('banners.view') || hasPermission('banners.manage')) && (
                <SubItem to="/banners" label="Banner Slides" />
              )}
            </NavGroup>

            {isAdmin && (
              <NavItem to="/settings" icon="fa-solid fa-sliders" label="System Settings" />
            )}

            {canViewRoles && (
              <NavGroup icon="fa-solid fa-shield-halved" label="Access Control" matchPrefixes={['/roles']}>
                <SubItem to="/roles" label="Roles & Permissions" />
              </NavGroup>
            )}
          </>
        )}

        <GroupLabel>Coming Soon</GroupLabel>
        <SoonItem icon="fa-solid fa-gift" label="Gift Cards" />
        <SoonItem icon="fa-solid fa-ticket" label="Coupons" />
      </div>

      <div className="sidebar-footer">
        <div className="footer-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name ?? '—'}</div>
            <div className="user-role">{roleLabel}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
