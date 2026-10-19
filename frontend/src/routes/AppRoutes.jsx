import { Routes, Route, Navigate } from 'react-router-dom';

import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';
import PrivateRoute from './PrivateRoute';
import AdminRoute from './AdminRoute';

// Customer pages
import Home from '../pages/customer/Home';
import ProductList from '../pages/customer/ProductList';
import ProductDetail from '../pages/customer/ProductDetail';
import Cart from '../pages/customer/Cart';
import Checkout from '../pages/customer/Checkout';
import OrderSuccess from '../pages/customer/OrderSuccess';
import PaypalMock from '../pages/customer/PaypalMock';
import Login from '../pages/customer/Login';
import Register from '../pages/customer/Register';
import ForgotPassword from '../pages/customer/ForgotPassword';

import ProfileLayout from '../pages/customer/profile/ProfileLayout';
import ProfileInfo from '../pages/customer/profile/ProfileInfo';
import ProfilePassword from '../pages/customer/profile/ProfilePassword';
import ProfileOrders from '../pages/customer/profile/ProfileOrders';
import ProfileOrderDetail from '../pages/customer/profile/ProfileOrderDetail';
import ProfileAddresses from '../pages/customer/profile/ProfileAddresses';
import ProfileCoupons from '../pages/customer/profile/ProfileCoupons';
import ProfileFavorites from '../pages/customer/profile/ProfileFavorites';

// Admin pages
import AdminLogin from '../pages/admin/Login';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminProducts from '../pages/admin/Products';
import AdminProductForm from '../pages/admin/ProductForm';
import AdminCategories from '../pages/admin/Categories';
import AdminOrders from '../pages/admin/Orders';
import AdminOrderDetail from '../pages/admin/OrderDetail';
import AdminCustomers from '../pages/admin/Customers';
import AdminCoupons from '../pages/admin/Coupons';
import AdminTrending from '../pages/admin/Trending';
import AdminChat from '../pages/admin/Chat';

export default function AppRoutes() {
  return (
    <Routes>
      {/* ---- Customer ---- */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/san-pham" element={<ProductList />} />
        <Route path="/san-pham/:slug" element={<ProductDetail />} />
        <Route path="/dang-nhap" element={<Login />} />
        <Route path="/dang-ky" element={<Register />} />
        <Route path="/quen-mat-khau" element={<ForgotPassword />} />
        <Route path="/dat-lai-mat-khau" element={<Navigate to="/quen-mat-khau" replace />} />

        <Route element={<PrivateRoute />}>
          <Route path="/gio-hang" element={<Cart />} />
          <Route path="/thanh-toan" element={<Checkout />} />
          <Route path="/thanh-toan/paypal-mock/:id" element={<PaypalMock />} />
          <Route path="/dat-hang-thanh-cong/:id" element={<OrderSuccess />} />

          <Route path="/tai-khoan" element={<ProfileLayout />}>
            <Route index element={<ProfileInfo />} />
            <Route path="mat-khau" element={<ProfilePassword />} />
            <Route path="don-hang" element={<ProfileOrders />} />
            <Route path="don-hang/:id" element={<ProfileOrderDetail />} />
            <Route path="dia-chi" element={<ProfileAddresses />} />
            <Route path="ma-giam-gia" element={<ProfileCoupons />} />
            <Route path="yeu-thich" element={<ProfileFavorites />} />
          </Route>
        </Route>
      </Route>

      {/* ---- Admin ---- */}
      <Route path="/admin/dang-nhap" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="san-pham" element={<AdminProducts />} />
          <Route path="san-pham/moi" element={<AdminProductForm />} />
          <Route path="san-pham/:id" element={<AdminProductForm />} />
          <Route path="danh-muc" element={<AdminCategories />} />
          <Route path="don-hang" element={<AdminOrders />} />
          <Route path="don-hang/:id" element={<AdminOrderDetail />} />
          <Route path="khach-hang" element={<AdminCustomers />} />
          <Route path="ma-giam-gia" element={<AdminCoupons />} />
          <Route path="trending" element={<AdminTrending />} />
          <Route path="chat" element={<AdminChat />} />
        </Route>
      </Route>

      <Route path="*" element={<div className="container" style={{ padding: 60, textAlign: 'center' }}>404 — Không tìm thấy trang</div>} />
    </Routes>
  );
}
