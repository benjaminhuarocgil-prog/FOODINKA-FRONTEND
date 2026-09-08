import { Routes, Route } from 'react-router-dom'
import { useOnboarding } from './hooks/useOnboarding.js'
import Home                from './pages/Home.jsx'
import Callback            from './pages/Callback.jsx'
import RestaurantDetail    from './pages/RestaurantDetail.jsx'
import Cart                from './pages/Cart.jsx'
import Checkout            from './pages/Checkout.jsx'
import Onboarding          from './pages/Onboarding.jsx'
import Dashboard           from './pages/admin/Dashboard.jsx'
import BecomeDriver        from './pages/BecomeDriver.jsx'
import DriverDashboard     from './pages/DriverDashboard.jsx'
import MyOrders            from './pages/MyOrders.jsx'
import OrderDetail         from './pages/OrderDetail.jsx'
import RestaurantDashboard from './pages/RestaurantDashboard.jsx'
import RestaurantPortal    from './pages/RestaurantPortal.jsx'
import RegisterRestaurant  from './pages/RegisterRestaurant.jsx'
import Profile from './pages/Profile.jsx'
import PaymentResult from './pages/PaymentResult.jsx'

function AppRoutes() {
  useOnboarding()
  return (
    <Routes>
      <Route path="/"                      element={<Home />} />
      <Route path="/callback"              element={<Callback />} />
      <Route path="/restaurant/:id"        element={<RestaurantDetail />} />
      <Route path="/cart"                  element={<Cart />} />
      <Route path="/checkout"              element={<Checkout />} />
      <Route path="/onboarding"            element={<Onboarding />} />
      <Route path="/admin"                 element={<Dashboard />} />
      <Route path="/become-driver"         element={<BecomeDriver />} />
      <Route path="/driver"                element={<DriverDashboard />} />
      <Route path="/orders"                element={<MyOrders />} />
      <Route path="/orders/:id"            element={<OrderDetail />} />
      <Route path="/restaurant-dashboard"  element={<RestaurantPortal />} />
      <Route path="/restaurant-orders"     element={<RestaurantDashboard />} />
      <Route path="/register-restaurant"   element={<RegisterRestaurant />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/payment/success" element={<PaymentResult status="success" />} />
      <Route path="/payment/pending" element={<PaymentResult status="pending" />} />
      <Route path="/payment/failure" element={<PaymentResult status="failure" />} />
    </Routes>
  )
}

export default function App() {
  return <AppRoutes />
}
