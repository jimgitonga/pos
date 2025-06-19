
// // src/renderer/components/pos/SalesModule.jsx
// import React, { useState, useEffect, useRef } from 'react';
// import {
//   Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign,
//   Smartphone, User, X, Loader2, Package, AlertCircle, Check,
//   Percent, Tag, Receipt, Send, Eye, ShoppingBag
// } from 'lucide-react';
// import { useCartStore, useProductsStore, useSalesStore, useAuthStore } from '../../store';
// import toast from 'react-hot-toast';

// export default function SalesModule() {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [searching, setSearching] = useState(false);
//   const [showCheckout, setShowCheckout] = useState(false);
//   const [showCustomerSearch, setShowCustomerSearch] = useState(false);
//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [selectedProductId, setSelectedProductId] = useState(null);
//   const [quickAddQuantity, setQuickAddQuantity] = useState({});
//   const searchInputRef = useRef(null);

//   const { user } = useAuthStore();
//   const {
//     items, customer, discountAmount, notes,
//     addItem, updateQuantity, removeItem, setCustomer,
//     setDiscount, setNotes, clearCart, getSubtotal,
//     getTaxAmount, getTotal
//   } = useCartStore();
//   const { searchProducts, fetchCategories, products, fetchProducts } = useProductsStore();
//   const { createSale } = useSalesStore();

//   useEffect(() => {
//     loadInitialData();
//     searchInputRef.current?.focus();
//   }, []);

//   const loadInitialData = async () => {
//     try {
//       const categoriesResult = await window.api.categories.getAll();
//       if (categoriesResult.success) {
//         setCategories(categoriesResult.categories);
//       }
//       await fetchProducts();
//     } catch (error) {
//       console.error('Failed to load initial data:', error);
//     }
//   };

//   const handleSearch = async (query) => {
//     setSearchQuery(query);

//     if (query.length < 2) {
//       setSearchResults([]);
//       return;
//     }

//     setSearching(true);
//     try {
//       const results = await searchProducts(query);
//       setSearchResults(results);
//     } catch (error) {
//       console.error('Search error:', error);
//     } finally {
//       setSearching(false);
//     }
//   };

//   const handleBarcodeScan = async (barcode) => {
//     try {
//       const result = await window.api.products.getByBarcode(barcode);
//       if (result.success && result.product) {
//         addItem(result.product);
//         setSearchQuery('');
//         setSearchResults([]);
//       } else {
//         toast.error('Product not found');
//       }
//     } catch (error) {
//       toast.error('Barcode scan error');
//     }
//   };

//   const handleAddProduct = (product, quantity = 1) => {
//     if (product.current_stock < quantity && product.track_inventory) {
//       toast.error('Insufficient stock');
//       return;
//     }

//     for (let i = 0; i < quantity; i++) {
//       addItem(product);
//     }
    
//     setQuickAddQuantity(prev => ({ ...prev, [product.id]: 1 }));
//     setSelectedProductId(null);
//     searchInputRef.current?.focus();
//     toast.success(`Added ${quantity} × ${product.name}`);
//   };

//   const handleQuickAddChange = (productId, value) => {
//     const qty = parseInt(value) || 1;
//     setQuickAddQuantity(prev => ({ ...prev, [productId]: Math.max(1, qty) }));
//   };

//   const handleCheckout = () => {
//     if (items.length === 0) {
//       toast.error('Cart is empty');
//       return;
//     }
//     setShowCheckout(true);
//   };

//   // Enhanced QuickProducts component with quantity controls
//   const QuickProducts = ({ products, selectedCategory, handleAddProduct }) => {
//     const filteredProducts = products.filter(p => 
//       p.is_active && 
//       (selectedCategory === null || p.category_id === selectedCategory)
//     );

//     return (
//       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
//         {filteredProducts.map((product) => {
//           const quantity = quickAddQuantity[product.id] || 1;
//           const isSelected = selectedProductId === product.id;
          
//           return (
//             <div
//               key={product.id}
//               className={`bg-gray-800 border rounded-lg overflow-hidden transition-all ${
//                 isSelected ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-700 hover:border-gray-600'
//               }`}
//             >
//               {/* Product Image/Icon */}
//               <div 
//                 className="bg-gray-700 h-24 flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
//                 onClick={() => setSelectedProductId(isSelected ? null : product.id)}
//               >
//                 <Package className="w-12 h-12 text-gray-500" />
//               </div>
              
//               {/* Product Info */}
//               <div className="p-3">
//                 <h4 className="text-white font-medium text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
//                   {product.name}
//                 </h4>
//                 <p className="text-gray-400 text-xs mb-2">{product.category_name}</p>
                
//                 <div className="flex justify-between items-center mb-3">
//                   <span className="text-base font-bold text-blue-400">
//                     KES {product.unit_price.toLocaleString()}
//                   </span>
//                   {product.track_inventory && (
//                     <span className={`text-xs ${
//                       product.current_stock <= product.low_stock_threshold ? 'text-red-400' : 'text-gray-500'
//                     }`}>
//                       Stock: {product.current_stock}
//                     </span>
//                   )}
//                 </div>

//                 {/* Quantity Controls */}
//                 <div className="flex items-center gap-2 mb-2">
//                   <button
//                     onClick={() => handleQuickAddChange(product.id, quantity - 1)}
//                     className="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded flex items-center justify-center text-white transition-colors"
//                   >
//                     <Minus className="w-4 h-4" />
//                   </button>
//                   <input
//                     type="number"
//                     value={quantity}
//                     onChange={(e) => handleQuickAddChange(product.id, e.target.value)}
//                     className="w-12 h-8 bg-gray-700 border border-gray-600 rounded text-white text-center text-sm focus:outline-none focus:border-blue-500"
//                     min="1"
//                     max={product.track_inventory ? product.current_stock : 999}
//                   />
//                   <button
//                     onClick={() => handleQuickAddChange(product.id, quantity + 1)}
//                     className="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded flex items-center justify-center text-white transition-colors"
//                     disabled={product.track_inventory && quantity >= product.current_stock}
//                   >
//                     <Plus className="w-4 h-4" />
//                   </button>
//                 </div>

