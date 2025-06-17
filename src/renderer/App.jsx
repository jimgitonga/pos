// import React, { useState, useEffect } from "react";
// import {
//   useAuthStore,
//   useCartStore,
//   useProductsStore,
//   useSalesStore,
//   useSettingsStore,
// } from "./store";
// import LoginScreen from "./components/auth/LoginScreen";
// import LicenseActivation from "./components/auth/LicenseActivation";
// import POSLayout from "./components/layout/POSLayout";
// import SalesModule from "./components/pos/SalesModule";
// import ProductsModule from "./components/products/ProductsModule";
// import InventoryModule from "./components/inventory/InventoryModule";
// import CustomersModule from "./components/customers/CustomersModule";
// import ReportsModule from "./components/reports/ReportsModule";
// import SettingsModule from "./components/settings/SettingsModule";
// import LoadingScreen from "./components/common/LoadingScreen";
// import ErrorBoundary from "./components/common/ErrorBoundary";
// import CategoriesModule from "./components/categories/CategoriesModule";
// import OrdersModule from "./components/orders/OrdersModule";
// import InvoicesModule from "./components/invoices/InvoicesModule";

// export default function App() {
//   const [loading, setLoading] = useState(true);
//   const [activeModule, setActiveModule] = useState("sales");
//   const [licenseValid, setLicenseValid] = useState(false);
//   const [requiresActivation, setRequiresActivation] = useState(false);
//   const [licenseInfo, setLicenseInfo] = useState(null);
//   const { isAuthenticated, user, verifySession } = useAuthStore();
//   const { loadSettings } = useSettingsStore();

//   useEffect(() => {
//     initializeApp();
//   }, []);

//   const initializeApp = async () => {
//     try {
//       // First check license status
//       const licenseData = await window.api.license.info();

//       if (!licenseData || !licenseData.hasLicense) {
//         // No license found, show activation screen
//         setRequiresActivation(true);
//         setLoading(false);
//         return;
//       }

//       // License exists, validate it
//       const validationResult = await window.api.license.validate();
//       console.log("validationResult", validationResult);

//       if (!validationResult.valid) {
//         // License invalid or expired
//         setRequiresActivation(true);
//         setLoading(false);
//         return;
//       }

//       // License is valid, proceed with normal flow
//       setLicenseValid(true);
//       setLicenseInfo(validationResult);

//       // Show warning if running in offline mode (but not for permanent licenses)
//       if (validationResult.offline && !validationResult.isPermanent) {
//         const daysRemaining = validationResult.daysRemaining || 0;
//         console.log("remaining days", daysRemaining);
//         if (daysRemaining <= 3) {
//           // Show urgent warning
//           setTimeout(() => {
//             alert(
//               `Warning: Running in offline mode. Please connect to internet within ${daysRemaining} days to validate your license.`
//             );
//           }, 2000);
//         }
//       }

//       // Show license status notification for non-permanent licenses
//       if (
//         !validationResult.isPermanent &&
//         validationResult.daysRemaining !== null
//       ) {
//         const daysRemaining = validationResult.daysRemaining;

//         // Show warning if license is expiring soon
//         if (daysRemaining <= 30 && daysRemaining > 0) {
//           setTimeout(() => {
//             alert(
//               `License Notice: Your license will expire in ${daysRemaining} days. Please renew to continue using the software.`
//             );
//           }, 2000);
//         }
//       }

//       // Log license status for debugging
//       if (validationResult.isPermanent) {
//         console.log("License Status: Permanent/Lifetime License");
//       } else {
//         console.log(
//           `License Status: ${validationResult.daysRemaining} days remaining`
//         );
//       }

//       // Verify existing session
//       await verifySession();

//       // Load app settings
//       if (isAuthenticated) {
//         await loadSettings();
//       }
//     } catch (error) {
//       console.error("App initialization error:", error);
//       // In case of error, still try to load the app if license was previously valid
//       const licenseData = await window.api.license.info();
//       if (licenseData && licenseData.isWithinGracePeriod) {
//         setLicenseValid(true);
//         setLicenseInfo(licenseData);
//         await verifySession();
//       } else {
//         setRequiresActivation(true);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLicenseActivation = async (licenseKey) => {
//     try {
//       const result = await window.api.license.activate(licenseKey);

