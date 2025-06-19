
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
//   const [initError, setInitError] = useState(null);
//   const { isAuthenticated, user, verifySession } = useAuthStore();
//   const { loadSettings } = useSettingsStore();

//   useEffect(() => {
//     initializeApp();
//   }, []);

//   const initializeApp = async () => {
//     try {
//       setInitError(null);
      
//       // First check license status with timeout
//       const licenseData = await Promise.race([
//         window.api.license.info(),
//         new Promise((_, reject) => 
//           setTimeout(() => reject(new Error('License check timeout')), 5000)
//         )
//       ]).catch(error => {
//         console.error('License info error:', error);
//         return null;
//       });

//       if (!licenseData || !licenseData.hasLicense) {
//         // No license found, show activation screen
//         setRequiresActivation(true);
//         setLoading(false);
//         return;
//       }

//       // License exists, validate it with timeout
//       const validationResult = await Promise.race([
//         window.api.license.validate(),
//         new Promise((_, reject) => 
//           setTimeout(() => reject(new Error('License validation timeout')), 10000)
//         )
//       ]).catch(error => {
//         console.error('License validation error:', error);
//         // If validation fails but we have a grace period, continue
//         if (licenseData.isWithinGracePeriod) {
//           return { 
//             valid: true, 
//             offline: true, 
//             daysRemaining: licenseData.graceDaysRemaining 
//           };
//         }
//         return { valid: false };
//       });

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
//       setInitError(error.message);
      
//       // In case of error, still try to load the app if license was previously valid
//       try {
//         const licenseData = await window.api.license.info();
//         if (licenseData && licenseData.isWithinGracePeriod) {
//           setLicenseValid(true);
//           setLicenseInfo(licenseData);
//           await verifySession();
//           setInitError(null); // Clear error if we can continue
//         } else {
//           setRequiresActivation(true);
//         }
//       } catch (fallbackError) {
//         console.error('Fallback initialization failed:', fallbackError);
//         setRequiresActivation(true);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLicenseActivation = async (licenseKey) => {
//     try {
//       // Show loading state immediately
//       const result = await Promise.race([
//         window.api.license.activate(licenseKey),
//         new Promise((_, reject) => 
//           setTimeout(() => reject(new Error('Network timeout')), 20000)
//         )
//       ]);

//       if (result.success) {
//         const now = new Date();
//         const daysRemaining = result.license?.expiresAt 
//           ? Math.floor((new Date(result.license.expiresAt) - now) / (1000 * 60 * 60 * 24))
//           : null;

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
//         } else if (daysRemaining !== null) {
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

//         return { success: true };
//       }

//       return result;
//     } catch (error) {
//       console.error("License activation error:", error);
      
//       // Specific handling for timeout
//       if (error.message === 'Network timeout') {
//         return {
//           success: false,
//           error: 'License activation is taking too long. Please check your internet connection and try again.'
//         };
//       }
      
//       return {
//         success: false,
//         error: error.message || "Failed to activate license. Please check your internet connection.",
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

//   // Show error screen if initialization completely failed
//   if (initError && !licenseValid) {
//     return (
//       <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
//         <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
//           <h2 className="text-xl font-bold text-white mb-4">Initialization Error</h2>
//           <p className="text-gray-400 mb-6">{initError}</p>
//           <button
//             onClick={() => {
//               setInitError(null);
//               setLoading(true);
//               initializeApp();
//             }}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return <LoadingScreen />;
//   }

//   // Show license activation if required
//   if (requiresActivation || !licenseValid) {
//     return (
//       <ErrorBoundary>
//         <LicenseActivation 
//           onActivate={handleLicenseActivation}
//           error={initError}
//         />
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


import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import { createPortal } from "react-dom"; // For notifications

import {
  useAuthStore,
  useCartStore, // If needed for initial data loading later
  useProductsStore, // If needed for initial data loading later
  useSalesStore, // If needed for initial data loading later
  useSettingsStore,
} from "./store";

// UI Components (assuming these paths are correct)
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

// ==========================================================
// 1. Notification Context and Component (to replace alert())
// ==========================================================
const NotificationContext = createContext(null);

const useNotification = () => useContext(NotificationContext);

const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const timeoutRef = useRef(null); // Use ref for timeout ID

  const showNotification = useCallback((message, type = 'info', duration = 5000) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setNotification({ message, type });

    // Set a new timeout to clear the notification, unless duration is 0 (for persistent)
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        setNotification(null);
      }, duration);
    }
  }, []); // No dependencies needed if timeoutRef is used correctly

  const NotificationDisplay = () => {
    if (!notification) return null;

    const baseClasses = "fixed top-4 right-4 p-4 rounded-md shadow-lg text-white z-50 transition-transform duration-300 transform translate-x-0";
    let typeClasses = "";

    switch (notification.type) {
      case 'success':
        typeClasses = "bg-green-600";
        break;
      case 'error':
        typeClasses = "bg-red-600";
        break;
      case 'warning':
        typeClasses = "bg-yellow-600";
        break;
      case 'info':
      default:
        typeClasses = "bg-blue-600";
        break;
    }

    return createPortal(
      <div className={`${baseClasses} ${typeClasses}`} role="alert">
        {notification.message}
        {notification.type === 'error' && notification.duration === 0 && (
          <button
            onClick={() => setNotification(null)}
            className="ml-4 px-2 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-sm"
          >
            &times;
          </button>
        )}
      </div>,
      document.body // Portal to the body to ensure it's on top
    );
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <NotificationDisplay />
    </NotificationContext.Provider>
  );
};

// ==========================================================
// 2. MainAppContent Component (Renders POSLayout and Modules)
// ==========================================================
const MainAppContent = ({ user, licenseInfo, showNotification }) => {
  const [activeModule, setActiveModule] = useState("sales");

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

  return (
    <POSLayout
      user={user}
      activeModule={activeModule}
      onModuleChange={setActiveModule}
      licenseInfo={licenseInfo}
      showNotification={showNotification}
    >
      {renderModule()}
    </POSLayout>
  );
};

// ==========================================================
// 3. AuthFlowManager Component (Handles Login State)
// ==========================================================
const AuthFlowManager = ({ licenseInfo, showNotification }) => {
  const { isAuthenticated, user, verifySession } = useAuthStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    const checkAuthAndLoadSettings = async () => {
      // If not authenticated, ensure session is verified (e.g., on app start/refresh)
      if (!isAuthenticated) {
        await verifySession(); // This will update isAuthenticated if a valid session exists
      }

      // If authenticated, load user-specific settings
      if (isAuthenticated && user) {
        await loadSettings();
      }
    };
    // Only run if not authenticated OR if isAuthenticated becomes true (e.g., after login)
    // Avoid running unnecessarily if already authenticated and settings loaded.
    if (!isAuthenticated || (isAuthenticated && !useSettingsStore.getState().settingsLoaded)) {
        checkAuthAndLoadSettings();
    }
  }, [isAuthenticated, user, verifySession, loadSettings]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Pass necessary props to the main app content
  return (
    <MainAppContent
      user={user}
      licenseInfo={licenseInfo}
      showNotification={showNotification}
    />
  );
};

