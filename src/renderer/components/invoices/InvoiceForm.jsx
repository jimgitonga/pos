// src/components/invoices/InvoiceForm.jsx
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, Trash2, Search, Calculator, Save,
  User, Mail, Phone, MapPin, Calendar, DollarSign,
  Hash, FileText, Package, Percent
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InvoiceForm({ invoice, editMode, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    invoice_number: '',
    customer_id: null,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: '30',
    notes: '',
    terms_conditions: '',
    status: 'draft',
    subtotal: 0,
    tax_rate: 16,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    items: []
  });

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editMode && invoice) {
      setFormData({
        ...invoice,
        invoice_date: new Date(invoice.invoice_date).toISOString().split('T')[0],
        due_date: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '',
        items: invoice.items || []
      });
      if (invoice.customer_id) {
        setSelectedCustomer({
          id: invoice.customer_id,
          first_name: invoice.customer_name?.split(' ')[0] || '',
          last_name: invoice.customer_name?.split(' ').slice(1).join(' ') || '',
          email: invoice.customer_email,
          phone: invoice.customer_phone,
          address: invoice.customer_address
        });
      }
    } else {
      generateInvoiceNumber();
    }
    loadCustomers();
    loadProducts();
  }, [editMode, invoice]);

  const generateInvoiceNumber = async () => {
    try {
      const result = await window.api.invoices.generateNumber();
      if (result.success) {
        setFormData(prev => ({ ...prev, invoice_number: result.number }));
      }
    } catch (error) {
      console.error('Error generating invoice number:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const result = await window.api.customers.getAll();
      if (result.success) {
        setCustomers(result.customers);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await window.api.products.getAll();
      if (result.success) {
        setProducts(result.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const calculateTotals = (items, taxRate, discountAmount) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount - discountAmount;
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      total_amount: parseFloat(totalAmount.toFixed(2))
    };
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field === 'tax_rate' || field === 'discount_amount') {
        const totals = calculateTotals(
          updated.items,
          field === 'tax_rate' ? parseFloat(value) || 0 : updated.tax_rate,
          field === 'discount_amount' ? parseFloat(value) || 0 : updated.discount_amount
        );
        return { ...updated, ...totals };
      }
      
      return updated;
    });
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_name: `${customer.first_name} ${customer.last_name}`.trim(),
      customer_email: customer.email || '',
      customer_phone: customer.phone || '',
      customer_address: customer.address || ''
    }));
    setShowCustomerSearch(false);
    setCustomerSearchTerm('');
  };

  const handleAddItem = () => {
    const newItem = {
      id: Date.now(),
      product_id: null,
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0
    };
    
    const updatedItems = [...formData.items, newItem];
    const totals = calculateTotals(updatedItems, formData.tax_rate, formData.discount_amount);
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  };

  const handleRemoveItem = (itemId) => {
    const updatedItems = formData.items.filter(item => item.id !== itemId);
    const totals = calculateTotals(updatedItems, formData.tax_rate, formData.discount_amount);
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  };

  const handleItemChange = (itemId, field, value) => {
    const updatedItems = formData.items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        
        if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price;
        }
        
        return updated;
      }
      return item;
    });
    
    const totals = calculateTotals(updatedItems, formData.tax_rate, formData.discount_amount);
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  };

  const handleProductSelect = (product, itemId) => {
    handleItemChange(itemId, 'product_id', product.id);
    handleItemChange(itemId, 'description', product.name);
    handleItemChange(itemId, 'unit_price', product.unit_price);
    setShowProductSearch(false);
    setProductSearchTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.invoice_number) {
      toast.error('Invoice number is required');
      return;
    }
    
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    
    if (!formData.customer_name) {
      toast.error('Customer information is required');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      toast.error('Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customerSearchTerm === '' ||
    `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    productSearchTerm === '' ||
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {editMode ? 'Edit Invoice' : 'Create New Invoice'}
          </h1>
          <p className="text-gray-400">
            {editMode ? 'Update invoice details' : 'Generate a new invoice for your customer'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Header */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoice Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Invoice Number
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Invoice Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => handleInputChange('invoice_date', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Payment Terms (Days)
              </label>
              <select
                value={formData.payment_terms}
                onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">Due on Receipt</option>
                <option value="15">Net 15</option>
                <option value="30">Net 30</option>
                <option value="45">Net 45</option>
                <option value="60">Net 60</option>
                <option value="90">Net 90</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Customer Information
          </h2>
          
          <div className="mb-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
              >
                <span>
                  {selectedCustomer 
                    ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` 
                    : 'Select Customer or Enter Details'
                  }
                </span>
                <Search className="w-4 h-4" />
              </button>
              
              {showCustomerSearch && (
                <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-3 border-b border-gray-600">
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredCustomers.map(customer => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleCustomerSelect(customer)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-600 transition-colors text-white"
                      >
                        <div className="font-medium">{customer.first_name} {customer.last_name}</div>
                        <div className="text-sm text-gray-400">{customer.email}</div>
                      </button>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <div className="px-3 py-2 text-gray-400">No customers found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Customer Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => handleInputChange('customer_email', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.customer_address}
                  onChange={(e) => handleInputChange('customer_address', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Invoice Items
            </h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-2 text-gray-300 font-medium w-1/2">Description</th>
                  <th className="text-center py-2 px-2 text-gray-300 font-medium w-20">Qty</th>
                  <th className="text-right py-2 px-2 text-gray-300 font-medium w-24">Unit Price</th>
                  <th className="text-right py-2 px-2 text-gray-300 font-medium w-24">Total</th>
                  <th className="text-center py-2 px-2 text-gray-300 font-medium w-12">Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-700">
                    <td className="py-3 px-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Item description..."
                        />
                        <button
                          type="button"
                          onClick={() => setShowProductSearch(item.id)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                          title="Search Products"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        
                        {showProductSearch === item.id && (
                          <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            <div className="p-3 border-b border-gray-600">
                              <input
                                type="text"
                                placeholder="Search products..."
                                value={productSearchTerm}
                                onChange={(e) => setProductSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                              {filteredProducts.map(product => (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => handleProductSelect(product, item.id)}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-600 transition-colors text-white"
                                >
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-gray-400 flex justify-between">
                                    <span>SKU: {product.sku}</span>
                                    <span>KES {product.unit_price}</span>
                                  </div>
                                </button>
                              ))}
                              {filteredProducts.length === 0 && (
                                <div className="px-3 py-2 text-gray-400">No products found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-2 text-right text-white font-medium">
                      KES {(item.quantity * item.unit_price).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                
                {formData.items.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-400">
                      No items added. Click "Add Item" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Totals */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Invoice Totals
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tax Rate (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.tax_rate}
                    onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Discount Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => handleInputChange('discount_amount', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Subtotal:</span>
                  <span className="text-white font-medium">KES {formData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Tax ({formData.tax_rate}%):</span>
                  <span className="text-white font-medium">KES {formData.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Discount:</span>
                  <span className="text-white font-medium">-KES {formData.discount_amount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-white">Total:</span>
                    <span className="text-xl font-bold text-green-400">KES {formData.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Additional Information</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Internal notes..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Terms & Conditions
              </label>
              <textarea
                value={formData.terms_conditions}
                onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Payment terms, delivery conditions, etc..."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || formData.items.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {editMode ? 'Update Invoice' : 'Create Invoice'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}