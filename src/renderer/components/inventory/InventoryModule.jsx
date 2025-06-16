// src/renderer/components/inventory/InventoryModule.jsx
import React, { useState, useEffect } from 'react';
import { 
  Package, AlertCircle, TrendingUp, TrendingDown, 
  RefreshCw, Loader2, Download, Filter, X, Search,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryModule() {
  const [inventoryData, setInventoryData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // Pagination for movements
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsPerPage] = useState(10);
  const [totalMovements, setTotalMovements] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadInventoryData();
  }, [currentPage, searchTerm, categoryFilter, stockStatusFilter]);

  useEffect(() => {
    if (activeTab === 'movements') {
      loadStockMovements();
    }
  }, [activeTab, movementsPage]);

  const loadCategories = async () => {
    try {
      const result = await window.api.categories.getAll();
      if (result.success) {
        setCategories(result.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      // Build filters for API call
      const filters = {
        is_active: true,
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        category_id: categoryFilter || undefined,
        stock_status: stockStatusFilter || undefined
      };

      // Load paginated inventory overview
      const productsResult = await window.api.products.getAll(filters);
      if (productsResult.success) {
        setInventoryData(productsResult.products || []);
        setTotalItems(productsResult.total || 0);
      }

      // Load low stock items (always load all for alerts)
      const lowStockResult = await window.api.inventory.getLowStock();
      if (lowStockResult.success) {
        setLowStockItems(lowStockResult.items || []);
      }
    } catch (error) {
      console.error('Failed to load inventory data:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const loadStockMovements = async () => {
    try {
      const result = await window.api.inventory.getStockMovements({ 
        page: movementsPage,
        limit: movementsPerPage 
      });
      if (result.success) {
        setStockMovements(result.movements || []);
        setTotalMovements(result.total || 0);
      }
    } catch (error) {
      console.error('Failed to load stock movements:', error);
      toast.error('Failed to load stock movements');
    }
  };

  const handleStockAdjustment = async (productId, newQuantity, reason) => {
    try {
      const result = await window.api.inventory.adjustStock([{
        productId,
        newQuantity,
        reason
      }]);
      
      if (result.success) {
        toast.success('Stock adjusted successfully');
        loadInventoryData();
        setShowAdjustment(false);
        setSelectedProduct(null);
      } else {
        toast.error(result.error || 'Failed to adjust stock');
      }
    } catch (error) {
      toast.error('Failed to adjust stock');
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'category') {
      setCategoryFilter(value);
    } else if (filterType === 'status') {
      setStockStatusFilter(value);
    }
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStockStatusFilter('');
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Movement pagination calculations
  const totalMovementPages = Math.ceil(totalMovements / movementsPerPage);
  const startMovement = (movementsPage - 1) * movementsPerPage + 1;
  const endMovement = Math.min(movementsPage * movementsPerPage, totalMovements);

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setCurrentPage(1);
              loadInventoryData();
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-gray-400 text-sm">Total Products</p>
          <p className="text-2xl font-bold text-white">{totalItems}</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-400 text-sm">Low Stock Items</p>
          <p className="text-2xl font-bold text-white">{lowStockItems.length}</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-gray-400 text-sm">Stock Value</p>
          <p className="text-2xl font-bold text-white">
            KES {inventoryData.reduce((sum, item) => sum + (item.current_stock * (item.cost_price || item.unit_price * 0.7)), 0).toLocaleString()}
          </p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-8 h-8 text-orange-400" />
          </div>
          <p className="text-gray-400 text-sm">Out of Stock</p>
          <p className="text-2xl font-bold text-white">
            {inventoryData.filter(item => item.current_stock === 0).length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'overview' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Stock Overview
        </button>
        <button
          onClick={() => setActiveTab('lowstock')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'lowstock' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Low Stock Alerts
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'movements' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Stock Movements
        </button>
      </div>

      {/* Filters (only show on overview tab) */}
      {activeTab === 'overview' && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Stock Status Filter */}
            <select
              value={stockStatusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Stock Levels</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            {/* Clear Filters */}
            {(searchTerm || categoryFilter || stockStatusFilter) && (
              <button
                onClick={clearFilters}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Inventory Table */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700 text-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left">SKU</th>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-right">Current Stock</th>
                  <th className="px-6 py-3 text-right">Reserved</th>
                  <th className="px-6 py-3 text-right">Available</th>
                  <th className="px-6 py-3 text-right">Value</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : inventoryData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                      No products found matching your criteria
                    </td>
                  </tr>
                ) : (
                  inventoryData.filter(item => item.track_inventory).map((item) => {
                    const available = item.current_stock - (item.reserved_stock || 0);
                    const stockValue = item.current_stock * (item.cost_price || item.unit_price * 0.7);
                    const status = item.current_stock === 0 ? 'out' : 
                                  item.current_stock <= item.low_stock_threshold ? 'low' : 'ok';
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-gray-300">{item.sku}</td>
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-gray-400 text-sm">{item.category_name}</p>
                        </td>
                        <td className="px-6 py-4 text-right text-white">{item.current_stock}</td>
                        <td className="px-6 py-4 text-right text-gray-400">{item.reserved_stock || 0}</td>
                        <td className="px-6 py-4 text-right text-white font-medium">{available}</td>
                        <td className="px-6 py-4 text-right text-white">
                          KES {stockValue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            status === 'out' ? 'bg-red-500/20 text-red-400' :
                            status === 'low' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {status === 'out' ? 'Out of Stock' : 
                             status === 'low' ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedProduct(item);
                              setShowAdjustment(true);
                            }}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startItem={startItem}
              endItem={endItem}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {activeTab === 'lowstock' && (
        <div className="bg-gray-800 rounded-lg p-6">
          {lowStockItems.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No low stock items</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockItems.map((item) => (
                <div key={item.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">{item.name}</h4>
                    <p className="text-gray-400 text-sm">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-bold text-lg">{item.current_stock} units</p>
                    <p className="text-gray-400 text-sm">Threshold: {item.low_stock_threshold}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProduct(item);
                      setShowAdjustment(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Restock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700 text-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-right">Quantity</th>
                  <th className="px-6 py-3 text-left">Reason</th>
                  <th className="px-6 py-3 text-left">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {stockMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-gray-300">
                      {new Date(movement.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{movement.product_name}</p>
                      <p className="text-gray-400 text-sm">{movement.sku}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        movement.movement_type === 'in' ? 'bg-green-500/20 text-green-400' :
                        movement.movement_type === 'out' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {movement.movement_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${
                        movement.movement_type === 'in' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{movement.reason}</td>
                    <td className="px-6 py-4 text-gray-300">{movement.user_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Movements Pagination */}
          {totalMovementPages > 1 && (
            <PaginationControls
              currentPage={movementsPage}
              totalPages={totalMovementPages}
              totalItems={totalMovements}
              startItem={startMovement}
              endItem={endMovement}
              onPageChange={setMovementsPage}
            />
          )}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustment && selectedProduct && (
        <StockAdjustmentModal
          product={selectedProduct}
          onClose={() => {
            setShowAdjustment(false);
            setSelectedProduct(null);
          }}
          onSave={handleStockAdjustment}
        />
      )}
    </div>
  );
}

// Pagination Controls Component
function PaginationControls({ currentPage, totalPages, totalItems, startItem, endItem, onPageChange }) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="bg-gray-800 rounded-lg px-6 py-4 flex items-center justify-between">
      <div className="text-gray-400 text-sm">
        Showing {startItem} to {endItem} of {totalItems} items
      </div>
      
      <div className="flex items-center gap-2">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        
        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {/* Page Numbers */}
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {page}
          </button>
        ))}
        
        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        
        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StockAdjustmentModal({ product, onClose, onSave }) {
  const [newQuantity, setNewQuantity] = useState(product.current_stock.toString());
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for adjustment');
      return;
    }

    setSaving(true);
    await onSave(product.id, parseInt(newQuantity), reason);
    setSaving(false);
  };

  const difference = parseInt(newQuantity) - product.current_stock;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Adjust Stock</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <h3 className="text-white font-medium">{product.name}</h3>
            <p className="text-gray-400 text-sm">SKU: {product.sku}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Stock
            </label>
            <p className="text-2xl font-bold text-white">{product.current_stock} units</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Quantity
            </label>
            <input
              type="number"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              min="0"
              required
            />
            {difference !== 0 && (
              <p className={`mt-2 font-medium ${difference > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {difference > 0 ? '+' : ''}{difference} units
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason for Adjustment
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              rows="3"
              placeholder="e.g., Stock count correction, damaged goods, etc."
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || difference === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Update Stock'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}