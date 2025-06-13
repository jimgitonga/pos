// // src/renderer/components/pos/SalesModule.jsx
// import React, { useState, useEffect, useRef } from 'react';
// import {
//   Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign,
//   Smartphone, User, X, Loader2, Package, AlertCircle, Check,
//   Percent, Tag, Receipt, Send
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
//     // Focus search input
//     searchInputRef.current?.focus();
//   }, []);

//   const loadInitialData = async () => {
//     try {
//       const categoriesResult = await window.api.categories.getAll();
//       if (categoriesResult.success) {
//         setCategories(categoriesResult.categories);
//       }

//       // Load products
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

//   const handleAddProduct = (product) => {
//     if (product.current_stock <= 0 && product.track_inventory) {
//       toast.error('Product out of stock');
//       return;
//     }

//     addItem(product);
//     setSearchQuery('');
//     setSearchResults([]);
//     searchInputRef.current?.focus();
//   };

//   const handleCheckout = () => {
//     if (items.length === 0) {
//       toast.error('Cart is empty');
//       return;
//     }
//     setShowCheckout(true);
//   };

//   const QuickProducts = () => {
//     const quickProducts = products.filter(p => p.is_active).slice(0, 12);

//     return (
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//         {quickProducts.map((product) => (
//           <button
//             key={product.id}
//             onClick={() => handleAddProduct(product)}
//             className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-left transition-all hover:scale-105"
//           >
//             <div className="bg-gray-700 h-20 rounded-lg mb-3 flex items-center justify-center">
//               <Package className="w-10 h-10 text-gray-500" />
//             </div>
//             <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">{product.name}</h4>
//             <p className="text-gray-400 text-xs mb-2">{product.category_name}</p>
//             <div className="flex justify-between items-center">
//               <span className="text-base font-bold text-blue-400">KES {product.unit_price.toLocaleString()}</span>
//               {product.track_inventory && (
//                 <span className={`text-xs ${product.current_stock <= product.low_stock_threshold ? 'text-red-400' : 'text-gray-500'}`}>
//                   {product.current_stock}
//                 </span>
//               )}
//             </div>
//           </button>
//         ))}
//       </div>
//     );
//   };

//   return (
//     <div className="flex h-full">
//       {/* Main Content */}
//       <div className="flex-1 p-6">
//         {/* Search Bar */}
//         <div className="mb-6">
//           <div className="relative">
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
//               className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
//             />
//             {searching && (
//               <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
//             )}
//           </div>

//           {/* Search Results Dropdown */}
//           {searchResults.length > 0 && (
//             <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
//               {searchResults.map((product) => (
//                 <button
//                   key={product.id}
//                   onClick={() => handleAddProduct(product)}
//                   className="w-full px-4 py-3 hover:bg-gray-700 flex items-center justify-between text-left"
//                 >
//                   <div>
//                     <p className="text-white font-medium">{product.name}</p>
//                     <p className="text-gray-400 text-sm">SKU: {product.sku} | {product.category_name}</p>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-blue-400 font-bold">KES {product.unit_price.toLocaleString()}</p>
//                     {product.track_inventory && (
//                       <p className="text-gray-500 text-sm">Stock: {product.current_stock}</p>
//                     )}
//                   </div>
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Categories */}
//         <div className="mb-6">
//           <div className="flex gap-2 overflow-x-auto pb-2">
//             <button
//               onClick={() => setSelectedCategory(null)}
//               className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
//                 selectedCategory === null
//                   ? 'bg-blue-600 text-white'
//                   : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
//               }`}
//             >
//               All Products
//             </button>
//             {categories.map((category) => (
//               <button
//                 key={category.id}
//                 onClick={() => setSelectedCategory(category.id)}
//                 className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
//                   selectedCategory === category.id
//                     ? 'bg-blue-600 text-white'
//                     : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
//                 }`}
//               >
//                 {category.name}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Quick Products Grid */}
//         <QuickProducts />
//       </div>