//                 {/* Add to Cart Button */}
//                 <button
//                   onClick={() => handleAddProduct(product, quantity)}
//                   disabled={product.current_stock <= 0 && product.track_inventory}
//                   className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
//                 >
//                   <ShoppingBag className="w-4 h-4" />
//                   Add to Cart
//                 </button>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   return (
//     <div className="flex h-screen bg-gray-900">
//       {/* Main Content Area */}
//       <div className="flex-1 flex flex-col min-w-0">
//         {/* Fixed Header */}
//         <div className="flex-shrink-0 p-4 lg:p-6 bg-gray-900 border-b border-gray-800">
//           {/* Search Bar */}
//           <div className="relative mb-4">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               ref={searchInputRef}
//               type="text"
//               value={searchQuery}
//               onChange={(e) => handleSearch(e.target.value)}
//               onKeyPress={(e) => {
//                 if (e.key === 'Enter' && searchQuery) {
//                   handleBarcodeScan(searchQuery);
//                 }
//               }}
//               placeholder="Search products by name, SKU, or scan barcode..."
//               className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
//             />
//             {searching && (
//               <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
//             )}
//           </div>

//           {/* Search Results Dropdown */}
//           {searchResults.length > 0 && (
//             <div className="absolute z-20 left-4 right-4 lg:left-6 lg:right-auto lg:w-[calc(100%-24rem-3rem)] mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
//               {searchResults.map((product) => (
//                 <button
//                   key={product.id}
//                   onClick={() => handleAddProduct(product)}
//                   className="w-full px-4 py-3 hover:bg-gray-700 flex items-center justify-between text-left transition-colors"
//                 >
//                   <div className="min-w-0 flex-1">
//                     <p className="text-white font-medium truncate">{product.name}</p>
//                     <p className="text-gray-400 text-sm">SKU: {product.sku} | {product.category_name}</p>
//                   </div>
//                   <div className="text-right ml-4 flex-shrink-0">
//                     <p className="text-blue-400 font-bold">KES {product.unit_price.toLocaleString()}</p>
//                     {product.track_inventory && (
//                       <p className="text-gray-500 text-sm">Stock: {product.current_stock}</p>
//                     )}
//                   </div>
//                 </button>
//               ))}
//             </div>
//           )}

//           {/* Categories */}
//           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
//             <button
//               onClick={() => setSelectedCategory(null)}
//               className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
//                 selectedCategory === null
//                   ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
//                   : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
//               }`}
//             >
//               All Products
//             </button>
//             {categories.map((category) => (
//               <button
//                 key={category.id}
//                 onClick={() => setSelectedCategory(category.id)}
//                 className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
//                   selectedCategory === category.id
//                     ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
//                     : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
//                 }`}
//               >
//                 {category.name}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Scrollable Products Grid */}
//         <div className="flex-1 overflow-y-auto p-4 lg:p-6">
//           <QuickProducts 
//             products={products} 
//             selectedCategory={selectedCategory} 
//             handleAddProduct={handleAddProduct} 
//           />
//         </div>
//       </div>

//       {/* Shopping Cart Sidebar - Always Visible */}
//       <div className="w-80 lg:w-96 bg-gray-800 border-l border-gray-700 flex flex-col h-screen">
//         {/* Cart Header */}
//         <div className="flex-shrink-0 p-4 border-b border-gray-700 bg-gray-800">
//           <div className="flex items-center justify-between">
//             <h3 className="text-lg font-bold text-white flex items-center gap-2">
//               <ShoppingCart className="w-5 h-5" />
//               Shopping Cart
//               {items.length > 0 && (
//                 <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
//                   {items.reduce((sum, item) => sum + item.quantity, 0)}
//                 </span>
//               )}
//             </h3>
//             {items.length > 0 && (
//               <button
//                 onClick={clearCart}
//                 className="text-red-400 hover:text-red-300 text-sm transition-colors"
//               >
//                 Clear All
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Customer Info */}
//         {customer ? (
//           <div className="flex-shrink-0 p-4 bg-gray-700/50 border-b border-gray-700">
//             <div className="flex items-center justify-between">
//               <div className="min-w-0 flex-1">
//                 <p className="text-white font-medium truncate">
//                   {customer.first_name} {customer.last_name}
//                 </p>
//                 <p className="text-gray-400 text-sm">Points: {customer.loyalty_points}</p>
//               </div>
//               <button
//                 onClick={() => setCustomer(null)}
//                 className="text-gray-400 hover:text-gray-300 ml-2 flex-shrink-0"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         ) : (
//           <div className="flex-shrink-0 p-4 border-b border-gray-700">
//             <button
//               onClick={() => setShowCustomerSearch(true)}
//               className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 text-gray-300 transition-colors"
//             >
//               <User className="w-4 h-4" />
//               Add Customer
//             </button>
//           </div>
//         )}

