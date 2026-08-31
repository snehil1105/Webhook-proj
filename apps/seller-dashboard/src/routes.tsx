import { createBrowserRouter } from 'react-router-dom';
import { SidebarLayout } from './layouts/SidebarLayout';
import { DashboardHome } from './pages/DashboardHome';
import { ProductManagement } from './pages/ProductManagement';
import { OrderManagement } from './pages/OrderManagement';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { CouponManagement } from './pages/CouponManagement';
import { CustomerRanking } from './pages/CustomerRanking';
 
export const routes = createBrowserRouter([
  {
    path: '/',
    element: <SidebarLayout />,
    children: [
      { path: '', element: <DashboardHome /> },
      { path: 'products', element: <ProductManagement /> },
      { path: 'orders', element: <OrderManagement /> },
      { path: 'customers', element: <CustomerRanking /> },
      { path: 'coupons', element: <CouponManagement /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
]);
