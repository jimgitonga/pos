import React, { useState, useEffect } from 'react';
import { useAuthStore, useCartStore, useProductsStore, useSalesStore, useSettingsStore } from './store';
import LoginScreen from './components/auth/LoginScreen';
import POSLayout from './components/layout/POSLayout';
import SalesModule from './components/pos/SalesModule';
import ProductsModule from './components/products/ProductsModule';
import InventoryModule from './components/inventory/InventoryModule';
import CustomersModule from './components/customers/CustomersModule';
import ReportsModule from './components/reports/ReportsModule';
import SettingsModule from './components/settings/SettingsModule';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';
import CategoriesModule from './components/categories/CategoriesModule';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('sales');
  const { isAuthenticated, user, verifySession } = useAuthStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Verify existing session
      await verifySession();
      
      // Load app settings
      if (isAuthenticated) {
        await loadSettings();
      }
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'sales':
        return <SalesModule />;
      case 'products':
        return <ProductsModule />;
      case 'categories':
      return <CategoriesModule />;
      case 'inventory':
        return <InventoryModule />;
      case 'customers':
        return <CustomersModule />;
      case 'reports':
        return <ReportsModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <SalesModule />;
    }
  };

  return (
    <ErrorBoundary>
      <POSLayout 
        user={user} 
        activeModule={activeModule} 
        onModuleChange={setActiveModule}
      >
        {renderModule()}
      </POSLayout>
    </ErrorBoundary>
  );
}