//         {/* Cart Items - Scrollable with proper constraints */}
//         <div className="flex-1 overflow-y-auto p-4 min-h-0">
//           {items.length === 0 ? (
//             <div className="flex flex-col items-center justify-center h-full text-center py-8">
//               <ShoppingCart className="w-16 h-16 text-gray-600 mb-4" />
//               <p className="text-gray-400 font-medium">Cart is empty</p>
//               <p className="text-gray-500 text-sm mt-2">Add products to get started</p>
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {items.map((item) => (
//                 <div key={item.id} className="bg-gray-700 rounded-lg p-3 shadow-lg">
//                   <div className="flex justify-between items-start mb-2">
//                     <div className="min-w-0 flex-1">
//                       <h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
//                       <p className="text-gray-400 text-xs">@ KES {item.unit_price.toLocaleString()}</p>
//                     </div>
//                     <button
//                       onClick={() => removeItem(item.id)}
//                       className="text-red-400 hover:text-red-300 ml-2 transition-colors"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </button>
//                   </div>
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                       <button
//                         onClick={() => updateQuantity(item.id, item.quantity - 1)}
//                         className="bg-gray-600 hover:bg-gray-500 w-8 h-8 rounded flex items-center justify-center text-white transition-colors"
//                       >
//                         <Minus className="w-4 h-4" />
//                       </button>
//                       <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
//                       <button
//                         onClick={() => updateQuantity(item.id, item.quantity + 1)}
//                         className="bg-gray-600 hover:bg-gray-500 w-8 h-8 rounded flex items-center justify-center text-white transition-colors"
//                         disabled={item.track_inventory && item.quantity >= item.current_stock}
//                       >
//                         <Plus className="w-4 h-4" />
//                       </button>
//                     </div>
//                     <span className="text-blue-400 font-bold">
//                       KES {(item.unit_price * item.quantity).toLocaleString()}
//                     </span>
//                   </div>
//                   {item.track_inventory && item.quantity >= item.current_stock && (
//                     <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
//                       <AlertCircle className="w-3 h-3" />
//                       Max stock reached
//                     </p>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Cart Summary - Always Visible at Bottom */}
//         <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-800 shadow-2xl">
//           <div className="space-y-2 mb-4">
//             <div className="flex justify-between text-sm">
//               <span className="text-gray-400">Subtotal</span>
//               <span className="text-white font-medium">KES {getSubtotal().toLocaleString()}</span>
//             </div>
//             <div className="flex justify-between text-sm">
//               <span className="text-gray-400">Tax (16%)</span>
//               <span className="text-white font-medium">KES {getTaxAmount().toLocaleString()}</span>
//             </div>
//             {discountAmount > 0 && (
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-400">Discount</span>
//                 <span className="text-green-400 font-medium">-KES {discountAmount.toLocaleString()}</span>
//               </div>
//             )}
//           </div>

//           <div className="flex justify-between items-center pt-3 mb-4 border-t border-gray-700">
//             <span className="text-white font-bold text-lg">Total</span>
//             <span className="text-blue-400 font-bold text-2xl">
//               KES {getTotal().toLocaleString()}
//             </span>
//           </div>

//           <button
//             onClick={handleCheckout}
//             disabled={items.length === 0}
//             className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-600/25 disabled:shadow-none"
//           >
//             <CreditCard className="w-5 h-5" />
//             Proceed to Checkout
//           </button>
//         </div>
//       </div>

//       {/* Modals */}
//       {showCheckout && (
//         <CheckoutModal
//           onClose={() => setShowCheckout(false)}
//           onComplete={() => {
//             setShowCheckout(false);
//             clearCart();
//           }}
//         />
//       )}

//       {showCustomerSearch && (
//         <CustomerSearchModal
//           onSelect={(customer) => {
//             setCustomer(customer);
//             setShowCustomerSearch(false);
//           }}
//           onClose={() => setShowCustomerSearch(false)}
//         />
//       )}
//     </div>
//   );
// }

// // Enhanced Checkout Modal
// function CheckoutModal({ onClose, onComplete }) {
//   const [paymentMethod, setPaymentMethod] = useState('cash');
//   const [amountPaid, setAmountPaid] = useState('');
//   const [reference, setReference] = useState('');
//   const [processing, setProcessing] = useState(false);
//   const [settings, setSettings] = useState({});
//   const [settingsLoaded, setSettingsLoaded] = useState(false);

//   const { items, customer, discountAmount, notes, getTotal, getSubtotal, getTaxAmount } = useCartStore();
//   const { createSale } = useSalesStore();
//   const { user } = useAuthStore();

//   const total = getTotal();
//   const change = parseFloat(amountPaid || 0) - total;

//   const paymentMethods = [
//     { id: 'cash', name: 'Cash', icon: DollarSign, color: 'green' },
//     { id: 'card', name: 'Card', icon: CreditCard, color: 'blue' },
//     { id: 'mpesa', name: 'M-Pesa', icon: Smartphone, color: 'green' },
//     { id: 'credit', name: 'Credit', icon: User, color: 'orange' }
//   ];

//   useEffect(() => {
//     const fetchSettings = async () => {
//       try {
//         const businessInfo = await window.api.settings.getBusinessInfo();
//         if (businessInfo && businessInfo.success) {
//           const businessData = businessInfo.businessInfo || businessInfo.settings;
//           setSettings(businessData || {});
//         }
//       } catch (error) {
//         console.error('Failed to load settings:', error);
//       } finally {
//         setSettingsLoaded(true);
//       }
//     };
//     fetchSettings();
//   }, []);

//   useEffect(() => {
//     // Auto-fill exact amount for cash payments
//     if (paymentMethod === 'cash' && !amountPaid) {
//       setAmountPaid(Math.ceil(total).toString());
//     }
//   }, [paymentMethod, total]);

//   const handleComplete = async () => {
//     if (paymentMethod !== 'credit' && (!amountPaid || parseFloat(amountPaid) < total)) {
//       toast.error('Insufficient payment amount');
//       return;
//     }

//     setProcessing(true);

//     try {
//       const saleData = {
//         customer_id: customer?.id,
//         items: items.map(item => ({
//           product_id: item.id,
//           quantity: item.quantity,
//           unit_price: item.unit_price,
//           product_name: item.name
//         })),
//         payment_method: paymentMethod,
//         amount_paid: parseFloat(amountPaid || 0),
//         discount_amount: discountAmount,
//         notes: notes,
//         reference_number: reference,
//         total_amount: total,
//         subtotal_amount: getSubtotal(),
//         tax_amount: getTaxAmount(),
//         change_due: change
//       };

//       const sale = await createSale(saleData);

//       if (sale) {
//         toast.success('Sale completed successfully!');
        
//         if (window.confirm('Print receipt?')) {
//           // Print receipt logic here (keeping your existing receipt printing code)
//           const currency = settings?.currency || 'KES';
//           const taxRate = parseFloat(settings?.tax_rate || '16');
//           const businessName = settings?.business_name || 'Your Business';
//           const businessAddress = settings?.business_address || '';
//           const businessPhone = settings?.business_phone || '';
//           const businessEmail = settings?.business_email || '';
//           const taxNumber = settings?.tax_number || '';
//           const receiptHeader = settings?.receipt_header || 'Welcome!';
//           const receiptFooter = settings?.receipt_footer || 'Thank you for your business!';

//           const itemsHtml = sale.items.map(item => `
//             <div class="flex justify-between">
//                 <span>${item.quantity} x ${item.product_name}</span>
//                 <span>${currency} ${(item.quantity * item.unit_price).toLocaleString()}</span>
//             </div>
//           `).join('');

//           const receiptHtml = `
//             <html>
//             <head>
//                 <title>Receipt</title>
//                 <style>
//                     body {
//                         font-family: 'monospace', sans-serif;
//                         font-size: 12px;
//                         color: #000;
//                         margin: 0;
//                         padding: 10px;
//                         box-sizing: border-box;
//                     }
//                     .receipt-container {
//                         width: 250px;
//                         margin: 0 auto;
//                         padding: 5px;
//                     }
//                     .text-center { text-align: center; }
//                     .flex { display: flex; }
//                     .justify-between { justify-content: space-between; }
//                     .font-bold { font-weight: bold; }
//                     .text-sm { font-size: 14px; }
//                     .text-xs { font-size: 12px; }
//                     .mb-2 { margin-bottom: 8px; }
//                     .my-2 { margin-top: 8px; margin-bottom: 8px; }
//                     .border-dashed { border-style: dashed; }
//                     .border-gray-400 { border-color: #9ca3af; }
//                     .border-t { border-top-width: 1px; }
//                     .space-y-1 > * + * { margin-top: 4px; }
//                 </style>
//             </head>
//             <body>
//                 <div class="receipt-container">
//                     <div class="text-center mb-2">
//                         <p class="font-bold text-sm">${businessName}</p>
//                         ${businessAddress ? `<p>${businessAddress}</p>` : ''}
//                         ${businessPhone || businessEmail ? `<p>${businessPhone}${businessPhone && businessEmail ? ' | ' : ''}${businessEmail}</p>` : ''}
//                         ${taxNumber ? `<p>Tax No: ${taxNumber}</p>` : ''}
//                     </div>
//                     <div class="border-t border-dashed border-gray-400 my-2"></div>
//                     <p class="text-center">${receiptHeader}</p>
//                     <div class="border-t border-dashed border-gray-400 my-2"></div>
//                     <div class="space-y-1">
//                         ${itemsHtml}
//                     </div>
//                     <div class="border-t border-dashed border-gray-400 my-2"></div>
//                     <div class="space-y-1">
//                         <div class="flex justify-between">
//                             <span>Subtotal:</span>
//                             <span>${currency} ${sale.subtotal.toLocaleString()}</span>
//                         </div>
//                         ${sale.discount_amount > 0 ? `
//                         <div class="flex justify-between">
//                             <span>Discount:</span>
//                             <span>-${currency} ${sale.discount_amount.toLocaleString()}</span>
//                         </div>
//                         ` : ''}
//                         <div class="flex justify-between">
//                             <span>Tax (${taxRate}%):</span>
//                             <span>${currency} ${sale.tax_amount.toLocaleString()}</span>
//                         </div>
//                         <div class="flex justify-between font-bold">
//                             <span>Total:</span>
//                             <span>${currency} ${sale.total_amount.toLocaleString()}</span>
//                         </div>
//                         <div class="flex justify-between">
//                             <span>Amount Paid:</span>
//                             <span>${currency} ${sale.amount_paid.toLocaleString()}</span>
//                         </div>
//                         ${sale.change_due > 0 ? `
//                         <div class="flex justify-between font-bold">
//                             <span>Change Due:</span>
//                             <span>${currency} ${sale.change_due.toLocaleString()}</span>
//                         </div>
//                         ` : ''}
//                     </div>
//                     <div class="border-t border-dashed border-gray-400 my-2"></div>
//                     <p class="text-center">${receiptFooter}</p>
//                     <p class="text-center mt-2">${new Date(sale.created_at).toLocaleString()}</p>
//                 </div>
//             </body>
//             </html>
//           `;

//           const printWindow = window.open('', '_blank');
//           printWindow.document.write(receiptHtml);
//           printWindow.document.close();
//           printWindow.focus();
//           printWindow.print();
//           printWindow.close();
//         }
//         onComplete();
//       }
//     } catch (error) {
//       console.error('Checkout error:', error);
//       toast.error('Failed to complete sale');
//     } finally {
//       setProcessing(false);
//     }
//   };

// // Continuation of CheckoutModal component
//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
//           <h2 className="text-xl font-bold text-white">Complete Payment</h2>
//           <button
//             onClick={onClose}
//             className="text-white/80 hover:text-white transition-colors"
//           >
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         {/* Show loading indicator if settings are not loaded yet */}
//         {!settingsLoaded && (
//           <div className="flex items-center justify-center p-6">
//             <Loader2 className="w-6 h-6 animate-spin text-blue-400 mr-2" />
//             <span className="text-gray-300">Loading business settings...</span>
//           </div>
//         )}

//         {/* Content - Scrollable */}
//         {settingsLoaded && (
//           <div className="flex-1 overflow-y-auto p-6 space-y-6">
//             {/* Order Summary Card */}
//             <div className="bg-gradient-to-br from-gray-700 to-gray-700/50 rounded-xl p-5 border border-gray-600">
//               <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
//                 <Receipt className="w-5 h-5" />
//                 Order Summary
//               </h3>
//               <div className="space-y-3">
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-400">Total Items</span>
//                   <span className="text-white font-medium bg-gray-600 px-3 py-1 rounded-lg">
//                     {items.reduce((sum, item) => sum + item.quantity, 0)} items
//                   </span>
//                 </div>
//                 {customer && (
//                   <div className="flex justify-between items-center">
//                     <span className="text-gray-400">Customer</span>
//                     <span className="text-white font-medium">
//                       {customer.first_name} {customer.last_name}
//                     </span>
//                   </div>
//                 )}
//                 <div className="flex justify-between items-center pt-3 border-t border-gray-600">
//                   <span className="text-white font-semibold text-lg">Total Due</span>
//                   <span className="text-blue-400 font-bold text-2xl">
//                     {settings?.currency || 'KES'} {total.toLocaleString()}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Payment Method Selection */}
//             <div>
//               <h3 className="font-semibold text-white mb-4">Select Payment Method</h3>
//               <div className="grid grid-cols-2 gap-3">
//                 {paymentMethods.map((method) => {
//                   const Icon = method.icon;
//                   const isSelected = paymentMethod === method.id;
//                   return (
//                     <button
//                       key={method.id}
//                       onClick={() => setPaymentMethod(method.id)}
//                       className={`relative p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
//                         isSelected
//                           ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
//                           : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
//                       }`}
//                     >
//                       {isSelected && (
//                         <div className="absolute top-2 right-2">
//                           <Check className="w-5 h-5 text-blue-400" />
//                         </div>
//                       )}
//                       <Icon className={`w-8 h-8 mx-auto mb-2 ${
//                         isSelected ? 'text-blue-400' : 'text-gray-300'
//                       }`} />
//                       <p className={`font-medium ${
//                         isSelected ? 'text-white' : 'text-gray-300'
//                       }`}>{method.name}</p>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Payment Amount Input */}
//             {paymentMethod !== 'credit' && (
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-2">
//                     Amount Received
//                   </label>
//                   <div className="relative">
//                     <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
//                       {settings?.currency || 'KES'}
//                     </span>
//                     <input
//                       type="number"
//                       value={amountPaid}
//                       onChange={(e) => setAmountPaid(e.target.value)}
//                       className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-16 pr-4 py-4 text-white text-xl font-semibold focus:outline-none focus:border-blue-500 transition-colors"
//                       placeholder="0"
//                       autoFocus
//                     />
//                   </div>
                  
//                   {/* Change Display */}
//                   {amountPaid && parseFloat(amountPaid) >= total && (
//                     <div className="mt-3 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
//                       <p className="text-green-400 font-bold text-lg">
//                         Change: {settings?.currency || 'KES'} {change.toLocaleString()}
//                       </p>
//                     </div>
//                   )}
                  
//                   {amountPaid && parseFloat(amountPaid) < total && (
//                     <div className="mt-3 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
//                       <p className="text-red-400 font-medium">
//                         Insufficient amount: {settings?.currency || 'KES'} {(total - parseFloat(amountPaid || 0)).toLocaleString()} short
//                       </p>
//                     </div>
//                   )}
//                 </div>

//                 {/* Quick Cash Amount Buttons */}
//                 {paymentMethod === 'cash' && (
//                   <div>
//                     <p className="text-sm text-gray-400 mb-2">Quick amounts:</p>
//                     <div className="grid grid-cols-4 gap-2">
//                       {[50, 100, 200, 500, 1000, 2000, 5000, 10000].map((amount) => (
//                         <button
//                           key={amount}
//                           onClick={() => setAmountPaid(amount.toString())}
//                           className={`bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
//                             parseFloat(amountPaid) === amount ? 'ring-2 ring-blue-500' : ''
//                           }`}
//                         >
//                           {amount >= 1000 ? `${amount / 1000}k` : amount}
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Reference Number for non-cash payments */}
//             {paymentMethod !== 'cash' && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   Reference Number {paymentMethod === 'mpesa' && '(M-Pesa Transaction Code)'}
//                 </label>
//                 <input
//                   type="text"
//                   value={reference}
//                   onChange={(e) => setReference(e.target.value.toUpperCase())}
//                   className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
//                   placeholder={paymentMethod === 'mpesa' ? 'e.g. QFH7X8MNP1' : 'Transaction reference'}
//                 />
//               </div>
//             )}

//             {/* Sale Notes (Optional) */}
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Notes (Optional)
//               </label>
//               <textarea
//                 value={notes}
//                 onChange={(e) => setNotes(e.target.value)}
//                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
//                 placeholder="Add any notes about this sale..."
//                 rows="2"
//               />
//             </div>
//           </div>
//         )}

//         {/* Footer Actions - Fixed */}
//         <div className="bg-gray-700/50 px-6 py-4 flex gap-3 flex-shrink-0 border-t border-gray-600">
//           <button
//             onClick={onClose}
//             className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 rounded-lg transition-all hover:scale-105"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleComplete}
//             disabled={processing || (paymentMethod !== 'credit' && (!amountPaid || parseFloat(amountPaid) < total))}
//             className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 hover:scale-105 disabled:hover:scale-100 shadow-lg"
//           >
//             {processing ? (
//               <>
//                 <Loader2 className="w-5 h-5 animate-spin" />
//                 Processing Sale...
//               </>
//             ) : (
//               <>
//                 <Check className="w-5 h-5" />
//                 Complete Sale
//               </>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Enhanced Customer Search Modal
// function CustomerSearchModal({ onSelect, onClose }) {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [customers, setCustomers] = useState([]);
//   const [searching, setSearching] = useState(false);
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   const [newCustomer, setNewCustomer] = useState({
//     first_name: '',
//     last_name: '',
//     phone: '',
//     email: ''
//   });

//   const handleSearch = async (query) => {
//     setSearchQuery(query);
    
//     if (query.length < 2) {
//       setCustomers([]);
//       return;
//     }

//     setSearching(true);
//     try {
//       const result = await window.api.customers.search(query);
//       if (result.success) {
//         setCustomers(result.customers);
//       }
//     } catch (error) {
//       console.error('Customer search error:', error);
//       toast.error('Failed to search customers');
//     } finally {
//       setSearching(false);
//     }
//   };

//   const handleCreateCustomer = async () => {
//     if (!newCustomer.first_name || !newCustomer.phone) {
//       toast.error('First name and phone are required');
//       return;
//     }

//     try {
//       const result = await window.api.customers.create(newCustomer);
//       if (result.success) {
//         toast.success('Customer created successfully');
//         onSelect(result.customer);
//       }
//     } catch (error) {
//       console.error('Create customer error:', error);
//       toast.error('Failed to create customer');
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
//           <h2 className="text-xl font-bold text-white">
//             {showCreateForm ? 'Create New Customer' : 'Select Customer'}
//           </h2>
//           <button
//             onClick={onClose}
//             className="text-white/80 hover:text-white transition-colors"
//           >
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         <div className="flex-1 overflow-hidden flex flex-col p-6">
//           {!showCreateForm ? (
//             <>
//               {/* Search Input */}
//               <div className="relative mb-4">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                 <input
//                   type="text"
//                   value={searchQuery}
//                   onChange={(e) => handleSearch(e.target.value)}
//                   placeholder="Search by name, phone, or email..."
//                   className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
//                   autoFocus
//                 />
//                 {searching && (
//                   <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
//                 )}
//               </div>

//               {/* Search Results */}
//               <div className="flex-1 overflow-y-auto mb-4">
//                 {customers.length > 0 ? (
//                   <div className="space-y-2">
//                     {customers.map((customer) => (
//                       <button
//                         key={customer.id}
//                         onClick={() => onSelect(customer)}
//                         className="w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-all hover:scale-[1.02] group"
//                       >
//                         <div className="flex items-center justify-between">
//                           <div>
//                             <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
//                               {customer.first_name} {customer.last_name}
//                             </p>
//                             <p className="text-gray-400 text-sm mt-1">
//                               {customer.phone} {customer.email && `• ${customer.email}`}
//                             </p>
//                           </div>
//                           <div className="text-right">
//                             <p className="text-gray-400 text-sm">Loyalty Points</p>
//                             <p className="text-blue-400 font-bold">{customer.loyalty_points || 0}</p>
//                           </div>
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 ) : searchQuery.length >= 2 && !searching ? (
//                   <div className="text-center py-12">
//                     <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
//                     <p className="text-gray-400 mb-4">No customers found</p>
//                     <button
//                       onClick={() => setShowCreateForm(true)}
//                       className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
//                     >
//                       Create new customer?
//                     </button>
//                   </div>
//                 ) : (
//                   <div className="text-center py-12">
//                     <p className="text-gray-500">Search for a customer or create a new one</p>
//                   </div>
//                 )}
//               </div>

//               {/* Action Buttons */}
//               <div className="flex gap-3 pt-4 border-t border-gray-700">
//                 <button
//                   onClick={() => setShowCreateForm(true)}
//                   className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 rounded-lg transition-all hover:scale-105"
//                 >
//                   Create New
//                 </button>
//                 <button
//                   onClick={() => onSelect(null)}
//                   className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all hover:scale-105"
//                 >
//                   Continue Without Customer
//                 </button>
//               </div>
//             </>
//           ) : (
//             <>
//               {/* Create Customer Form */}
//               <div className="space-y-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-300 mb-2">
//                       First Name *
//                     </label>
//                     <input
//                       type="text"
//                       value={newCustomer.first_name}
//                       onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
//                       className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
//                       autoFocus
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-300 mb-2">
//                       Last Name
//                     </label>
//                     <input
//                       type="text"
//                       value={newCustomer.last_name}
//                       onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
//                       className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-2">
//                     Phone Number *
//                   </label>
//                   <input
//                     type="tel"
//                     value={newCustomer.phone}
//                     onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
//                     className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
//                     placeholder="07XXXXXXXX"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-2">
//                     Email Address
//                   </label>
//                   <input
//                     type="email"
//                     value={newCustomer.email}
//                     onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
//                     className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
//                     placeholder="customer@example.com"
//                   />
//                 </div>
//               </div>

//               {/* Form Actions */}
//               <div className="flex gap-3 mt-6">
//                 <button
//                   onClick={() => setShowCreateForm(false)}
//                   className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 rounded-lg transition-all hover:scale-105"
//                 >
//                   Back to Search
//                 </button>
//                 <button
//                   onClick={handleCreateCustomer}
//                   disabled={!newCustomer.first_name || !newCustomer.phone}
//                   className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all hover:scale-105 disabled:hover:scale-100"
//                 >
//                   Create Customer
//                 </button>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// src/renderer/components/pos/SalesModule.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign,
  Smartphone, User, X, Loader2, Package, AlertCircle, Check,
  Percent, Tag, Receipt, Send, Eye, ShoppingBag
} from 'lucide-react';
import { useCartStore, useProductsStore, useSalesStore, useAuthStore } from '../../store';
import toast from 'react-hot-toast';

export default function SalesModule() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const searchInputRef = useRef(null);

  const { user } = useAuthStore();
  const {
    items, customer, discountAmount, notes,
    addItem, updateQuantity, removeItem, setCustomer,
    setDiscount, setNotes, clearCart, getSubtotal,
    getTaxAmount, getTotal
  } = useCartStore();
  const { searchProducts, fetchCategories, products, fetchProducts } = useProductsStore();
  const { createSale } = useSalesStore();

  useEffect(() => {
    loadInitialData();
    searchInputRef.current?.focus();
  }, []);

  const loadInitialData = async () => {
    try {
      const categoriesResult = await window.api.categories.getAll();
      if (categoriesResult.success) {
        setCategories(categoriesResult.categories);
      }
      await fetchProducts();
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchProducts(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleBarcodeScan = async (barcode) => {
    try {
      const result = await window.api.products.getByBarcode(barcode);
      if (result.success && result.product) {
        addItem(result.product);
        setSearchQuery('');
        setSearchResults([]);
        toast.success(`Added 1 × ${result.product.name}`);
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      toast.error('Barcode scan error');
    }
  };

  const handleAddProduct = (product) => {
    if (product.track_inventory && product.current_stock < 1) {
      toast.error('Insufficient stock');
      return;
    }
    addItem(product);
    searchInputRef.current?.focus();
    toast.success(`Added 1 × ${product.name}`);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowCheckout(true);
  };

  // Enhanced QuickProducts component with a more compact layout
// Enhanced QuickProducts component with a more compact layout
  const QuickProducts = ({ products, selectedCategory, handleAddProduct }) => {
    const filteredProducts = products.filter(p =>
      p.is_active &&
      (selectedCategory === null || p.category_id === selectedCategory)
    );

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredProducts.map((product) => {
          return (
            <div
              key={product.id}
              // Added cursor-default to explicitly set cursor behavior
              className={`bg-gray-800 border border-gray-700 rounded-lg overflow-hidden transition-all hover:border-blue-500 hover:ring-2 hover:ring-blue-500/50 cursor-default`}
            >
              {/* Product Image/Icon - made smaller */}
              <div
                className="bg-gray-700 h-20 flex items-center justify-center"
              >
                <Package className="w-10 h-10 text-gray-500" />
              </div>

              {/* Product Info - more compact */}
              <div className="p-3">
                <h4 className="text-white font-medium text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h4>
                <p className="text-gray-400 text-xs mb-2 truncate">
                  {product.category_name}
                </p>

                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-blue-400">
                    KES {product.unit_price.toLocaleString()}
                  </span>
                  {product.track_inventory && (
                    <span className={`text-xs ${
                      product.current_stock <= product.low_stock_threshold ? 'text-red-400' : 'text-gray-500'
                    }`}>
                      Stock: {product.current_stock}
                    </span>
                  )}
                </div>

                {/* Add to Cart Button - now the primary action */}
                <button
                  onClick={(e) => { // Prevent click on card from bubbling up
                    e.stopPropagation();
                    handleAddProduct(product);
                  }}
                  disabled={product.current_stock <= 0 && product.track_inventory}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mt-3"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-4 lg:p-6 bg-gray-900 border-b border-gray-800">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery) {
                  handleBarcodeScan(searchQuery);
                }
              }}
              placeholder="Search products by name, SKU, or scan barcode..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-20 left-4 right-4 lg:left-6 lg:right-auto lg:w-[calc(100%-24rem-3rem)] mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  className="w-full px-4 py-3 hover:bg-gray-700 flex items-center justify-between text-left transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate">{product.name}</p>
                    <p className="text-gray-400 text-sm">SKU: {product.sku} | {product.category_name}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-blue-400 font-bold">KES {product.unit_price.toLocaleString()}</p>
                    {product.track_inventory && (
                      <p className="text-gray-500 text-sm">Stock: {product.current_stock}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <QuickProducts
            products={products}
            selectedCategory={selectedCategory}
            handleAddProduct={handleAddProduct}
          />
        </div>
      </div>

      {/* Shopping Cart Sidebar - Always Visible */}
      <div className="w-80 lg:w-96 bg-gray-800 border-l border-gray-700 flex flex-col h-screen">
        {/* Cart Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart
              {items.length > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </h3>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Customer Info */}
        {customer ? (
          <div className="flex-shrink-0 p-4 bg-gray-700/50 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium truncate">
                  {customer.first_name} {customer.last_name}
                </p>
                <p className="text-gray-400 text-sm">Points: {customer.loyalty_points}</p>
              </div>
              <button
                onClick={() => setCustomer(null)}
                className="text-gray-400 hover:text-gray-300 ml-2 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 p-4 border-b border-gray-700">
            <button
              onClick={() => setShowCustomerSearch(true)}
              className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 text-gray-300 transition-colors"
            >
              <User className="w-4 h-4" />
              Add Customer
            </button>
          </div>
        )}

        {/* Cart Items - Scrollable with proper constraints */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <ShoppingCart className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400 font-medium">Cart is empty</p>
              <p className="text-gray-500 text-sm mt-2">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-700 rounded-lg p-3 shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
                      <p className="text-gray-400 text-xs">@ KES {item.unit_price.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-300 ml-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="bg-gray-600 hover:bg-gray-500 w-8 h-8 rounded flex items-center justify-center text-white transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="bg-gray-600 hover:bg-gray-500 w-8 h-8 rounded flex items-center justify-center text-white transition-colors"
                        disabled={item.track_inventory && item.quantity >= item.current_stock}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-blue-400 font-bold">
                      KES {(item.unit_price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                  {item.track_inventory && item.quantity >= item.current_stock && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Max stock reached
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary - Always Visible at Bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-800 shadow-2xl">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white font-medium">KES {getSubtotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tax (16%)</span>
              <span className="text-white font-medium">KES {getTaxAmount().toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Discount</span>
                <span className="text-green-400 font-medium">-KES {discountAmount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-3 mb-4 border-t border-gray-700">
            <span className="text-white font-bold text-lg">Total</span>
            <span className="text-blue-400 font-bold text-2xl">
              KES {getTotal().toLocaleString()}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-600/25 disabled:shadow-none"
          >
            <CreditCard className="w-5 h-5" />
            Proceed to Checkout
          </button>
        </div>
      </div>

      {/* Modals */}
      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onComplete={() => {
            setShowCheckout(false);
            clearCart();
          }}
        />
      )}

      {showCustomerSearch && (
        <CustomerSearchModal
          onSelect={(customer) => {
            setCustomer(customer);
            setShowCustomerSearch(false);
          }}
          onClose={() => setShowCustomerSearch(false)}
        />
      )}
    </div>
  );
}

// Enhanced Checkout Modal
function CheckoutModal({ onClose, onComplete }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [reference, setReference] = useState('');
  const [processing, setProcessing] = useState(false);
  const [settings, setSettings] = useState({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { items, customer, discountAmount, notes, getTotal, getSubtotal, getTaxAmount } = useCartStore();
  const { createSale } = useSalesStore();
  const { user } = useAuthStore();

  const total = getTotal();
  const change = parseFloat(amountPaid || 0) - total;

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: DollarSign, color: 'green' },
    { id: 'card', name: 'Card', icon: CreditCard, color: 'blue' },
    { id: 'mpesa', name: 'M-Pesa', icon: Smartphone, color: 'green' },
    { id: 'credit', name: 'Credit', icon: User, color: 'orange' }
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const businessInfo = await window.api.settings.getBusinessInfo();
        if (businessInfo && businessInfo.success) {
          const businessData = businessInfo.businessInfo || businessInfo.settings;
          setSettings(businessData || {});
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    // Auto-fill exact amount for cash payments
    if (paymentMethod === 'cash' && !amountPaid) {
      setAmountPaid(Math.ceil(total).toString());
    }
  }, [paymentMethod, total]);

  const handleComplete = async () => {
    if (paymentMethod !== 'credit' && (!amountPaid || parseFloat(amountPaid) < total)) {
      toast.error('Insufficient payment amount');
      return;
    }

    setProcessing(true);

    try {
      const saleData = {
        customer_id: customer?.id,
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          product_name: item.name
        })),
        payment_method: paymentMethod,
        amount_paid: parseFloat(amountPaid || 0),
        discount_amount: discountAmount,
        notes: notes,
        reference_number: reference,
        total_amount: total,
        subtotal_amount: getSubtotal(),
        tax_amount: getTaxAmount(),
        change_due: change
      };

      const sale = await createSale(saleData);

      if (sale) {
        toast.success('Sale completed successfully!');

        // Custom modal for print confirmation
        const printConfirmModal = document.createElement('div');
        printConfirmModal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4';
        printConfirmModal.innerHTML = `
          <div class="bg-gray-800 rounded-lg shadow-2xl p-6 text-center max-w-sm w-full">
            <p class="text-white text-lg mb-6">Print receipt?</p>
            <div class="flex justify-center gap-4">
              <button id="printNo" class="bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-5 rounded-lg transition-all">No</button>
              <button id="printYes" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg transition-all">Yes</button>
            </div>
          </div>
        `;
        document.body.appendChild(printConfirmModal);

        const handlePrintResponse = (print) => {
          document.body.removeChild(printConfirmModal);
          if (print) {
            // Print receipt logic here (keeping your existing receipt printing code)
            const currency = settings?.currency || 'KES';
            const taxRate = parseFloat(settings?.tax_rate || '16');
            const businessName = settings?.business_name || 'Your Business';
            const businessAddress = settings?.business_address || '';
            const businessPhone = settings?.business_phone || '';
            const businessEmail = settings?.business_email || '';
            const taxNumber = settings?.tax_number || '';
            const receiptHeader = settings?.receipt_header || 'Welcome!';
            const receiptFooter = settings?.receipt_footer || 'Thank you for your business!';

            const itemsHtml = sale.items.map(item => `
              <div class="flex justify-between">
                  <span>${item.quantity} x ${item.product_name}</span>
                  <span>${currency} ${(item.quantity * item.unit_price).toLocaleString()}</span>
              </div>
            `).join('');

            const receiptHtml = `
              <html>
              <head>
                  <title>Receipt</title>
                  <style>
                      body {
                          font-family: 'monospace', sans-serif;
                          font-size: 12px;
                          color: #000;
                          margin: 0;
                          padding: 10px;
                          box-sizing: border-box;
                      }
                      .receipt-container {
                          width: 250px;
                          margin: 0 auto;
                          padding: 5px;
                      }
                      .text-center { text-align: center; }
                      .flex { display: flex; }
                      .justify-between { justify-content: space-between; }
                      .font-bold { font-weight: bold; }
                      .text-sm { font-size: 14px; }
                      .text-xs { font-size: 12px; }
                      .mb-2 { margin-bottom: 8px; }
                      .my-2 { margin-top: 8px; margin-bottom: 8px; }
                      .border-dashed { border-style: dashed; }
                      .border-gray-400 { border-color: #9ca3af; }
                      .border-t { border-top-width: 1px; }
                      .space-y-1 > * + * { margin-top: 4px; }
                  </style>
              </head>
              <body>
                  <div class="receipt-container">
                      <div class="text-center mb-2">
                          <p class="font-bold text-sm">${businessName}</p>
                          ${businessAddress ? `<p>${businessAddress}</p>` : ''}
                          ${businessPhone || businessEmail ? `<p>${businessPhone}${businessPhone && businessEmail ? ' | ' : ''}${businessEmail}</p>` : ''}
                          ${taxNumber ? `<p>Tax No: ${taxNumber}</p>` : ''}
                      </div>
                      <div class="border-t border-dashed border-gray-400 my-2"></div>
                      <p class="text-center">${receiptHeader}</p>
                      <div class="border-t border-dashed border-gray-400 my-2"></div>
                      <div class="space-y-1">
                          ${itemsHtml}
                      </div>
                      <div class="border-t border-dashed border-gray-400 my-2"></div>
                      <div class="space-y-1">
                          <div class="flex justify-between">
                              <span>Subtotal:</span>
                              <span>${currency} ${sale.subtotal.toLocaleString()}</span>
                          </div>
                          ${sale.discount_amount > 0 ? `
                          <div class="flex justify-between">
                              <span>Discount:</span>
                              <span>-${currency} ${sale.discount_amount.toLocaleString()}</span>
                          </div>
                          ` : ''}
                          <div class="flex justify-between">
                              <span>Tax (${taxRate}%):</span>
                              <span>${currency} ${sale.tax_amount.toLocaleString()}</span>
                          </div>
                          <div class="flex justify-between font-bold">
                              <span>Total:</span>
                              <span>${currency} ${sale.total_amount.toLocaleString()}</span>
                          </div>
                          <div class="flex justify-between">
                              <span>Amount Paid:</span>
                              <span>${currency} ${sale.amount_paid.toLocaleString()}</span>
                          </div>
                          ${sale.change_due > 0 ? `
                          <div class="flex justify-between font-bold">
                              <span>Change Due:</span>
                              <span>${currency} ${sale.change_due.toLocaleString()}</span>
                          </div>
                          ` : ''}
                      </div>
                      <div class="border-t border-dashed border-gray-400 my-2"></div>
                      <p class="text-center">${receiptFooter}</p>
                      <p class="text-center mt-2">${new Date(sale.created_at).toLocaleString()}</p>
                  </div>
              </body>
              </html>
            `;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(receiptHtml);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
          }
          onComplete();
        };

        document.getElementById('printYes').onclick = () => handlePrintResponse(true);
        document.getElementById('printNo').onclick = () => handlePrintResponse(false);

      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to complete sale');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Show loading indicator if settings are not loaded yet */}
        {!settingsLoaded && (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400 mr-2" />
            <span className="text-gray-300">Loading business settings...</span>
          </div>
        )}

        {/* Content - Scrollable */}
        {settingsLoaded && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Order Summary Card */}
            <div className="bg-gradient-to-br from-gray-700 to-gray-700/50 rounded-xl p-5 border border-gray-600">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Order Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Items</span>
                  <span className="text-white font-medium bg-gray-600 px-3 py-1 rounded-lg">
                    {items.reduce((sum, item) => sum + item.quantity, 0)} items
                  </span>
                </div>
                {customer && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Customer</span>
                    <span className="text-white font-medium">
                      {customer.first_name} {customer.last_name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-gray-600">
                  <span className="text-white font-semibold text-lg">Total Due</span>
                  <span className="text-blue-400 font-bold text-2xl">
                    {settings?.currency || 'KES'} {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <h3 className="font-semibold text-white mb-4">Select Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                          : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-5 h-5 text-blue-400" />
                        </div>
                      )}
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${
                        isSelected ? 'text-blue-400' : 'text-gray-300'
                      }`} />
                      <p className={`font-medium ${
                        isSelected ? 'text-white' : 'text-gray-300'
                      }`}>{method.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Amount Input */}
            {paymentMethod !== 'credit' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount Received
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                      {settings?.currency || 'KES'}
                    </span>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-16 pr-4 py-4 text-white text-xl font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="0"
                      autoFocus
                    />
                  </div>

                  {/* Change Display */}
                  {amountPaid && parseFloat(amountPaid) >= total && (
                    <div className="mt-3 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                      <p className="text-green-400 font-bold text-lg">
                        Change: {settings?.currency || 'KES'} {change.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {amountPaid && parseFloat(amountPaid) < total && (
                    <div className="mt-3 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <p className="text-red-400 font-medium">
                        Insufficient amount: {settings?.currency || 'KES'} {(total - parseFloat(amountPaid || 0)).toLocaleString()} short
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Cash Amount Buttons */}
                {paymentMethod === 'cash' && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Quick amounts:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[50, 100, 200, 500, 1000, 2000, 5000, 10000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setAmountPaid(amount.toString())}
                          className={`bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                            parseFloat(amountPaid) === amount ? 'ring-2 ring-blue-500' : ''
                          }`}
                        >
                          {amount >= 1000 ? `${amount / 1000}k` : amount}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reference Number for non-cash payments */}
            {paymentMethod !== 'cash' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reference Number {paymentMethod === 'mpesa' && '(M-Pesa Transaction Code)'}
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value.toUpperCase())}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder={paymentMethod === 'mpesa' ? 'e.g. QFH7X8MNP1' : 'Transaction reference'}
                />
              </div>
            )}

            {/* Sale Notes (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Add any notes about this sale..."
                rows="2"
              />
            </div>
          </div>
        )}

        {/* Footer Actions - Fixed */}
        <div className="bg-gray-700/50 px-6 py-4 flex gap-3 flex-shrink-0 border-t border-gray-600">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 rounded-lg transition-all hover:scale-105"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={processing || (paymentMethod !== 'credit' && (!amountPaid || parseFloat(amountPaid) < total))}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 hover:scale-105 disabled:hover:scale-100 shadow-lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Sale...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Complete Sale
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced Customer Search Modal
function CustomerSearchModal({ onSelect, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setCustomers([]);
      return;
    }

    setSearching(true);
    try {
      const result = await window.api.customers.search(query);
      if (result.success) {
        setCustomers(result.customers);
      }
    } catch (error) {
      console.error('Customer search error:', error);
      toast.error('Failed to search customers');
    } finally {
      setSearching(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.first_name || !newCustomer.phone) {
      toast.error('First name and phone are required');
      return;
    }

    try {
      const result = await window.api.customers.create(newCustomer);
      if (result.success) {
        toast.success('Customer created successfully');
        onSelect(result.customer);
      }
    } catch (error) {
      console.error('Create customer error:', error);
      toast.error('Failed to create customer');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-white">
            {showCreateForm ? 'Create New Customer' : 'Select Customer'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {!showCreateForm ? (
            <>
              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by name, phone, or email..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  autoFocus
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                )}
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto mb-4">
                {customers.length > 0 ? (
                  <div className="space-y-2">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => onSelect(customer)}
                        className="w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-all hover:scale-[1.02] group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
                              {customer.first_name} {customer.last_name}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                              {customer.phone} {customer.email && `• ${customer.email}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-sm">Loyalty Points</p>
                            <p className="text-blue-400 font-bold">{customer.loyalty_points || 0}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 && !searching ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No customers found</p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Create new customer?
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Search for a customer or create a new one</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 rounded-lg transition-all hover:scale-105"
                >
                  Create New
                </button>
                <button
                  onClick={() => onSelect(null)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all hover:scale-105"
                >
                  Continue Without Customer
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Create Customer Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={newCustomer.first_name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={newCustomer.last_name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="07XXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="customer@example.com"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 rounded-lg transition-all hover:scale-105"
                >
                  Back to Search
                </button>
                <button
                  onClick={handleCreateCustomer}
                  disabled={!newCustomer.first_name || !newCustomer.phone}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all hover:scale-105 disabled:hover:scale-100"
                >
                  Create Customer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
