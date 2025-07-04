
// src/renderer/components/layout/POSLayout.jsx
import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Grid3X3,
  Folder,
  Menu,
  X,
  Bell,
  LogOut,
  User,
  Clock,
  Minimize2,
  Maximize2,
  Minus,
  FileText,
  Receipt,
} from "lucide-react";
import { useAuthStore } from "../../store";
import toast from "react-hot-toast";

export default function POSLayout({
  user,
  activeModule,
  onModuleChange,
  children,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [dailyStats, setDailyStats] = useState({
    revenue: "KES 0",
    transactions: "0",
    loading: true,
  });
  const { logout } = useAuthStore();

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Auto-collapse sidebar on mobile
      if (width < 768) {
        setSidebarCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Expose refresh function globally so sales components can call it
  React.useEffect(() => {
    window.refreshSalesStats = fetchDailyStats;
    return () => {
      delete window.refreshSalesStats;
    };
  }, []);

  const modules = [
    { id: "sales", name: "Sales", icon: ShoppingCart, color: "bg-blue-600" },
    { id: "orders", name: "Orders", icon: FileText, color: "bg-indigo-600" },
    {
      id: "invoices",
      name: "Invoices",
      icon: Receipt,
      color: "bg-purple-600",
    },
    { id: "products", name: "Products", icon: Grid3X3, color: "bg-green-600" },
    {
      id: "categories",
      name: "Categories",
      icon: Folder,
      color: "bg-yellow-600",
    },
    {
      id: "inventory",
      name: "Inventory",
      icon: Package,
      color: "bg-purple-600",
    },
    { id: "customers", name: "Customers", icon: Users, color: "bg-orange-600" },
    { id: "reports", name: "Reports", icon: BarChart3, color: "bg-pink-600" },
    { id: "settings", name: "Settings", icon: Settings, color: "bg-gray-600" },
  ];

  // Filter modules based on user role
  const availableModules = modules.filter((module) => {
    if (user.role === "cashier") {
      return ["sales", "customers"].includes(module.id);
    }
    if (user.role === "manager") {
      return module.id !== "settings";
    }
    return true; // Admin has access to all
  });

  // Fetch today's sales data
  const fetchDailyStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const result = await window.api.sales.getDailySummary(today);

      if (result.success && result.summary) {
        const { summary } = result;
        setDailyStats({
          revenue: `KES ${(summary.gross_revenue || 0).toLocaleString()}`,
          transactions: (summary.total_sales || 0).toString(),
          loading: false,
        });
      } else {
        // Handle API error but don't show error to user, just show 0 values
        setDailyStats({
          revenue: "KES 0",
          transactions: "0",
          loading: false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch daily stats:", error);
      setDailyStats({
        revenue: "KES 0",
        transactions: "0",
        loading: false,
      });
    }
  };

  // Initial load and refresh interval
  useEffect(() => {
    fetchDailyStats();

    // Refresh every 2 minutes
    const interval = setInterval(fetchDailyStats, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen for sale events and refresh immediately
  useEffect(() => {
    const handleSaleCompleted = () => {
      fetchDailyStats();
    };

    // Listen for custom sale completion events
    window.addEventListener("saleCompleted", handleSaleCompleted);

    return () => {
      window.removeEventListener("saleCompleted", handleSaleCompleted);
    };
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  const handleWindowControl = (action) => {
    window.api.window[action]();
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [currentTime, setCurrentTime] = React.useState(getCurrentTime());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle module change and close sidebar on mobile
  const handleModuleChange = (moduleId) => {
    onModuleChange(moduleId);
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Custom Title Bar - Hide on mobile for more space */}
      {!isMobile && (
        <div
          className="bg-gray-800 border-b border-gray-700 flex items-center justify-between px-2 sm:px-4 py-1 sm:py-2 select-none flex-shrink-0"
          style={{ WebkitAppRegion: "drag" }}
        >
          <div
            className="flex items-center gap-2 sm:gap-4"
            style={{ WebkitAppRegion: "no-drag" }}
          >
            <h1 className="text-sm sm:text-lg font-bold text-white">Modern POS System</h1>
          </div>

          <div
            className="flex items-center gap-1 sm:gap-2"
            style={{ WebkitAppRegion: "no-drag" }}
          >
            <button
              onClick={() => handleWindowControl("minimize")}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            </button>
            <button
              onClick={() => handleWindowControl("maximize")}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            </button>
            <button
              onClick={() => handleWindowControl("close")}
              className="p-1 hover:bg-red-600 rounded transition-colors"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? (
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              ) : (
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              )}
            </button>

            {!isMobile && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <span className="text-xs sm:text-sm text-gray-300">{currentTime}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications - Hide on very small screens */}
            {!isMobile && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg transition-colors relative"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
                  <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-64 sm:w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-3 sm:p-4 border-b border-gray-700">
                      <h3 className="font-semibold text-sm sm:text-base text-white">Notifications</h3>
                    </div>
                    <div className="max-h-64 sm:max-h-96 overflow-y-auto">
                      <div className="p-3 sm:p-4 hover:bg-gray-700 cursor-pointer">
                        <p className="text-xs sm:text-sm text-white">Low stock alert</p>
                        <p className="text-xs text-gray-400 mt-1">
                          5 products are running low
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 hover:bg-gray-700 cursor-pointer">
                        <p className="text-xs sm:text-sm text-white">Daily report ready</p>
                        <p className="text-xs text-gray-400 mt-1">
                          View yesterday's sales summary
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu */}
            <div className="flex items-center gap-2 sm:gap-3 border-l border-gray-700 pl-2 sm:pl-4">
              <div className="text-right">
                <p className="text-xs sm:text-sm text-white font-medium truncate max-w-[100px] sm:max-w-none">
                  {user.full_name}
                </p>
                {!isMobile && (
                  <p className="text-xs text-gray-400">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 sm:p-2 hover:bg-red-600 rounded-lg transition-colors group"
                title="Logout"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Overlay */}
        {!sidebarCollapsed && isMobile && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            ${sidebarCollapsed ? 'w-0' : 'w-48 sm:w-56 md:w-64'} 
            ${isMobile ? 'absolute left-0 top-0 h-full z-50' : 'relative'}
            bg-gray-800 border-r border-gray-700 transition-all duration-300 overflow-hidden flex-shrink-0
          `}
        >
          <nav className="p-1.5 sm:p-2 space-y-1 sm:space-y-2 overflow-y-auto h-full">
            {availableModules.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;

              return (
                <button
                  key={module.id}
                  onClick={() => handleModuleChange(module.id)}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg transition-all text-xs sm:text-sm ${
                    isActive
                      ? `${module.color} text-white shadow-lg`
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                  }`}
                  title={module.name}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="font-medium truncate">
                    {module.name}
                  </span>
                </button>
              );
            })}

            {/* Quick Stats - Show only on desktop */}
            {!isMobile && !isTablet && (
              <div className="mt-auto pt-4 border-t border-gray-700">
                <div className="px-2 sm:px-3 space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs text-gray-400">Today's Sales</p>
                    <p className="text-sm sm:text-lg font-bold text-white">
                      {dailyStats.loading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs">Loading...</span>
                        </span>
                      ) : (
                        dailyStats.revenue
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Transactions</p>
                    <p className="text-sm sm:text-lg font-bold text-white">
                      {dailyStats.loading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs">Loading...</span>
                        </span>
                      ) : (
                        dailyStats.transactions
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden bg-gray-900">
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Status Bar - Simplified on mobile */}
      <footer className="bg-gray-800 border-t border-gray-700 px-2 sm:px-4 py-1 sm:py-2 flex-shrink-0">
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <div className="flex items-center gap-2 sm:gap-4 text-gray-400">
            <span className="flex items-center gap-1 sm:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
              <span className="hidden sm:inline">Connected</span>
            </span>
            {!isMobile && <span>Terminal: POS-001</span>}
          </div>
          {!isMobile && (
            <div className="text-gray-400">Version 1.0.0</div>
          )}
        </div>
      </footer>
    </div>
  );
}