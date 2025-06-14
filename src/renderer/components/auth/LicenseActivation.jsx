import React, { useState } from 'react';
import { Key, AlertCircle, CheckCircle, Loader2, Shield, Monitor } from 'lucide-react';

export default function LicenseActivation({ onActivate }) {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [deviceLimit, setDeviceLimit] = useState(null);

  const formatLicenseKey = (value) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Split into groups of 4
    const groups = [];
    for (let i = 0; i < cleaned.length && i < 16; i += 4) {
      groups.push(cleaned.slice(i, i + 4));
    }
    
    return groups.join('-');
  };

  const handleLicenseChange = (e) => {
    const formatted = formatLicenseKey(e.target.value);
    setLicenseKey(formatted);
    setError('');
  };

  const handleActivate = async () => {
    const cleanKey = licenseKey.replace(/-/g, '');
    
    if (cleanKey.length !== 16) {
      setError('Please enter a valid 16-character license key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await onActivate(licenseKey);
      
      if (result.success) {
        setSuccess(true);
        if (result.license) {
          setDeviceLimit(result.license);
        }
        
        // Restart app after successful activation
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setError(result.error || 'Activation failed');
        
        // Show registered devices if device limit exceeded
        if (result.registeredDevices) {
          const devicesList = result.registeredDevices
            .map(d => `${d.hostname} (Last seen: ${new Date(d.lastSeen).toLocaleDateString()})`)
            .join('\n');
          
          setError(`${result.error}\n\nRegistered devices:\n${devicesList}`);
        }
      }
    } catch (error) {
      console.error('Activation error:', error);
      setError('Failed to activate license. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
            <div className="text-center text-white">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">License Activated!</h1>
              <p className="text-green-100">Your POS system is now licensed</p>
            </div>
          </div>
          
          <div className="p-6">
            {deviceLimit && (
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="text-gray-300 font-medium mb-2">License Details:</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-400">
                    Devices: <span className="text-white">{deviceLimit.devicesUsed} / {deviceLimit.maxDevices}</span>
                  </p>
                  {deviceLimit.expiresAt && (
                    <p className="text-gray-400">
                      Expires: <span className="text-white">{new Date(deviceLimit.expiresAt).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-400">Restarting application...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
              <Key className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">License Activation</h1>
            <p className="text-blue-100">Enter your license key to activate</p>
          </div>
        </div>

        {/* Activation Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <span className="text-sm text-red-400 whitespace-pre-line">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                License Key
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={handleLicenseChange}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                maxLength={19}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-center text-lg"
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter the 16-character license key provided with your purchase
              </p>
            </div>

            <button
              onClick={handleActivate}
              disabled={loading || licenseKey.replace(/-/g, '').length !== 16}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Activate License
                </>
              )}
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Monitor className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-300 font-medium">Device Binding</p>
                  <p className="text-xs text-gray-500">
                    This license will be bound to your current device
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-300 font-medium">Secure Activation</p>
                  <p className="text-xs text-gray-500">
                    Your license is validated through our secure servers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-900 px-6 py-4">
          <p className="text-center text-gray-500 text-sm">
            Need help? Contact support@yourcompany.com
          </p>
        </div>
      </div>
    </div>
  );
}











// import React, { useState, useEffect } from 'react';
// import { 
//   Plus, Download, Mail, Copy, CheckCircle, XCircle, 
//   RefreshCw, Key, Users, Calendar, Eye, EyeOff, 
//   Search, Filter, Edit, Trash2, Info, Clock
// } from 'lucide-react';

// export default function LicensePortal() {
//   // State management
//   const [licenses, setLicenses] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [selectedLicense, setSelectedLicense] = useState(null);
//   const [copiedKey, setCopiedKey] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [showKeys, setShowKeys] = useState({});

//   // Form data
//   const [formData, setFormData] = useState({
//     customerName: '',
//     customerEmail: '',
//     customerCompany: '',
//     customerPhone: '',
//     maxDevices: 1,
//     validityDays: 365,
//     price: '',
//     paymentMethod: 'credit_card',
//     notes: ''
//   });

//   // API URL - using your deployed server
//   const API_URL = 'https://licensemanager-mdkj.onrender.com';

//   // Load licenses on component mount
//   useEffect(() => {
//     fetchLicenses();
//   }, []);

//   // Fetch all licenses
//   const fetchLicenses = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch(`${API_URL}/api/admin/licenses`);
//       const data = await response.json();
//       setLicenses(data.licenses || []);
//     } catch (error) {
//       console.error('Error fetching licenses:', error);
//       alert('Failed to fetch licenses. Please check your connection.');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   // Create new license
//   const handleCreateLicense = async () => {
//     if (!formData.customerName || !formData.customerEmail) {
//       alert('Please fill in required fields');
//       return;
//     }

//     setLoading(true);
    
//     let expiresAt = null;
//     if (formData.validityDays > 0) {
//       const expDate = new Date();
//       expDate.setDate(expDate.getDate() + parseInt(formData.validityDays));
//       expiresAt = expDate.toISOString();
//     }

//     try {
//       const response = await fetch(`${API_URL}/api/licenses/create`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           maxDevices: parseInt(formData.maxDevices),
//           expiresAt,
//           customerInfo: {
//             name: formData.customerName,
//             email: formData.customerEmail,
//             company: formData.customerCompany,
//             phone: formData.customerPhone,
//             price: formData.price,
//             paymentMethod: formData.paymentMethod,
//             notes: formData.notes
//           }
//         })
//       });

//       const data = await response.json();
      
//       if (data.success) {
//         copyToClipboard(data.license.key);
//         alert(`License created successfully!\n\nKey: ${data.license.key}\n(Copied to clipboard)`);
        
//         setShowCreateModal(false);
//         resetForm();
//         fetchLicenses();
//       } else {
//         alert('Failed to create license: ' + (data.error || 'Unknown error'));
//       }
//     } catch (error) {
//       console.error('Error creating license:', error);
//       alert('Failed to create license. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Deactivate license
//   const deactivateLicense = async (key) => {
//     if (!window.confirm('Are you sure you want to deactivate this license?')) return;

//     try {
//       const response = await fetch(`${API_URL}/api/admin/licenses/${key}/deactivate`, {
//         method: 'POST'
//       });

//       if (response.ok) {
//         alert('License deactivated successfully');
//         fetchLicenses();
//       } else {
//         alert('Failed to deactivate license');
//       }
//     } catch (error) {
//       console.error('Error deactivating license:', error);
//       alert('Failed to deactivate license');
//     }
//   };

//   // Copy to clipboard
//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(text).then(() => {
//       setCopiedKey(text);
//       setTimeout(() => setCopiedKey(''), 3000);
//     });
//   };

//   // Toggle key visibility
//   const toggleKeyVisibility = (key) => {
//     setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
//   };

//   // Reset form
//   const resetForm = () => {
//     setFormData({
//       customerName: '',
//       customerEmail: '',
//       customerCompany: '',
//       customerPhone: '',
//       maxDevices: 1,
//       validityDays: 365,
//       price: '',
//       paymentMethod: 'credit_card',
//       notes: ''
//     });
//   };

//   // Export to CSV
//   const exportToCSV = () => {
//     const headers = ['License Key', 'Customer', 'Email', 'Company', 'Devices', 'Max Devices', 'Status', 'Created', 'Expires'];
//     const rows = filteredLicenses.map(l => [
//       l.key,
//       l.customerInfo?.name || '',
//       l.customerInfo?.email || '',
//       l.customerInfo?.company || '',
//       l.devices?.length || 0,
//       l.max_devices || 1,
//       l.is_active ? 'Active' : 'Inactive',
//       new Date(l.created_at).toLocaleDateString(),
//       l.expires_at ? new Date(l.expires_at).toLocaleDateString() : 'Never'
//     ]);

//     const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
//     const blob = new Blob([csv], { type: 'text/csv' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `licenses_${new Date().toISOString().split('T')[0]}.csv`;
//     a.click();
//   };

//   // Filter licenses
//   const filteredLicenses = licenses.filter(license => {
//     const matchesSearch = !searchTerm || 
//       license.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       license.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       license.customerInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesFilter = filterStatus === 'all' ||
//       (filterStatus === 'active' && license.is_active) ||
//       (filterStatus === 'inactive' && !license.is_active);

//     return matchesSearch && matchesFilter;
//   });

//   // Calculate stats
//   const stats = {
//     total: licenses.length,
//     active: licenses.filter(l => l.is_active).length,
//     inactive: licenses.filter(l => !l.is_active).length,
//     expired: licenses.filter(l => l.expires_at && new Date(l.expires_at) < new Date()).length
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-800">License Management</h1>
//               <p className="text-gray-600 mt-1">Manage your POS licenses</p>
//             </div>
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={exportToCSV}
//                 className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
//               >
//                 <Download className="w-4 h-4" />
//                 Export
//               </button>
//               <button
//                 onClick={() => setShowCreateModal(true)}
//                 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//               >
//                 <Plus className="w-4 h-4" />
//                 New License
//               </button>
//               <button
//                 onClick={() => { setRefreshing(true); fetchLicenses(); }}
//                 disabled={refreshing}
//                 className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
//               >
//                 <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//           <div className="bg-white rounded-lg shadow p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600">Total</p>
//                 <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
//               </div>
//               <Key className="w-8 h-8 text-blue-500" />
//             </div>
//           </div>
//           <div className="bg-white rounded-lg shadow p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600">Active</p>
//                 <p className="text-2xl font-bold text-green-600">{stats.active}</p>
//               </div>
//               <CheckCircle className="w-8 h-8 text-green-500" />
//             </div>
//           </div>
//           <div className="bg-white rounded-lg shadow p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600">Inactive</p>
//                 <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
//               </div>
//               <XCircle className="w-8 h-8 text-gray-500" />
//             </div>
//           </div>
//           <div className="bg-white rounded-lg shadow p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600">Expired</p>
//                 <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
//               </div>
//               <Clock className="w-8 h-8 text-red-500" />
//             </div>
//           </div>
//         </div>

//         {/* Search and Filter */}
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="flex-1 relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search licenses..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
//               />
//             </div>
//             <select
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//               className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
//             >
//               <option value="all">All Licenses</option>
//               <option value="active">Active Only</option>
//               <option value="inactive">Inactive Only</option>
//             </select>
//           </div>
//         </div>

//         {/* Licenses Table */}
//         <div className="bg-white rounded-lg shadow overflow-hidden">
//           {loading && !refreshing ? (
//             <div className="p-8 text-center">
//               <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
//               <p className="text-gray-600">Loading licenses...</p>
//             </div>
//           ) : filteredLicenses.length === 0 ? (
//             <div className="p-8 text-center">
//               <Key className="w-12 h-12 mx-auto mb-4 text-gray-400" />
//               <p className="text-gray-600 mb-4">No licenses found</p>
//               <button
//                 onClick={() => setShowCreateModal(true)}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//               >
//                 Create First License
//               </button>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50 border-b">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Key</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Devices</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {filteredLicenses.map((license) => (
//                     <tr key={license.key} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center gap-2">
//                           <code className="text-sm font-mono text-gray-800">
//                             {showKeys[license.key] ? license.key : '••••-••••-••••-••••'}
//                           </code>
//                           <button
//                             onClick={() => toggleKeyVisibility(license.key)}
//                             className="p-1 hover:bg-gray-200 rounded text-gray-600"
//                           >
//                             {showKeys[license.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                           </button>
//                           <button
//                             onClick={() => copyToClipboard(license.key)}
//                             className="p-1 hover:bg-gray-200 rounded"
//                           >
//                             <Copy className={`w-4 h-4 ${copiedKey === license.key ? 'text-green-500' : 'text-gray-600'}`} />
//                           </button>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div>
//                           <p className="text-sm font-medium text-gray-900">{license.customerInfo?.name || 'N/A'}</p>
//                           <p className="text-xs text-gray-500">{license.customerInfo?.email || 'N/A'}</p>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <span className={`text-sm ${
//                           (license.devices?.length || 0) >= (license.max_devices || 1) 
//                             ? 'text-orange-600 font-medium' 
//                             : 'text-gray-900'
//                         }`}>
//                           {license.devices?.length || 0} / {license.max_devices || 1}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4">
//                         {license.is_active ? (
//                           <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
//                             <CheckCircle className="w-3 h-3" />
//                             Active
//                           </span>
//                         ) : (
//                           <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
//                             <XCircle className="w-3 h-3" />
//                             Inactive
//                           </span>
//                         )}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-900">
//                         {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="flex items-center gap-2">
//                           <button
//                             onClick={() => {
//                               setSelectedLicense(license);
//                               setShowDetailsModal(true);
//                             }}
//                             className="p-1 hover:bg-gray-200 rounded"
//                             title="View Details"
//                           >
//                             <Info className="w-4 h-4 text-gray-600" />
//                           </button>
//                           {license.is_active && (
//                             <button
//                               onClick={() => deactivateLicense(license.key)}
//                               className="text-red-600 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50"
//                             >
//                               Deactivate
//                             </button>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>

//         {/* Create License Modal */}
//         {showCreateModal && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//               <div className="p-6 border-b">
//                 <h2 className="text-2xl font-bold text-gray-800">Create New License</h2>
//               </div>
              
//               <div className="p-6 space-y-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
//                     <input
//                       type="text"
//                       value={formData.customerName}
//                       onChange={(e) => setFormData({...formData, customerName: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
//                     <input
//                       type="email"
//                       value={formData.customerEmail}
//                       onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
//                     <input
//                       type="text"
//                       value={formData.customerCompany}
//                       onChange={(e) => setFormData({...formData, customerCompany: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
//                     <input
//                       type="tel"
//                       value={formData.customerPhone}
//                       onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Max Devices</label>
//                     <input
//                       type="number"
//                       min="1"
//                       value={formData.maxDevices}
//                       onChange={(e) => setFormData({...formData, maxDevices: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Validity</label>
//                     <select
//                       value={formData.validityDays}
//                       onChange={(e) => setFormData({...formData, validityDays: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
//                     >
//                       <option value="30">30 Days</option>
//                       <option value="90">90 Days</option>
//                       <option value="180">6 Months</option>
//                       <option value="365">1 Year</option>
//                       <option value="730">2 Years</option>
//                       <option value="0">Lifetime</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
//                     <input
//                       type="text"
//                       value={formData.price}
//                       onChange={(e) => setFormData({...formData, price: e.target.value})}
//                       placeholder="e.g., $99"
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
//                     <select
//                       value={formData.paymentMethod}
//                       onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
//                     >
//                       <option value="credit_card">Credit Card</option>
//                       <option value="paypal">PayPal</option>
//                       <option value="bank_transfer">Bank Transfer</option>
//                       <option value="mpesa">M-Pesa</option>
//                       <option value="other">Other</option>
//                     </select>
//                   </div>
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
//                   <textarea
//                     value={formData.notes}
//                     onChange={(e) => setFormData({...formData, notes: e.target.value})}
//                     rows="3"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
//                     placeholder="Any additional notes..."
//                   />
//                 </div>
                
//                 <div className="flex justify-end gap-3 pt-4 border-t">
//                   <button
//                     onClick={() => { setShowCreateModal(false); resetForm(); }}
//                     className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={handleCreateLicense}
//                     disabled={loading || !formData.customerName || !formData.customerEmail}
//                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
//                   >
//                     {loading ? 'Creating...' : 'Create License'}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* License Details Modal */}
//         {showDetailsModal && selectedLicense && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
//               <div className="p-6 border-b">
//                 <h2 className="text-2xl font-bold text-gray-800">License Details</h2>
//               </div>
              
//               <div className="p-6 space-y-6">
//                 {/* Basic License Information */}
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-800 mb-4">License Information</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     <div className="space-y-1">
//                       <p className="text-sm font-medium text-gray-600">License Key</p>
//                       <div className="flex items-center gap-2">
//                         <code className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
//                           {selectedLicense.key}
//                         </code>
//                         <button
//                           onClick={() => copyToClipboard(selectedLicense.key)}
//                           className="p-1 hover:bg-gray-200 rounded"
//                         >
//                           <Copy className="w-4 h-4 text-gray-600" />
//                         </button>
//                       </div>
//                     </div>
//                     <div className="space-y-1">
//                       <p className="text-sm font-medium text-gray-600">Status</p>
//                       <div>
//                         {selectedLicense.is_active ? (
//                           <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
//                             <CheckCircle className="w-3 h-3" />
//                             Active
//                           </span>
//                         ) : (
//                           <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
//                             <XCircle className="w-3 h-3" />
//                             Inactive
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                     <div className="space-y-1">
//                       <p className="text-sm font-medium text-gray-600">Device Usage</p>
//                       <p className="text-sm text-gray-900">
//                         <span className={`font-medium ${
//                           (selectedLicense.devices?.length || 0) >= (selectedLicense.max_devices || 1) 
//                             ? 'text-orange-600' 
//                             : 'text-gray-900'
//                         }`}>
//                           {selectedLicense.devices?.length || 0}
//                         </span>
//                         <span className="text-gray-600"> / {selectedLicense.max_devices || 1} devices</span>
//                       </p>
//                     </div>
//                     <div className="space-y-1">
//                       <p className="text-sm font-medium text-gray-600">Created</p>
//                       <p className="text-sm text-gray-900">
//                         {new Date(selectedLicense.created_at).toLocaleString()}
//                       </p>
//                     </div>
//                     <div className="space-y-1">
//                       <p className="text-sm font-medium text-gray-600">Expires</p>
//                       <p className="text-sm text-gray-900">
//                         {selectedLicense.expires_at ? new Date(selectedLicense.expires_at).toLocaleString() : 'Never'}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Customer Information */}
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     <div className="space-y-1">
//                       <p className="text-sm font-medium text-gray-600">Customer Name</p>
//                       <p className="text-sm text-gray-900">{selectedLicense.customerInfo?.name || 'N/A'}</p>
//                     </div>
//                     <div className="space-y-1">
//                       <p className="text-sm font-medium text-gray-600">Email</p>
//                       <p className="text-sm text-gray-900">{selectedLicense.customerInfo?.email || 'N/A'}</p>
//                     </div>
//                     <div className="space-y-1">
//                       <p className="text-sm font-medium text-gray-600">Company</p>
//                       <p className="text-sm text-gray-900">{selectedLicense.customerInfo?.company || 'N/A'}</p>
//                     </div>
//                     <div className="space-y-1">
//                       <p className="text-sm font-medium text-gray-600">Phone</p>
//                       <p className="text-sm text-gray-900">{selectedLicense.customerInfo?.phone || 'N/A'}</p>
//                     </div>
//                     <div className="space-y-1">
//                       <p className="text-sm font-medium text-gray-600">Price</p>
//                       <p className="text-sm text-gray-900">{selectedLicense.customerInfo?.price || 'N/A'}</p>
//                     </div>
//                     <div className="space-y-1">
//                       <p className="text-sm font-medium text-gray-600">Payment Method</p>
//                       <p className="text-sm text-gray-900 capitalize">
//                         {selectedLicense.customerInfo?.paymentMethod?.replace('_', ' ') || 'N/A'}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Notes Section */}
//                 {selectedLicense.customerInfo?.notes && (
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes</h3>
//                     <div className="bg-gray-50 p-4 rounded-lg">
//                       <p className="text-sm text-gray-900 whitespace-pre-wrap">
//                         {selectedLicense.customerInfo.notes}
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {/* Registered Devices */}
//                 {selectedLicense.devices && selectedLicense.devices.length > 0 && (
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-800 mb-4">
//                       Registered Devices ({selectedLicense.devices.length})
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       {selectedLicense.devices.map((device, idx) => (
//                         <div key={idx} className="bg-gray-50 p-4 rounded-lg border">
//                           <div className="space-y-2">
//                             <div className="flex items-center justify-between">
//                               <p className="font-medium text-gray-900">{device.hostname}</p>
//                               <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
//                                 Device {idx + 1}
//                               </span>
//                             </div>
//                             <div className="space-y-1 text-sm">
//                               <div className="flex justify-between">
//                                 <span className="text-gray-600">Platform:</span>
//                                 <span className="text-gray-900">{device.platform}</span>
//                               </div>
//                               <div className="flex justify-between">
//                                 <span className="text-gray-600">OS Version:</span>
//                                 <span className="text-gray-900">{device.os_version}</span>
//                               </div>
//                               <div className="flex justify-between">
//                                 <span className="text-gray-600">Last Seen:</span>
//                                 <span className="text-gray-900">
//                                   {new Date(device.last_seen).toLocaleString()}
//                                 </span>
//                               </div>
//                               {device.ip_address && (
//                                 <div className="flex justify-between">
//                                   <span className="text-gray-600">IP Address:</span>
//                                   <span className="text-gray-900 font-mono text-xs">
//                                     {device.ip_address}
//                                   </span>
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {/* Empty state for no devices */}
//                 {(!selectedLicense.devices || selectedLicense.devices.length === 0) && (
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-800 mb-4">Registered Devices</h3>
//                     <div className="bg-gray-50 p-8 rounded-lg text-center">
//                       <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
//                       <p className="text-gray-600 mb-2">No devices registered yet</p>
//                       <p className="text-sm text-gray-500">
//                         Devices will appear here once the license is activated and used.
//                       </p>
//                     </div>
//                   </div>
//                 )}
                
//                 {/* Action Buttons */}
//                 <div className="flex justify-between items-center pt-6 border-t">
//                   <div>
//                     {selectedLicense.is_active && (
//                       <button
//                         onClick={() => {
//                           deactivateLicense(selectedLicense.key);
//                           setShowDetailsModal(false);
//                           setSelectedLicense(null);
//                         }}
//                         className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
//                       >
//                         <XCircle className="w-4 h-4" />
//                         Deactivate License
//                       </button>
//                     )}
//                   </div>
//                   <button
//                     onClick={() => { setShowDetailsModal(false); setSelectedLicense(null); }}
//                     className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }