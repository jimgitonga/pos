// src/renderer/components/categories/CategoriesModule.jsx
import React, { useState, useEffect } from 'react';
import { 
  Folder, FolderOpen, Plus, Edit, Trash2, 
  ChevronRight, ChevronDown, Package, 
  AlertCircle, Save, X, Loader2, 
  FolderPlus, Move, Hash, BarChart3,
  ArrowUpDown, Grid3X3
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CategoriesModule() {
  const [categories, setCategories] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryStats, setCategoryStats] = useState(null);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'grid'

  useEffect(() => {
    loadCategories();
    loadCategoryStats();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await window.api.categories.getAll();
      if (result.success) {
        setCategories(result.categories);
        setFlatCategories(result.flat);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryStats = async () => {
    try {
      const result = await window.api.categories.getStats();
      if (result.success) {
        setCategoryStats(result);
      }
    } catch (error) {
      console.error('Failed to load category stats:', error);
    }
  };

  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDelete = async (category) => {
    if (category.product_count > 0) {
      toast.error(`Cannot delete category with ${category.product_count} products`);
      return;
    }

    if (category.children && category.children.length > 0) {
      toast.error(`Cannot delete category with subcategories`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        const result = await window.api.categories.delete(category.id);
        if (result.success) {
          toast.success(result.message);
          loadCategories();
          loadCategoryStats();
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const CategoryTreeItem = ({ category, level = 0 }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategory?.id === category.id;

    return (
      <div>
        <div
          className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            isSelected 
              ? 'bg-blue-600 text-white' 
              : 'hover:bg-gray-700 text-gray-300'
          }`}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
          onClick={() => setSelectedCategory(category)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(category.id);
              }}
              className="p-0.5 hover:bg-gray-600 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          
          {!hasChildren && <div className="w-5" />}
          
          <div className="flex-1 flex items-center gap-3">
            {isExpanded ? (
              <FolderOpen className="w-5 h-5 text-blue-400" />
            ) : (
              <Folder className="w-5 h-5 text-gray-400" />
            )}
            <span className="font-medium">{category.name}</span>
            {category.product_count > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isSelected ? 'bg-blue-700' : 'bg-gray-600'
              }`}>
                {category.product_count}
              </span>
            )}
          </div>
          
          <div className={`flex items-center gap-1 ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } transition-opacity`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingCategory(category);
              }}
              className="p-1 hover:bg-gray-600 rounded"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(category);
              }}
              className="p-1 hover:bg-red-600 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {category.children.map((child) => (
              <CategoryTreeItem 
                key={child.id} 
                category={child} 
                level={level + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const CategoryGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {flatCategories.map((category) => (
        <div
          key={category.id}
          className={`bg-gray-800 rounded-lg p-4 border-2 cursor-pointer transition-all ${
            selectedCategory?.id === category.id
              ? 'border-blue-500'
              : 'border-gray-700 hover:border-gray-600'
          }`}
          onClick={() => setSelectedCategory(category)}
        >
          <div className="flex items-start justify-between mb-3">
            <Folder className="w-8 h-8 text-blue-400" />
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCategory(category);
                }}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <Edit className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(category);
                }}
                className="p-1 hover:bg-red-600 rounded"
              >
                <Trash2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          
          <h3 className="text-white font-medium text-lg mb-1">{category.name}</h3>
          {category.parent_name && (
            <p className="text-gray-500 text-sm mb-2">in {category.parent_name}</p>
          )}
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2 text-gray-400">
              <Package className="w-4 h-4" />
              <span className="text-sm">{category.product_count} products</span>
            </div>
            {!category.is_active && (
              <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded">
                Inactive
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Left Panel - Categories */}
      <div className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Categories</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'tree' ? 'grid' : 'tree')}
                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
                title={viewMode === 'tree' ? 'Grid View' : 'Tree View'}
              >
                {viewMode === 'tree' ? <Grid3X3 className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowAddCategory(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          {categoryStats && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-700 rounded p-2">
                <p className="text-gray-400">Total Categories</p>
                <p className="text-white font-medium">{categoryStats.stats.total_categories}</p>
              </div>
              <div className="bg-gray-700 rounded p-2">
                <p className="text-gray-400">Total Products</p>
                <p className="text-white font-medium">{categoryStats.stats.total_products}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No categories yet</p>
              <button
                onClick={() => setShowAddCategory(true)}
                className="mt-3 text-blue-400 hover:text-blue-300"
              >
                Create your first category
              </button>
            </div>
          ) : viewMode === 'tree' ? (
            <div className="space-y-1">
              {categories.map((category) => (
                <CategoryTreeItem key={category.id} category={category} />
              ))}
            </div>
          ) : (
            <CategoryGrid />
          )}
        </div>
      </div>

      {/* Right Panel - Category Details */}
      <div className="flex-1 bg-gray-900">
        {selectedCategory ? (
          <CategoryDetails 
            category={selectedCategory} 
            onRefresh={loadCategories}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Folder className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">Select a category to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Category Modal */}
      {(showAddCategory || editingCategory) && (
        <CategoryModal
          category={editingCategory}
          categories={flatCategories}
          onClose={() => {
            setShowAddCategory(false);
            setEditingCategory(null);
          }}
          onSave={() => {
            loadCategories();
            loadCategoryStats();
            setShowAddCategory(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}


// Fixed Category Details Component
function CategoryDetails({ category, onRefresh }) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    loadCategoryDetails();
  }, [category.id]);

  const loadCategoryDetails = async () => {
    setLoading(true);
    try {
      const result = await window.api.categories.getById(category.id);
      if (result.success) {
        setDetails(result.category);
      } else {
        toast.error('Failed to load category details');
        setDetails(null);
      }
    } catch (error) {
      console.error('Failed to load category details:', error);
      toast.error('Failed to load category details');
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Check if details is null or undefined
  if (!details) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Failed to load category details</p>
          <button
            onClick={loadCategoryDetails}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Folder className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">{details.name || 'Unnamed Category'}</h1>
          {details.is_active === false && (
            <span className="bg-red-900/30 text-red-400 px-3 py-1 rounded-lg text-sm">
              Inactive
            </span>
          )}
        </div>
        {details.parent_name && (
          <p className="text-gray-400">Subcategory of {details.parent_name}</p>
        )}
        {details.description && (
          <p className="text-gray-300 mt-3">{details.description}</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-gray-400 text-sm">Total Products</p>
          <p className="text-2xl font-bold text-white">{details.product_count || 0}</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Folder className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-gray-400 text-sm">Subcategories</p>
          <p className="text-2xl font-bold text-white">{details.subcategories?.length || 0}</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Hash className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-gray-400 text-sm">Display Order</p>
          <p className="text-2xl font-bold text-white">{details.display_order || 0}</p>
        </div>
      </div>

      {/* Subcategories */}
      {details.subcategories && details.subcategories.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Subcategories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {details.subcategories.map((sub) => (
              <div key={sub.id} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{sub.name}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  sub.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                }`}>
                  {sub.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products in Category */}
      {details.products && details.products.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Products in this Category</h3>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700 text-gray-300 text-sm">
                <tr>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Product Name</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {details.products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-gray-400">{product.sku}</td>
                    <td className="px-4 py-3 text-white">{product.name}</td>
                    <td className="px-4 py-3 text-right text-white">
                      KES {(product.unit_price || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        product.is_active 
                          ? 'bg-green-900/30 text-green-400' 
                          : 'bg-red-900/30 text-red-400'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {details.product_count > 10 && (
              <div className="p-3 bg-gray-700 text-center">
                <p className="text-gray-400 text-sm">
                  Showing 10 of {details.product_count} products
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State for No Products */}
      {(!details.products || details.products.length === 0) && (!details.subcategories || details.subcategories.length === 0) && (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No products or subcategories in this category yet</p>
        </div>
      )}
    </div>
  );
}

// Category Modal Component
function CategoryModal({ category, categories, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    parent_id: category?.parent_id || null,
    display_order: category?.display_order || '',
    is_active: category?.is_active ?? true
  });
  const [saving, setSaving] = useState(false);

  // Filter out the current category and its descendants from parent options
  const getAvailableParents = () => {
    if (!category) return categories;
    
    const descendantIds = new Set();
    const findDescendants = (catId) => {
      categories.forEach(cat => {
        if (cat.parent_id === catId) {
          descendantIds.add(cat.id);
          findDescendants(cat.id);
        }
      });
    };
    
    descendantIds.add(category.id);
    findDescendants(category.id);
    
    return categories.filter(cat => !descendantIds.has(cat.id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);
    
    try {
      let result;
      if (category) {
        result = await window.api.categories.update(category.id, { updates: formData });
      } else {
        result = await window.api.categories.create(formData);
      }
      
      if (result.success) {
        toast.success(category ? 'Category updated' : 'Category created');
        onSave();
      } else {
        toast.error(result.error || 'Failed to save category');
      }
    } catch (error) {
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {category ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., Electronics"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              rows="3"
              placeholder="Optional description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Parent Category
            </label>
            <select
              value={formData.parent_id || ''}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">None (Top Level)</option>
              {getAvailableParents().map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.parent_name ? `${cat.parent_name} > ${cat.name}` : cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Leave empty for automatic ordering"
              min="0"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-gray-300">
              Active (visible in product selection)
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
                  {category ? 'Update' : 'Create'} Category
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}