//       const now = new Date();

//       const daysRemaining = Math.floor(
//         (new Date(result.license.expiresAt) - now) / (1000 * 60 * 60 * 24)
//       );

//       if (result.success) {
//         // License activated successfully
//         setRequiresActivation(false);
//         setLicenseValid(true);
//         setLicenseInfo(result);

//         // Show appropriate message based on license type
//         if (result.isPermanent) {
//           setTimeout(() => {
//             alert(
//               "License activated successfully! You have permanent access to this software."
//             );
//           }, 1000);
//         } else if (result.daysRemaining !== null) {
//           setTimeout(() => {
//             alert(
//               `License activated successfully! Valid for ${daysRemaining} days.`
//             );
//           }, 1000);
//         }

//         // Continue with normal app initialization
//         await verifySession();
//         if (isAuthenticated) {
//           await loadSettings();
//         }

//         return { success: false };
//       }

//       return result;
//     } catch (error) {
//       console.error("License activation error:", error);
//       return {
//         success: false,
//         error:
//           "Failed to activate license. Please check your internet connection.",
//       };
//     }
//   };

//   // Function to get license display text
//   const getLicenseDisplayInfo = () => {
//     if (!licenseInfo) return null;

//     if (licenseInfo.isPermanent) {
//       return {
//         text: "Permanent License",
//         className: "text-green-600",
//         icon: "✓",
//       };
//     }

//     if (licenseInfo.offline) {
//       return {
//         text: `Offline Mode (${licenseInfo.daysRemaining} days grace period)`,
//         className: "text-yellow-600",
//         icon: "⚠",
//       };
//     }

//     if (licenseInfo.daysRemaining !== null) {
//       const days = licenseInfo.daysRemaining;
//       if (days <= 7) {
//         return {
//           text: `License expires in ${days} days`,
//           className: "text-red-600",
//           icon: "!",
//         };
//       } else if (days <= 30) {
//         return {
//           text: `License expires in ${days} days`,
//           className: "text-yellow-600",
//           icon: "⚠",
//         };
//       } else {
//         return {
//           text: `License valid for ${days} days`,
//           className: "text-green-600",
//           icon: "✓",
//         };
//       }
//     }

//     return null;
//   };

//   if (loading) {
//     return <LoadingScreen />;
//   }

//   // Show license activation if required
//   if (requiresActivation || !licenseValid) {
//     return (
//       <ErrorBoundary>
//         <LicenseActivation onActivate={handleLicenseActivation} />
//       </ErrorBoundary>
//     );
//   }

//   // Show login screen if not authenticated
//   if (!isAuthenticated) {
//     return <LoginScreen />;
//   }

//   const renderModule = () => {
//     switch (activeModule) {
//       case "sales":
//         return <SalesModule />;
//       case "orders":
//         return <OrdersModule />;
//       case "products":
//         return <ProductsModule />;
//       case "invoices":
//         return <InvoicesModule />;
//       case "categories":
//         return <CategoriesModule />;
//       case "inventory":
//         return <InventoryModule />;
//       case "customers":
//         return <CustomersModule />;
//       case "reports":
//         return <ReportsModule />;
//       case "settings":
//         return <SettingsModule />;
//       default:
//         return <SalesModule />;
//     }
//   };

//   const licenseDisplay = getLicenseDisplayInfo();

//   return (
//     <ErrorBoundary>
//       <POSLayout
//         user={user}
//         activeModule={activeModule}
//         onModuleChange={setActiveModule}
//         licenseInfo={licenseDisplay} // Pass license info to layout if needed
//       >
//         {renderModule()}
//       </POSLayout>
//     </ErrorBoundary>
//   );
// }


