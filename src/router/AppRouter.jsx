import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import AuthGuard from '../features/auth/components/AuthGuard';
import {
  MasterLayout,
  Login,
  ReportsPage,
  CategoryListPage, CategoryCreatePage, CategoryEditPage,
  SubCategoryListPage, SubCategoryCreatePage, SubCategoryEditPage,
  ChildSubCategoryListPage, ChildSubCategoryCreatePage, ChildSubCategoryEditPage,
  BrandListPage, BrandCreatePage, BrandEditPage,
  ProductListPage, ProductCreatePage, ProductEditPage, ProductDetailsPage, ProductPhotoPage, ProductCsvPage,
  ProductTransferListPage, ProductTransferFormPage,
  OrderListPage, StoreOrderListPage, OrderCreatePage, OrderDetailsPage, StoreOrderDetailsPage,
  AdjustmentPage,
  CustomerListPage, CustomerOrdersPage,
  ReturnPage, ReturnListPage,
  BarcodeGeneratePage,
  SupplierListPage, SupplierCreatePage, SupplierEditPage,
  ShopListPage, ShopCreatePage, ShopEditPage,
  EmployeeListPage, EmployeeCreatePage, EmployeeEditPage,
  ProductAttributesPage, PriceFormulaListPage, PriceFormulaCreatePage, PriceFormulaEditPage,
  ApprovalsPage,
  EcommerceMenuListPage, EcommerceMenuCreatePage, EcommerceMenuEditPage,
  StaffListPage, StaffFormPage,
  RolesListPage, RolePermissionsPage,
  ProfilePage,
  BannersPage,
  StaffActivityPage,
  SystemSettingsPage,
  ProductRankingsPage, ProductAnalyticsPage,
} from './routes';

function SuspenseWrap({ children }) {
  return <Suspense fallback={<LoadingSpinner fullPage />}>{children}</Suspense>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <SuspenseWrap>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected — all wrapped in AuthGuard → MasterLayout */}
          <Route element={<AuthGuard />}>
            <Route element={<MasterLayout />}>
              <Route index element={<ReportsPage />} />
              <Route path="reports" element={<ReportsPage />} />

              {/* Catalog */}
              <Route path="category" element={<CategoryListPage />} />
              <Route path="category/create" element={<CategoryCreatePage />} />
              <Route path="category/edit/:id" element={<CategoryEditPage />} />
              <Route path="sub-category" element={<SubCategoryListPage />} />
              <Route path="sub-category/create" element={<SubCategoryCreatePage />} />
              <Route path="sub-category/edit/:id" element={<SubCategoryEditPage />} />
              <Route path="child-sub-category" element={<ChildSubCategoryListPage />} />
              <Route path="child-sub-category/create" element={<ChildSubCategoryCreatePage />} />
              <Route path="child-sub-category/edit/:id" element={<ChildSubCategoryEditPage />} />
              <Route path="brand" element={<BrandListPage />} />
              <Route path="brand/create" element={<BrandCreatePage />} />
              <Route path="brand/edit/:id" element={<BrandEditPage />} />

              {/* Products */}
              <Route path="products" element={<ProductListPage />} />
              <Route path="product/create" element={<ProductCreatePage />} />
              <Route path="product/edit/:id" element={<ProductEditPage />} />
              <Route path="product/photo/:id" element={<ProductPhotoPage />} />
              <Route path="product/csv" element={<ProductCsvPage />} />
              <Route path="product/:id" element={<ProductDetailsPage />} />
              <Route path="product/transfer/list" element={<ProductTransferListPage />} />
              <Route path="product/transfer/form/:id" element={<ProductTransferFormPage />} />

              {/* Orders */}
              <Route path="orders" element={<OrderListPage />} />
              <Route path="orders/create" element={<OrderCreatePage />} />
              <Route path="order/:id" element={<OrderDetailsPage />} />
              <Route path="store-orders" element={<StoreOrderListPage />} />
              <Route path="store-order/:id" element={<StoreOrderDetailsPage />} />
              <Route path="adjustments" element={<AdjustmentPage />} />
              <Route path="returns" element={<ReturnPage />} />
              <Route path="return/log" element={<ReturnListPage />} />
              <Route path="order/return" element={<ReturnPage />} />

              {/* Customers */}
              <Route path="customers" element={<CustomerListPage />} />
              <Route path="customers/:id/orders" element={<CustomerOrdersPage />} />

              {/* Suppliers & Shops */}
              <Route path="suppliers" element={<SupplierListPage />} />
              <Route path="supplier/create" element={<SupplierCreatePage />} />
              <Route path="supplier/edit/:id" element={<SupplierEditPage />} />
              <Route path="shops" element={<ShopListPage />} />
              <Route path="shop/create" element={<ShopCreatePage />} />
              <Route path="shop/edit/:id" element={<ShopEditPage />} />

              {/* Employees */}
              <Route path="employee" element={<EmployeeListPage />} />
              <Route path="employee/create" element={<EmployeeCreatePage />} />
              <Route path="employee/edit/:id" element={<EmployeeEditPage />} />

              {/* Pricing */}
              <Route path="product-attributes" element={<ProductAttributesPage />} />
              <Route path="price-formulas" element={<PriceFormulaListPage />} />
              <Route path="price-formulas/create" element={<PriceFormulaCreatePage />} />
              <Route path="price-formulas/:id/edit" element={<PriceFormulaEditPage />} />

              {/* Barcode */}
              <Route path="generate-bar-code" element={<BarcodeGeneratePage />} />

              {/* Approvals */}
              <Route path="approvals" element={<ApprovalsPage />} />

              {/* E-commerce menus */}
              <Route path="ecommerce/menu-list" element={<EcommerceMenuListPage />} />
              <Route path="ecommerce/menu/create" element={<EcommerceMenuCreatePage />} />
              <Route path="ecommerce/menu/:level/:id/edit" element={<EcommerceMenuEditPage />} />

              {/* Staff management */}
              <Route path="staff" element={<StaffListPage />} />
              <Route path="staff/create" element={<StaffFormPage />} />
              <Route path="staff/edit/:id" element={<StaffFormPage />} />

              {/* Roles & Permissions */}
              <Route path="roles" element={<RolesListPage />} />
              <Route path="roles/:id" element={<RolePermissionsPage />} />

              {/* Profile */}
              <Route path="profile" element={<ProfilePage />} />

              {/* Banners */}
              <Route path="banners" element={<BannersPage />} />

              {/* Staff Activity */}
              <Route path="activity-logs" element={<Navigate to="/staff" replace />} />
              <Route path="activity-logs/:id" element={<StaffActivityPage />} />

              {/* System Settings */}
              <Route path="settings" element={<SystemSettingsPage />} />

              {/* Analytics */}
              <Route path="analytics/products" element={<ProductRankingsPage />} />
              <Route path="analytics/products/:id" element={<ProductAnalyticsPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SuspenseWrap>
    </BrowserRouter>
  );
}
