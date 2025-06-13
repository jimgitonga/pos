// // src/renderer/components/auth/LoginScreen.jsx
// import React, { useState } from 'react';
// import { Eye, EyeOff, Lock, User, Hash, AlertCircle, Loader2 } from 'lucide-react';
// import { useAuthStore } from '../../store';

// export default function LoginScreen() {
//   const [loginMode, setLoginMode] = useState('password');
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [pin, setPin] = useState('');
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
  
//   const { login, pinLogin } = useAuthStore();
  
//   // Get recent users from localStorage
//   const [recentUsers] = useState(() => {
//     const stored = localStorage.getItem('recentUsers');
//     return stored ? JSON.parse(stored) : [];
//   });

//   const handlePasswordLogin = async () => {
//     if (!username || !password) {
//       setError('Please enter username and password');
//       return;
//     }

//     setError('');
//     setLoading(true);

//     const success = await login({ username, password });
    
//     if (!success) {
//       setError('Invalid username or password');
//     }
    
//     setLoading(false);
//   };

//   const handlePinLogin = async () => {
//     if (!selectedUser) {
//       setError('Please select a user');
//       return;
//     }

//     if (pin.length !== 4) {
//       setError('PIN must be 4 digits');
//       return;
//     }

//     setError('');
//     setLoading(true);

//     const success = await pinLogin(selectedUser.id, pin);
    
//     if (!success) {
//       setError('Invalid PIN');
//       setPin('');
//     }
    
//     setLoading(false);
//   };

//   const appendPin = (digit) => {
//     if (pin.length < 4) {
//       setPin(pin + digit);
//     }
//   };

//   const clearPin = () => {
//     setPin('');
//     setError('');
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
//       <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center">
//           <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
//             <Lock className="w-10 h-10 text-blue-600" />
//           </div>
//           <h1 className="text-2xl font-bold text-white">Modern POS System</h1>
//           <p className="text-blue-100 mt-2">Secure Authentication</p>
//         </div>

//         {/* Login Mode Toggle */}
//         <div className="flex border-b border-gray-700">
//           <button
//             onClick={() => { 
//               setLoginMode('password'); 
//               setError(''); 
//               setPin('');
//               setSelectedUser(null);
//             }}
//             className={`flex-1 py-3 font-medium transition-colors ${
//               loginMode === 'password' 
//                 ? 'text-blue-400 border-b-2 border-blue-400' 
//                 : 'text-gray-400 hover:text-gray-300'
//             }`}
//           >
//             Password Login
//           </button>
//           <button
//             onClick={() => { 
//               setLoginMode('pin'); 
//               setError(''); 
//               setUsername(''); 
//               setPassword(''); 
//             }}
//             className={`flex-1 py-3 font-medium transition-colors ${
//               loginMode === 'pin' 
//                 ? 'text-blue-400 border-b-2 border-blue-400' 
//                 : 'text-gray-400 hover:text-gray-300'
//             }`}
//           >
//             Quick PIN Access
//           </button>
//         </div>

//         {/* Login Forms */}
//         <div className="p-6">
//           {error && (
//             <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
//               <AlertCircle className="w-4 h-4 flex-shrink-0" />
//               <span className="text-sm">{error}</span>
//             </div>
//           )}

//           {loginMode === 'password' ? (
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   Username or Email
//                 </label>
//                 <div className="relative">
//                   <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
//                   <input
//                     type="text"
//                     value={username}
//                     onChange={(e) => setUsername(e.target.value)}
//                     onKeyPress={(e) => e.key === 'Enter' && handlePasswordLogin()}
//                     className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                     placeholder="Enter username or email"
//                     disabled={loading}
//                     autoFocus
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-2">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
//                   <input
//                     type={showPassword ? 'text' : 'password'}
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     onKeyPress={(e) => e.key === 'Enter' && handlePasswordLogin()}
//                     className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                     placeholder="Enter password"
//                     disabled={loading}
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
//                   >
//                     {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                   </button>
//                 </div>
//               </div>

//               <button
//                 onClick={handlePasswordLogin}
//                 disabled={loading}
//                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {loading ? (
//                   <>
//                     <Loader2 className="w-5 h-5 animate-spin" />
//                     Logging in...
//                   </>
//                 ) : (
//                   'Login'
//                 )}
//               </button>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {/* Recent Users */}
//               {recentUsers.length > 0 ? (
//                 <div className="space-y-2">
//                   <p className="text-sm text-gray-400 mb-3">Select user:</p>
//                   {recentUsers.map((user) => (
//                     <button
//                       key={user.id}
//                       onClick={() => setSelectedUser(user)}
//                       className={`w-full p-3 rounded-lg flex items-center justify-between transition-all ${
//                         selectedUser?.id === user.id 
//                           ? 'bg-blue-600 hover:bg-blue-700' 
//                           : 'bg-gray-700 hover:bg-gray-600'
//                       }`}
//                     >
//                       <div className="flex items-center gap-3">
//                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
//                           selectedUser?.id === user.id ? 'bg-blue-700' : 'bg-gray-600'
//                         }`}>
//                           <User className="w-5 h-5 text-gray-300" />
//                         </div>
//                         <div className="text-left">
//                           <p className="text-white font-medium">{user.full_name}</p>
//                           <p className={`text-sm ${selectedUser?.id === user.id ? 'text-blue-200' : 'text-gray-400'}`}>
//                             {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
//                           </p>
//                         </div>
//                       </div>
//                       <Hash className={`w-5 h-5 ${selectedUser?.id === user.id ? 'text-blue-200' : 'text-gray-400'}`} />
//                     </button>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-8 text-gray-400">
//                   <p>No recent users</p>
//                   <p className="text-sm mt-2">Login with password first</p>
//                 </div>
//               )}

//               {/* PIN Pad */}
//               {selectedUser && (
//                 <div className="mt-6">
//                   <p className="text-center text-gray-400 text-sm mb-3">
//                     Enter PIN for {selectedUser.full_name}
//                   </p>
//                   <div className="bg-gray-700 rounded-lg p-4 mb-4">
//                     <div className="flex justify-center gap-2">
//                       {[0, 1, 2, 3].map((i) => (
//                         <div
//                           key={i}
//                           className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
//                             pin.length > i ? 'bg-blue-600 scale-110' : 'bg-gray-600'
//                           }`}
//                         >
//                           {pin.length > i && <span className="text-white text-xl">•</span>}
//                         </div>
//                       ))}
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-3 gap-3">
//                     {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
//                       <button
//                         key={num}
//                         onClick={() => appendPin(num.toString())}
//                         className="bg-gray-700 hover:bg-gray-600 active:scale-95 text-white text-xl font-medium py-4 rounded-lg transition-all"
//                         disabled={loading}
//                       >
//                         {num}
//                       </button>
//                     ))}
//                     <button
//                       onClick={clearPin}
//                       className="bg-red-900/30 hover:bg-red-900/50 text-red-400 py-4 rounded-lg transition-all"
//                       disabled={loading}
//                     >
//                       Clear
//                     </button>
//                     <button
//                       onClick={() => appendPin('0')}
//                       className="bg-gray-700 hover:bg-gray-600 active:scale-95 text-white text-xl font-medium py-4 rounded-lg transition-all"
//                       disabled={loading}
//                     >
//                       0
//                     </button>
//                     <button
//                       onClick={handlePinLogin}
//                       className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//                       disabled={pin.length !== 4 || loading}
//                     >
//                       {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enter'}
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="bg-gray-900 px-6 py-4 text-center">
//           <p className="text-gray-500 text-sm">
//             {loginMode === 'password' 
//               ? 'Default credentials: admin / admin123' 
//               : 'Default PIN: 1234'}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }


// src/renderer/components/auth/LoginScreen.jsx
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, Hash, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store';

