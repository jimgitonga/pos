// // src/renderer/components/reports/ReportsModule.jsx
// import React, { useState, useEffect } from 'react';
// import { 
//   BarChart3, TrendingUp, Calendar, Download, 
//   Filter, Loader2, DollarSign, Package, Users, Clock,
//   FileText, Printer, RefreshCw
// } from 'lucide-react';
// import { 
//   BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
//   XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
// } from 'recharts';
// import toast from 'react-hot-toast';

// export default function ReportsModule() {
//   const [dateRange, setDateRange] = useState({
//     startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
//     endDate: new Date().toISOString().split('T')[0]
//   });
//   const [reportType, setReportType] = useState('sales');
//   const [reportData, setReportData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [summary, setSummary] = useState(null);

//   const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

//   const reportTypes = [
//     { id: 'sales', name: 'Sales Report', icon: DollarSign },
//     { id: 'inventory', name: 'Inventory Report', icon: Package },
//     { id: 'customers', name: 'Customer Analytics', icon: Users },
//     { id: 'staff', name: 'Staff Performance', icon: Clock }
//   ];

//   useEffect(() => {
//     loadReport();
//   }, [reportType, dateRange]);

//   const loadReport = async () => {
//     setLoading(true);
//     try {
//       let result;
//       switch (reportType) {
//         case 'sales':
//           result = await window.api.reports.getSalesReport(dateRange);
//           break;
//         case 'inventory':
//           result = await window.api.reports.getInventoryReport(dateRange);
//           break;
//         case 'customers':
//           result = await window.api.customers.getAnalytics(dateRange);
//           break;
//         case 'staff':
//           result = await window.api.reports.getStaffPerformance(dateRange);
//           break;
//         default:
//           result = { success: false };
//       }

//       if (result.success) {
//         setReportData(result.data || result.analytics);
        
//         // Calculate summary based on report type
//         if (reportType === 'sales' && result.data?.salesData) {
//           const totalRevenue = result.data.salesData.reduce((sum, day) => sum + day.revenue, 0);
//           const totalTransactions = result.data.salesData.reduce((sum, day) => sum + day.transaction_count, 0);
//           setSummary({
//             totalRevenue,
//             totalTransactions,
//             averageTransaction: totalRevenue / totalTransactions || 0,
//             growthRate: calculateGrowthRate(result.data.salesData)
//           });
//         }
//       }
//     } catch (error) {
//       console.error('Failed to load report:', error);
//       toast.error('Failed to load report');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculateGrowthRate = (data) => {
//     if (data.length < 2) return 0;
//     const firstPeriod = data.slice(0, Math.floor(data.length / 2));
//     const secondPeriod = data.slice(Math.floor(data.length / 2));
    
//     const firstTotal = firstPeriod.reduce((sum, item) => sum + item.revenue, 0);
//     const secondTotal = secondPeriod.reduce((sum, item) => sum + item.revenue, 0);
    
//     return firstTotal > 0 ? ((secondTotal - firstTotal) / firstTotal * 100) : 0;
//   };

//   const handleExport = async () => {
//     try {
//       const result = await window.api.reports.exportReport(reportType, dateRange, 'pdf');
//       if (result.success) {
//         toast.success('Report exported successfully');
//       }
//     } catch (error) {
//       toast.error('Failed to export report');
//     }
//   };

//   const handlePrint = () => {
//     window.print();
//   };

//   const renderSalesReport = () => {
//     if (!reportData?.salesData || reportData.salesData.length === 0) {
//       return <div className="text-center text-gray-400 py-8">No sales data available</div>;
//     }

//     return (
//       <div className="space-y-6">
//         {/* Sales Trend Chart */}
//         <div className="bg-gray-800 rounded-lg p-6">
//           <h3 className="text-lg font-semibold text-white mb-4">Sales Trend</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart data={reportData.salesData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
//               <XAxis dataKey="period" stroke="#9CA3AF" />
//               <YAxis stroke="#9CA3AF" />
//               <Tooltip 
//                 contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
//                 labelStyle={{ color: '#F3F4F6' }}
//               />
//               <Legend />
//               <Line 
//                 type="monotone" 
//                 dataKey="revenue" 
//                 stroke="#3B82F6" 
//                 strokeWidth={2}
//                 name="Revenue"
//               />
//               <Line 
//                 type="monotone" 
//                 dataKey="transaction_count" 
//                 stroke="#10B981" 
//                 strokeWidth={2}
//                 name="Transactions"
//                 yAxisId="right"
//               />
//               <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>

//         {/* Payment Methods Breakdown */}
//         {reportData.paymentMethods && reportData.paymentMethods.length > 0 && (
//           <div className="bg-gray-800 rounded-lg p-6">
//             <h3 className="text-lg font-semibold text-white mb-4">Payment Methods</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <ResponsiveContainer width="100%" height={250}>
//                 <PieChart>
//                   <Pie
//                     data={reportData.paymentMethods}
//                     cx="50%"
//                     cy="50%"
//                     labelLine={false}
//                     outerRadius={80}
//                     fill="#8884d8"
//                     dataKey="total"
//                     label={({ payment_method, percent }) => `${payment_method}: ${(percent * 100).toFixed(0)}%`}
//                   >
//                     {reportData.paymentMethods.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                 </PieChart>
//               </ResponsiveContainer>
              
//               <div className="space-y-3">
//                 {reportData.paymentMethods.map((method, index) => (
//                   <div key={method.payment_method} className="flex justify-between items-center">
//                     <div className="flex items-center gap-3">
//                       <div 
//                         className="w-4 h-4 rounded"
//                         style={{ backgroundColor: COLORS[index % COLORS.length] }}
//                       />
//                       <span className="text-gray-300 capitalize">{method.payment_method}</span>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-white font-medium">KES {method.total.toLocaleString()}</p>
//                       <p className="text-gray-400 text-sm">{method.count} transactions</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Top Products */}
//         {reportData.topProducts && reportData.topProducts.length > 0 && (
//           <div className="bg-gray-800 rounded-lg p-6">
//             <h3 className="text-lg font-semibold text-white mb-4">Top Selling Products</h3>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="text-gray-400 text-sm">
//                   <tr>
//                     <th className="text-left pb-3">Product</th>
//                     <th className="text-right pb-3">Units Sold</th>
//                     <th className="text-right pb-3">Revenue</th>
//                     <th className="text-right pb-3">Avg. Price</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-700">
//                   {reportData.topProducts.map((product, index) => (
//                     <tr key={index} className="text-gray-300">
//                       <td className="py-3">
//                         <p className="text-white font-medium">{product.name}</p>
//                         <p className="text-gray-400 text-sm">SKU: {product.sku}</p>
//                       </td>
//                       <td className="text-right py-3">{product.units_sold}</td>
//                       <td className="text-right py-3 text-white font-medium">
//                         KES {product.revenue.toLocaleString()}
//                       </td>
//                       <td className="text-right py-3">
//                         KES {(product.revenue / product.units_sold).toFixed(2)}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Category Performance */}
//         {reportData.categories && reportData.categories.length > 0 && (
//           <div className="bg-gray-800 rounded-lg p-6">
//             <h3 className="text-lg font-semibold text-white mb-4">Category Performance</h3>
//             <ResponsiveContainer width="100%" height={300}>
//               <BarChart data={reportData.categories}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
//                 <XAxis dataKey="category" stroke="#9CA3AF" />
//                 <YAxis stroke="#9CA3AF" />
//                 <Tooltip 
//                   contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
//                   labelStyle={{ color: '#F3F4F6' }}
//                 />
//                 <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
//                 <Bar dataKey="units_sold" fill="#10B981" name="Units Sold" yAxisId="right" />
//                 <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const renderInventoryReport = () => {
//     if (!reportData) {
//       return <div className="text-center text-gray-400 py-8">No inventory data available</div>;
//     }

//     return (
//       <div className="space-y-6">
//         {/* Inventory Summary */}
//         {reportData.summary && (
//           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//             <div className="bg-gray-800 rounded-lg p-4">
//               <p className="text-gray-400 text-sm">Total Products</p>
//               <p className="text-2xl font-bold text-white">{reportData.summary.total_products}</p>
//             </div>
//             <div className="bg-gray-800 rounded-lg p-4">
//               <p className="text-gray-400 text-sm">Total Units</p>
//               <p className="text-2xl font-bold text-white">{reportData.summary.total_units}</p>
//             </div>
//             <div className="bg-gray-800 rounded-lg p-4">
//               <p className="text-gray-400 text-sm">Stock Value</p>
//               <p className="text-2xl font-bold text-white">
//                 KES {reportData.summary.total_value?.toLocaleString() || 0}
//               </p>
//             </div>
//             <div className="bg-gray-800 rounded-lg p-4">
//               <p className="text-gray-400 text-sm">Low Stock</p>
//               <p className="text-2xl font-bold text-orange-400">{reportData.summary.low_stock}</p>
//             </div>
//             <div className="bg-gray-800 rounded-lg p-4">
//               <p className="text-gray-400 text-sm">Out of Stock</p>
//               <p className="text-2xl font-bold text-red-400">{reportData.summary.out_of_stock}</p>
//             </div>
//           </div>
//         )}

//         {/* Stock Levels */}
//         {reportData.stockLevels && reportData.stockLevels.length > 0 && (
//           <div className="bg-gray-800 rounded-lg p-6">
//             <h3 className="text-lg font-semibold text-white mb-4">Current Stock Levels</h3>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="text-gray-400 text-sm">
//                   <tr>
//                     <th className="text-left pb-3">SKU</th>
//                     <th className="text-left pb-3">Product</th>
//                     <th className="text-left pb-3">Category</th>
//                     <th className="text-right pb-3">Stock</th>
//                     <th className="text-right pb-3">Value</th>
//                     <th className="text-left pb-3">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-700">
//                   {reportData.stockLevels.map((item) => (
//                     <tr key={item.sku} className="text-gray-300">
//                       <td className="py-3">{item.sku}</td>
//                       <td className="py-3 text-white">{item.name}</td>
//                       <td className="py-3">{item.category || 'Uncategorized'}</td>
//                       <td className="py-3 text-right">{item.current_stock}</td>
//                       <td className="py-3 text-right">
//                         KES {item.stock_value?.toLocaleString() || 0}
//                       </td>
//                       <td className="py-3">
//                         <span className={`px-2 py-1 rounded-full text-xs ${
//                           item.status === 'Out of Stock' ? 'bg-red-500/20 text-red-400' :
//                           item.status === 'Low Stock' ? 'bg-orange-500/20 text-orange-400' :
//                           'bg-green-500/20 text-green-400'
//                         }`}>
//                           {item.status}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Recent Movements */}
//         {reportData.movements && reportData.movements.length > 0 && (
//           <div className="bg-gray-800 rounded-lg p-6">
//             <h3 className="text-lg font-semibold text-white mb-4">Recent Stock Movements</h3>
//             <div className="space-y-2">
//               {reportData.movements.slice(0, 10).map((movement, index) => (
//                 <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700">
//                   <div className="flex items-center gap-4">
//                     <div className={`p-2 rounded ${
//                       movement.movement_type === 'in' ? 'bg-green-500/20' : 'bg-red-500/20'
//                     }`}>
//                       {movement.movement_type === 'in' ? (
//                         <TrendingUp className="w-4 h-4 text-green-400" />
//                       ) : (
//                         <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
//                       )}
//                     </div>
//                     <div>
//                       <p className="text-white font-medium">{movement.product}</p>
//                       <p className="text-gray-400 text-sm">{movement.reason}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className={`font-medium ${
//                       movement.movement_type === 'in' ? 'text-green-400' : 'text-red-400'
//                     }`}>
//                       {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
//                     </p>
//                     <p className="text-gray-400 text-xs">{movement.user}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const renderCustomerReport = () => {
//     if (!reportData) {
//       return <div className="text-center text-gray-400 py-8">No customer data available</div>;
//     }

//     return (
//       <div className="space-y-6">
//         {/* Customer Metrics */}
//         {reportData.metrics && (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="bg-gray-800 rounded-lg p-6">
//               <p className="text-gray-400 text-sm">Total Customers</p>
//               <p className="text-3xl font-bold text-white">{reportData.metrics.total_customers}</p>
//               <p className="text-green-400 text-sm mt-2">
//                 +{reportData.metrics.new_customers} new this period
//               </p>
//             </div>
//             <div className="bg-gray-800 rounded-lg p-6">
//               <p className="text-gray-400 text-sm">Active Customers</p>
//               <p className="text-3xl font-bold text-white">{reportData.metrics.active_customers}</p>
//               <p className="text-gray-400 text-sm mt-2">
//                 {((reportData.metrics.active_customers / reportData.metrics.total_customers) * 100).toFixed(1)}% of total
//               </p>
//             </div>
//             <div className="bg-gray-800 rounded-lg p-6">
//               <p className="text-gray-400 text-sm">Avg. Loyalty Points</p>
//               <p className="text-3xl font-bold text-blue-400">
//                 {Math.round(reportData.metrics.avg_loyalty_points || 0)}
//               </p>
//             </div>
//           </div>
//         )}

//         {/* Customer Segmentation */}
//         {reportData.segmentation && reportData.segmentation.length > 0 && (
//           <div className="bg-gray-800 rounded-lg p-6">
//             <h3 className="text-lg font-semibold text-white mb-4">Customer Segmentation</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <ResponsiveContainer width="100%" height={250}>
//                 <PieChart>
//                   <Pie
//                     data={reportData.segmentation}
//                     cx="50%"
//                     cy="50%"
//                     outerRadius={80}
//                     fill="#8884d8"
//                     dataKey="count"
//                     label={({ segment, percent }) => `${segment}: ${(percent * 100).toFixed(0)}%`}
//                   >
//                     {reportData.segmentation.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                 </PieChart>
//               </ResponsiveContainer>
              