//       {/* Shopping Cart Sidebar */}
//       <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
//         <div className="p-4 border-b border-gray-700">
//           <div className="flex items-center justify-between">
//             <h3 className="text-lg font-bold text-white flex items-center gap-2">
//               <ShoppingCart className="w-5 h-5" />
//               Shopping Cart
//             </h3>
//             {items.length > 0 && (
//               <button
//                 onClick={clearCart}
//                 className="text-red-400 hover:text-red-300 text-sm"
//               >
//                 Clear All
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Customer Info */}
//         {customer ? (
//           <div className="p-4 bg-gray-700/50 border-b border-gray-700">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-white font-medium">{customer.first_name} {customer.last_name}</p>
//                 <p className="text-gray-400 text-sm">Points: {customer.loyalty_points}</p>
//               </div>
//               <button
//                 onClick={() => setCustomer(null)}
//                 className="text-gray-400 hover:text-gray-300"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         ) : (
//           <button
//             onClick={() => setShowCustomerSearch(true)}
//             className="m-4 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 text-gray-300"
//           >
//             <User className="w-4 h-4" />
//             Add Customer
//           </button>
//         )}

//         {/* Cart Items */}
//         <div className="flex-1 overflow-y-auto p-4">
//           {items.length === 0 ? (
//             <div className="text-center py-8">
//               <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
//               <p className="text-gray-400">Cart is empty</p>
//               <p className="text-gray-500 text-sm mt-2">Add products to get started</p>
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {items.map((item) => (
//                 <div key={item.id} className="bg-gray-700 rounded-lg p-3">
//                   <div className="flex justify-between items-start mb-2">
//                     <div className="flex-1">
//                       <h4 className="text-white font-medium text-sm">{item.name}</h4>
//                       <p className="text-gray-400 text-xs">@ KES {item.unit_price.toLocaleString()}</p>
//                     </div>
//                     <button
//                       onClick={() => removeItem(item.id)}
//                       className="text-red-400 hover:text-red-300 ml-2"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </button>
//                   </div>
//                   <div className="flex items-center justify-between">
//                     <button
//                       onClick={() => updateQuantity(item.id, item.quantity - 1)}
//                       className="bg-gray-600 hover:bg-gray-500 w-8 h-8 rounded flex items-center justify-center text-white"
//                     >
//                       <Minus className="w-4 h-4" />
//                     </button>
//                     <span className="text-white w-8 text-center">{item.quantity}</span>
//                     <button
//                       onClick={() => updateQuantity(item.id, item.quantity + 1)}
//                       className="bg-gray-600 hover:bg-gray-500 w-8 h-8 rounded flex items-center justify-center text-white"
//                       disabled={item.track_inventory && item.quantity >= item.current_stock}
//                     >
//                       <Plus className="w-4 h-4" />
//                     </button>
//                   </div>
//                   <span className="text-blue-400 font-medium">
//                     KES {(item.unit_price * item.quantity).toLocaleString()}
//                   </span>
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

//         {/* Cart Summary */}
//         <div className="p-4 border-t border-gray-700 space-y-3">
//           <div className="space-y-2">
//             <div className="flex justify-between text-sm">
//               <span className="text-gray-400">Subtotal</span>
//               <span className="text-white">KES {getSubtotal().toLocaleString()}</span>
//             </div>
//             <div className="flex justify-between text-sm">
//               <span className="text-gray-400">Tax (16%)</span>
//               <span className="text-white">KES {getTaxAmount().toLocaleString()}</span>
//             </div>
//             {discountAmount > 0 && (
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-400">Discount</span>
//                 <span className="text-green-400">-KES {discountAmount.toLocaleString()}</span>
//               </div>
//             )}
//           </div>

//           <div className="flex justify-between text-xl pt-3 border-t border-gray-700">
//             <span className="text-white font-bold">Total</span>
//             <span className="text-blue-400 font-bold">KES {getTotal().toLocaleString()}</span>
//           </div>

//           <button
//             onClick={handleCheckout}
//             disabled={items.length === 0}
//             className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
//           >
//             <CreditCard className="w-5 h-5" />
//             Checkout
//           </button>
//         </div>
//       </div>

//       {/* Checkout Modal */}
//       {showCheckout && (
//         <CheckoutModal
//           onClose={() => setShowCheckout(false)}
//           onComplete={() => {
//             setShowCheckout(false);
//             clearCart();
//           }}
//         />
//       )}

//       {/* Customer Search Modal */}
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


// // Fixed Checkout Modal Component
// function CheckoutModal({ onClose, onComplete }) {
//   const [paymentMethod, setPaymentMethod] = useState('cash');
//   const [amountPaid, setAmountPaid] = useState('');
//   const [reference, setReference] = useState('');
//   const [processing, setProcessing] = useState(false);
//   const [settings, setSettings] = useState({}); // State to hold settings
//   const [settingsLoaded, setSettingsLoaded] = useState(false); // Track if settings are loaded

//   const { items, customer, discountAmount, notes, getTotal, getSubtotal, getTaxAmount } = useCartStore();
//   const { createSale } = useSalesStore();
//   const { user } = useAuthStore();

//   const total = getTotal();
//   const change = parseFloat(amountPaid || 0) - total;

//   const paymentMethods = [
//     { id: 'cash', name: 'Cash', icon: DollarSign },
//     { id: 'card', name: 'Card', icon: CreditCard },
//     { id: 'mpesa', name: 'M-Pesa', icon: Smartphone },
//     { id: 'credit', name: 'Credit', icon: User }
//   ];

//   useEffect(() => {
//     // Fetch settings when the modal mounts
//     const fetchSettings = async () => {
//       try {
//         const businessInfo = await window.api.settings.getBusinessInfo();
       
//         if (businessInfo && businessInfo.success) {
//           // Handle both possible response structures
//           const businessData = businessInfo.businessInfo || businessInfo.settings;
//           setSettings(businessData || {});
//           console.log("getBusinessInfo>>>>", businessInfo);
//         } else {
//           // Fallback for individual settings if getBusinessInfo doesn't exist or returns partial
//           const generalSettings = await window.api.settings.getAll();
//           if (generalSettings && generalSettings.success) {
//             const mappedSettings = generalSettings.settings.reduce((acc, s) => {
//               acc[s.key] = s.value;
//               return acc;
//             }, {});
//             setSettings(mappedSettings);
//           }
//         }
//       } catch (error) {
//         console.error('Failed to load settings:', error);
//         toast.error('Failed to load business settings for receipt.');
//       } finally {
//         setSettingsLoaded(true); // Mark as loaded regardless of success/failure
//       }
//     };
//     fetchSettings();
//   }, []); // Remove settings from dependency array to prevent infinite loop

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
//       console.table("create sale ", sale);

//       if (sale) {
//         if (window.confirm('Print receipt?')) {
//           // Use fallback values if settings are not loaded or properties are missing
//           const currency = settings?.currency || 'KES';
//           const taxRate = parseFloat(settings?.tax_rate || '16');
//           const businessName = settings?.business_name || 'Your Business';
//           const businessAddress = settings?.business_address || '';
//           const businessPhone = settings?.business_phone || '';
//           const businessEmail = settings?.business_email || '';
//           const taxNumber = settings?.tax_number || '';
//           const receiptHeader = settings?.receipt_header || 'Welcome!';
//           const receiptFooter = settings?.receipt_footer || 'Thank you for your business!';
//           console.log(sale);

//           // Dynamically generate item list for receipt
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

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
//         {/* Header - Fixed */}
//         <div className="bg-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
//           <h2 className="text-xl font-bold text-white">Complete Payment</h2>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-white"
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
//         <div className="flex-1 overflow-y-auto p-6 space-y-6">
//           {/* Order Summary */}
//           <div className="bg-gray-700 rounded-lg p-4">
//             <h3 className="font-semibold text-white mb-3">Order Summary</h3>
//             <div className="space-y-2 text-sm">
//               <div className="flex justify-between">
//                 <span className="text-gray-400">Items</span>
//                 <span className="text-white">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
//               </div>
//               {customer && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-400">Customer</span>
//                   <span className="text-white">{customer.first_name} {customer.last_name}</span>
//                 </div>
//               )}
//               <div className="flex justify-between pt-2 border-t border-gray-600">
//                 <span className="text-white font-semibold">Total Due</span>
//                 <span className="text-blue-400 font-bold text-lg">
//                   {settings?.currency || 'KES'} {total.toLocaleString()}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Payment Method */}
//           <div>
//             <h3 className="font-semibold text-white mb-3">Payment Method</h3>
//             <div className="grid grid-cols-2 gap-3">
//               {paymentMethods.map((method) => {
//                 const Icon = method.icon;
//                 return (
//                   <button
//                     key={method.id}
//                     onClick={() => setPaymentMethod(method.id)}
//                     className={`p-4 rounded-lg border-2 transition-all ${
//                       paymentMethod === method.id
//                         ? 'border-blue-500 bg-blue-500/20'
//                         : 'border-gray-600 hover:border-gray-500'
//                     }`}
//                   >
//                     <Icon className="w-6 h-6 text-white mx-auto mb-2" />
//                     <p className="text-white font-medium">{method.name}</p>
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Payment Details */}
//           {paymentMethod !== 'credit' && (
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Amount Received
//               </label>
//               <input
//                 type="number"
//                 value={amountPaid}
//                 onChange={(e) => setAmountPaid(e.target.value)}
//                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-blue-500"
//                 placeholder="0"
//                 autoFocus
//               />
//               {change > 0 && (
//                 <p className="mt-2 text-green-400 font-semibold">
//                   Change: {settings?.currency || 'KES'} {change.toLocaleString()}
//                 </p>
//               )}
//             </div>
//           )}

//           {/* Reference Number for non-cash */}
//           {paymentMethod !== 'cash' && (
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Reference Number
//               </label>
//               <input
//                 type="text"
//                 value={reference}
//                 onChange={(e) => setReference(e.target.value)}
//                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                 placeholder="Transaction reference"
//               />
//             </div>
//           )}

//           {/* Quick Cash Amounts */}
//           {paymentMethod === 'cash' && (
//             <div className="grid grid-cols-4 gap-2">
//               {[50, 100, 200, 500, 1000, 2000, 5000, 10000].map((amount) => (
//                 <button
//                   key={amount}
//                   onClick={() => setAmountPaid(amount.toString())}
//                   className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium"
//                 >
//                   {amount >= 1000 ? `${amount / 1000}k` : amount}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Footer - Fixed */}
//         <div className="bg-gray-700 px-6 py-4 flex gap-3 flex-shrink-0">
//           <button
//             onClick={onClose}
//             className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 rounded-lg transition-colors"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleComplete}
//             disabled={processing || (paymentMethod !== 'credit' && (!amountPaid || parseFloat(amountPaid) < total))}
//             className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
//           >
//             {processing ? (
//               <>
//                 <Loader2 className="w-5 h-5 animate-spin" />
//                 Processing...
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






// // Customer Search Modal Component






// function CustomerSearchModal({ onSelect, onClose }) {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [customers, setCustomers] = useState([]);
//   const [searching, setSearching] = useState(false);

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
//     } finally {
//       setSearching(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//       <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
//         <div className="p-6">
//           <h2 className="text-xl font-bold text-white mb-4">Select Customer</h2>
          
//           <div className="relative mb-4">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               type="text"
//               value={searchQuery}
//               onChange={(e) => handleSearch(e.target.value)}
//               placeholder="Search by name, phone, or email..."
//               className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
//               autoFocus
//             />
//             {searching && (
//               <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
//             )}
//           </div>

//           <div className="max-h-96 overflow-y-auto">
//             {customers.length > 0 ? (
//               <div className="space-y-2">
//                 {customers.map((customer) => (
//                   <button
//                     key={customer.id}
//                     onClick={() => onSelect(customer)}
//                     className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
//                   >
//                     <p className="text-white font-medium">
//                       {customer.first_name} {customer.last_name}
//                     </p>
//                     <p className="text-gray-400 text-sm">
//                       {customer.phone} | Points: {customer.loyalty_points}
//                     </p>
//                   </button>
//                 ))}
//               </div>
//             ) : searchQuery.length >= 2 && !searching ? (
//               <p className="text-center text-gray-400 py-8">No customers found</p>
//             ) : (
//               <p className="text-center text-gray-500 py-8">Search for a customer</p>
//             )}
//           </div>

//           <div className="mt-4 flex gap-3">
//             <button
//               onClick={onClose}
//               className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 rounded-lg transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={() => onSelect(null)}
//               className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
//             >
//               Continue Without Customer
//             </button>
//           </div>
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
  Percent, Tag, Receipt, Send
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
    // Focus search input
    searchInputRef.current?.focus();
  }, []);

  const loadInitialData = async () => {
    try {
      const categoriesResult = await window.api.categories.getAll();
      if (categoriesResult.success) {
        setCategories(categoriesResult.categories);
      }

      // Load products
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
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      toast.error('Barcode scan error');
    }
  };

  const handleAddProduct = (product) => {
    if (product.current_stock <= 0 && product.track_inventory) {
      toast.error('Product out of stock');
      return;
    }

    addItem(product);
    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowCheckout(true);
  };

  // Modified QuickProducts component to accept props
  const QuickProducts = ({ products, selectedCategory, handleAddProduct }) => {
    // Filter products based on selectedCategory
    const filteredProducts = products.filter(p => 
      p.is_active && 
      (selectedCategory === null || p.category_id === selectedCategory)
    );
    
    // Slice for display, perhaps you want more than 12 if filtering reduces the count
    const productsToDisplay = filteredProducts.slice(0, 12); 

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {productsToDisplay.map((product) => (
          <button
            key={product.id}
            onClick={() => handleAddProduct(product)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-left transition-all hover:scale-105"
          >
            <div className="bg-gray-700 h-20 rounded-lg mb-3 flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-500" />
            </div>
            <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">{product.name}</h4>
            <p className="text-gray-400 text-xs mb-2">{product.category_name}</p>
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-blue-400">KES {product.unit_price.toLocaleString()}</span>
              {product.track_inventory && (
                <span className={`text-xs ${product.current_stock <= product.low_stock_threshold ? 'text-red-400' : 'text-gray-500'}`}>
                  {product.current_stock}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
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
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  className="w-full px-4 py-3 hover:bg-gray-700 flex items-center justify-between text-left"
                >
                  <div>
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-gray-400 text-sm">SKU: {product.sku} | {product.category_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400 font-bold">KES {product.unit_price.toLocaleString()}</p>
                    {product.track_inventory && (
                      <p className="text-gray-500 text-sm">Stock: {product.current_stock}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Products Grid - Now passing props */}
        <QuickProducts 
          products={products} 
          selectedCategory={selectedCategory} 
          handleAddProduct={handleAddProduct} 
        />
      </div>

      {/* Shopping Cart Sidebar */}
      <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart
            </h3>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Customer Info */}
        {customer ? (
          <div className="p-4 bg-gray-700/50 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{customer.first_name} {customer.last_name}</p>
                <p className="text-gray-400 text-sm">Points: {customer.loyalty_points}</p>
              </div>
              <button
                onClick={() => setCustomer(null)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomerSearch(true)}
            className="m-4 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 text-gray-300"
          >
            <User className="w-4 h-4" />
            Add Customer
          </button>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Cart is empty</p>
              <p className="text-gray-500 text-sm mt-2">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm">{item.name}</h4>
                      <p className="text-gray-400 text-xs">@ KES {item.unit_price.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="bg-gray-600 hover:bg-gray-500 w-8 h-8 rounded flex items-center justify-center text-white"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-white w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="bg-gray-600 hover:bg-gray-500 w-8 h-8 rounded flex items-center justify-center text-white"
                      disabled={item.track_inventory && item.quantity >= item.current_stock}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-blue-400 font-medium">
                    KES {(item.unit_price * item.quantity).toLocaleString()}
                  </span>
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

        {/* Cart Summary */}
        <div className="p-4 border-t border-gray-700 space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white">KES {getSubtotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tax (16%)</span>
              <span className="text-white">KES {getTaxAmount().toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Discount</span>
                <span className="text-green-400">-KES {discountAmount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between text-xl pt-3 border-t border-gray-700">
            <span className="text-white font-bold">Total</span>
            <span className="text-blue-400 font-bold">KES {getTotal().toLocaleString()}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Checkout
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onComplete={() => {
            setShowCheckout(false);
            clearCart();
          }}
        />
      )}

      {/* Customer Search Modal */}
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


// Fixed Checkout Modal Component
function CheckoutModal({ onClose, onComplete }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [reference, setReference] = useState('');
  const [processing, setProcessing] = useState(false);
  const [settings, setSettings] = useState({}); // State to hold settings
  const [settingsLoaded, setSettingsLoaded] = useState(false); // Track if settings are loaded

  const { items, customer, discountAmount, notes, getTotal, getSubtotal, getTaxAmount } = useCartStore();
  const { createSale } = useSalesStore();
  const { user } = useAuthStore();

  const total = getTotal();
  const change = parseFloat(amountPaid || 0) - total;

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: DollarSign },
    { id: 'card', name: 'Card', icon: CreditCard },
    { id: 'mpesa', name: 'M-Pesa', icon: Smartphone },
    { id: 'credit', name: 'Credit', icon: User }
  ];

  useEffect(() => {
    // Fetch settings when the modal mounts
    const fetchSettings = async () => {
      try {
        const businessInfo = await window.api.settings.getBusinessInfo();
       
        if (businessInfo && businessInfo.success) {
          // Handle both possible response structures
          const businessData = businessInfo.businessInfo || businessInfo.settings;
          setSettings(businessData || {});
          console.log("getBusinessInfo>>>>", businessInfo);
        } else {
          // Fallback for individual settings if getBusinessInfo doesn't exist or returns partial
          const generalSettings = await window.api.settings.getAll();
          if (generalSettings && generalSettings.success) {
            const mappedSettings = generalSettings.settings.reduce((acc, s) => {
              acc[s.key] = s.value;
              return acc;
            }, {});
            setSettings(mappedSettings);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load business settings for receipt.');
      } finally {
        setSettingsLoaded(true); // Mark as loaded regardless of success/failure
      }
    };
    fetchSettings();
  }, []); // Remove settings from dependency array to prevent infinite loop

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
      console.table("create sale ", sale);

      if (sale) {
        if (window.confirm('Print receipt?')) {
          // Use fallback values if settings are not loaded or properties are missing
          const currency = settings?.currency || 'KES';
          const taxRate = parseFloat(settings?.tax_rate || '16');
          const businessName = settings?.business_name || 'Your Business';
          const businessAddress = settings?.business_address || '';
          const businessPhone = settings?.business_phone || '';
          const businessEmail = settings?.business_email || '';
          const taxNumber = settings?.tax_number || '';
          const receiptHeader = settings?.receipt_header || 'Welcome!';
          const receiptFooter = settings?.receipt_footer || 'Thank you for your business!';
          console.log(sale);

          // Dynamically generate item list for receipt
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
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to complete sale');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Items</span>
                <span className="text-white">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              {customer && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer</span>
                  <span className="text-white">{customer.first_name} {customer.last_name}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-600">
                <span className="text-white font-semibold">Total Due</span>
                <span className="text-blue-400 font-bold text-lg">
                  {settings?.currency || 'KES'} {total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="font-semibold text-white mb-3">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === method.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <Icon className="w-6 h-6 text-white mx-auto mb-2" />
                    <p className="text-white font-medium">{method.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Details */}
          {paymentMethod !== 'credit' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount Received
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-blue-500"
                placeholder="0"
                autoFocus
              />
              {change > 0 && (
                <p className="mt-2 text-green-400 font-semibold">
                  Change: {settings?.currency || 'KES'} {change.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Reference Number for non-cash */}
          {paymentMethod !== 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="Transaction reference"
              />
            </div>
          )}

          {/* Quick Cash Amounts */}
          {paymentMethod === 'cash' && (
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 200, 500, 1000, 2000, 5000, 10000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setAmountPaid(amount.toString())}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium"
                >
                  {amount >= 1000 ? `${amount / 1000}k` : amount}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="bg-gray-700 px-6 py-4 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={processing || (paymentMethod !== 'credit' && (!amountPaid || parseFloat(amountPaid) < total))}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
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






// Customer Search Modal Component






function CustomerSearchModal({ onSelect, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [searching, setSearching] = useState(false);

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
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Select Customer</h2>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {customers.length > 0 ? (
              <div className="space-y-2">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => onSelect(customer)}
                    className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
                  >
                    <p className="text-white font-medium">
                      {customer.first_name} {customer.last_name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {customer.phone} | Points: {customer.loyalty_points}
                    </p>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 && !searching ? (
              <p className="text-center text-gray-400 py-8">No customers found</p>
            ) : (
              <p className="text-center text-gray-500 py-8">Search for a customer</p>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSelect(null)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
            >
              Continue Without Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}