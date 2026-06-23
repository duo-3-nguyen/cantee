import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../shared/components/AuthContext.jsx';
import { ProtectedRoute, GuestRoute } from '../shared/components/RouteGuards.jsx';
import Layout from '../shared/components/Layout.jsx';
import LoginPage from '../features/auth/LoginPage.jsx';
import RegisterPage from '../features/auth/RegisterPage.jsx';
import UserHomePage from '../features/user/UserHomePage.jsx';
import CartPage from '../features/cart/CartPage.jsx';
import UserOrdersPage from '../features/orders/UserOrdersPage.jsx';
import UserOrderDetailPage from '../features/orders/UserOrderDetailPage.jsx';
import StaffOrdersPage from '../features/staff/StaffOrdersPage.jsx';
import StaffProductsPage from '../features/staff/StaffProductsPage.jsx';
import AdminDashboardPage from '../features/admin/AdminDashboardPage.jsx';
import AdminOrdersPage from '../features/admin/AdminOrdersPage.jsx';
import AdminProductsPage from '../features/admin/AdminProductsPage.jsx';
import AdminUsersPage from '../features/admin/AdminUsersPage.jsx';
import AdminSettingsPage from '../features/admin/AdminSettingsPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Guest routes */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* User routes */}
        <Route path="/user" element={<ProtectedRoute roles={['user']}><Layout><UserHomePage /></Layout></ProtectedRoute>} />
        <Route path="/user/cart" element={<ProtectedRoute roles={['user']}><Layout><CartPage /></Layout></ProtectedRoute>} />
        <Route path="/user/orders" element={<ProtectedRoute roles={['user']}><Layout><UserOrdersPage /></Layout></ProtectedRoute>} />
        <Route path="/user/orders/:orderId" element={<ProtectedRoute roles={['user']}><Layout><UserOrderDetailPage /></Layout></ProtectedRoute>} />

        {/* Staff routes */}
        <Route path="/staff" element={<ProtectedRoute roles={['staff']}><Layout><StaffOrdersPage /></Layout></ProtectedRoute>} />
        <Route path="/staff/orders" element={<ProtectedRoute roles={['staff']}><Layout><StaffOrdersPage /></Layout></ProtectedRoute>} />
        <Route path="/staff/products" element={<ProtectedRoute roles={['staff']}><Layout><StaffProductsPage /></Layout></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout><AdminDashboardPage /></Layout></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><Layout><AdminOrdersPage /></Layout></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute roles={['admin']}><Layout><AdminProductsPage /></Layout></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><Layout><AdminUsersPage /></Layout></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><Layout><AdminSettingsPage /></Layout></ProtectedRoute>} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}