//               <div className="space-y-3">
//                 {reportData.segmentation.map((segment, index) => (
//                   <div key={segment.segment} className="flex justify-between items-center">
//                     <div className="flex items-center gap-3">
//                       <div 
//                         className="w-4 h-4 rounded"
//                         style={{ backgroundColor: COLORS[index % COLORS.length] }}
//                       />
//                       <span className="text-gray-300">{segment.segment}</span>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-white font-medium">{segment.count} customers</p>
//                       <p className="text-gray-400 text-sm">
//                         Avg: KES {segment.avg_value?.toLocaleString() || 0}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Top Customers */}
//         {reportData.topCustomers && reportData.topCustomers.length > 0 && (
//           <div className="bg-gray-800 rounded-lg p-6">
//             <h3 className="text-lg font-semibold text-white mb-4">Top Customers</h3>
//             <div className="space-y-3">
//               {reportData.topCustomers.map((customer, index) => (
//                 <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium">
//                       {index + 1}
//                     </div>
//                     <div>
//                       <p className="text-white font-medium">
//                         {customer.first_name} {customer.last_name}
//                       </p>
//                       <p className="text-gray-400 text-sm">
//                         {customer.purchase_count} purchases
//                       </p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-white font-medium">
//                       KES {customer.total_spent.toLocaleString()}
//                     </p>
//                     <p className="text-gray-400 text-xs">
//                       Last: {new Date(customer.last_purchase).toLocaleDateString()}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const renderStaffReport = () => {
//     if (!reportData) {
//       return <div className="text-center text-gray-400 py-8">No staff data available</div>;
//     }

//     return (
//       <div className="space-y-6">
//         {/* Staff Performance */}
//         {reportData.performance && reportData.performance.length > 0 && (
//           <div className="bg-gray-800 rounded-lg p-6">
//             <h3 className="text-lg font-semibold text-white mb-4">Staff Performance</h3>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="text-gray-400 text-sm">
//                   <tr>
//                     <th className="text-left pb-3">Staff Member</th>
//                     <th className="text-left pb-3">Role</th>
//                     <th className="text-right pb-3">Transactions</th>
//                     <th className="text-right pb-3">Revenue</th>
//                     <th className="text-right pb-3">Avg. Sale</th>
//                     <th className="text-right pb-3">Voids</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-700">
//                   {reportData.performance.map((staff) => (
//                     <tr key={staff.id} className="text-gray-300">
//                       <td className="py-3 text-white font-medium">{staff.full_name}</td>
//                       <td className="py-3">
//                         <span className="px-2 py-1 bg-gray-700 rounded text-xs capitalize">
//                           {staff.role}
//                         </span>
//                       </td>
//                       <td className="py-3 text-right">{staff.transactions || 0}</td>
//                       <td className="py-3 text-right text-white font-medium">
//                         KES {(staff.revenue || 0).toLocaleString()}
//                       </td>
//                       <td className="py-3 text-right">
//                         KES {(staff.avg_sale || 0).toLocaleString()}
//                       </td>
//                       <td className="py-3 text-right">
//                         <span className={staff.voids > 0 ? 'text-red-400' : ''}>
//                           {staff.voids || 0}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Hourly Activity Heatmap */}
//         {reportData.hourlyActivity && reportData.hourlyActivity.length > 0 && (
//           <div className="bg-gray-800 rounded-lg p-6">
//             <h3 className="text-lg font-semibold text-white mb-4">Hourly Activity</h3>
//             <div className="text-gray-400 text-sm">
//               Activity heatmap showing peak hours for each staff member
//             </div>
//             {/* Simplified representation - in production, use a proper heatmap library */}
//             <div className="mt-4 space-y-2">
//               {Object.entries(
//                 reportData.hourlyActivity.reduce((acc, item) => {
//                   if (!acc[item.full_name]) acc[item.full_name] = {};
//                   acc[item.full_name][item.hour] = item.transactions;
//                   return acc;
//                 }, {})
//               ).map(([name, hours]) => (
//                 <div key={name} className="flex items-center gap-2">
//                   <div className="w-32 text-gray-300 text-sm">{name}</div>
//                   <div className="flex gap-1">
//                     {Array.from({ length: 24 }, (_, i) => {
//                       const count = hours[i.toString().padStart(2, '0')] || 0;
//                       const intensity = count > 0 ? Math.min(count / 10, 1) : 0;
//                       return (
//                         <div
//                           key={i}
//                           className="w-4 h-4 rounded"
//                           style={{
//                             backgroundColor: count > 0 
//                               ? `rgba(59, 130, 246, ${intensity})` 
//                               : '#374151'
//                           }}
//                           title={`${i}:00 - ${count} transactions`}
//                         />
//                       );
//                     })}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
//         <div className="flex gap-3">
//           <button
//             onClick={loadReport}
//             className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
//           >
//             <RefreshCw className="w-4 h-4" />
//             Refresh
//           </button>
//           <button
//             onClick={handlePrint}
//             className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
//           >
//             <Printer className="w-4 h-4" />
//             Print
//           </button>
//           <button
//             onClick={handleExport}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
//           >
//             <Download className="w-4 h-4" />
//             Export PDF
//           </button>
//         </div>
//       </div>

