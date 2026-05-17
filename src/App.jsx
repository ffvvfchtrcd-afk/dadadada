import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout';

// Lazy-load de todas as páginas admin para reduzir bundle inicial e uso de memória
const DashboardHome = React.lazy(() => import('./pages/admin/DashboardHome'));
const ProductsList = React.lazy(() => import('./pages/admin/Products/ProductsList'));
const ProductForm = React.lazy(() => import('./pages/admin/Products/ProductForm'));
const SalesList = React.lazy(() => import('./pages/admin/Sales/SalesList'));
const UsersList = React.lazy(() => import('./pages/admin/Users/UsersList'));
const StorePreview = React.lazy(() => import('./pages/admin/StorePreview/StorePreview'));
const ProductPreview = React.lazy(() => import('./pages/admin/StorePreview/ProductPreview'));
const CategoriesList = React.lazy(() => import('./pages/admin/Categories/CategoriesList'));
const StockPage = React.lazy(() => import('./pages/admin/Stock/StockPage'));
const SettingsPage = React.lazy(() => import('./pages/admin/Settings/SettingsPage'));
const CouponsPage = React.lazy(() => import('./pages/admin/Coupons/CouponsPage'));
const BannersPage = React.lazy(() => import('./pages/admin/Banners/BannersPage'));
const AnalyticsPage = React.lazy(() => import('./pages/admin/Analytics/AnalyticsPage'));

// Fallback de loading minimalista para as páginas lazy
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin" replace />} />
        <Route path="admin" element={<Suspense fallback={<PageLoader />}><DashboardHome /></Suspense>} />
        <Route path="admin/analytics" element={<Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense>} />
        <Route path="admin/categories" element={<Suspense fallback={<PageLoader />}><CategoriesList /></Suspense>} />
        <Route path="admin/products" element={<Suspense fallback={<PageLoader />}><ProductsList /></Suspense>} />
        <Route path="admin/products/new" element={<Suspense fallback={<PageLoader />}><ProductForm /></Suspense>} />
        <Route path="admin/products/:id" element={<Suspense fallback={<PageLoader />}><ProductForm /></Suspense>} />
        <Route path="admin/sales" element={<Suspense fallback={<PageLoader />}><SalesList /></Suspense>} />
        <Route path="admin/users" element={<Suspense fallback={<PageLoader />}><UsersList /></Suspense>} />
        <Route path="admin/stock" element={<Suspense fallback={<PageLoader />}><StockPage /></Suspense>} />
        <Route path="admin/coupons" element={<Suspense fallback={<PageLoader />}><CouponsPage /></Suspense>} />
        <Route path="admin/banners" element={<Suspense fallback={<PageLoader />}><BannersPage /></Suspense>} />
        <Route path="admin/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
        <Route path="admin/preview" element={<Suspense fallback={<PageLoader />}><StorePreview /></Suspense>} />
        <Route path="admin/preview/:id" element={<Suspense fallback={<PageLoader />}><ProductPreview /></Suspense>} />
      </Route>
    </Routes>
  );
}

export default App;
