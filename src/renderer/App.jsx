// import React, { useState, useEffect } from 'react';
// import { useAuthStore, useCartStore, useProductsStore, useSalesStore, useSettingsStore } from './store';
// import LoginScreen from './components/auth/LoginScreen';
// import POSLayout from './components/layout/POSLayout';
// import SalesModule from './components/pos/SalesModule';
// import ProductsModule from './components/products/ProductsModule';
// import InventoryModule from './components/inventory/InventoryModule';
// import CustomersModule from './components/customers/CustomersModule';
// import ReportsModule from './components/reports/ReportsModule';
// import SettingsModule from './components/settings/SettingsModule';
// import LoadingScreen from './components/common/LoadingScreen';
// import ErrorBoundary from './components/common/ErrorBoundary';
// import CategoriesModule from './components/categories/CategoriesModule';

// export default function App() {
//   const [loading, setLoading] = useState(true);
//   const [activeModule, setActiveModule] = useState('sales');
//   const { isAuthenticated, user, verifySession } = useAuthStore();
//   const { loadSettings } = useSettingsStore();

//   useEffect(() => {
//     initializeApp();
//   }, []);

//   const initializeApp = async () => {
//     try {
//       // Verify existing session
//       await verifySession();
      
//       // Load app settings
//       if (isAuthenticated) {
//         await loadSettings();
//       }
//     } catch (error) {
//       console.error('App initialization error:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return <LoadingScreen />;
//   }

//   if (!isAuthenticated) {
//     return <LoginScreen />;
//   }

//   const renderModule = () => {
//     switch (activeModule) {
//       case 'sales':
//         return <SalesModule />;
//       case 'products':
//         return <ProductsModule />;
//       case 'categories':
//       return <CategoriesModule />;
//       case 'inventory':
//         return <InventoryModule />;
//       case 'customers':
//         return <CustomersModule />;
//       case 'reports':
//         return <ReportsModule />;
//       case 'settings':
//         return <SettingsModule />;
//       default:
//         return <SalesModule />;
//     }
//   };

//   return (
//     <ErrorBoundary>
//       <POSLayout 
//         user={user} 
//         activeModule={activeModule} 
//         onModuleChange={setActiveModule}
//       >
//         {renderModule()}
//       </POSLayout>
//     </ErrorBoundary>
//   );
// }


import React, { useState, useEffect } from 'react';
import { useAuthStore, useCartStore, useProductsStore, useSalesStore, useSettingsStore } from './store';
import LoginScreen from './components/auth/LoginScreen';
import LicenseActivation from './components/auth/LicenseActivation';
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
  const [licenseValid, setLicenseValid] = useState(false);
  const [requiresActivation, setRequiresActivation] = useState(false);
  const { isAuthenticated, user, verifySession } = useAuthStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // First check license status
      const licenseInfo = await window.api.license.info();
      
      if (!licenseInfo || !licenseInfo.hasLicense) {
        // No license found, show activation screen
        setRequiresActivation(true);
        setLoading(false);
        return;
      }

      // License exists, validate it
      const validationResult = await window.api.license.validate();
      
      if (!validationResult.valid) {
        // License invalid or expired
        setRequiresActivation(true);
        setLoading(false);
        return;
      }

      // License is valid, proceed with normal flow
      setLicenseValid(true);

      // Show warning if running in offline mode
      if (validationResult.offline) {
        const daysRemaining = validationResult.daysRemaining || 0;
        if (daysRemaining <= 3) {
          // Show urgent warning
          setTimeout(() => {
            alert(`Warning: Running in offline mode. Please connect to internet within ${daysRemaining} days to validate your license.`);
          }, 2000);
        }
      }

      // Verify existing session
      await verifySession();
      
      // Load app settings
      if (isAuthenticated) {
        await loadSettings();
      }
    } catch (error) {
      console.error('App initialization error:', error);
      // In case of error, still try to load the app if license was previously valid
      const licenseInfo = await window.api.license.info();
      if (licenseInfo && licenseInfo.isWithinGracePeriod) {
        setLicenseValid(true);
        await verifySession();
      } else {
        setRequiresActivation(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseActivation = async (licenseKey) => {
    try {
      const result = await window.api.license.activate(licenseKey);
      
      if (result.success) {
        // License activated successfully
        setRequiresActivation(false);
        setLicenseValid(true);
        
        // Continue with normal app initialization
        await verifySession();
        if (isAuthenticated) {
          await loadSettings();
        }
        
        return { success: true };
      }
      
      return result;
    } catch (error) {
      console.error('License activation error:', error);
      return { 
        success: false, 
        error: 'Failed to activate license. Please check your internet connection.' 
      };
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Show license activation if required
  if (requiresActivation || !licenseValid) {
    return (
      <ErrorBoundary>
        <LicenseActivation onActivate={handleLicenseActivation} />
      </ErrorBoundary>
    );
  }

  // Show login screen if not authenticated
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