//       {/* Report Type Selector */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//         {reportTypes.map((type) => {
//           const Icon = type.icon;
//           return (
//             <button
//               key={type.id}
//               onClick={() => setReportType(type.id)}
//               className={`p-4 rounded-lg border-2 transition-all ${
//                 reportType === type.id
//                   ? 'bg-blue-600 border-blue-600 text-white'
//                   : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
//               }`}
//             >
//               <Icon className="w-8 h-8 mx-auto mb-2" />
//               <p className="font-medium">{type.name}</p>
//             </button>
//           );
//         })}
//       </div>

//       {/* Date Range Selector */}
//       <div className="bg-gray-800 rounded-lg p-4 mb-6">
//         <div className="flex items-center gap-4">
//           <Calendar className="w-5 h-5 text-gray-400" />
//           <div className="flex items-center gap-2">
//             <input
//               type="date"
//               value={dateRange.startDate}
//               onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
//               className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
//             />
//             <span className="text-gray-400">to</span>
//             <input
//               type="date"
//               value={dateRange.endDate}
//               onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
//               className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
//             />
//           </div>
//           <div className="ml-auto flex gap-2">
//             <button
//               onClick={() => {
//                 const today = new Date();
//                 setDateRange({
//                   startDate: today.toISOString().split('T')[0],
//                   endDate: today.toISOString().split('T')[0]
//                 });
//               }}
//               className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
//             >
//               Today
//             </button>
//             <button
//               onClick={() => {
//                 const today = new Date();
//                 const weekAgo = new Date(today.setDate(today.getDate() - 7));
//                 setDateRange({
//                   startDate: weekAgo.toISOString().split('T')[0],
//                   endDate: new Date().toISOString().split('T')[0]
//                 });
//               }}
//               className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
//             >
//               Last 7 Days
//             </button>
//             <button
//               onClick={() => {
//                 const today = new Date();
//                 const monthAgo = new Date(today.setDate(today.getDate() - 30));
//                 setDateRange({
//                   startDate: monthAgo.toISOString().split('T')[0],
//                   endDate: new Date().toISOString().split('T')[0]
//                 });
//               }}
//               className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
//             >
//               Last 30 Days
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       {summary && reportType === 'sales' && (
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//           <div className="bg-gray-800 rounded-lg p-6">
//             <div className="flex items-center justify-between mb-2">
//               <DollarSign className="w-8 h-8 text-green-400" />
//               <span className={`text-sm ${summary.growthRate > 0 ? 'text-green-400' : 'text-red-400'}`}>
//                 {summary.growthRate > 0 ? '+' : ''}{summary.growthRate.toFixed(1)}%
//               </span>
//             </div>
//             <p className="text-gray-400 text-sm">Total Revenue</p>
//             <p className="text-2xl font-bold text-white">
//               KES {summary.totalRevenue.toLocaleString()}
//             </p>
//           </div>
          
//           <div className="bg-gray-800 rounded-lg p-6">
//             <BarChart3 className="w-8 h-8 text-blue-400 mb-2" />
//             <p className="text-gray-400 text-sm">Total Transactions</p>
//             <p className="text-2xl font-bold text-white">
//               {summary.totalTransactions.toLocaleString()}
//             </p>
//           </div>
          
//           <div className="bg-gray-800 rounded-lg p-6">
//             <TrendingUp className="w-8 h-8 text-purple-400 mb-2" />
//             <p className="text-gray-400 text-sm">Average Transaction</p>
//             <p className="text-2xl font-bold text-white">
//               KES {summary.averageTransaction.toFixed(2)}
//             </p>
//           </div>
          
//           <div className="bg-gray-800 rounded-lg p-6">
//             <Users className="w-8 h-8 text-orange-400 mb-2" />
//             <p className="text-gray-400 text-sm">Growth Rate</p>
//             <p className="text-2xl font-bold text-white">
//               {summary.growthRate.toFixed(1)}%
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Report Content */}
//       <div className="bg-gray-900 rounded-lg">
//         {loading ? (
//           <div className="flex items-center justify-center py-20">
//             <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
//           </div>
//         ) : (
//           <>
//             {reportType === 'sales' && renderSalesReport()}
//             {reportType === 'inventory' && renderInventoryReport()}
//             {reportType === 'customers' && renderCustomerReport()}
//             {reportType === 'staff' && renderStaffReport()}
//           </>
//         )}
//       </div>
//     </div>
//   );
// }


// src/renderer/components/reports/ReportsModule.jsx
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Calendar, Download, 
  Filter, Loader2, DollarSign, Package, Users, Clock,
  FileText, Printer, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-t border-gray-700">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">
          Showing {startItem} to {endItem} of {totalItems} items
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === 1
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            if (pageNum < 1 || pageNum > totalPages) return null;
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === totalPages
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function ReportsModule() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('sales');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  
  // Pagination states for inventory report
  const [stockPage, setStockPage] = useState(1);
  const [movementsPage, setMovementsPage] = useState(1);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const reportTypes = [
    { id: 'sales', name: 'Sales Report', icon: DollarSign },
    { id: 'inventory', name: 'Inventory Report', icon: Package },
    { id: 'customers', name: 'Customer Analytics', icon: Users },
    { id: 'staff', name: 'Staff Performance', icon: Clock }
  ];

  useEffect(() => {
    // Reset pagination when report type changes
    if (reportType === 'inventory') {
      setStockPage(1);
      setMovementsPage(1);
    }
    loadReport();
  }, [reportType, dateRange]);

  const loadReport = async (paginationParams = {}) => {
    setLoading(true);
    try {
      let result;
      const params = {
        ...dateRange,
        ...(reportType === 'inventory' ? {
          stockPage: paginationParams.stockPage || stockPage,
          stockLimit: 10,
          movementsPage: paginationParams.movementsPage || movementsPage,
          movementsLimit: 10
        } : {})
      };

      switch (reportType) {
        case 'sales':
          result = await window.api.reports.getSalesReport(params);
          break;
        case 'inventory':
          result = await window.api.reports.getInventoryReport(params);
          break;
        case 'customers':
          result = await window.api.customers.getAnalytics(params);
          break;
        case 'staff':
          result = await window.api.reports.getStaffPerformance(params);
          break;
        default:
          result = { success: false };
      }

      if (result.success) {
        setReportData(result.data || result.analytics);
        
        // Calculate summary based on report type
        if (reportType === 'sales' && result.data?.salesData) {
          const totalRevenue = result.data.salesData.reduce((sum, day) => sum + day.revenue, 0);
          const totalTransactions = result.data.salesData.reduce((sum, day) => sum + day.transaction_count, 0);
          setSummary({
            totalRevenue,
            totalTransactions,
            averageTransaction: totalRevenue / totalTransactions || 0,
            growthRate: calculateGrowthRate(result.data.salesData)
          });
        }
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleStockPageChange = (newPage) => {
    setStockPage(newPage);
    loadReport({ stockPage: newPage });
  };

  const handleMovementsPageChange = (newPage) => {
    setMovementsPage(newPage);
    loadReport({ movementsPage: newPage });
  };

  const calculateGrowthRate = (data) => {
    if (data.length < 2) return 0;
    const firstPeriod = data.slice(0, Math.floor(data.length / 2));
    const secondPeriod = data.slice(Math.floor(data.length / 2));
    
    const firstTotal = firstPeriod.reduce((sum, item) => sum + item.revenue, 0);
    const secondTotal = secondPeriod.reduce((sum, item) => sum + item.revenue, 0);
    
    return firstTotal > 0 ? ((secondTotal - firstTotal) / firstTotal * 100) : 0;
  };

  const handleExport = async () => {
    try {
      const result = await window.api.reports.exportReport(reportType, dateRange, 'pdf');
      if (result.success) {
        toast.success('Report exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderSalesReport = () => {
    if (!reportData?.salesData || reportData.salesData.length === 0) {
      return <div className="text-center text-gray-400 py-8">No sales data available</div>;
    }

    return (
      <div className="space-y-6">
        {/* Sales Trend Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData.salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="period" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="transaction_count" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Transactions"
                yAxisId="right"
              />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Breakdown */}
        {reportData.paymentMethods && reportData.paymentMethods.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Methods</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={reportData.paymentMethods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                    label={({ payment_method, percent }) => `${payment_method}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {reportData.paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-3">
                {reportData.paymentMethods.map((method, index) => (
                  <div key={method.payment_method} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-300 capitalize">{method.payment_method}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">KES {method.total.toLocaleString()}</p>
                      <p className="text-gray-400 text-sm">{method.count} transactions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Products */}
        {reportData.topProducts && reportData.topProducts.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Selling Products</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-gray-400 text-sm">
                  <tr>
                    <th className="text-left pb-3">Product</th>
                    <th className="text-right pb-3">Units Sold</th>
                    <th className="text-right pb-3">Revenue</th>
                    <th className="text-right pb-3">Avg. Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {reportData.topProducts.map((product, index) => (
                    <tr key={index} className="text-gray-300">
                      <td className="py-3">
                        <p className="text-white font-medium">{product.name}</p>
                        <p className="text-gray-400 text-sm">SKU: {product.sku}</p>
                      </td>
                      <td className="text-right py-3">{product.units_sold}</td>
                      <td className="text-right py-3 text-white font-medium">
                        KES {product.revenue.toLocaleString()}
                      </td>
                      <td className="text-right py-3">
                        KES {(product.revenue / product.units_sold).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Category Performance */}
        {reportData.categories && reportData.categories.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Category Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.categories}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                <Bar dataKey="units_sold" fill="#10B981" name="Units Sold" yAxisId="right" />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const renderInventoryReport = () => {
    if (!reportData) {
      return <div className="text-center text-gray-400 py-8">No inventory data available</div>;
    }

    return (
      <div className="space-y-6">
        {/* Inventory Summary */}
        {reportData.summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Products</p>
              <p className="text-2xl font-bold text-white">{reportData.summary.total_products}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Units</p>
              <p className="text-2xl font-bold text-white">{reportData.summary.total_units}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Stock Value</p>
              <p className="text-2xl font-bold text-white">
                KES {reportData.summary.total_value?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Low Stock</p>
              <p className="text-2xl font-bold text-orange-400">{reportData.summary.low_stock}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Out of Stock</p>
              <p className="text-2xl font-bold text-red-400">{reportData.summary.out_of_stock}</p>
            </div>
          </div>
        )}

        {/* Stock Levels with Pagination */}
        {reportData.stockLevels && reportData.stockLevels.length > 0 && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Current Stock Levels</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-gray-400 text-sm">
                    <tr>
                      <th className="text-left pb-3">SKU</th>
                      <th className="text-left pb-3">Product</th>
                      <th className="text-left pb-3">Category</th>
                      <th className="text-right pb-3">Stock</th>
                      <th className="text-right pb-3">Value</th>
                      <th className="text-left pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {reportData.stockLevels.map((item) => (
                      <tr key={item.sku} className="text-gray-300">
                        <td className="py-3">{item.sku}</td>
                        <td className="py-3 text-white">{item.name}</td>
                        <td className="py-3">{item.category || 'Uncategorized'}</td>
                        <td className="py-3 text-right">{item.current_stock}</td>
                        <td className="py-3 text-right">
                          KES {item.stock_value?.toLocaleString() || 0}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.status === 'Out of Stock' ? 'bg-red-500/20 text-red-400' :
                            item.status === 'Low Stock' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {reportData.stockPagination && (
              <Pagination
                currentPage={reportData.stockPagination.page}
                totalPages={reportData.stockPagination.totalPages}
                onPageChange={handleStockPageChange}
                itemsPerPage={reportData.stockPagination.limit}
                totalItems={reportData.stockPagination.total}
              />
            )}
          </div>
        )}

        {/* Recent Movements with Pagination */}
        {reportData.movements && reportData.movements.length > 0 && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Stock Movements</h3>
              <div className="space-y-2">
                {reportData.movements.map((movement, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded ${
                        movement.movement_type === 'in' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {movement.movement_type === 'in' ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{movement.product}</p>
                        <p className="text-gray-400 text-sm">{movement.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        movement.movement_type === 'in' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
                      </p>
                      <p className="text-gray-400 text-xs">{movement.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {reportData.movementsPagination && (
              <Pagination
                currentPage={reportData.movementsPagination.page}
                totalPages={reportData.movementsPagination.totalPages}
                onPageChange={handleMovementsPageChange}
                itemsPerPage={reportData.movementsPagination.limit}
                totalItems={reportData.movementsPagination.total}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCustomerReport = () => {
    if (!reportData) {
      return <div className="text-center text-gray-400 py-8">No customer data available</div>;
    }

    return (
      <div className="space-y-6">
        {/* Customer Metrics */}
        {reportData.metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-400 text-sm">Total Customers</p>
              <p className="text-3xl font-bold text-white">{reportData.metrics.total_customers}</p>
              <p className="text-green-400 text-sm mt-2">
                +{reportData.metrics.new_customers} new this period
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-400 text-sm">Active Customers</p>
              <p className="text-3xl font-bold text-white">{reportData.metrics.active_customers}</p>
              <p className="text-gray-400 text-sm mt-2">
                {((reportData.metrics.active_customers / reportData.metrics.total_customers) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-400 text-sm">Avg. Loyalty Points</p>
              <p className="text-3xl font-bold text-blue-400">
                {Math.round(reportData.metrics.avg_loyalty_points || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Customer Segmentation */}
        {reportData.segmentation && reportData.segmentation.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Customer Segmentation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={reportData.segmentation}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ segment, percent }) => `${segment}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {reportData.segmentation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-3">
                {reportData.segmentation.map((segment, index) => (
                  <div key={segment.segment} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-300">{segment.segment}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{segment.count} customers</p>
                      <p className="text-gray-400 text-sm">
                        Avg: KES {segment.avg_value?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Customers */}
        {reportData.topCustomers && reportData.topCustomers.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Customers</h3>
            <div className="space-y-3">
              {reportData.topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {customer.first_name} {customer.last_name}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {customer.purchase_count} purchases
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      KES {customer.total_spent.toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Last: {new Date(customer.last_purchase).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStaffReport = () => {
    if (!reportData) {
      return <div className="text-center text-gray-400 py-8">No staff data available</div>;
    }

    return (
      <div className="space-y-6">
        {/* Staff Performance */}
        {reportData.performance && reportData.performance.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Staff Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-gray-400 text-sm">
                  <tr>
                    <th className="text-left pb-3">Staff Member</th>
                    <th className="text-left pb-3">Role</th>
                    <th className="text-right pb-3">Transactions</th>
                    <th className="text-right pb-3">Revenue</th>
                    <th className="text-right pb-3">Avg. Sale</th>
                    <th className="text-right pb-3">Voids</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {reportData.performance.map((staff) => (
                    <tr key={staff.id} className="text-gray-300">
                      <td className="py-3 text-white font-medium">{staff.full_name}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs capitalize">
                          {staff.role}
                        </span>
                      </td>
                      <td className="py-3 text-right">{staff.transactions || 0}</td>
                      <td className="py-3 text-right text-white font-medium">
                        KES {(staff.revenue || 0).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        KES {(staff.avg_sale || 0).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <span className={staff.voids > 0 ? 'text-red-400' : ''}>
                          {staff.voids || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* Hourly Activity Heatmap */}
        {reportData.hourlyActivity && reportData.hourlyActivity.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Hourly Activity</h3>
            <div className="text-gray-400 text-sm">
              Activity heatmap showing peak hours for each staff member
            </div>
            {/* Simplified representation - in production, use a proper heatmap library */}
            <div className="mt-4 space-y-2">
              {Object.entries(
                reportData.hourlyActivity.reduce((acc, item) => {
                  if (!acc[item.full_name]) acc[item.full_name] = {};
                  acc[item.full_name][item.hour] = item.transactions;
                  return acc;
                }, {})
              ).map(([name, hours]) => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-32 text-gray-300 text-sm">{name}</div>
                  <div className="flex gap-1">
                    {Array.from({ length: 24 }, (_, i) => {
                      const count = hours[i.toString().padStart(2, '0')] || 0;
                      const intensity = count > 0 ? Math.min(count / 10, 1) : 0;
                      return (
                        <div
                          key={i}
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor: count > 0 
                              ? `rgba(59, 130, 246, ${intensity})` 
                              : '#374151'
                          }}
                          title={`${i}:00 - ${count} transactions`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
        <div className="flex gap-3">
          <button
            onClick={() => loadReport()}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {reportTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setReportType(type.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                reportType === type.id
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
              }`}
            >
              <Icon className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">{type.name}</p>
            </button>
          );
        })}
      </div>

      {/* Date Range Selector */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => {
                const today = new Date();
                setDateRange({
                  startDate: today.toISOString().split('T')[0],
                  endDate: today.toISOString().split('T')[0]
                });
              }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
            >
              Today
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const weekAgo = new Date(today.setDate(today.getDate() - 7));
                setDateRange({
                  startDate: weekAgo.toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                });
              }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const monthAgo = new Date(today.setDate(today.getDate() - 30));
                setDateRange({
                  startDate: monthAgo.toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                });
              }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
            >
              Last 30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && reportType === 'sales' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
              <span className={`text-sm ${summary.growthRate > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summary.growthRate > 0 ? '+' : ''}{summary.growthRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-gray-400 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-white">
              KES {summary.totalRevenue.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <BarChart3 className="w-8 h-8 text-blue-400 mb-2" />
            <p className="text-gray-400 text-sm">Total Transactions</p>
            <p className="text-2xl font-bold text-white">
              {summary.totalTransactions.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <TrendingUp className="w-8 h-8 text-purple-400 mb-2" />
            <p className="text-gray-400 text-sm">Average Transaction</p>
            <p className="text-2xl font-bold text-white">
              KES {summary.averageTransaction.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <Users className="w-8 h-8 text-orange-400 mb-2" />
            <p className="text-gray-400 text-sm">Growth Rate</p>
            <p className="text-2xl font-bold text-white">
              {summary.growthRate.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div className="bg-gray-900 rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {reportType === 'sales' && renderSalesReport()}
            {reportType === 'inventory' && renderInventoryReport()}
            {reportType === 'customers' && renderCustomerReport()}
            {reportType === 'staff' && renderStaffReport()}
          </>
        )}
      </div>
    </div>
  );
}