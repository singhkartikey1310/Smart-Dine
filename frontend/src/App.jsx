import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from './redux/slices/authSlice';
import { initSocket } from './services/socketService';
import VerifyOTP from './pages/auth/VerifyOTP';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import RestaurantLayout from './layouts/RestaurantLayout';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import RestaurantsPage from './pages/customer/RestaurantsPage';
import RestaurantDetailPage from './pages/customer/RestaurantDetailPage';
import FoodDetailPage from './pages/customer/FoodDetailPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrdersPage from './pages/customer/OrdersPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import ProfilePage from './pages/customer/ProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import WishlistPage from './pages/customer/WishlistPage';
import SearchPage from './pages/customer/SearchPage';

// Restaurant Owner Pages
import RestaurantMenuPage from './pages/restaurant/RestaurantMenuPage';
import AddFoodPage from './pages/restaurant/AddFoodPage';
import RestaurantReviewsPage from './pages/restaurant/RestaurantReviewsPage';
import RestaurantAnalyticsPage from './pages/restaurant/RestaurantAnalyticsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminFoods from './pages/admin/AdminFoods';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminCoupons from './pages/admin/AdminCoupons';

// Route Guards
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import RestaurantRoute from './routes/RestaurantRoute';

// 404
import NotFoundPage from './pages/NotFoundPage';

// Smart home redirect
const SmartHome = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  if (isAuthenticated && user?.role === 'restaurant_admin') return <Navigate to="/restaurant" replace />;
  if (isAuthenticated && user?.role === 'super_admin') return <Navigate to="/admin" replace />;
  return <HomePage />;
};

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => { if (token) dispatch(loadUser()); }, [dispatch, token]);
  useEffect(() => { if (user) initSocket(token); }, [user, token]);
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Restaurant Owner — isolated dashboard */}
      <Route path="/restaurant" element={<RestaurantRoute><RestaurantLayout /></RestaurantRoute>}>
        <Route index element={<RestaurantMenuPage />} />
        <Route path="add-food" element={<AddFoodPage />} />
        <Route path="reviews" element={<RestaurantReviewsPage />} />
        <Route path="analytics" element={<RestaurantAnalyticsPage />} />
      </Route>

      {/* Customer */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<SmartHome />} />
        <Route path="restaurants" element={<RestaurantsPage />} />
        <Route path="restaurants/:id" element={<RestaurantDetailPage />} />
        <Route path="foods/:id" element={<FoodDetailPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="restaurants" element={<AdminRestaurants />} />
        <Route path="foods" element={<AdminFoods />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="coupons" element={<AdminCoupons />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
