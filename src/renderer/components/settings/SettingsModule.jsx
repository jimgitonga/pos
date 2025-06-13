
// // src/renderer/components/settings/SettingsModule.jsx
// import React, { useState, useEffect } from 'react';
// import {
//   Settings, Store, Receipt, Bell, Shield, Database,
//   Printer, CreditCard, Globe, Clock, Save, RefreshCw,
//   Download, Upload, AlertCircle, Check, Loader2,
//   HardDrive, Wifi, Volume2, Monitor, Key, Users,
//   Mail, Phone, MapPin, DollarSign, Percent, Package
// } from 'lucide-react';
// import { useSettingsStore, useAuthStore } from '../../store';
// import toast from 'react-hot-toast';

// export default function SettingsModule() {
//   const [activeTab, setActiveTab] = useState('business');
//   const [settings, setSettings] = useState({});
//   const [saving, setSaving] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const { user } = useAuthStore();
//   const { loadSettings, updateSetting } = useSettingsStore();

//   const tabs = [
//     { id: 'business', name: 'Business Info', icon: Store },
//     { id: 'receipt', name: 'Receipt Settings', icon: Receipt },
//     { id: 'tax', name: 'Tax & Currency', icon: DollarSign },
//     { id: 'hardware', name: 'Hardware', icon: Printer },
//     { id: 'notifications', name: 'Notifications', icon: Bell },
//     { id: 'security', name: 'Security', icon: Shield },
//     { id: 'backup', name: 'Backup & Restore', icon: Database },
//     { id: 'system', name: 'System', icon: Settings }
//   ];

//   useEffect(() => {
//     loadAllSettings();
//   }, []);

//   const loadAllSettings = async () => {
//     setLoading(true);
//     try {
//       // Assuming window.api.settings.getAll() exists and fetches all settings
//       const result = await window.api.settings.getAll();
//       if (result.success) {
//         setSettings(result.settings);
//       } else {
//         toast.error(result.message || 'Failed to load settings from API.');
//       }
//     } catch (error) {
//       console.error('Failed to load settings:', error);
//       toast.error('Failed to load settings. Please check console for details.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSave = async (key, value) => {
//     setSaving(true);
//     try {
//       // Assuming updateSetting is a store action that updates backend and then state
//       const success = await updateSetting(key, value);
//       if (success) {
//         setSettings({ ...settings, [key]: value });
//         toast.success('Setting updated successfully');
//       } else {
//         toast.error('Failed to update setting. Check input or server response.');
//       }
//     } catch (error) {
//       console.error('Failed to update setting:', error);
//       toast.error('Failed to update setting. Please try again.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleBackup = async () => {
//     try {
//       const result = await window.api.settings.backup();
//       if (result.success) {
//         toast.success('Backup created successfully');
//       } else {
//         toast.error(result.message || 'Failed to create backup.');
//       }
//     } catch (error) {
//       console.error('Failed to create backup:', error);
//       toast.error('Failed to create backup. Please check console for details.');
//     }
//   };

//   const handleRestore = async () => {
//     if (window.confirm('Are you sure you want to restore from backup? This will replace all current data.')) {
//       try {
//         const result = await window.api.file.selectFile({
//           filters: [{ name: 'Database', extensions: ['db'] }]
//         });
//         if (result.success && result.filePath) {
//           const restoreResult = await window.api.settings.restore(result.filePath);
//           if (restoreResult.success) {
//             toast.success('Restore completed successfully. Please restart the application.');
//             // Optionally, you might want to trigger a full settings reload or app restart here
//           } else {
//             toast.error(restoreResult.message || 'Failed to restore from backup.');
//           }
//         } else if (result.canceled) {
//           toast('Restore cancelled.', { icon: 'ℹ️' });
//         }
//       } catch (error) {
//         console.error('Failed to restore from backup:', error);
//         toast.error('Failed to restore from backup. Ensure the file is valid.');
//       }
//     }
//   };

//   const renderBusinessSettings = () => (
//     <div className="space-y-6">
//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-white mb-4">Business Information</h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">
//               Business Name
//             </label>
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={settings.business_name || ''}
//                 onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
//                 className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//               />
//               <button
//                 onClick={() => handleSave('business_name', settings.business_name)}
//                 disabled={saving}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//               >
//                 <Save className="w-4 h-4" />
//               </button>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">
//               Tax Number
//             </label>
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={settings.tax_number || ''}
//                 onChange={(e) => setSettings({ ...settings, tax_number: e.target.value })}
//                 className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//               />
//               <button
//                 onClick={() => handleSave('tax_number', settings.tax_number)}
//                 disabled={saving}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//               >
//                 <Save className="w-4 h-4" />
//               </button>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">
//               <div className="flex items-center gap-2">
//                 <Phone className="w-4 h-4" />
//                 Phone Number
//               </div>
//             </label>
//             <div className="flex gap-2">
//               <input
//                 type="tel"
//                 value={settings.business_phone || ''}
//                 onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
//                 className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//               />
//               <button
//                 onClick={() => handleSave('business_phone', settings.business_phone)}
//                 disabled={saving}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//               >
//                 <Save className="w-4 h-4" />
//               </button>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">
//               <div className="flex items-center gap-2">
//                 <Mail className="w-4 h-4" />
//                 Email Address
//               </div>
//             </label>
//             <div className="flex gap-2">
//               <input
//                 type="email"
//                 value={settings.business_email || ''}
//                 onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
//                 className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//               />
//               <button
//                 onClick={() => handleSave('business_email', settings.business_email)}
//                 disabled={saving}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//               >
//                 <Save className="w-4 h-4" />
//               </button>
//             </div>
//           </div>

//           <div className="md:col-span-2">
//             <label className="block text-sm font-medium text-gray-300 mb-2">
//               <div className="flex items-center gap-2">
//                 <MapPin className="w-4 h-4" />
//                 Business Address
//               </div>
//             </label>
//             <div className="flex gap-2">
//               <textarea
//                 value={settings.business_address || ''}
//                 onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
//                 className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                 rows="3"
//               />
//               <button
//                 onClick={() => handleSave('business_address', settings.business_address)}
//                 disabled={saving}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//               >
//                 <Save className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   const renderReceiptSettings = () => (
//     <div className="space-y-6">
//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-white mb-4">Receipt Configuration</h3>
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">
//               Receipt Header Message
//             </label>
//             <div className="flex gap-2">
//               <textarea
//                 value={settings.receipt_header || ''}
//                 onChange={(e) => setSettings({ ...settings, receipt_header: e.target.value })}
//                 className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                 rows="2"
//                 placeholder="Welcome to our store!"
//               />
//               <button
//                 onClick={() => handleSave('receipt_header', settings.receipt_header)}
//                 disabled={saving}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//               >
//                 <Save className="w-4 h-4" />
//               </button>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">
//               Receipt Footer Message
//             </label>
//             <div className="flex gap-2">
//               <textarea
//                 value={settings.receipt_footer || ''}
//                 onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
//                 className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                 rows="2"
//                 placeholder="Thank you for your business!"
//               />
//               <button
//                 onClick={() => handleSave('receipt_footer', settings.receipt_footer)}
//                 disabled={saving}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//               >
//                 <Save className="w-4 h-4" />
//               </button>
//             </div>
//           </div>

//           <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-3">
//               <Receipt className="w-5 h-5 text-gray-400" />
//               <div>
//                 <p className="text-white font-medium">Print Receipt Automatically</p>
//                 <p className="text-gray-400 text-sm">Print receipt after each sale</p>
//               </div>
//             </div>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={settings.auto_print_receipt === '1'}
//                 onChange={(e) => handleSave('auto_print_receipt', e.target.checked ? '1' : '0')}
//                 className="sr-only peer"
//               />
//               <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//             </label>
//           </div>

