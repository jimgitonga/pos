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
