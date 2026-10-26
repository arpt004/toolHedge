import { Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from './AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { FiltersPage } from './pages/FiltersPage';
import './admin-shared.css';

export function AdminApp() {
  return (
    <AdminAuthProvider>
      {/*
        AdminApp is mounted as a plain component from App() (not as the
        element of a parent <Route>), so there's no ancestor route to
        inherit a "/admin" base from — every path here must be absolute.
        Children nested under the "/admin" Route still resolve relative to
        it as usual.
      */}
      <Routes>
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:id/edit" element={<ProductFormPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="filters" element={<FiltersPage />} />
          </Route>
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
