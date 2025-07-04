// // src/renderer/components/products/ProductsModule.jsx
// import React, { useState, useEffect } from 'react';
// import { 
//   Plus, Search, Edit, Trash2, Package, AlertCircle, 
//   Download, Upload, Filter, X, Save, Loader2, RefreshCw 
// } from 'lucide-react';
// import { useProductsStore } from '../../store';
// import toast from 'react-hot-toast';

// export default function ProductsModule() {
//   const [showAddProduct, setShowAddProduct] = useState(false);
//   const [editingProduct, setEditingProduct] = useState(null);
//   const [selectedCategory, setSelectedCategory] = useState('');
//   const [searchQuery, setSearchQuery] = useState('');
  
//   const { products, categories, loading, fetchProducts, fetchCategories, createProduct, updateProduct } = useProductsStore();

//   useEffect(() => {
//     fetchProducts();
//     fetchCategories();
//   }, []);

//   const filteredProducts = products.filter(product => {
//     const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
//     const matchesCategory = !selectedCategory || product.category_id === parseInt(selectedCategory);
//     return matchesSearch && matchesCategory;
//   });

//   const handleDelete = async (id) => {
//     if (window.confirm('Are you sure you want to delete this product?')) {
//       try {
//         const result = await window.api.products.delete(id);
//         if (result.success) {
//           toast.success(result.message);
//           fetchProducts();
//         } else {
//           toast.error(result.error);
//         }
//       } catch (error) {
//         toast.error('Failed to delete product');
//       }
//     }
//   };

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold text-white">Products Management</h1>
//         <div className="flex gap-3">
//           <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
//             <Upload className="w-4 h-4" />
//             Import
//           </button>
//           <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
//             <Download className="w-4 h-4" />
//             Export
//           </button>
//           <button
//             onClick={() => setShowAddProduct(true)}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
//           >
//             <Plus className="w-4 h-4" />
//             Add Product
//           </button>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="bg-gray-800 rounded-lg p-4 mb-6">
//         <div className="flex gap-4">
//           <div className="flex-1 relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               type="text"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Search products..."
//               className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
//             />
//           </div>
//           <select
//             value={selectedCategory}
//             onChange={(e) => setSelectedCategory(e.target.value)}
//             className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//           >
//             <option value="">All Categories</option>
//             {categories.map(cat => (
//               <option key={cat.id} value={cat.id}>{cat.name}</option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* Products Table */}
//       <div className="bg-gray-800 rounded-lg overflow-hidden">
//         {loading ? (
//           <div className="p-8 text-center">
//             <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <div className="p-8 text-center">
//             <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
//             <p className="text-gray-400">No products found</p>
//           </div>
//         ) : (
//           <table className="w-full">
//             <thead className="bg-gray-700 text-gray-300">
//               <tr>
//                 <th className="px-6 py-3 text-left">SKU</th>
//                 <th className="px-6 py-3 text-left">Product Name</th>
//                 <th className="px-6 py-3 text-left">Category</th>
//                 <th className="px-6 py-3 text-right">Price</th>
//                 <th className="px-6 py-3 text-right">Stock</th>
//                 <th className="px-6 py-3 text-left">Status</th>
//                 <th className="px-6 py-3 text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-700">
//               {filteredProducts.map((product) => (
//                 <tr key={product.id} className="hover:bg-gray-700/50">
//                   <td className="px-6 py-4 text-gray-300">{product.sku}</td>
//                   <td className="px-6 py-4">
//                     <div>
//                       <p className="text-white font-medium">{product.name}</p>
//                       {product.barcode && (
//                         <p className="text-gray-400 text-sm">Barcode: {product.barcode}</p>
//                       )}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 text-gray-300">{product.category_name || 'Uncategorized'}</td>
//                   <td className="px-6 py-4 text-right text-white font-medium">
//                     KES {product.unit_price.toLocaleString()}
//                   </td>
//                   <td className="px-6 py-4 text-right">
//                     {product.track_inventory ? (
//                       <span className={`font-medium ${
//                         product.current_stock <= product.low_stock_threshold ? 'text-red-400' : 'text-green-400'
//                       }`}>
//                         {product.current_stock}
//                       </span>
//                     ) : (
//                       <span className="text-gray-500">—</span>
//                     )}
//                   </td>
//                   <td className="px-6 py-4">
//                     <span className={`px-2 py-1 rounded-full text-xs ${
//                       product.is_active 
//                         ? 'bg-green-500/20 text-green-400' 
//                         : 'bg-red-500/20 text-red-400'
//                     }`}>
//                       {product.is_active ? 'Active' : 'Inactive'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="flex items-center justify-center gap-2">
//                       <button
//                         onClick={() => setEditingProduct(product)}
//                         className="text-blue-400 hover:text-blue-300"
//                       >
//                         <Edit className="w-4 h-4" />
//                       </button>
//                       <button
//                         onClick={() => handleDelete(product.id)}
//                         className="text-red-400 hover:text-red-300"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* Add/Edit Product Modal */}
//       {(showAddProduct || editingProduct) && (
//         <ProductModal
//           product={editingProduct}
//           categories={categories}
//           products={products}
//           onClose={() => {
//             setShowAddProduct(false);
//             setEditingProduct(null);
//           }}
//           onSave={() => {
//             fetchProducts();
//             setShowAddProduct(false);
//             setEditingProduct(null);
//           }}
//         />
//       )}
//     </div>
//   );
// }

