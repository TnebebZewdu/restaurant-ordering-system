import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink
} from 'react-router-dom';

import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrderPage from './pages/OrderPage';

import KitchenView from './components/KitchenView';
import AdminAnalytics from './components/AdminAnalytics';
import ProtectedRoute from './components/ProtectedRoute';

import { CustomerProvider } from './context/CustomerContext';
import TableQRPage from './pages/TableQRPage';

function CustomerNavigation() {
  return (
    <nav className="bg-white border border-orange-100 shadow-sm rounded-2xl mb-6 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <NavLink
          to="/"
          className="text-xl font-extrabold text-orange-600"
        >
          🍽️ Restaurant
        </NavLink>

        <div className="flex items-center gap-2 overflow-x-auto">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-orange-50'
              }`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/menu"
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-orange-50'
              }`
            }
          >
            Menu
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-orange-50'
              }`
            }
          >
            🛒 Cart
          </NavLink>

          <NavLink
            to="/order"
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-orange-50'
              }`
            }
          >
            My Order
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

function CustomerLayout({ children }) {
  return (
    <>
      <CustomerNavigation />
      {children}
    </>
  );
}

function App() {
  return (
    <Router>
      <CustomerProvider>
        <div className="min-h-screen bg-gray-100 font-sans pb-12">
          <main className="max-w-7xl mx-auto px-6 py-6">
            <Routes>

              {/* Customer Home */}
              <Route
                path="/"
                element={
                  <CustomerLayout>
                    <HomePage />
                  </CustomerLayout>
                }
              />

              {/* Customer Menu */}
              <Route
                path="/menu"
                element={
                  <CustomerLayout>
                    <MenuPage />
                  </CustomerLayout>
                }
              />

              {/* Customer Cart */}
              <Route
                path="/cart"
                element={
                  <CustomerLayout>
                    <CartPage />
                  </CustomerLayout>
                }
              />

              {/* Customer Order Tracking */}
              <Route
                path="/order"
                element={
                  <CustomerLayout>
                    <OrderPage />
                  </CustomerLayout>
                }
              />

              {/* Kitchen */}
              <Route
                path="/kitchen"
                element={
                  <ProtectedRoute
                    role="kitchen"
                    title="Kitchen Display System"
                  >
                    <KitchenView />
                  </ProtectedRoute>
                }
              />

              {/* Admin */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute
                    role="admin"
                    title="Manager Dashboard"
                  >
                    <AdminAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/qr"
                element={
                  <ProtectedRoute
                    role="admin"
                    title="Manager Dashboard"
                  >
                    <TableQRPage />
                  </ProtectedRoute>
                }
              />

            </Routes>
          </main>
        </div>
      </CustomerProvider>
    </Router>
  );
}

export default App;