export default function LoginScreen() {
  const [loginMode, setLoginMode] = useState('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const { login, pinLogin } = useAuthStore();

  // Load recent users from database when component mounts
  useEffect(() => {
    loadRecentUsers();
  }, []);

  const loadRecentUsers = async () => {
    setLoadingUsers(true);
    try {
      // Get users who have logged in recently (have PIN set)
      const result = await window.api.auth.getUsers({ role: 'admin' }); // This will get all users
      if (result.success) {
        // Filter users who have recent login and are active
        const filteredUsers = result.users
          .filter(user => user.is_active && user.last_login)
          .sort((a, b) => new Date(b.last_login) - new Date(a.last_login))
          .slice(0, 5); // Show last 5 users
        
        setRecentUsers(filteredUsers);
        
        // Store in localStorage for offline access
        localStorage.setItem('recentUsers', JSON.stringify(filteredUsers));
      }
    } catch (error) {
      console.error('Failed to load recent users:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('recentUsers');
      if (stored) {
        setRecentUsers(JSON.parse(stored));
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const success = await login({ username, password });
      
      if (success) {
        // Update recent users list
        loadRecentUsers();
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinLogin = async () => {
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const success = await pinLogin(selectedUser.id, pin);
      
      if (!success) {
        setError('Invalid PIN');
        setPin('');
      }
    } catch (error) {
      console.error('PIN login error:', error);
      setError('Connection error. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const appendPin = (digit) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const clearPin = () => {
    setPin('');
    setError('');
  };

  const deletePin = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  // Auto-submit PIN when 4 digits are entered
  useEffect(() => {
    if (pin.length === 4 && selectedUser && !loading) {
      handlePinLogin();
    }
  }, [pin, selectedUser, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <Lock className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">Modern POS System</h1>
          <p className="text-blue-100 mt-2">Secure Authentication</p>
        </div>

        {/* Login Mode Toggle */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => { 
              setLoginMode('password'); 
              setError(''); 
              setPin('');
              setSelectedUser(null);
            }}
            className={`flex-1 py-3 font-medium transition-colors ${
              loginMode === 'password' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Password Login
          </button>
          <button
            onClick={() => { 
              setLoginMode('pin'); 
              setError(''); 
              setUsername(''); 
              setPassword(''); 
            }}
            className={`flex-1 py-3 font-medium transition-colors ${
              loginMode === 'pin' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Quick PIN Access
          </button>
        </div>

        {/* Login Forms */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {loginMode === 'password' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordLogin()}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter username or email"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordLogin()}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handlePasswordLogin}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Recent Users */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400">Select user:</p>
                <button
                  onClick={loadRecentUsers}
                  disabled={loadingUsers}
                  className="text-blue-400 hover:text-blue-300 p-1"
                  title="Refresh user list"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingUsers ? (
                <div className="text-center py-8 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p>Loading users...</p>
                </div>
              ) : recentUsers.length > 0 ? (
                <div className="space-y-2">
                  {recentUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setPin('');
                        setError('');
                      }}
                      className={`w-full p-3 rounded-lg flex items-center justify-between transition-all ${
                        selectedUser?.id === user.id 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedUser?.id === user.id ? 'bg-blue-700' : 'bg-gray-600'
                        }`}>
                          <User className="w-5 h-5 text-gray-300" />
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{user.full_name}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${selectedUser?.id === user.id ? 'text-blue-200' : 'text-gray-400'}`}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                            {user.last_login && (
                              <span className={`text-xs ${selectedUser?.id === user.id ? 'text-blue-300' : 'text-gray-500'}`}>
                                Last: {new Date(user.last_login).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Hash className={`w-5 h-5 ${selectedUser?.id === user.id ? 'text-blue-200' : 'text-gray-400'}`} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="font-medium">No recent users</p>
                  <p className="text-sm mt-2">Login with password first to enable PIN access</p>
                </div>
              )}

              {/* PIN Pad */}
              {selectedUser && (
                <div className="mt-6">
                  <p className="text-center text-gray-400 text-sm mb-3">
                    Enter PIN for <span className="text-white font-medium">{selectedUser.full_name}</span>
                  </p>
                  
                  {/* PIN Display */}
                  <div className="bg-gray-700 rounded-lg p-4 mb-4">
                    <div className="flex justify-center gap-2">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                            pin.length > i ? 'bg-blue-600 scale-110' : 'bg-gray-600'
                          }`}
                        >
                          {pin.length > i && <span className="text-white text-xl">•</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Number Pad */}
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => appendPin(num.toString())}
                        className="bg-gray-700 hover:bg-gray-600 active:scale-95 text-white text-xl font-medium py-4 rounded-lg transition-all"
                        disabled={loading || pin.length >= 4}
                      >
                        {num}
                      </button>
                    ))}
                    
                    {/* Clear Button */}
                    <button
                      onClick={clearPin}
                      className="bg-red-900/30 hover:bg-red-900/50 text-red-400 py-4 rounded-lg transition-all text-sm font-medium"
                      disabled={loading}
                    >
                      Clear
                    </button>
                    
                    {/* Zero Button */}
                    <button
                      onClick={() => appendPin('0')}
                      className="bg-gray-700 hover:bg-gray-600 active:scale-95 text-white text-xl font-medium py-4 rounded-lg transition-all"
                      disabled={loading || pin.length >= 4}
                    >
                      0
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={deletePin}
                      className="bg-orange-900/30 hover:bg-orange-900/50 text-orange-400 py-4 rounded-lg transition-all text-sm font-medium"
                      disabled={loading || pin.length === 0}
                    >
                      ←
                    </button>
                  </div>
                  
                  {/* Login Button */}
                  <button
                    onClick={handlePinLogin}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={pin.length !== 4 || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Login with PIN
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-900 px-6 py-4">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              {loginMode === 'password' 
                ? 'Default admin credentials: admin / admin123' 
                : selectedUser
                  ? 'Enter your 4-digit PIN'
                  : 'Select a user to continue with PIN'}
            </p>
            {loginMode === 'password' && (
              <p className="text-gray-600 text-xs mt-1">
                After login, you can set up a PIN for quick access
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}