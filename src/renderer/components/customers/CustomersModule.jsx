// src/renderer/components/customers/CustomersModule.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Edit, Trash2, Phone, Mail, 
  CreditCard, Award, Loader2, Download, Upload,X 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomersModule() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const result = await window.api.customers.getAll({ search: searchQuery });
      if (result.success) {
        setCustomers(result.customers);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const result = await window.api.customers.delete(id);
        if (result.success) {
          toast.success(result.message);
          loadCustomers();
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error('Failed to delete customer');
      }
    }
  };

  const handleExport = async () => {
    try {
      const result = await window.api.customers.export({ format: 'csv' });
      if (result.success) {
        // In real implementation, trigger download
        toast.success('Customers exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export customers');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Customer Management</h1>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={() => setShowAddCustomer(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && loadCustomers()}
            placeholder="Search customers by name, email, or phone..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No customers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <div key={customer.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-medium text-lg">
                    {customer.first_name} {customer.last_name}
                  </h3>
                  <p className="text-gray-400 text-sm">#{customer.customer_code}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCustomer(customer)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {customer.email && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Mail className="w-4 h-4 text-gray-500" />
                    {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Phone className="w-4 h-4 text-gray-500" />
                    {customer.phone}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-gray-400 text-xs">Purchases</p>
                  <p className="text-white font-medium">{customer.total_purchases || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Spent</p>
                  <p className="text-white font-medium">
                    {customer.lifetime_value ? `KES ${customer.lifetime_value.toLocaleString()}` : 'KES 0'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Points</p>
                  <p className="text-white font-medium">{customer.loyalty_points || 0}</p>
                </div>
              </div>

              {customer.outstanding_balance > 0 && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
                  <p className="text-red-400 text-sm">
                    Outstanding: KES {customer.outstanding_balance.toLocaleString()}
                  </p>
                </div>
              )}

              <button
                onClick={() => setSelectedCustomer(customer)}
                className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition-colors"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {(showAddCustomer || editingCustomer) && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => {
            setShowAddCustomer(false);
            setEditingCustomer(null);
          }}
          onSave={() => {
            loadCustomers();
            setShowAddCustomer(false);
            setEditingCustomer(null);
          }}
        />
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={loadCustomers}
        />
      )}
    </div>
  );
}

// Customer Modal Component
function CustomerModal({ customer, onClose, onSave }) {
  const [formData, setFormData] = useState({
    first_name: customer?.first_name || '',
    last_name: customer?.last_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    postal_code: customer?.postal_code || '',
    date_of_birth: customer?.date_of_birth || '',
    customer_group: customer?.customer_group || 'regular',
    credit_limit: customer?.credit_limit || 0,
    notes: customer?.notes || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);
    
    try {
      let result;
      if (customer) {
        result = await window.api.customers.update(customer.id, { updates: formData });
      } else {
        result = await window.api.customers.create(formData);
      }
      
      if (result.success) {
        toast.success(customer ? 'Customer updated' : 'Customer created');
        onSave();
      } else {
        toast.error(result.error || 'Failed to save customer');
      }
    } catch (error) {
      toast.error('Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gray-700 px-6 py-4 flex items-center justify-between sticky top-0">
          <h2 className="text-xl font-bold text-white">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Customer Group
              </label>
              <select
                value={formData.customer_group}
                onChange={(e) => setFormData({ ...formData, customer_group: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
                <option value="wholesale">Wholesale</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Credit Limit
              </label>
              <input
                type="number"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                min="0"
                step="100"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                rows="3"
              />
            </div>
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
                'Save Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Customer Details Modal
function CustomerDetailsModal({ customer, onClose, onUpdate }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerDetails();
  }, [customer.id]);

  const loadCustomerDetails = async () => {
    try {
      const result = await window.api.customers.getTransactions({ 
        customerId: customer.id, 
        limit: 10 
      });
      if (result.success) {
        setTransactions(result.transactions);
      }
    } catch (error) {
      console.error('Failed to load customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Customer Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Customer Info */}
          <div className="bg-gray-700 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {customer.first_name} {customer.last_name}
                </h3>
                <p className="text-gray-400">Customer Code: {customer.customer_code}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Member Since</p>
                <p className="text-white">{new Date(customer.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-gray-400 text-sm">Total Purchases</p>
                <p className="text-2xl font-bold text-white">{customer.total_purchases || 0}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Lifetime Value</p>
                <p className="text-2xl font-bold text-white">
                  KES {(customer.lifetime_value || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Loyalty Points</p>
                <p className="text-2xl font-bold text-blue-400">{customer.loyalty_points || 0}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Outstanding Balance</p>
                <p className={`text-2xl font-bold ${customer.outstanding_balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  KES {(customer.outstanding_balance || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-700 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">Contact Information</h4>
            <div className="grid grid-cols-2 gap-4">
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{customer.phone}</span>
                </div>
              )}
            </div>
            {customer.address && (
              <div className="mt-4">
                <p className="text-gray-400 text-sm mb-1">Address</p>
                <p className="text-gray-300">
                  {customer.address}
                  {customer.city && `, ${customer.city}`}
                  {customer.postal_code && ` ${customer.postal_code}`}
                </p>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Recent Transactions</h4>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{transaction.invoice_number}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(transaction.created_at).toLocaleString()} • {transaction.item_count} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">
                        KES {transaction.total_amount.toLocaleString()}
                      </p>
                      <p className={`text-sm ${
                        transaction.payment_status === 'paid' ? 'text-green-400' :
                        transaction.payment_status === 'pending' ? 'text-orange-400' :
                        'text-red-400'
                      }`}>
                        {transaction.payment_status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}