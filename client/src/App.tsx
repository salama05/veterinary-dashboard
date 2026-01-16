import React, { useContext, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Products = React.lazy(() => import('./pages/Products'));
const Suppliers = React.lazy(() => import('./pages/Suppliers'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Purchases = React.lazy(() => import('./pages/Purchases'));
const Sales = React.lazy(() => import('./pages/Sales'));
const Treatments = React.lazy(() => import('./pages/Treatments'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const OpeningStock = React.lazy(() => import('./pages/OpeningStock'));
const ConsumedProducts = React.lazy(() => import('./pages/ConsumedProducts'));
const Appointments = React.lazy(() => import('./pages/Appointments'));
const Analysis = React.lazy(() => import('./pages/Analysis'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useContext(AuthContext)!;
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={
          <Suspense fallback={<LoadingSpinner />}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="products" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Products />
          </Suspense>
        } />
        <Route path="purchases" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Purchases />
          </Suspense>
        } />
        <Route path="treatments" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Treatments />
          </Suspense>
        } />
        <Route path="sales" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Sales />
          </Suspense>
        } />
        <Route path="suppliers" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Suppliers />
          </Suspense>
        } />
        <Route path="customers" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Customers />
          </Suspense>
        } />
        <Route path="inventory" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Inventory />
          </Suspense>
        } />
        <Route path="opening-stock" element={
          <Suspense fallback={<LoadingSpinner />}>
            <OpeningStock />
          </Suspense>
        } />
        <Route path="consumed-products" element={
          <Suspense fallback={<LoadingSpinner />}>
            <ConsumedProducts />
          </Suspense>
        } />
        <Route path="appointments" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Appointments />
          </Suspense>
        } />
        <Route path="analysis" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Analysis />
          </Suspense>
        } />
      </Route>
    </Routes>
  );
}

export default App;