import React, { useState, useEffect } from "react";
import {
  useAuthStore,
  useCartStore,
  useProductsStore,
  useSalesStore,
  useSettingsStore,
} from "./store";
import LoginScreen from "./components/auth/LoginScreen";
import LicenseActivation from "./components/auth/LicenseActivation";
import POSLayout from "./components/layout/POSLayout";
import SalesModule from "./components/pos/SalesModule";
import ProductsModule from "./components/products/ProductsModule";
import InventoryModule from "./components/inventory/InventoryModule";
import CustomersModule from "./components/customers/CustomersModule";
import ReportsModule from "./components/reports/ReportsModule";
import SettingsModule from "./components/settings/SettingsModule";
import LoadingScreen from "./components/common/LoadingScreen";
import ErrorBoundary from "./components/common/ErrorBoundary";
import CategoriesModule from "./components/categories/CategoriesModule";
import OrdersModule from "./components/orders/OrdersModule";
import InvoicesModule from "./components/invoices/InvoicesModule";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState("sales");
  const [licenseValid, setLicenseValid] = useState(false);
  const [requiresActivation, setRequiresActivation] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [initError, setInitError] = useState(null);
  const { isAuthenticated, user, verifySession } = useAuthStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setInitError(null);
      
      // First check license status with timeout
      const licenseData = await Promise.race([
        window.api.license.info(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('License check timeout')), 5000)
        )
      ]).catch(error => {
        console.error('License info error:', error);
        return null;
      });

      if (!licenseData || !licenseData.hasLicense) {
        // No license found, show activation screen
        setRequiresActivation(true);
        setLoading(false);
        return;
      }

      // License exists, validate it with timeout
      const validationResult = await Promise.race([
        window.api.license.validate(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('License validation timeout')), 10000)
        )
      ]).catch(error => {
        console.error('License validation error:', error);
        // If validation fails but we have a grace period, continue
        if (licenseData.isWithinGracePeriod) {
          return { 
            valid: true, 
            offline: true, 
            daysRemaining: licenseData.graceDaysRemaining 
          };
        }
        return { valid: false };
      });

      console.log("validationResult", validationResult);

      if (!validationResult.valid) {
        // License invalid or expired
        setRequiresActivation(true);
        setLoading(false);
        return;
      }

      // License is valid, proceed with normal flow
      setLicenseValid(true);
      setLicenseInfo(validationResult);

      // Show warning if running in offline mode (but not for permanent licenses)
      if (validationResult.offline && !validationResult.isPermanent) {
        const daysRemaining = validationResult.daysRemaining || 0;
        console.log("remaining days", daysRemaining);
        if (daysRemaining <= 3) {
          // Show urgent warning
          setTimeout(() => {
            alert(
              `Warning: Running in offline mode. Please connect to internet within ${daysRemaining} days to validate your license.`
            );
          }, 2000);
        }
      }

      // Show license status notification for non-permanent licenses
      if (
        !validationResult.isPermanent &&
        validationResult.daysRemaining !== null
      ) {
        const daysRemaining = validationResult.daysRemaining;

        // Show warning if license is expiring soon
        if (daysRemaining <= 30 && daysRemaining > 0) {
          setTimeout(() => {
            alert(
              `License Notice: Your license will expire in ${daysRemaining} days. Please renew to continue using the software.`
            );
          }, 2000);
        }
      }

      // Log license status for debugging
      if (validationResult.isPermanent) {
        console.log("License Status: Permanent/Lifetime License");
      } else {
        console.log(
          `License Status: ${validationResult.daysRemaining} days remaining`
        );
      }

      // Verify existing session
      await verifySession();

      // Load app settings
      if (isAuthenticated) {
        await loadSettings();
      }
    } catch (error) {
      console.error("App initialization error:", error);
      setInitError(error.message);
      
      // In case of error, still try to load the app if license was previously valid
      try {
        const licenseData = await window.api.license.info();
        if (licenseData && licenseData.isWithinGracePeriod) {
          setLicenseValid(true);
          setLicenseInfo(licenseData);
          await verifySession();
          setInitError(null); // Clear error if we can continue
        } else {
          setRequiresActivation(true);
        }
      } catch (fallbackError) {
        console.error('Fallback initialization failed:', fallbackError);
        setRequiresActivation(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseActivation = async (licenseKey) => {
    try {
      // Show loading state immediately
      const result = await Promise.race([
        window.api.license.activate(licenseKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 20000)
        )
      ]);

      if (result.success) {
        const now = new Date();
        const daysRemaining = result.license?.expiresAt 
          ? Math.floor((new Date(result.license.expiresAt) - now) / (1000 * 60 * 60 * 24))
          : null;

        // License activated successfully
        setRequiresActivation(false);
        setLicenseValid(true);
        setLicenseInfo(result);

        // Show appropriate message based on license type
        if (result.isPermanent) {
          setTimeout(() => {
            alert(
              "License activated successfully! You have permanent access to this software."
            );
          }, 1000);
        } else if (daysRemaining !== null) {
          setTimeout(() => {
            alert(
              `License activated successfully! Valid for ${daysRemaining} days.`
            );
          }, 1000);
        }

        // Continue with normal app initialization
        await verifySession();
        if (isAuthenticated) {
          await loadSettings();
        }

        return { success: true };
      }

      return result;
    } catch (error) {
      console.error("License activation error:", error);
      
      // Specific handling for timeout
      if (error.message === 'Network timeout') {
        return {
          success: false,
          error: 'License activation is taking too long. Please check your internet connection and try again.'
        };
      }
      
      return {
        success: false,
        error: error.message || "Failed to activate license. Please check your internet connection.",
      };
    }
  };

  // Function to get license display text
  const getLicenseDisplayInfo = () => {
    if (!licenseInfo) return null;

    if (licenseInfo.isPermanent) {
      return {
        text: "Permanent License",
        className: "text-green-600",
        icon: "✓",
      };
    }

    if (licenseInfo.offline) {
      return {
        text: `Offline Mode (${licenseInfo.daysRemaining} days grace period)`,
        className: "text-yellow-600",
        icon: "⚠",
      };
    }

    if (licenseInfo.daysRemaining !== null) {
      const days = licenseInfo.daysRemaining;
      if (days <= 7) {
        return {
          text: `License expires in ${days} days`,
          className: "text-red-600",
          icon: "!",
        };
      } else if (days <= 30) {
        return {
          text: `License expires in ${days} days`,
          className: "text-yellow-600",
          icon: "⚠",
        };
      } else {
        return {
          text: `License valid for ${days} days`,
          className: "text-green-600",
          icon: "✓",
        };
      }
    }

    return null;
  };

  // Show error screen if initialization completely failed
  if (initError && !licenseValid) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-white mb-4">Initialization Error</h2>
          <p className="text-gray-400 mb-6">{initError}</p>
          <button
            onClick={() => {
              setInitError(null);
              setLoading(true);
              initializeApp();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  // Show license activation if required
  if (requiresActivation || !licenseValid) {
    return (
      <ErrorBoundary>
        <LicenseActivation 
          onActivate={handleLicenseActivation}
          error={initError}
        />
      </ErrorBoundary>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case "sales":
        return <SalesModule />;
      case "orders":
        return <OrdersModule />;
      case "products":
        return <ProductsModule />;
      case "invoices":
        return <InvoicesModule />;
      case "categories":
        return <CategoriesModule />;
      case "inventory":
        return <InventoryModule />;
      case "customers":
        return <CustomersModule />;
      case "reports":
        return <ReportsModule />;
      case "settings":
        return <SettingsModule />;
      default:
        return <SalesModule />;
    }
  };

  const licenseDisplay = getLicenseDisplayInfo();

  return (
    <ErrorBoundary>
      <POSLayout
        user={user}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        licenseInfo={licenseDisplay} // Pass license info to layout if needed
      >
        {renderModule()}
      </POSLayout>
    </ErrorBoundary>
  );
}