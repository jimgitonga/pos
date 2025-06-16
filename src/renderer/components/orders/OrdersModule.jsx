// src/renderer/components/orders/OrdersModule.jsx - COMPLETE NEW FILE
import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Calendar, Download, Eye, RotateCcw, 
  Trash2, TrendingUp, TrendingDown, DollarSign, 
  ShoppingCart, Package, RefreshCw, ChevronDown,
  FileText, ArrowUp, ArrowDown
} from 'lucide-react';

export default function OrdersModule() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalRefunds: 0,
    netProfit: 0,
    averageOrderValue: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'today',
    customStartDate: '',
    customEndDate: '',
    minAmount: '',
    maxAmount: '',
    cashier: 'all'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [cashiers, setCashiers] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });

  useEffect(() => {
    loadOrdersAndAnalytics();
    loadCashiers();
  }, []);

  useEffect(() => {
    loadOrdersAndAnalytics();
  }, [filters.dateRange, filters.customStartDate, filters.customEndDate]);

  useEffect(() => {
    applyClientFilters();
  }, [orders, filters.status, filters.minAmount, filters.maxAmount, filters.cashier, searchTerm, sortConfig]);

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDateRange = (range) => {
    const today = getCurrentDate();
    const now = new Date();
    
    switch (range) {
      case 'today':
        return { start: today, end: today };
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        return { start: yesterdayStr, end: yesterdayStr };
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        return { start: weekStartStr, end: today };
      case 'month':
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        return { start: monthStart, end: today };
      case 'year':
        const yearStart = `${now.getFullYear()}-01-01`;
        return { start: yearStart, end: today };
      case 'custom':
        return { start: filters.customStartDate, end: filters.customEndDate };
      default:
        return { start: null, end: null };
    }
  };

  const loadOrdersAndAnalytics = async () => {
    try {
      setLoading(true);
      console.log('Loading orders for filter:', filters.dateRange);
      
      let ordersResult;
      let analyticsData = {
        totalSales: 0,
        totalRevenue: 0,
        totalRefunds: 0,
        netProfit: 0,
        averageOrderValue: 0
      };

      // Get date range for filtering
      const dateRange = getDateRange(filters.dateRange);
      console.log('Date range:', dateRange);

      if (dateRange.start && dateRange.end) {
        // Load orders by date range
        ordersResult = await window.api.sales.getByDateRange(dateRange.start, dateRange.end);
        console.log('Orders loaded:', ordersResult);

        // Get accurate analytics for today using daily summary
        if (filters.dateRange === 'today') {
          try {
            const summaryResult = await window.api.sales.getDailySummary(dateRange.start);
            console.log('Daily summary:', summaryResult);
            
            if (summaryResult.success && summaryResult.summary) {
              const { summary } = summaryResult;
              analyticsData = {
                totalSales: summary.total_sales || 0,
                totalRevenue: summary.gross_revenue || 0,
                totalRefunds: 0, // Calculate from orders if needed
                netProfit: (summary.gross_revenue || 0) * 0.25, // Estimate 25% profit
                averageOrderValue: summary.average_sale || 0
              };
            }
          } catch (summaryError) {
            console.error('Failed to get daily summary:', summaryError);
          }
        }
      } else {
        // Load recent orders if no date filter
        ordersResult = await window.api.sales.getRecent(100);
      }

      if (ordersResult && ordersResult.success) {
        console.log('Setting orders:', ordersResult.sales.length);
        setOrders(ordersResult.sales || []);
        
        // Calculate analytics from orders if not already set
        if (filters.dateRange !== 'today' || analyticsData.totalSales === 0) {
          analyticsData = calculateAnalyticsFromOrders(ordersResult.sales || []);
        }
      } else {
        console.error('Failed to load orders:', ordersResult);
        setOrders([]);
      }

      setAnalytics(analyticsData);
      console.log('Analytics set:', analyticsData);

    } catch (error) {
      console.error('Failed to load orders and analytics:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalyticsFromOrders = (ordersList) => {
    const validOrders = ordersList.filter(order => order.payment_status !== 'refunded');
    const refundedOrders = ordersList.filter(order => order.payment_status === 'refunded');
    
    const totalSales = validOrders.length;
    const totalRevenue = validOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    const totalRefunds = refundedOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    const netProfit = totalRevenue * 0.25; // Estimate 25% profit margin
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      totalSales,
      totalRevenue,
      totalRefunds,
      netProfit,
      averageOrderValue
    };
  };

  const applyClientFilters = () => {
    let filtered = [...orders];
    console.log('Applying client filters to', orders.length, 'orders');

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.first_name && order.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.last_name && order.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.cashier_name && order.cashier_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.payment_status === filters.status);
    }

    // Amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter(order => order.total_amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(order => order.total_amount <= parseFloat(filters.maxAmount));
    }

    // Cashier filter
    if (filters.cashier !== 'all') {
      filtered = filtered.filter(order => order.user_id === parseInt(filters.cashier));
    }

    // Sort orders
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    console.log('Filtered orders:', filtered.length);
    setFilteredOrders(filtered);
  };

  const loadCashiers = async () => {
    try {
      const result = await window.api.auth.getUsers();
      if (result.success) {
        setCashiers(result.users.filter(user => 
          ['cashier', 'manager', 'admin'].includes(user.role)
        ));
      }
    } catch (error) {
      console.error('Failed to load cashiers:', error);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      dateRange: 'today',
      customStartDate: '',
      customEndDate: '',
      minAmount: '',
      maxAmount: '',
      cashier: 'all'
    });
    setSearchTerm('');
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const result = await window.api.sales.getById(orderId);
      if (result.success) {
        setSelectedOrder(result.sale);
        setShowOrderModal(true);
      }
    } catch (error) {
      console.error('Failed to load order details:', error);
    }
  };

  const handleVoidOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to void this order? This action cannot be undone.')) {
      return;
    }

    const reason = window.prompt('Please enter the reason for voiding this order:');
    if (!reason) return;

    try {
      const result = await window.api.sales.void(orderId, reason);
      if (result.success) {
        loadOrdersAndAnalytics(); // Refresh the list
        alert('Order voided successfully');
      } else {
        alert('Failed to void order: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to void order:', error);
      alert('Failed to void order');
    }
  };

  const exportData = () => {
    const headers = ['Invoice', 'Date', 'Customer', 'Cashier', 'Total', 'Status'];
    const csvData = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order.invoice_number,
        new Date(order.created_at).toLocaleDateString(),
        order.first_name ? `${order.first_name} ${order.last_name}` : 'Walk-in',
        order.cashier_name,
        order.total_amount,
        order.payment_status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${getCurrentDate()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      partial: { color: 'bg-blue-100 text-blue-800', label: 'Partial' },
      refunded: { color: 'bg-red-100 text-red-800', label: 'Refunded' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Orders & Sales History</h1>
            <p className="text-gray-400">Track and analyze all sales transactions</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Current Date: {getCurrentDate()}</p>
            <p className="text-gray-400 text-xs">
              Filter: {filters.dateRange} 
              {filters.dateRange !== 'all' && ` (${getDateRange(filters.dateRange).start})`}
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Sales</p>
              <p className="text-white text-2xl font-bold">{analytics.totalSales}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Refunds</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(analytics.totalRefunds)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Est. Profit</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(analytics.netProfit)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Order</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(analytics.averageOrderValue)}</p>
            </div>
            <Package className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice number, customer, or cashier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="refunded">Refunded</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={loadOrdersAndAnalytics}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            <button
              onClick={exportData}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {filters.dateRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.customStartDate}
                      onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.customEndDate}
                      onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Min Amount</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Max Amount</label>
                <input
                  type="number"
                  placeholder="999999"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Cashier</label>
                <select
                  value={filters.cashier}
                  onChange={(e) => handleFilterChange('cashier', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Cashiers</option>
                  {cashiers.map(cashier => (
                    <option key={cashier.id} value={cashier.id}>
                      {cashier.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
              >
                Clear Filters
              </button>
              <span className="text-gray-400 text-sm flex items-center">
                Showing {filteredOrders.length} of {orders.length} orders
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th 
                  className="text-left p-4 text-gray-300 font-medium cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort('invoice_number')}
                >
                  <div className="flex items-center gap-2">
                    Invoice
                    {sortConfig.key === 'invoice_number' && (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-left p-4 text-gray-300 font-medium cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-2">
                    Date & Time
                    {sortConfig.key === 'created_at' && (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="text-left p-4 text-gray-300 font-medium">Customer</th>
                <th className="text-left p-4 text-gray-300 font-medium">Cashier</th>
                <th 
                  className="text-right p-4 text-gray-300 font-medium cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort('total_amount')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Total
                    {sortConfig.key === 'total_amount' && (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="text-center p-4 text-gray-300 font-medium">Status</th>
                <th className="text-center p-4 text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Loading orders...
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-gray-400">
                    {filters.dateRange === 'today' ? (
                      <div>
                        <p className="text-lg mb-2">No sales found for today</p>
                        <p className="text-sm">
                          Current filter: {getDateRange('today').start}
                        </p>
                        <p className="text-xs mt-2">
                          Try selecting "Yesterday" or "This Week" to see recent sales
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p>No orders found matching your criteria</p>
                        <p className="text-sm mt-1">
                          Try adjusting your filters or date range
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-blue-400">{order.invoice_number}</div>
                    </td>
                    <td className="p-4 text-gray-300">
                      <div className="text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">
                      {order.first_name ? `${order.first_name} ${order.last_name}` : 'Walk-in Customer'}
                    </td>
                    <td className="p-4 text-gray-300">
                      {order.cashier_name}
                    </td>
                    <td className="p-4 text-right text-white font-medium">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(order.payment_status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => viewOrderDetails(order.id)}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.payment_status !== 'refunded' && (
                          <button
                            onClick={() => handleVoidOrder(order.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Void Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Order Details</h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Order Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Order Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Invoice:</span>
                        <span className="text-white font-medium">{selectedOrder.invoice_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Date:</span>
                        <span className="text-white">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        {getStatusBadge(selectedOrder.payment_status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cashier:</span>
                        <span className="text-white">{selectedOrder.cashier_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {(selectedOrder.first_name || selectedOrder.customer_email) && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Customer Information</h3>
                      <div className="space-y-2">
                        {selectedOrder.first_name && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Name:</span>
                            <span className="text-white">{selectedOrder.first_name} {selectedOrder.last_name}</span>
                          </div>
                        )}
                        {selectedOrder.phone && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Phone:</span>
                            <span className="text-white">{selectedOrder.phone}</span>
                          </div>
                        )}
                        {selectedOrder.customer_email && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Email:</span>
                            <span className="text-white">{selectedOrder.customer_email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal:</span>
                      <span className="text-white">{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tax:</span>
                      <span className="text-white">{formatCurrency(selectedOrder.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Discount:</span>
                      <span className="text-white">-{formatCurrency(selectedOrder.discount_amount)}</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between">
                        <span className="text-white font-semibold">Total:</span>
                        <span className="text-white font-bold text-lg">{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-white mb-3">Payment Details</h4>
                      <div className="space-y-2">
                        {selectedOrder.payments.map((payment, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-gray-400 capitalize">{payment.payment_method.replace('_', ' ')}:</span>
                            <span className="text-white">{formatCurrency(payment.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-white mb-2">Notes</h4>
                      <p className="text-gray-300 text-sm bg-gray-700 p-3 rounded">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Items Ordered</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="text-left p-3 text-gray-300 font-medium">Product</th>
                        <th className="text-center p-3 text-gray-300 font-medium">SKU</th>
                        <th className="text-center p-3 text-gray-300 font-medium">Qty</th>
                        <th className="text-right p-3 text-gray-300 font-medium">Unit Price</th>
                        <th className="text-right p-3 text-gray-300 font-medium">Discount</th>
                        <th className="text-right p-3 text-gray-300 font-medium">Tax</th>
                        <th className="text-right p-3 text-gray-300 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items && selectedOrder.items.map((item, index) => (
                        <tr key={index} className="border-t border-gray-600">
                          <td className="p-3">
                            <div className="text-white font-medium">{item.product_name}</div>
                            {item.barcode && (
                              <div className="text-xs text-gray-400">Barcode: {item.barcode}</div>
                            )}
                          </td>
                          <td className="p-3 text-center text-gray-300">{item.sku}</td>
                          <td className="p-3 text-center text-white">{item.quantity}</td>
                          <td className="p-3 text-right text-white">{formatCurrency(item.unit_price)}</td>
                          <td className="p-3 text-right text-white">
                            {item.discount_amount > 0 ? `-${formatCurrency(item.discount_amount)}` : '-'}
                          </td>
                          <td className="p-3 text-right text-white">{formatCurrency(item.tax_amount)}</td>
                          <td className="p-3 text-right text-white font-medium">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Print receipt functionality
                    window.api.print?.receipt(selectedOrder);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Print Receipt
                </button>
                {selectedOrder.payment_status !== 'refunded' && (
                  <button
                    onClick={() => {
                      setShowOrderModal(false);
                      handleVoidOrder(selectedOrder.id);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Void Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-gray-400 text-sm">
            Showing {filteredOrders.length} of {orders.length} total orders
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">
              Total Revenue: <span className="text-white font-semibold">{formatCurrency(analytics.totalRevenue)}</span>
            </span>
            <span className="text-gray-400">
              Est. Profit: <span className="text-white font-semibold">{formatCurrency(analytics.netProfit)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}