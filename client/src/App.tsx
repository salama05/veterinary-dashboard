import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';

import Treatments from './pages/Treatments';
import Inventory from './pages/Inventory';
import OpeningStock from './pages/OpeningStock';
import ConsumedProducts from './pages/ConsumedProducts';
import Appointments from './pages/Appointments';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useContext(AuthContext)!;
  if (loading) return <div>Loading...</div>;
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
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="treatments" element={<Treatments />} />
        <Route path="sales" element={<Sales />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="customers" element={<Customers />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="opening-stock" element={<OpeningStock />} />
        <Route path="consumed-products" element={<ConsumedProducts />} />
        <Route path="appointments" element={<Appointments />} />
      </Route>
    </Routes>
  );
}

export default App;