// // Product Modal Component
// function ProductModal({ product, categories, products, onClose, onSave }) {
//   const [formData, setFormData] = useState({
//     name: product?.name || '',
//     sku: product?.sku || '',
//     barcode: product?.barcode || '',
//     category_id: product?.category_id || '',
//     unit_price: product?.unit_price || '',
//     cost_price: product?.cost_price || '',
//     tax_rate: product?.tax_rate || 16,
//     track_inventory: product?.track_inventory ?? true,
//     low_stock_threshold: product?.low_stock_threshold || 10,
//     initial_stock: 0,
//     is_active: product?.is_active ?? true
//   });
//   const [saving, setSaving] = useState(false);
//   const [skuGenerated, setSkuGenerated] = useState(!product); // Track if SKU was auto-generated
  
//   const { createProduct, updateProduct } = useProductsStore();

//   // Function to generate SKU based on category and product name
//   const generateSKU = (categoryId, productName) => {
//     if (!categoryId || !productName) return '';
    
//     // Find the category
//     const category = categories.find(cat => cat.id === parseInt(categoryId));
//     if (!category) return '';
    
//     // Create category prefix (first 3 letters of category, uppercase)
//     const categoryPrefix = category.name
//       .substring(0, 3)
//       .toUpperCase()
//       .replace(/[^A-Z]/g, ''); // Remove non-letters
    
//     // Create product suffix (first letter of each word, max 3 letters)
//     const words = productName.trim().split(' ').filter(word => word.length > 0);
//     const productSuffix = words
//       .map(word => word[0].toUpperCase())
//       .join('')
//       .substring(0, 3);
    
//     // Generate random number (4 digits)
//     const randomNum = Math.floor(1000 + Math.random() * 9000);
    
//     // Combine to create SKU
//     const baseSKU = `${categoryPrefix}-${productSuffix}-${randomNum}`;
    
//     // Check if SKU already exists and regenerate if needed
//     const skuExists = products.some(p => p.sku === baseSKU && p.id !== product?.id);
//     if (skuExists) {
//       // If exists, add another random digit
//       return `${baseSKU}${Math.floor(Math.random() * 10)}`;
//     }
    
//     return baseSKU;
//   };

//   // Auto-generate SKU when category or name changes (only for new products)
//   useEffect(() => {
//     if (!product && skuGenerated && formData.category_id && formData.name) {
//       const newSKU = generateSKU(formData.category_id, formData.name);
//       setFormData(prev => ({ ...prev, sku: newSKU }));
//     }
//   }, [formData.category_id, formData.name, product, skuGenerated]);