//           <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-3">
//               <Mail className="w-5 h-5 text-gray-400" />
//               <div>
//                 <p className="text-white font-medium">Email Receipts</p>
//                 <p className="text-gray-400 text-sm">Send receipt via email when available</p>
//               </div>
//             </div>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={settings.enable_email_receipt === '1'}
//                 onChange={(e) => handleSave('enable_email_receipt', e.target.checked ? '1' : '0')}
//                 className="sr-only peer"
//               />
//               <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//             </label>
//           </div>
//         </div>
//       </div>

//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-white mb-4">Receipt Preview</h3>
//         <div className="bg-white text-black p-4 rounded font-mono text-xs max-w-sm mx-auto">
//           <div className="text-center mb-2">
//             <p className="font-bold text-sm">{settings.business_name || 'Business Name'}</p>
//             <p>{settings.business_address || 'Business Address'}</p>
//             <p>{settings.business_phone || 'Phone'} | {settings.business_email || 'Email'}</p>
//             <p>Tax No: {settings.tax_number || 'XXX-XXX-XXX'}</p>
//           </div>
//           <div className="border-t border-dashed border-gray-400 my-2"></div>
//           <p className="text-center">{settings.receipt_header || 'Welcome!'}</p>
//           <div className="border-t border-dashed border-gray-400 my-2"></div>
//           <div className="space-y-1">
//             <div className="flex justify-between">
//               <span>Sample Product 1</span>
//               <span>{settings.currency || 'KES'} 1,000</span>
//             </div>
//             <div className="flex justify-between">
//               <span>Sample Product 2</span>
//               <span>{settings.currency || 'KES'} 2,500</span>
//             </div>
//           </div>
//           <div className="border-t border-dashed border-gray-400 my-2"></div>
//           <div className="space-y-1">
//             <div className="flex justify-between">
//               <span>Subtotal:</span>
//               <span>{settings.currency || 'KES'} 3,500</span>
//             </div>
//             <div className="flex justify-between">
//               <span>Tax ({settings.tax_rate || '16'}%):</span>
//               <span>{settings.currency || 'KES'} {(3500 * (parseFloat(settings.tax_rate || '16') / 100)).toFixed(2)}</span>
//             </div>
//             <div className="flex justify-between font-bold">
//               <span>Total:</span>
//               <span>{settings.currency || 'KES'} {(3500 * (1 + parseFloat(settings.tax_rate || '16') / 100)).toFixed(2)}</span>
//             </div>
//           </div>
//           <div className="border-t border-dashed border-gray-400 my-2"></div>
//           <p className="text-center">{settings.receipt_footer || 'Thank you!'}</p>
//           <p className="text-center mt-2">{new Date().toLocaleString()}</p>
//         </div>
//       </div>
//     </div>
//   );

//   const renderTaxSettings = () => (
//     <div className="space-y-6">
//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-white mb-4">Tax Configuration</h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">
//               <div className="flex items-center gap-2">
//                 <Percent className="w-4 h-4" />
//                 Default Tax Rate (%)
//               </div>
//             </label>
//             <div className="flex gap-2">
//               <input
//                 type="number"
//                 value={settings.tax_rate || '16'}
//                 onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
//                 className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                 min="0"
//                 max="100"
//                 step="0.01"
//               />
//               <button
//                 onClick={() => handleSave('tax_rate', settings.tax_rate)}
//                 disabled={saving}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//               >
//                 <Save className="w-4 h-4" />
//               </button>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">
//               <div className="flex items-center gap-2">
//                 <Globe className="w-4 h-4" />
//                 Currency
//               </div>
//             </label>
//             <div className="flex gap-2">
//               <select
//                 value={settings.currency || 'KES'}
//                 onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
//                 className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//               >
//                 <option value="KES">KES - Kenyan Shilling</option>
//                 <option value="USD">USD - US Dollar</option>
//                 <option value="EUR">EUR - Euro</option>
//                 <option value="GBP">GBP - British Pound</option>
//                 <option value="TZS">TZS - Tanzanian Shilling</option>
//                 <option value="UGX">UGX - Ugandan Shilling</option>
//               </select>
//               <button
//                 onClick={() => handleSave('currency', settings.currency)}
//                 disabled={saving}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//               >
//                 <Save className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="mt-6 p-4 bg-gray-700 rounded-lg">
//           <h4 className="text-white font-medium mb-3">Tax Calculation Preview</h4>
//           <div className="space-y-2 text-sm">
//             <div className="flex justify-between">
//               <span className="text-gray-400">Product Price:</span>
//               <span className="text-white">{settings.currency || 'KES'} 1,000.00</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-400">Tax ({settings.tax_rate || '16'}%):</span>
//               <span className="text-white">{settings.currency || 'KES'} {(1000 * (parseFloat(settings.tax_rate || '16') / 100)).toFixed(2)}</span>
//             </div>
//             <div className="flex justify-between border-t border-gray-600 pt-2">
//               <span className="text-gray-400">Total with Tax:</span>
//               <span className="text-white font-medium">{settings.currency || 'KES'} {(1000 * (1 + parseFloat(settings.tax_rate || '16') / 100)).toFixed(2)}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-white mb-4">Loyalty Program</h3>
//         <div className="space-y-4">
//           <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-3">
//               <Users className="w-5 h-5 text-gray-400" />
//               <div>
//                 <p className="text-white font-medium">Enable Loyalty Program</p>
//                 <p className="text-gray-400 text-sm">Customers earn points on purchases</p>
//               </div>
//             </div>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={settings.enable_loyalty === '1'}
//                 onChange={(e) => handleSave('enable_loyalty', e.target.checked ? '1' : '0')}
//                 className="sr-only peer"
//               />
//               <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//             </label>
//           </div>

//           {settings.enable_loyalty === '1' && (
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Points per {settings.currency || 'KES'} 100 spent
//               </label>
//               <div className="flex gap-2">
//                 <input
//                   type="number"
//                   value={settings.loyalty_points_rate || '1'}
//                   onChange={(e) => setSettings({ ...settings, loyalty_points_rate: e.target.value })}
//                   className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                   min="0"
//                   step="1"
//                 />
//                 <button
//                   onClick={() => handleSave('loyalty_points_rate', settings.loyalty_points_rate)}
//                   disabled={saving}
//                   className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//                 >
//                   <Save className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );

//   const renderHardwareSettings = () => (
//     <div className="space-y-6">
//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-white mb-4">Receipt Printer</h3>
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">
//               Default Receipt Printer
//             </label>
//             <div className="flex gap-2">
//               <select
//                 value={settings.receipt_printer || ''}
//                 onChange={(e) => setSettings({ ...settings, receipt_printer: e.target.value })}
//                 className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//               >
//                 <option value="">Select Printer</option>
//                 <option value="EPSON TM-T88V">EPSON TM-T88V</option>
//                 <option value="Star TSP100">Star TSP100</option>
//                 <option value="Generic POS Printer">Generic POS Printer</option>
//                 {/* You might want to dynamically list available printers here using a window.api call */}
//               </select>
//               <button
//                 onClick={() => handleSave('receipt_printer', settings.receipt_printer)}
//                 disabled={saving}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//               >
//                 <Save className="w-4 h-4" />
//               </button>
//             </div>
//           </div>

