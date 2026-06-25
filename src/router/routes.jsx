import { lazy } from 'react';

// Layout
const MasterLayout = lazy(() => import('../layout/MasterLayout'));

// Auth
const Login = lazy(() => import('../features/auth/pages/LoginPage'));

// Dashboard / Reports
const ReportsPage = lazy(() => import('../features/reports/pages/ReportsPage'));

// Catalog
const CategoryListPage = lazy(() => import('../features/catalog/pages/CategoryListPage'));
const CategoryCreatePage = lazy(() => import('../features/catalog/pages/CategoryCreatePage'));
const CategoryEditPage = lazy(() => import('../features/catalog/pages/CategoryEditPage'));
const SubCategoryListPage = lazy(() => import('../features/catalog/pages/SubCategoryListPage'));
const SubCategoryCreatePage = lazy(() => import('../features/catalog/pages/SubCategoryCreatePage'));
const SubCategoryEditPage = lazy(() => import('../features/catalog/pages/SubCategoryEditPage'));
const ChildSubCategoryListPage = lazy(() => import('../features/catalog/pages/ChildSubCategoryListPage'));
const ChildSubCategoryCreatePage = lazy(() => import('../features/catalog/pages/ChildSubCategoryCreatePage'));
const ChildSubCategoryEditPage = lazy(() => import('../features/catalog/pages/ChildSubCategoryEditPage'));
const BrandListPage = lazy(() => import('../features/catalog/pages/BrandListPage'));
const BrandCreatePage = lazy(() => import('../features/catalog/pages/BrandCreatePage'));
const BrandEditPage = lazy(() => import('../features/catalog/pages/BrandEditPage'));

// Products
const ProductListPage = lazy(() => import('../features/products/pages/ProductListPage'));
const ProductCreatePage = lazy(() => import('../features/products/pages/ProductCreatePage'));
const ProductEditPage = lazy(() => import('../features/products/pages/ProductEditPage'));
const ProductDetailsPage = lazy(() => import('../features/products/pages/ProductDetailsPage'));
const ProductPhotoPage = lazy(() => import('../features/products/pages/ProductPhotoPage'));
const ProductCsvPage = lazy(() => import('../features/products/pages/ProductCsvPage'));
const ProductTransferListPage = lazy(() => import('../features/inventory/pages/ProductTransferListPage'));
const ProductTransferFormPage = lazy(() => import('../features/inventory/pages/ProductTransferFormPage'));

// Orders
const OrderListPage = lazy(() => import('../features/orders/pages/OrderListPage'));
const StoreOrderListPage = lazy(() => import('../features/orders/pages/StoreOrderListPage'));
const OrderCreatePage = lazy(() => import('../features/orders/pages/OrderCreatePage'));
const OrderDetailsPage = lazy(() => import('../features/orders/pages/OrderDetailsPage'));
const StoreOrderDetailsPage = lazy(() => import('../features/orders/pages/StoreOrderDetailsPage'));
const AdjustmentPage = lazy(() => import('../features/inventory/pages/AdjustmentPage'));

// Customers
const CustomerListPage = lazy(() => import('../features/orders/pages/CustomerListPage'));
const CustomerOrdersPage = lazy(() => import('../features/orders/pages/CustomerOrdersPage'));

// Returns
const ReturnPage = lazy(() => import('../features/returns/pages/ReturnPage'));
const ReturnListPage = lazy(() => import('../features/returns/pages/ReturnListPage'));

// Barcode
const BarcodeGeneratePage = lazy(() => import('../features/barcode/pages/BarcodeGeneratePage'));

// Suppliers
const SupplierListPage = lazy(() => import('../features/suppliers/pages/SupplierListPage'));
const SupplierCreatePage = lazy(() => import('../features/suppliers/pages/SupplierFormPage'));
const SupplierEditPage = lazy(() => import('../features/suppliers/pages/SupplierFormPage'));

// Shops
const ShopListPage = lazy(() => import('../features/shops/pages/ShopListPage'));
const ShopCreatePage = lazy(() => import('../features/shops/pages/ShopFormPage'));
const ShopEditPage = lazy(() => import('../features/shops/pages/ShopFormPage'));

// Employees
const EmployeeListPage = lazy(() => import('../features/employees/pages/EmployeeListPage'));
const EmployeeCreatePage = lazy(() => import('../features/employees/pages/EmployeeFormPage'));
const EmployeeEditPage = lazy(() => import('../features/employees/pages/EmployeeFormPage'));

// Pricing
const ProductAttributesPage = lazy(() => import('../features/pricing/pages/ProductAttributesPage'));
const PriceFormulaListPage = lazy(() => import('../features/pricing/pages/PriceFormulaListPage'));
const PriceFormulaCreatePage = lazy(() => import('../features/pricing/pages/PriceFormulaCreatePage'));
const PriceFormulaEditPage = lazy(() => import('../features/pricing/pages/PriceFormulaEditPage'));

// Approvals
const ApprovalsPage = lazy(() => import('../features/approvals/pages/ApprovalsPage'));

// Settings (ecommerce menu)
const EcommerceMenuListPage = lazy(() => import('../features/approvals/pages/EcommerceMenuListPage'));
const EcommerceMenuCreatePage = lazy(() => import('../features/approvals/pages/EcommerceMenuCreatePage'));
const EcommerceMenuEditPage = lazy(() => import('../features/approvals/pages/EcommerceMenuEditPage'));

// Staff management
const StaffListPage = lazy(() => import('../features/staff/pages/StaffListPage'));
const StaffFormPage = lazy(() => import('../features/staff/pages/StaffFormPage'));

// Roles & Permissions
const RolesListPage = lazy(() => import('../features/roles/pages/RolesListPage'));
const RolePermissionsPage = lazy(() => import('../features/roles/pages/RolePermissionsPage'));

// Profile
const ProfilePage = lazy(() => import('../features/profile/pages/ProfilePage'));

// Banners
const BannersPage = lazy(() => import('../features/banners/pages/BannersPage'));

// Staff Activity
const StaffActivityPage  = lazy(() => import('../features/activity-logs/pages/StaffActivityPage'));

// System Settings
const SystemSettingsPage = lazy(() => import('../features/settings/pages/SystemSettingsPage'));

// Analytics
const ProductRankingsPage = lazy(() => import('../features/analytics/pages/ProductRankingsPage'));
const ProductAnalyticsPage = lazy(() => import('../features/analytics/pages/ProductAnalyticsPage'));

export {
  MasterLayout,
  Login,
  ReportsPage,
  StaffActivityPage,
  SystemSettingsPage,
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
  ProductRankingsPage, ProductAnalyticsPage,
};