// ==========================================================
// 4. LicenseFlowManager Component (Handles License Activation/Validation)
// ==========================================================
const LicenseFlowManager = () => {
  const [loading, setLoading] = useState(true);
  const [licenseValid, setLicenseValid] = useState(false);
  const [requiresActivation, setRequiresActivation] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [initError, setInitError] = useState(null);

  const { verifySession } = useAuthStore(); // Still needed for fallback path
  const { showNotification } = useNotification();

  const initializeApp = useCallback(async () => {
    try {
      setInitError(null); // Clear previous errors
      setLoading(true); // Ensure loading state is true at start

      // 1. First check license status with timeout
      const licenseData = await Promise.race([
        window.api.license.info(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('License info check timed out')), 5000)
        )
      ]).catch(error => {
        console.error('License info error:', error);
        return null; // Treat as no license found if info call fails
      });

      if (!licenseData || !licenseData.hasLicense) {
        setRequiresActivation(true);
        setLicenseValid(false); // Ensure license is marked invalid
        setLoading(false);
        return;
      }

      // 2. License exists, validate it with timeout
      const validationResult = await Promise.race([
        window.api.license.validate(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('License validation timed out')), 10000)
        )
      ]).catch(error => {
        console.error('License validation error:', error);
        // If validation fails but we have a grace period, allow continued use
        if (licenseData.isWithinGracePeriod) {
          showNotification(
            `Warning: License validation failed, but operating in grace period for ${licenseData.graceDaysRemaining} days. Please connect to internet.`,
            'warning', 15000
          );
          return {
            valid: true,
            offline: true,
            daysRemaining: licenseData.graceDaysRemaining,
            isPermanent: false // Grace period is never permanent
          };
        }
        // Otherwise, validation truly failed
        return { valid: false, error: error.message || "License validation failed." };
      });

      console.log("validationResult", validationResult);

      if (!validationResult.valid) {
        setRequiresActivation(true);
        setLicenseValid(false); // Ensure license is marked invalid
        setInitError(validationResult.error || "License is invalid or expired.");
        setLoading(false);
        return;
      }

      // License is valid, proceed
      setLicenseValid(true);
      setLicenseInfo(validationResult);
      setRequiresActivation(false); // Ensure activation screen is not shown

      // Show notifications for license status
      if (validationResult.offline && !validationResult.isPermanent) {
        const daysRemaining = validationResult.daysRemaining || 0;
        if (daysRemaining <= 3 && daysRemaining > 0) {
          showNotification(
            `Urgent: Running in offline mode. Connect to internet within ${daysRemaining} day(s) to validate license.`,
            'error', 0 // Persistent
          );
        } else {
             showNotification(
            `Notice: Running in offline mode. License will re-validate when online.`,
            'warning', 5000
          );
        }
      }

      if (!validationResult.isPermanent && validationResult.daysRemaining !== null) {
        const daysRemaining = validationResult.daysRemaining;
        if (daysRemaining <= 30 && daysRemaining > 0) {
          showNotification(
            `License Notice: Your license will expire in ${daysRemaining} day(s). Please renew.`,
            'warning', 10000
          );
        } else if (daysRemaining === 0) {
            showNotification(
            `License Expired: Your license has expired. Please activate a new license.`,
            'error', 0 // Persistent
          );
        }
      }

      // If everything is fine, session verification will be handled by AuthFlowManager
      // No need to call verifySession here if it's handled by AuthFlowManager.
      // await verifySession(); // This is handled by AuthFlowManager

    } catch (error) {
      console.error("App initialization error (LicenseFlowManager):", error);
      setInitError(error.message || "An unexpected error occurred during initialization.");
      setLicenseValid(false); // Assume invalid unless explicitly confirmed valid
      setRequiresActivation(true); // Default to requiring activation on error

      // IMPORTANT: Fallback to grace period if license info *can* be retrieved and is valid for grace
      try {
        const infoOnFail = await window.api.license.info();
        if (infoOnFail && infoOnFail.isWithinGracePeriod) {
          setLicenseValid(true);
          setLicenseInfo(infoOnFail);
          setRequiresActivation(false);
          setInitError(null); // Clear error if we can proceed in grace
          showNotification(
              `Warning: App started in grace period due to an error. Days remaining: ${infoOnFail.graceDaysRemaining}`,
              'warning',
              10000
          );
          // If we are in grace period, also try to verify session to load app data
          await verifySession(); // Attempt session verification for UI flow
        } else {
            // If no grace period, definitely requires activation or shows error
             setRequiresActivation(true);
             showNotification(`Critical Error: ${error.message || "Failed to initialize license."} Please retry or activate.`, 'error', 0);
        }
      } catch (fallbackError) {
        console.error('Fallback license check failed:', fallbackError);
        setRequiresActivation(true);
        setInitError(error.message || 'Failed to check license status. Please try again.');
        showNotification(`Critical Error: ${error.message || "Failed to initialize license."} Please retry or activate.`, 'error', 0);
      }

    } finally {
      setLoading(false);
    }
  }, [verifySession, showNotification]); // Dependencies for useCallback

  useEffect(() => {
    initializeApp();
  }, [initializeApp]); // Re-run if initializeApp memoized function changes

  const handleLicenseActivation = async (licenseKey) => {
    try {
      const result = await Promise.race([
        window.api.license.activate(licenseKey),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout during activation')), 20000)
        )
      ]);

      if (result.success) {
        const now = new Date();
        const expiresAtDate = result.license?.expiresAt ? new Date(result.license.expiresAt) : null;
        const daysRemaining = expiresAtDate
          ? Math.floor((expiresAtDate - now) / (1000 * 60 * 60 * 24))
          : null;

        setRequiresActivation(false);
        setLicenseValid(true);
        setLicenseInfo(result);

        if (result.isPermanent) {
          showNotification("License activated successfully! Permanent access granted.", 'success');
        } else if (daysRemaining !== null) {
          showNotification(`License activated successfully! Valid for ${daysRemaining} days.`, 'success');
        }
        // Re-run initialization to ensure all checks pass and state is consistent
        await initializeApp();
        return { success: true };
      }
      return result; // Return activation failure result (e.g., { success: false, error: "..." })
    } catch (error) {
      console.error("License activation error:", error);
      if (error.message.includes('Network timeout')) {
        return {
          success: false,
          error: 'License activation timed out. Check your internet connection and try again.'
        };
      }
      return {
        success: false,
        error: error.message || "Failed to activate license. Please try again.",
      };
    }
  };

  // Function to get license display text for the UI
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
        text: `Offline Mode (${licenseInfo.daysRemaining || 0} days grace)`,
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

  // Render logic for LicenseFlowManager
  if (loading) {
    return <LoadingScreen />;
  }

  // If initialization completely failed and no grace period
  if (initError && !licenseValid) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-white mb-4">Initialization Error</h2>
          <p className="text-gray-400 mb-6">{initError}</p>
          <button
            onClick={() => initializeApp()} // Retry button re-runs the whole initialization
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show license activation if required
  if (requiresActivation || !licenseValid) {
    return (
      <LicenseActivation
        onActivate={handleLicenseActivation}
        error={initError} // Pass current initError to activation screen
      />
    );
  }

  // If license is valid, proceed to the authentication flow
  return (
    <AuthFlowManager
      licenseInfo={getLicenseDisplayInfo()}
      showNotification={showNotification}
    />
  );
};

// ==========================================================
// 5. App Component (The root of your application)
// ==========================================================
export default function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <LicenseFlowManager />
      </NotificationProvider>
    </ErrorBoundary>
  );
}