//           <button
//             onClick={async () => {
//               try {
//                 // Assuming window.api.print.testPrint exists
//                 const result = await window.api.print.testPrint(settings.receipt_printer);
//                 if (result.success) {
//                   toast.success('Test print sent successfully');
//                 } else {
//                   toast.error(result.message || 'Failed to test printer.');
//                 }
//               } catch (error) {
//                 console.error('Failed to test printer:', error);
//                 toast.error('Failed to test printer. Check printer connection.');
//               }
//             }}
//             className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
//           >
//             <Printer className="w-4 h-4" />
//             Test Print
//           </button>
//         </div>
//       </div>

//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-white mb-4">Barcode Scanner</h3>
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">
//               Scanner Device
//             </label>
//             <div className="flex gap-2">
//               <select
//                 value={settings.barcode_scanner || ''}
//                 onChange={(e) => setSettings({ ...settings, barcode_scanner: e.target.value })}
//                 className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//               >
//                 <option value="">Auto-detect (USB HID)</option>
//                 <option value="Symbol LS2208">Symbol LS2208</option>
//                 <option value="Honeywell Voyager">Honeywell Voyager</option>
//                 <option value="Datalogic QD2430">Datalogic QD2430</option>
//                 {/* Dynamically list connected scanners if possible */}
//               </select>
//               <button
//                 onClick={() => handleSave('barcode_scanner', settings.barcode_scanner)}
//                 disabled={saving}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//               >
//                 <Save className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-white mb-4">Cash Drawer</h3>
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">
//               Cash Drawer Connection
//             </label>
//             <div className="flex gap-2">
//               <select
//                 value={settings.cash_drawer || ''}
//                 onChange={(e) => setSettings({ ...settings, cash_drawer: e.target.value })}
//                 className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//               >
//                 <option value="">Disabled</option>
//                 <option value="printer">Via Receipt Printer</option>
//                 <option value="usb">USB Direct</option>
//               </select>
//               <button
//                 onClick={() => handleSave('cash_drawer', settings.cash_drawer)}
//                 disabled={saving}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//               >
//                 <Save className="w-4 h-4" />
//               </button>
//             </div>
//           </div>