//   const handleRegenerateSKU = () => {
//     if (formData.category_id && formData.name) {
//       const newSKU = generateSKU(formData.category_id, formData.name);
//       setFormData({ ...formData, sku: newSKU });
//       setSkuGenerated(true);
//       toast.success('SKU regenerated successfully');
//     } else {
//       toast.error('Please select a category and enter product name first');
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!formData.name || !formData.sku || !formData.unit_price) {
//       toast.error('Please fill in all required fields');
//       return;
//     }

//     setSaving(true);
    
//     try {
//       let success;
//       if (product) {
//         success = await updateProduct(product.id, formData);
//       } else {
//         success = await createProduct(formData);
//       }
      
//       if (success) {
//         onSave();
//       }
//     } catch (error) {
//       console.error('Save error:', error);
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//       <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//         <div className="bg-gray-700 px-6 py-4 flex items-center justify-between sticky top-0">
//           <h2 className="text-xl font-bold text-white">
//             {product ? 'Edit Product' : 'Add New Product'}
//           </h2>
//           <button onClick={onClose} className="text-gray-400 hover:text-white">
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-4">
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Product Name *
//               </label>
//               <input
//                 type="text"
//                 value={formData.name}
//                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                 required
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Category *
//               </label>
//               <select
//                 value={formData.category_id}
//                 onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
//                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                 required
//               >
//                 <option value="">Select Category</option>
//                 {categories.map(cat => (
//                   <option key={cat.id} value={cat.id}>{cat.name}</option>
//                 ))}
//               </select>
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 SKU {skuGenerated && <span className="text-blue-400 text-xs">(Auto-generated)</span>}
//               </label>
//               <div className="flex gap-2">
//                 <input
//                   type="text"
//                   value={formData.sku}
//                   onChange={(e) => {
//                     setFormData({ ...formData, sku: e.target.value });
//                     setSkuGenerated(false); // Mark as manually edited
//                   }}
//                   className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                   placeholder={!product ? "Auto-generated" : ""}
//                   readOnly={!product && skuGenerated}
//                   required
//                 />
//                 <button
//                   type="button"
//                   onClick={handleRegenerateSKU}
//                   className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-lg transition-colors"
//                   title="Regenerate SKU"
//                 >
//                   <RefreshCw className="w-5 h-5" />
//                 </button>
//               </div>
//               <p className="text-xs text-gray-400 mt-1">Format: CAT-PRD-1234</p>
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Barcode
//               </label>
//               <input
//                 type="text"
//                 value={formData.barcode}
//                 onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
//                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Selling Price *
//               </label>
//               <input
//                 type="number"
//                 value={formData.unit_price}
//                 onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
//                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                 required
//                 min="0"
//                 step="0.01"
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Cost Price
//               </label>
//               <input
//                 type="number"
//                 value={formData.cost_price}
//                 onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
//                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                 min="0"
//                 step="0.01"
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Tax Rate (%)
//               </label>
//               <input
//                 type="number"
//                 value={formData.tax_rate}
//                 onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
//                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                 min="0"
//                 max="100"
//                 step="0.01"
//               />
//             </div>
            
//             {formData.track_inventory && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   Low Stock Threshold
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.low_stock_threshold}
//                   onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
//                   className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                   min="0"
//                 />
//               </div>
//             )}
            
//             {!product && formData.track_inventory && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   Initial Stock
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.initial_stock}
//                   onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
//                   className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                   min="0"
//                 />
//               </div>
//             )}
//           </div>

//           <div className="flex items-center gap-4 pt-4">
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={formData.track_inventory}
//                 onChange={(e) => setFormData({ ...formData, track_inventory: e.target.checked })}
//                 className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
//               />
//               <span className="text-gray-300">Track Inventory</span>
//             </label>
            
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={formData.is_active}
//                 onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
//                 className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
//               />
//               <span className="text-gray-300">Active</span>
//             </label>
//           </div>

//           <div className="flex gap-3 pt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 rounded-lg transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={saving}
//               className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
//             >
//               {saving ? (
//                 <>
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                   Saving...
//                 </>
//               ) : (
//                 <>
//                   <Save className="w-4 h-4" />
//                   {product ? 'Update' : 'Create'} Product
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }


// src/renderer/components/products/ProductsModule.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, Package, AlertCircle, 
  Download, Upload, Filter, X, Save, Loader2, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { useProductsStore } from '../../store';
import toast from 'react-hot-toast';

