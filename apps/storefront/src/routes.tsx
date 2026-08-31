import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { OrderHistory } from './pages/OrderHistory';
import { OrderDetail } from './pages/OrderDetail';
import { SearchResults } from './pages/SearchResults';
import { Wishlist } from './pages/Wishlist';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { CartProvider } from './context/CartContext';
import { AddressProvider } from './context/AddressContext';
import { LanguageProvider } from './context/LanguageContext';
 
export const routes = createBrowserRouter([
  {
    path: '/',
    element: (
      <LanguageProvider>
        <AddressProvider>
          <CartProvider>
            <MainLayout />
          </CartProvider>
        </AddressProvider>
      </LanguageProvider>
    ),
    children: [
      { path: '', element: <Home /> },
      { path: 'products', element: <Catalog /> },
      { path: 'products/:id', element: <ProductDetail /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order-confirmation', element: <OrderConfirmation /> },
      { path: 'orders', element: <OrderHistory /> },
      { path: 'orders/:orderId', element: <OrderDetail /> },
      { path: 'search', element: <SearchResults /> },
      { path: 'wishlist', element: <Wishlist /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: '*', element: <Home /> },
    ],
  },
]);