//           <button
//             onClick={async () => {
//               try {
//                 // Assuming window.api.hardware.openCashDrawer exists
//                 const result = await window.api.hardware.openCashDrawer();
//                 if (result.success) {
//                   toast.success('Cash drawer opened');
//                 } else {
//                   toast.error(result.message || 'Failed to open cash drawer.');
//                 }
//               } catch (error) {
//                 console.error('Failed to open cash drawer:', error);
//                 toast.error('Failed to open cash drawer. Check connection.');
//               }
//             }}
//             className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
//           >
//             Test Cash Drawer
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   const renderNotificationSettings = () => (
//     <div className="space-y-6">
//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
//         <div className="space-y-4">
//           <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-3">
//               <Volume2 className="w-5 h-5 text-gray-400" />
//               <div>
//                 <p className="text-white font-medium">Sound Notifications</p>
//                 <p className="text-gray-400 text-sm">Play sounds for events</p>
//               </div>
//             </div>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={settings.enable_sound === '1'}
//                 onChange={(e) => handleSave('enable_sound', e.target.checked ? '1' : '0')}
//                 className="sr-only peer"
//               />
//               <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//             </label>
//           </div>

//           <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-3">
//               <Package className="w-5 h-5 text-gray-400" />
//               <div>
//                 <p className="text-white font-medium">Low Stock Alerts</p>
//                 <p className="text-gray-400 text-sm">Notify when products are low</p>
//               </div>
//             </div>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={settings.low_stock_notifications === '1'}
//                 onChange={(e) => handleSave('low_stock_notifications', e.target.checked ? '1' : '0')}
//                 className="sr-only peer"
//               />
//               <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//             </label>
//           </div>

//           <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-3">
//               <DollarSign className="w-5 h-5 text-gray-400" />
//               <div>
//                 <p className="text-white font-medium">Daily Sales Summary</p>
//                 <p className="text-gray-400 text-sm">Show sales summary at day end</p>
//               </div>
//             </div>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={settings.daily_summary === '1'}
//                 onChange={(e) => handleSave('daily_summary', e.target.checked ? '1' : '0')}
//                 className="sr-only peer"
//               />
//               <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//             </label>
//           </div>
//         </div>
//       </div>

//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-white mb-4">Alert Thresholds</h3>
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">
//               Low Stock Threshold (default)
//             </label>
//             <div className="flex gap-2">
//               <input
//                 type="number"
//                 value={settings.low_stock_alert || '10'}
//                 onChange={(e) => setSettings({ ...settings, low_stock_alert: e.target.value })}
//                 className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                 min="1"
//               />
//               <button
//                 onClick={() => handleSave('low_stock_alert', settings.low_stock_alert)}
//                 disabled={saving}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//               >
//                 <Save className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   const renderSecuritySettings = () => (
//     <div className="space-y-6">
//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
//         <div className="space-y-4">
//           <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-3">
//               <Key className="w-5 h-5 text-gray-400" />
//               <div>
//                 <p className="text-white font-medium">Require Password for Returns</p>
//                 <p className="text-gray-400 text-sm">Staff must enter password for returns</p>
//               </div>
//             </div>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={settings.require_password_returns === '1'}
//                 onChange={(e) => handleSave('require_password_returns', e.target.checked ? '1' : '0')}
//                 className="sr-only peer"
//               />
//               <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//             </label>
//           </div>

//           <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-3">
//               <Clock className="w-5 h-5 text-gray-400" />
//               <div>
//                 <p className="text-white font-medium">Auto-lock after Inactivity</p>
//                 <p className="text-gray-400 text-sm">Lock screen after a period of inactivity</p>
//               </div>
//             </div>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={settings.auto_lock_inactivity === '1'}
//                 onChange={(e) => handleSave('auto_lock_inactivity', e.target.checked ? '1' : '0')}
//                 className="sr-only peer"
//               />
//               <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//             </label>
//           </div>

//           {settings.auto_lock_inactivity === '1' && (
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Inactivity Timeout (minutes)
//               </label>
//               <div className="flex gap-2">
//                 <input
//                   type="number"
//                   value={settings.inactivity_timeout_minutes || '5'}
//                   onChange={(e) => setSettings({ ...settings, inactivity_timeout_minutes: e.target.value })}
//                   className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//                   min="1"
//                 />
//                 <button
//                   onClick={() => handleSave('inactivity_timeout_minutes', settings.inactivity_timeout_minutes)}
//                   disabled={saving}
//                   className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//                 >
//                   <Save className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>
//           )}

//           <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-3">
//               <Wifi className="w-5 h-5 text-gray-400" />
//               <div>
//                 <p className="text-white font-medium">Offline Mode Support</p>
//                 <p className="text-gray-400 text-sm">Allow limited operations without internet</p>
//               </div>
//             </div>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={settings.offline_mode_support === '1'}
//                 onChange={(e) => handleSave('offline_mode_support', e.target.checked ? '1' : '0')}
//                 className="sr-only peer"
//               />
//               <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//             </label>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   const renderBackupRestoreSettings = () => (
//     <div className="space-y-6">
//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-white mb-4">Data Backup & Restore</h3>
//         <div className="space-y-4">
//           <p className="text-gray-300">
//             Create a backup of your current database or restore from a previously saved backup file.
//           </p>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <button
//               onClick={handleBackup}
//               className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-600"
//               disabled={saving || loading}
//             >
//               {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
//               {saving ? 'Creating Backup...' : 'Create Backup'}
//             </button>
//             <button
//               onClick={handleRestore}
//               className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-600"
//               disabled={saving || loading}
//             >
//               {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />}
//               {saving ? 'Restoring Data...' : 'Restore from Backup'}
//             </button>
//           </div>
//           <div className="p-4 bg-gray-700 rounded-lg flex items-center gap-3">
//             <AlertCircle className="w-6 h-6 text-yellow-400" />
//             <p className="text-yellow-200 text-sm">
//               Restoring data will overwrite your current database. Ensure you have a recent backup!
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   const renderSystemSettings = () => (
//     <div className="space-y-6">
//       <div className="bg-gray-800 rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-white mb-4">System Preferences</h3>
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-300 mb-2">
//               <div className="flex items-center gap-2">
//                 <Clock className="w-4 h-4" />
//                 Time Zone
//               </div>
//             </label>
//             <div className="flex gap-2">
//               <select
//                 value={settings.time_zone || 'Africa/Nairobi'}
//                 onChange={(e) => setSettings({ ...settings, time_zone: e.target.value })}
//                 className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
//               >
//                 <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
//                 <option value="America/New_York">America/New_York (EST)</option>
//                 <option value="Europe/London">Europe/London (GMT)</option>
//                 <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
//                 {/* Add more time zones as needed */}
//               </select>
//               <button
//                 onClick={() => handleSave('time_zone', settings.time_zone)}
//                 disabled={saving}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
//               >
//                 <Save className="w-4 h-4" />
//               </button>
//             </div>
//           </div>

//           <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-3">
//               <Monitor className="w-5 h-5 text-gray-400" />
//               <div>
//                 <p className="text-white font-medium">Dark Mode</p>
//                 <p className="text-gray-400 text-sm">Enable dark theme for the application</p>
//               </div>
//             </div>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={settings.dark_mode === '1'}
//                 onChange={(e) => {
//                   handleSave('dark_mode', e.target.checked ? '1' : '0');
//                   // Optionally, apply theme change immediately
//                   document.documentElement.classList.toggle('dark', e.target.checked);
//                 }}
//                 className="sr-only peer"
//               />
//               <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//             </label>
//           </div>

//           <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-3">
//               <RefreshCw className="w-5 h-5 text-gray-400" />
//               <div>
//                 <p className="text-white font-medium">Auto-Update Application</p>
//                 <p className="text-gray-400 text-sm">Automatically download and install updates</p>
//               </div>
//             </div>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={settings.auto_update === '1'}
//                 onChange={(e) => handleSave('auto_update', e.target.checked ? '1' : '0')}
//                 className="sr-only peer"
//               />
//               <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//             </label>
//           </div>

//           <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-3">
//               <HardDrive className="w-5 h-5 text-gray-400" />
//               <div>
//                 <p className="text-white font-medium">Clear Cache on Exit</p>
//                 <p className="text-gray-400 text-sm">Clear application cache when closing</p>
//               </div>
//             </div>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={settings.clear_cache_on_exit === '1'}
//                 onChange={(e) => handleSave('clear_cache_on_exit', e.target.checked ? '1' : '0')}
//                 className="sr-only peer"
//               />
//               <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//             </label>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   const renderContent = () => {
//     if (loading) {
//       return (
//         <div className="flex justify-center items-center h-full">
//           <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
//           <p className="ml-2 text-gray-400">Loading settings...</p>
//         </div>
//       );
//     }

//     switch (activeTab) {
//       case 'business':
//         return renderBusinessSettings();
//       case 'receipt':
//         return renderReceiptSettings();
//       case 'tax':
//         return renderTaxSettings();
//       case 'hardware':
//         return renderHardwareSettings();
//       case 'notifications':
//         return renderNotificationSettings();
//       case 'security':
//         return renderSecuritySettings();
//       case 'backup':
//         return renderBackupRestoreSettings();
//       case 'system':
//         return renderSystemSettings();
//       default:
//         return <div className="text-gray-400">Select a setting category.</div>;
//     }
//   };

//   return (
//     <div className="flex h-full bg-gray-900 text-white">
//       {/* Sidebar Navigation */}
//       <div className="w-64 bg-gray-800 p-4 shadow-lg overflow-y-auto">
//         <h2 className="text-2xl font-bold mb-6 text-blue-400">Settings</h2>
//         <nav>
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               className={`flex items-center gap-3 p-3 rounded-lg w-full text-left transition-colors duration-200 mb-2
//                 ${activeTab === tab.id ? 'bg-blue-700 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
//               onClick={() => setActiveTab(tab.id)}
//             >
//               <tab.icon className="w-5 h-5" />
//               <span className="text-md">{tab.name}</span>
//             </button>
//           ))}
//         </nav>
//       </div>

//       {/* Main Content Area */}
//       <div className="flex-1 p-6 overflow-y-auto">
//         <h1 className="text-3xl font-bold mb-6 capitalize text-blue-300">
//           {tabs.find(tab => tab.id === activeTab)?.name || 'Settings'}
//         </h1>
//         <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
//           {renderContent()}
//         </div>
//       </div>
//     </div>
//   );
// }


// src/renderer/components/settings/SettingsModule.jsx


import React, { useState, useEffect } from 'react';
import {
  Settings, Store, Receipt, Bell, Shield, Database,
  Printer, CreditCard, Globe, Clock, Save, RefreshCw,
  Download, Upload, AlertCircle, Check, Loader2,
  HardDrive, Wifi, Volume2, Monitor, Key, Users,
  Mail, Phone, MapPin, DollarSign, Percent, Package,
  Plus, Edit2, Trash2, Eye, EyeOff, UserPlus
} from 'lucide-react';
import { useSettingsStore, useAuthStore } from '../../store';
import toast from 'react-hot-toast';

export default function SettingsModule() {
  const [activeTab, setActiveTab] = useState('business');
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { loadSettings, updateSetting } = useSettingsStore();

  const tabs = [
    { id: 'business', name: 'Business Info', icon: Store },
    { id: 'receipt', name: 'Receipt Settings', icon: Receipt },
    { id: 'tax', name: 'Tax & Currency', icon: DollarSign },
    { id: 'hardware', name: 'Hardware', icon: Printer },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'users', name: 'User Management', icon: Users, adminOnly: true },
    { id: 'backup', name: 'Backup & Restore', icon: Database },
    { id: 'system', name: 'System', icon: Settings }
  ];

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      const result = await window.api.settings.getAll();
      if (result.success) {
        setSettings(result.settings);
      } else {
        toast.error(result.message || 'Failed to load settings from API.');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key, value) => {
    setSaving(true);
    try {
      const success = await updateSetting(key, value);
      if (success) {
        setSettings({ ...settings, [key]: value });
        toast.success('Setting updated successfully');
      } else {
        toast.error('Failed to update setting. Check input or server response.');
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
      toast.error('Failed to update setting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const result = await window.api.settings.backup();
      if (result.success) {
        toast.success('Backup created successfully');
      } else {
        toast.error(result.message || 'Failed to create backup.');
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast.error('Failed to create backup. Please check console for details.');
    }
  };

  const handleRestore = async () => {
    if (window.confirm('Are you sure you want to restore from backup? This will replace all current data.')) {
      try {
        const result = await window.api.file.selectFile({
          filters: [{ name: 'Database', extensions: ['db'] }]
        });
        if (result.success && result.filePath) {
          const restoreResult = await window.api.settings.restore(result.filePath);
          if (restoreResult.success) {
            toast.success('Restore completed successfully. Please restart the application.');
          } else {
            toast.error(restoreResult.message || 'Failed to restore from backup.');
          }
        } else if (result.canceled) {
          toast('Restore cancelled.', { icon: 'ℹ️' });
        }
      } catch (error) {
        console.error('Failed to restore from backup:', error);
        toast.error('Failed to restore from backup. Ensure the file is valid.');
      }
    }
  };

  // Password Change Component
  const PasswordChangeForm = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changing, setChanging] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
      current: false,
      new: false,
      confirm: false
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      setChanging(true);
      
      try {
        const result = await window.api.auth.changePassword({
          userId: user.id,
          currentPassword,
          newPassword
        });
        
        if (result.success) {
          toast.success('Password changed successfully');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          toast.error(result.error || 'Failed to change password');
        }
      } catch (error) {
        toast.error('Failed to change password');
      } finally {
        setChanging(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={changing || !currentPassword || !newPassword || !confirmPassword}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
        >
          {changing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Changing...
            </>
          ) : (
            <>
              <Key className="w-4 h-4" />
              Change Password
            </>
          )}
        </button>
      </form>
    );
  };

  // User Management Component
  // const UserManagement = () => {
  //   const [users, setUsers] = useState([]);
  //   const [loadingUsers, setLoadingUsers] = useState(true);
  //   const [showAddUser, setShowAddUser] = useState(false);
  //   const [editingUser, setEditingUser] = useState(null);

  //   useEffect(() => {
  //     loadUsers();
  //   }, []);

  //   const loadUsers = async () => {
  //     setLoadingUsers(true);
  //     try {
  //       const result = await window.api.auth.getUsers({ role: user.role });
  //       if (result.success) {
  //         setUsers(result.users);
  //       } else {
  //         toast.error('Failed to load users');
  //       }
  //     } catch (error) {
  //       console.error('Failed to load users:', error);
  //       toast.error('Failed to load users');
  //     } finally {
  //       setLoadingUsers(false);
  //     }
  //   };

  //   const AddUserForm = () => {
  //     const [formData, setFormData] = useState({
  //       username: '',
  //       password: '',
  //       pin: '',
  //       full_name: '',
  //       email: '',
  //       phone: '',
  //       role: 'cashier'
  //     });
  //     const [submitting, setSubmitting] = useState(false);

  //     const handleSubmit = async (e) => {
  //       e.preventDefault();
        
  //       if (formData.password.length < 6) {
  //         toast.error('Password must be at least 6 characters');
  //         return;
  //       }

  //       if (formData.pin && formData.pin.length !== 4) {
  //         toast.error('PIN must be exactly 4 digits');
  //         return;
  //       }

  //       setSubmitting(true);
  //       try {
  //         const result = await window.api.auth.createUser({
  //           currentUserRole: user.role,
  //           userData: formData
  //         });
          
  //         if (result.success) {
  //           toast.success('User created successfully');
  //           setShowAddUser(false);
  //           setFormData({
  //             username: '',
  //             password: '',
  //             pin: '',
  //             full_name: '',
  //             email: '',
  //             phone: '',
  //             role: 'cashier'
  //           });
  //           loadUsers();
  //         } else {
  //           toast.error(result.error || 'Failed to create user');
  //         }
  //       } catch (error) {
  //         toast.error('Failed to create user');
  //       } finally {
  //         setSubmitting(false);
  //       }
  //     };

  //     return (
  //       <div className="bg-gray-800 rounded-lg p-6">
  //         <h3 className="text-lg font-semibold text-white mb-4">Add New User</h3>
  //         <form onSubmit={handleSubmit} className="space-y-4">
  //           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //             <div>
  //               <label className="block text-sm font-medium text-gray-300 mb-2">
  //                 Username *
  //               </label>
  //               <input
  //                 type="text"
  //                 value={formData.username}
  //                 onChange={(e) => setFormData({...formData, username: e.target.value})}
  //                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
  //                 required
  //               />
  //             </div>
              
  //             <div>
  //               <label className="block text-sm font-medium text-gray-300 mb-2">
  //                 Full Name *
  //               </label>
  //               <input
  //                 type="text"
  //                 value={formData.full_name}
  //                 onChange={(e) => setFormData({...formData, full_name: e.target.value})}
  //                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
  //                 required
  //               />
  //             </div>
              
  //             <div>
  //               <label className="block text-sm font-medium text-gray-300 mb-2">
  //                 Email
  //               </label>
  //               <input
  //                 type="email"
  //                 value={formData.email}
  //                 onChange={(e) => setFormData({...formData, email: e.target.value})}
  //                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
  //               />
  //             </div>
              
  //             <div>
  //               <label className="block text-sm font-medium text-gray-300 mb-2">
  //                 Phone
  //               </label>
  //               <input
  //                 type="tel"
  //                 value={formData.phone}
  //                 onChange={(e) => setFormData({...formData, phone: e.target.value})}
  //                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
  //               />
  //             </div>
              
  //             <div>
  //               <label className="block text-sm font-medium text-gray-300 mb-2">
  //                 Role *
  //               </label>
  //               <select
  //                 value={formData.role}
  //                 onChange={(e) => setFormData({...formData, role: e.target.value})}
  //                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
  //                 required
  //               >
  //                 <option value="cashier">Cashier</option>
  //                 <option value="manager">Manager</option>
  //                 {user.role === 'admin' && <option value="admin">Admin</option>}
  //               </select>
  //             </div>
              
  //             <div>
  //               <label className="block text-sm font-medium text-gray-300 mb-2">
  //                 Password *
  //               </label>
  //               <input
  //                 type="password"
  //                 value={formData.password}
  //                 onChange={(e) => setFormData({...formData, password: e.target.value})}
  //                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
  //                 required
  //                 minLength="6"
  //               />
  //             </div>
              
  //             <div>
  //               <label className="block text-sm font-medium text-gray-300 mb-2">
  //                 PIN (4 digits)
  //               </label>
  //               <input
  //                 type="text"
  //                 value={formData.pin}
  //                 onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
  //                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
  //                 maxLength="4"
  //                 pattern="[0-9]{4}"
  //               />
  //             </div>
  //           </div>
            
  //           <div className="flex gap-4">
  //             <button
  //               type="submit"
  //               disabled={submitting}
  //               className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
  //             >
  //               {submitting ? (
  //                 <>
  //                   <Loader2 className="w-4 h-4 animate-spin" />
  //                   Creating...
  //                 </>
  //               ) : (
  //                 <>
  //                   <UserPlus className="w-4 h-4" />
  //                   Create User
  //                 </>
  //               )}
  //             </button>
              
  //             <button
  //               type="button"
  //               onClick={() => setShowAddUser(false)}
  //               className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
  //             >
  //               Cancel
  //             </button>
  //           </div>
  //         </form>
  //       </div>
  //     );
  //   };

  //   const UsersList = () => (
  //     <div className="bg-gray-800 rounded-lg p-6">
  //       <div className="flex items-center justify-between mb-4">
  //         <h3 className="text-lg font-semibold text-white">System Users</h3>
  //         <button
  //           onClick={() => setShowAddUser(true)}
  //           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
  //         >
  //           <Plus className="w-4 h-4" />
  //           Add User
  //         </button>
  //       </div>
        
  //       {loadingUsers ? (
  //         <div className="flex justify-center py-8">
  //           <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
  //         </div>
  //       ) : (
  //         <div className="overflow-x-auto">
  //           <table className="w-full text-white">
  //             <thead>
  //               <tr className="border-b border-gray-700">
  //                 <th className="text-left py-3 px-4">Name</th>
  //                 <th className="text-left py-3 px-4">Username</th>
  //                 <th className="text-left py-3 px-4">Role</th>
  //                 <th className="text-left py-3 px-4">Status</th>
  //                 <th className="text-left py-3 px-4">Last Login</th>
  //                 <th className="text-left py-3 px-4">Actions</th>
  //               </tr>
  //             </thead>
  //             <tbody>
  //               {users.map((userData) => (
  //                 <tr key={userData.id} className="border-b border-gray-700">
  //                   <td className="py-3 px-4">{userData.full_name}</td>
  //                   <td className="py-3 px-4">{userData.username}</td>
  //                   <td className="py-3 px-4">
  //                     <span className={`px-2 py-1 rounded text-xs ${
  //                       userData.role === 'admin' ? 'bg-red-900 text-red-200' :
  //                       userData.role === 'manager' ? 'bg-yellow-900 text-yellow-200' :
  //                       'bg-green-900 text-green-200'
  //                     }`}>
  //                       {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
  //                     </span>
  //                   </td>
  //                   <td className="py-3 px-4">
  //                     <span className={`px-2 py-1 rounded text-xs ${
  //                       userData.is_active ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
  //                     }`}>
  //                       {userData.is_active ? 'Active' : 'Inactive'}
  //                     </span>
  //                   </td>
  //                   <td className="py-3 px-4">
  //                     {userData.last_login ? new Date(userData.last_login).toLocaleDateString() : 'Never'}
  //                   </td>
  //                   <td className="py-3 px-4">
  //                     <div className="flex gap-2">
  //                       <button
  //                         onClick={() => setEditingUser(userData)}
  //                         className="text-blue-400 hover:text-blue-300"
  //                       >
  //                         <Edit2 className="w-4 h-4" />
  //                       </button>
  //                       {userData.id !== user.id && (
  //                         <button
  //                           onClick={() => {
  //                             if (window.confirm('Are you sure you want to deactivate this user?')) {
  //                               // Handle user deactivation
  //                             }
  //                           }}
  //                           className="text-red-400 hover:text-red-300"
  //                         >
  //                           <Trash2 className="w-4 h-4" />
  //                         </button>
  //                       )}
  //                     </div>
  //                   </td>
  //                 </tr>
  //               ))}
  //             </tbody>
  //           </table>
  //         </div>
  //       )}
  //     </div>
  //   );

  //   return (
  //     <div className="space-y-6">
  //       {showAddUser ? <AddUserForm /> : <UsersList />}
  //     </div>
  //   );
  // };

 // User Management Component with PIN Support
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const result = await window.api.auth.getUsers({ role: user.role });
      if (result.success) {
        setUsers(result.users);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const EditUserForm = ({ userData, onCancel, onSuccess }) => {
    const [formData, setFormData] = useState({
      username: userData.username || '',
      full_name: userData.full_name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      role: userData.role || 'cashier',
      is_active: userData.is_active || 1
    });
    const [submitting, setSubmitting] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({
      newPassword: '',
      confirmPassword: '',
      newPin: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      
      try {
        const result = await window.api.auth.updateUser({
          currentUserRole: user.role,
          userId: userData.id,
          userData: formData
        });
        
        if (result.success) {
          toast.success('User updated successfully');
          onSuccess();
        } else {
          toast.error(result.error || 'Failed to update user');
        }
      } catch (error) {
        toast.error('Failed to update user');
      } finally {
        setSubmitting(false);
      }
    };

    const handlePasswordChange = async (e) => {
      e.preventDefault();
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      if (passwordData.newPin && passwordData.newPin.length !== 4) {
        toast.error('PIN must be exactly 4 digits');
        return;
      }

      setSubmitting(true);
      try {
        const result = await window.api.auth.changePassword({
          userId: userData.id,
          newPassword: passwordData.newPassword,
          newPin: passwordData.newPin,
          adminReset: true
        });
        
        if (result.success) {
          toast.success('Password and PIN updated successfully');
          setShowPasswordChange(false);
          setPasswordData({ newPassword: '', confirmPassword: '', newPin: '' });
        } else {
          toast.error(result.error || 'Failed to update password');
        }
      } catch (error) {
        toast.error('Failed to update password');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Edit User: {userData.full_name}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
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
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                required
                disabled={userData.id === user.id}
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                {user.role === 'admin' && <option value="admin">Admin</option>}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: parseInt(e.target.value)})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                disabled={userData.id === user.id}
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Update User
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              {showPasswordChange ? 'Hide' : 'Reset'} Password & PIN
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>

        {showPasswordChange && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-md font-semibold text-white mb-4">Reset Password & PIN</h4>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                    minLength="6"
                    placeholder="Enter new password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                    placeholder="Confirm new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New PIN (4 digits)
                  </label>
                  <input
                    type="text"
                    value={passwordData.newPin}
                    onChange={(e) => setPasswordData({
                      ...passwordData, 
                      newPin: e.target.value.replace(/\D/g, '').slice(0, 4)
                    })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    maxLength="4"
                    pattern="[0-9]{4}"
                    placeholder="1234"
                  />
                  <p className="text-xs text-gray-400 mt-1">Optional - Leave empty to keep current PIN</p>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={submitting || !passwordData.newPassword || !passwordData.confirmPassword}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Update Password & PIN
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  const AddUserForm = () => {
    const [formData, setFormData] = useState({
      username: '',
      password: '',
      pin: '',
      full_name: '',
      email: '',
      phone: '',
      role: 'cashier'
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      if (formData.pin && formData.pin.length !== 4) {
        toast.error('PIN must be exactly 4 digits');
        return;
      }

      setSubmitting(true);
      try {
        const result = await window.api.auth.createUser({
          currentUserRole: user.role,
          userData: formData
        });
        
        if (result.success) {
          toast.success('User created successfully');
          setShowAddUser(false);
          setFormData({
            username: '',
            password: '',
            pin: '',
            full_name: '',
            email: '',
            phone: '',
            role: 'cashier'
          });
          loadUsers();
        } else {
          toast.error(result.error || 'Failed to create user');
        }
      } catch (error) {
        toast.error('Failed to create user');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Add New User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
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
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                {user.role === 'admin' && <option value="admin">Admin</option>}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                required
                minLength="6"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                PIN (4 digits)
              </label>
              <input
                type="text"
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                maxLength="4"
                pattern="[0-9]{4}"
                placeholder="1234"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create User
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setShowAddUser(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  const UsersList = () => (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">System Users</h3>
        <button
          onClick={() => setShowAddUser(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>
      
      {loadingUsers ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Username</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Last Login</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userData) => (
                <tr key={userData.id} className="border-b border-gray-700">
                  <td className="py-3 px-4">{userData.full_name}</td>
                  <td className="py-3 px-4">{userData.username}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      userData.role === 'admin' ? 'bg-red-900 text-red-200' :
                      userData.role === 'manager' ? 'bg-yellow-900 text-yellow-200' :
                      'bg-green-900 text-green-200'
                    }`}>
                      {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      userData.is_active ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                    }`}>
                      {userData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {userData.last_login ? new Date(userData.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingUser(userData)}
                        className="text-blue-400 hover:text-blue-300"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {userData.id !== user.id && (
                        <button
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to ${userData.is_active ? 'deactivate' : 'activate'} this user?`)) {
                              try {
                                const result = await window.api.auth.updateUser({
                                  currentUserRole: user.role,
                                  userId: userData.id,
                                  userData: { is_active: userData.is_active ? 0 : 1 }
                                });
                                
                                if (result.success) {
                                  toast.success(`User ${userData.is_active ? 'deactivated' : 'activated'} successfully`);
                                  loadUsers();
                                } else {
                                  toast.error(result.error || 'Failed to update user status');
                                }
                              } catch (error) {
                                toast.error('Failed to update user status');
                              }
                            }
                          }}
                          className={`${userData.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                          title={userData.is_active ? 'Deactivate User' : 'Activate User'}
                        >
                          {userData.is_active ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Main render logic
  if (editingUser) {
    return (
      <div className="space-y-6">
        <EditUserForm
          userData={editingUser}
          onCancel={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            loadUsers();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showAddUser ? <AddUserForm /> : <UsersList />}
    </div>
  );
};


  const renderReceiptSettings = () => (
  <div className="space-y-6">
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Receipt Configuration</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Receipt Header Message
          </label>
          <div className="flex gap-2">
            <textarea
              value={settings.receipt_header || ''}
              onChange={(e) => setSettings({ ...settings, receipt_header: e.target.value })}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              rows="2"
              placeholder="Welcome to our store!"
            />
            <button
              onClick={() => handleSave('receipt_header', settings.receipt_header)}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Receipt Footer Message
          </label>
          <div className="flex gap-2">
            <textarea
              value={settings.receipt_footer || ''}
              onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              rows="2"
              placeholder="Thank you for your business!"
            />
            <button
              onClick={() => handleSave('receipt_footer', settings.receipt_footer)}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <Receipt className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-white font-medium">Print Receipt Automatically</p>
              <p className="text-gray-400 text-sm">Print receipt after each sale</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.auto_print_receipt === '1'}
              onChange={(e) => handleSave('auto_print_receipt', e.target.checked ? '1' : '0')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-white font-medium">Email Receipts</p>
              <p className="text-gray-400 text-sm">Send receipt via email when available</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_email_receipt === '1'}
              onChange={(e) => handleSave('enable_email_receipt', e.target.checked ? '1' : '0')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>

    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Receipt Preview</h3>
      <div className="bg-white text-black p-4 rounded font-mono text-xs max-w-sm mx-auto">
        <div className="text-center mb-2">
          <p className="font-bold text-sm">{settings.business_name || 'Business Name'}</p>
          <p>{settings.business_address || 'Business Address'}</p>
          <p>{settings.business_phone || 'Phone'} | {settings.business_email || 'Email'}</p>
          <p>Tax No: {settings.tax_number || 'XXX-XXX-XXX'}</p>
        </div>
        <div className="border-t border-dashed border-gray-400 my-2"></div>
        <p className="text-center">{settings.receipt_header || 'Welcome!'}</p>
        <div className="border-t border-dashed border-gray-400 my-2"></div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Sample Product 1</span>
            <span>{settings.currency || 'KES'} 1,000</span>
          </div>
          <div className="flex justify-between">
            <span>Sample Product 2</span>
            <span>{settings.currency || 'KES'} 2,500</span>
          </div>
        </div>
        <div className="border-t border-dashed border-gray-400 my-2"></div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{settings.currency || 'KES'} 3,500</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({settings.tax_rate || '16'}%):</span>
            <span>{settings.currency || 'KES'} {(3500 * (parseFloat(settings.tax_rate || '16') / 100)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>{settings.currency || 'KES'} {(3500 * (1 + parseFloat(settings.tax_rate || '16') / 100)).toFixed(2)}</span>
          </div>
        </div>
        <div className="border-t border-dashed border-gray-400 my-2"></div>
        <p className="text-center">{settings.receipt_footer || 'Thank you!'}</p>
        <p className="text-center mt-2">{new Date().toLocaleString()}</p>
      </div>
    </div>
  </div>
);

  // Previous render functions (keeping the existing ones)
  const renderBusinessSettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Business Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.business_name || ''}
                onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleSave('business_name', settings.business_name)}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tax Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.tax_number || ''}
                onChange={(e) => setSettings({ ...settings, tax_number: e.target.value })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleSave('tax_number', settings.tax_number)}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </div>
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={settings.business_phone || ''}
                onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleSave('business_phone', settings.business_phone)}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={settings.business_email || ''}
                onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleSave('business_email', settings.business_email)}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Business Address
              </div>
            </label>
            <div className="flex gap-2">
              <textarea
                value={settings.business_address || ''}
                onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                rows="3"
              />
              <button
                onClick={() => handleSave('business_address', settings.business_address)}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Password & Security</h3>
        <PasswordChangeForm />
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">Require Password for Returns</p>
                <p className="text-gray-400 text-sm">Staff must enter password for returns</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.require_password_returns === '1'}
                onChange={(e) => handleSave('require_password_returns', e.target.checked ? '1' : '0')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">Auto-lock after Inactivity</p>
                <p className="text-gray-400 text-sm">Lock screen after a period of inactivity</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.auto_lock_inactivity === '1'}
                onChange={(e) => handleSave('auto_lock_inactivity', e.target.checked ? '1' : '0')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            </div>

          {settings.auto_lock_inactivity === '1' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Inactivity Timeout (minutes)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={settings.inactivity_timeout_minutes || '5'}
                  onChange={(e) => setSettings({ ...settings, inactivity_timeout_minutes: e.target.value })}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  min="1"
                />
                <button
                  onClick={() => handleSave('inactivity_timeout_minutes', settings.inactivity_timeout_minutes)}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">Offline Mode Support</p>
                <p className="text-gray-400 text-sm">Allow limited operations without internet</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.offline_mode_support === '1'}
                onChange={(e) => handleSave('offline_mode_support', e.target.checked ? '1' : '0')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTaxSettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Tax Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Default Tax Rate (%)
              </div>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={settings.tax_rate || '16'}
                onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                min="0"
                max="100"
                step="0.01"
              />
              <button
                onClick={() => handleSave('tax_rate', settings.tax_rate)}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Currency
              </div>
            </label>
            <div className="flex gap-2">
              <select
                value={settings.currency || 'KES'}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="TZS">TZS - Tanzanian Shilling</option>
                <option value="UGX">UGX - Ugandan Shilling</option>
              </select>
              <button
                onClick={() => handleSave('currency', settings.currency)}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-white font-medium mb-3">Tax Calculation Preview</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Product Price:</span>
              <span className="text-white">{settings.currency || 'KES'} 1,000.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tax ({settings.tax_rate || '16'}%):</span>
              <span className="text-white">{settings.currency || 'KES'} {(1000 * (parseFloat(settings.tax_rate || '16') / 100)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-600 pt-2">
              <span className="text-gray-400">Total with Tax:</span>
              <span className="text-white font-medium">{settings.currency || 'KES'} {(1000 * (1 + parseFloat(settings.tax_rate || '16') / 100)).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Loyalty Program</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">Enable Loyalty Program</p>
                <p className="text-gray-400 text-sm">Customers earn points on purchases</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_loyalty === '1'}
                onChange={(e) => handleSave('enable_loyalty', e.target.checked ? '1' : '0')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.enable_loyalty === '1' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Points per {settings.currency || 'KES'} 100 spent
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={settings.loyalty_points_rate || '1'}
                  onChange={(e) => setSettings({ ...settings, loyalty_points_rate: e.target.value })}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  min="0"
                  step="1"
                />
                <button
                  onClick={() => handleSave('loyalty_points_rate', settings.loyalty_points_rate)}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderHardwareSettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Receipt Printer</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Receipt Printer
            </label>
            <div className="flex gap-2">
              <select
                value={settings.receipt_printer || ''}
                onChange={(e) => setSettings({ ...settings, receipt_printer: e.target.value })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Printer</option>
                <option value="EPSON TM-T88V">EPSON TM-T88V</option>
                <option value="Star TSP100">Star TSP100</option>
                <option value="Generic POS Printer">Generic POS Printer</option>
              </select>
              <button
                onClick={() => handleSave('receipt_printer', settings.receipt_printer)}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={async () => {
              try {
                const result = await window.api.print.testPrint(settings.receipt_printer);
                if (result.success) {
                  toast.success('Test print sent successfully');
                } else {
                  toast.error(result.message || 'Failed to test printer.');
                }
              } catch (error) {
                console.error('Failed to test printer:', error);
                toast.error('Failed to test printer. Check printer connection.');
              }
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Test Print
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Barcode Scanner</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Scanner Device
            </label>
            <div className="flex gap-2">
              <select
                value={settings.barcode_scanner || ''}
                onChange={(e) => setSettings({ ...settings, barcode_scanner: e.target.value })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Auto-detect (USB HID)</option>
                <option value="Symbol LS2208">Symbol LS2208</option>
                <option value="Honeywell Voyager">Honeywell Voyager</option>
                <option value="Datalogic QD2430">Datalogic QD2430</option>
              </select>
              <button
                onClick={() => handleSave('barcode_scanner', settings.barcode_scanner)}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Cash Drawer</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cash Drawer Connection
            </label>
            <div className="flex gap-2">
              <select
                value={settings.cash_drawer || ''}
                onChange={(e) => setSettings({ ...settings, cash_drawer: e.target.value })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Disabled</option>
                <option value="printer">Via Receipt Printer</option>
                <option value="usb">USB Direct</option>
              </select>
              <button
                onClick={() => handleSave('cash_drawer', settings.cash_drawer)}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={async () => {
              try {
                const result = await window.api.hardware.openCashDrawer();
                if (result.success) {
                  toast.success('Cash drawer opened');
                } else {
                  toast.error(result.message || 'Failed to open cash drawer.');
                }
              } catch (error) {
                console.error('Failed to open cash drawer:', error);
                toast.error('Failed to open cash drawer. Check connection.');
              }
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Test Cash Drawer
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">Sound Notifications</p>
                <p className="text-gray-400 text-sm">Play sounds for events</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_sound === '1'}
                onChange={(e) => handleSave('enable_sound', e.target.checked ? '1' : '0')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">Low Stock Alerts</p>
                <p className="text-gray-400 text-sm">Notify when products are low</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.low_stock_notifications === '1'}
                onChange={(e) => handleSave('low_stock_notifications', e.target.checked ? '1' : '0')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">Daily Sales Summary</p>
                <p className="text-gray-400 text-sm">Show sales summary at day end</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.daily_summary === '1'}
                onChange={(e) => handleSave('daily_summary', e.target.checked ? '1' : '0')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Alert Thresholds</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Low Stock Threshold (default)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={settings.low_stock_alert || '10'}
                onChange={(e) => setSettings({ ...settings, low_stock_alert: e.target.value })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                min="1"
              />
              <button
                onClick={() => handleSave('low_stock_alert', settings.low_stock_alert)}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-700">
            <span className="text-gray-400">Version</span>
            <span className="text-white">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-700">
            <span className="text-gray-400">Database Size</span>
            <span className="text-white">125 MB</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-700">
            <span className="text-gray-400">Total Products</span>
            <span className="text-white">1,234</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-700">
            <span className="text-gray-400">Total Customers</span>
            <span className="text-white">5,678</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-400">Total Sales</span>
            <span className="text-white">45,678</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Display Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">Dark Mode</p>
                <p className="text-gray-400 text-sm">Use dark theme</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dark_mode === '1'}
                onChange={(e) => {
                  handleSave('dark_mode', e.target.checked ? '1' : '0');
                  document.documentElement.classList.toggle('dark', e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">Auto-Update Application</p>
                <p className="text-gray-400 text-sm">Automatically download and install updates</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.auto_update === '1'}
                onChange={(e) => handleSave('auto_update', e.target.checked ? '1' : '0')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">Clear Cache on Exit</p>
                <p className="text-gray-400 text-sm">Clear application cache when closing</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.clear_cache_on_exit === '1'}
                onChange={(e) => handleSave('clear_cache_on_exit', e.target.checked ? '1' : '0')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Data Management</h3>
        <div className="space-y-4">
          <button 
            className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
            onClick={async () => {
              try {
                const result = await window.api.system.clearCache();
                if (result.success) {
                  toast.success('Cache cleared successfully');
                } else {
                  toast.error('Failed to clear cache');
                }
              } catch (error) {
                toast.error('Failed to clear cache');
              }
            }}
          >
            <HardDrive className="w-5 h-5" />
            Clear Cache
          </button>
          
          <button 
            className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
            onClick={async () => {
              try {
                const result = await window.api.system.rebuildIndex();
                if (result.success) {
                  toast.success('Search index rebuilt successfully');
                } else {
                  toast.error('Failed to rebuild search index');
                }
              } catch (error) {
                toast.error('Failed to rebuild search index');
              }
            }}
          >
            <RefreshCw className="w-5 h-5" />
            Rebuild Search Index
          </button>
          
          <button 
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
            onClick={() => {
              if (window.confirm('Are you sure you want to reset to factory settings? This will delete ALL data and cannot be undone!')) {
                if (window.confirm('This is your final warning. ALL DATA WILL BE LOST. Continue?')) {
                  // Handle factory reset
                  toast.error('Factory reset functionality needs to be implemented');
                }
              }
            }}
          >
            <AlertCircle className="w-5 h-5" />
            Reset to Factory Settings
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
          <p className="ml-2 text-gray-400">Loading settings...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'business':
        return renderBusinessSettings();
      case 'receipt':
        return renderReceiptSettings();
      case 'tax':
        return renderTaxSettings();
      case 'hardware':
        return renderHardwareSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'users':
        return user.role === 'admin' ? <UserManagement /> : 
          <div className="text-center text-gray-400 py-8">Access denied. Admin privileges required.</div>;
      case 'backup':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Data Backup & Restore</h3>
              <div className="space-y-4">
                <p className="text-gray-300">
                  Create a backup of your current database or restore from a previously saved backup file.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleBackup}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-600"
                    disabled={saving || loading}
                  >
                    {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                    {saving ? 'Creating Backup...' : 'Create Backup'}
                  </button>
                  <button
                    onClick={handleRestore}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-600"
                    disabled={saving || loading}
                  >
                    {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />}
                    {saving ? 'Restoring Data...' : 'Restore from Backup'}
                  </button>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-400" />
                  <p className="text-yellow-200 text-sm">
                    Restoring data will overwrite your current database. Ensure you have a recent backup!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'system':
        return renderSystemSettings();
      default:
        return <div className="text-gray-400">Select a setting category.</div>;
    }
  };

  // Filter tabs based on user role
  const visibleTabs = tabs.filter(tab => !tab.adminOnly || user.role === 'admin');

  return (
    <div className="flex h-full bg-gray-900 text-white">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-gray-800 p-4 shadow-lg overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-blue-400">Settings</h2>
        <nav>
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-3 p-3 rounded-lg w-full text-left transition-colors duration-200 mb-2
                ${activeTab === tab.id ? 'bg-blue-700 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-md">{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 capitalize text-blue-300">
          {visibleTabs.find(tab => tab.id === activeTab)?.name || 'Settings'}
        </h1>
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