export default function ProductsModule() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Fixed at 5 items per page
  
  const { products, categories, loading, fetchProducts, fetchCategories, createProduct, updateProduct } = useProductsStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Fetch products with pagination
    fetchProducts({
      page: currentPage,
      limit: itemsPerPage,
      search: searchQuery,
      category_id: selectedCategory || undefined
    });
  }, [currentPage, searchQuery, selectedCategory, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Filter products locally (since we're fetching with filters from backend)
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Calculate pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredProducts.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const result = await window.api.products.delete(id);
        if (result.success) {
          toast.success(result.message);
          fetchProducts({
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery,
            category_id: selectedCategory || undefined
          });
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Products Management</h1>
        <div className="flex gap-3">
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddProduct(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          </div>
        ) : currentItems.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No products found</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-700 text-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left">SKU</th>
                  <th className="px-6 py-3 text-left">Product Name</th>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-right">Price</th>
                  <th className="px-6 py-3 text-right">Stock</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {currentItems.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-gray-300">{product.sku}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{product.name}</p>
                        {product.barcode && (
                          <p className="text-gray-400 text-sm">Barcode: {product.barcode}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{product.category_name || 'Uncategorized'}</td>
                    <td className="px-6 py-4 text-right text-white font-medium">
                      KES {product.unit_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {product.track_inventory ? (
                        <span className={`font-medium ${
                          product.current_stock <= product.low_stock_threshold ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {product.current_stock}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.is_active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
              {/* Left side - showing results info */}
              <div className="text-sm text-gray-300">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} products
              </div>

              {/* Right side - pagination buttons */}
              <div className="flex items-center gap-2">
                {/* First page button */}
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-colors"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous page button */}
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 hover:bg-gray-500 text-white'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                {/* Next page button */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last page button */}
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-colors"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {(showAddProduct || editingProduct) && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          products={products}
          onClose={() => {
            setShowAddProduct(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            fetchProducts({
              page: currentPage,
              limit: itemsPerPage,
              search: searchQuery,
              category_id: selectedCategory || undefined
            });
            setShowAddProduct(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

// Product Modal Component (unchanged)
function ProductModal({ product, categories, products, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    category_id: product?.category_id || '',
    unit_price: product?.unit_price || '',
    cost_price: product?.cost_price || '',
    tax_rate: product?.tax_rate || 16,
    track_inventory: product?.track_inventory ?? true,
    low_stock_threshold: product?.low_stock_threshold || 10,
    initial_stock: 0,
    is_active: product?.is_active ?? true
  });
  const [saving, setSaving] = useState(false);
  const [skuGenerated, setSkuGenerated] = useState(!product);
  
  const { createProduct, updateProduct } = useProductsStore();

  // Function to generate SKU based on category and product name
  const generateSKU = (categoryId, productName) => {
    if (!categoryId || !productName) return '';
    
    const category = categories.find(cat => cat.id === parseInt(categoryId));
    if (!category) return '';
    
    const categoryPrefix = category.name
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    
    const words = productName.trim().split(' ').filter(word => word.length > 0);
    const productSuffix = words
      .map(word => word[0].toUpperCase())
      .join('')
      .substring(0, 3);
    
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const baseSKU = `${categoryPrefix}-${productSuffix}-${randomNum}`;
    
    const skuExists = products.some(p => p.sku === baseSKU && p.id !== product?.id);
    if (skuExists) {
      return `${baseSKU}${Math.floor(Math.random() * 10)}`;
    }
    
    return baseSKU;
  };

  useEffect(() => {
    if (!product && skuGenerated && formData.category_id && formData.name) {
      const newSKU = generateSKU(formData.category_id, formData.name);
      setFormData(prev => ({ ...prev, sku: newSKU }));
    }
  }, [formData.category_id, formData.name, product, skuGenerated]);

  const handleRegenerateSKU = () => {
    if (formData.category_id && formData.name) {
      const newSKU = generateSKU(formData.category_id, formData.name);
      setFormData({ ...formData, sku: newSKU });
      setSkuGenerated(true);
      toast.success('SKU regenerated successfully');
    } else {
      toast.error('Please select a category and enter product name first');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sku || !formData.unit_price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    
    try {
      let success;
      if (product) {
        success = await updateProduct(product.id, formData);
      } else {
        success = await createProduct(formData);
      }
      
      if (success) {
        onSave();
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gray-700 px-6 py-4 flex items-center justify-between sticky top-0">
          <h2 className="text-xl font-bold text-white">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SKU {skuGenerated && <span className="text-blue-400 text-xs">(Auto-generated)</span>}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => {
                    setFormData({ ...formData, sku: e.target.value });
                    setSkuGenerated(false);
                  }}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder={!product ? "Auto-generated" : ""}
                  readOnly={!product && skuGenerated}
                  required
                />
                <button
                  type="button"
                  onClick={handleRegenerateSKU}
                  className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-lg transition-colors"
                  title="Regenerate SKU"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Format: CAT-PRD-1234</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Barcode
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Selling Price *
              </label>
              <input
                type="number"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                required
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cost Price
              </label>
              <input
                type="number"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
            
            {formData.track_inventory && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  min="0"
                />
              </div>
            )}
            
            {!product && formData.track_inventory && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Initial Stock
                </label>
                <input
                  type="number"
                  value={formData.initial_stock}
                  onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  min="0"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.track_inventory}
                onChange={(e) => setFormData({ ...formData, track_inventory: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-300">Track Inventory</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-300">Active</span>
            </label>
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
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {product ? 'Update' : 'Create'} Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}