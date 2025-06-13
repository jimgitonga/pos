import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

// Auth Store
export const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        sessionToken: null,
        isAuthenticated: false,
        recentUsers: [],
        
        login: async (credentials) => {
          try {
            const result = await window.api.auth.login(credentials);
            if (result.success) {
              set({
                user: result.user,
                sessionToken: result.sessionToken,
                isAuthenticated: true
              });
              
              // Add to recent users if not already there
              get().addToRecentUsers(result.user);
              
              toast.success(`Welcome back, ${result.user.full_name}!`);
              return true;
            } else {
              toast.error(result.error || 'Login failed');
              return false;
            }
          } catch (error) {
            console.error('Login error:', error);
            toast.error('Connection error');
            return false;
          }
        },
        
        pinLogin: async (userId, pin) => {
          try {
            const result = await window.api.auth.pinLogin({ userId, pin });
            if (result.success) {
              set({
                user: result.user,
                sessionToken: result.sessionToken,
                isAuthenticated: true
              });
              
              // Update recent users
              get().addToRecentUsers(result.user);
              
              toast.success(`Welcome back, ${result.user.full_name}!`);
              return true;
            } else {
              toast.error(result.error || 'Invalid PIN');
              return false;
            }
          } catch (error) {
            console.error('PIN login error:', error);
            toast.error('Connection error');
            return false;
          }
        },
        
        logout: async () => {
          const { sessionToken, user } = get();
          try {
            if (sessionToken && user?.id) {
              await window.api.auth.logout({ sessionToken, userId: user.id });
            }
          } catch (error) {
            console.error('Logout error:', error);
          }
          set({
            user: null,
            sessionToken: null,
            isAuthenticated: false
          });
          toast.success('Logged out successfully');
        },
        
        verifySession: async () => {
          const { sessionToken } = get();
          if (!sessionToken) return false;
          
          try {
            const result = await window.api.auth.verifySession({ sessionToken });
            if (result.success) {
              set({ 
                user: result.user, 
                isAuthenticated: true 
              });
              return true;
            } else {
              set({
                user: null,
                sessionToken: null,
                isAuthenticated: false
              });
              return false;
            }
          } catch (error) {
            console.error('Session verification error:', error);
            return false;
          }
        },
        
        addToRecentUsers: (user) => {
          const { recentUsers } = get();
          const existingIndex = recentUsers.findIndex(u => u.id === user.id);
          
          let newRecentUsers;
          if (existingIndex !== -1) {
            // Move existing user to front
            newRecentUsers = [
              { ...user, last_login: new Date().toISOString() },
              ...recentUsers.filter(u => u.id !== user.id)
            ];
          } else {
            // Add new user to front
            newRecentUsers = [
              { ...user, last_login: new Date().toISOString() },
              ...recentUsers.slice(0, 4) // Keep only 5 recent users
            ];
          }
          
          set({ recentUsers: newRecentUsers });
          
          // Also store in localStorage for offline access
          localStorage.setItem('recentUsers', JSON.stringify(newRecentUsers));
        },
        
        loadRecentUsers: async () => {
          try {
            // Try to get from API first
            const result = await window.api.auth.getUsers({ role: 'admin' });
            if (result.success) {
              const filteredUsers = result.users
                .filter(user => user.is_active && user.last_login)
                .sort((a, b) => new Date(b.last_login) - new Date(a.last_login))
                .slice(0, 5);
              
              set({ recentUsers: filteredUsers });
              localStorage.setItem('recentUsers', JSON.stringify(filteredUsers));
              return filteredUsers;
            }
          } catch (error) {
            console.error('Failed to load recent users from API:', error);
          }
          
          // Fallback to localStorage
          try {
            const stored = localStorage.getItem('recentUsers');
            if (stored) {
              const users = JSON.parse(stored);
              set({ recentUsers: users });
              return users;
            }
          } catch (error) {
            console.error('Failed to load recent users from localStorage:', error);
          }
          
          return [];
        },
        
        changePassword: async (currentPassword, newPassword) => {
          const { user } = get();
          if (!user) {
            toast.error('Not authenticated');
            return false;
          }
          
          try {
            const result = await window.api.auth.changePassword({
              userId: user.id,
              currentPassword,
              newPassword
            });
            
            if (result.success) {
              toast.success('Password changed successfully');
              return true;
            } else {
              toast.error(result.error || 'Failed to change password');
              return false;
            }
          } catch (error) {
            console.error('Change password error:', error);
            toast.error('Connection error');
            return false;
          }
        },
        
        setPin: async (pin) => {
          const { user } = get();
          if (!user) {
            toast.error('Not authenticated');
            return false;
          }
          
          try {
            const result = await window.api.auth.setPin({
              userId: user.id,
              pin
            });
            
            if (result.success) {
              toast.success('PIN set successfully');
              return true;
            } else {
              toast.error(result.error || 'Failed to set PIN');
              return false;
            }
          } catch (error) {
            console.error('Set PIN error:', error);
            toast.error('Connection error');
            return false;
          }
        }
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          sessionToken: state.sessionToken,
          recentUsers: state.recentUsers
        })
      }
    )
  )
);

// Cart Store
export const useCartStore = create(
  devtools((set, get) => ({
    items: [],
    customer: null,
    discountAmount: 0,
    notes: '',
    
    addItem: (product) => {
      const items = get().items;
      const existingItem = items.find(item => item.id === product.id);
      
      if (existingItem) {
        set({
          items: items.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        });
      } else {
        set({
          items: [...items, { ...product, quantity: 1 }]
        });
      }
      toast.success(`${product.name} added to cart`);
    },
    
    updateQuantity: (productId, quantity) => {
      if (quantity <= 0) {
        set({
          items: get().items.filter(item => item.id !== productId)
        });
      } else {
        set({
          items: get().items.map(item =>
            item.id === productId
              ? { ...item, quantity }
              : item
          )
        });
      }
    },
    
    removeItem: (productId) => {
      const item = get().items.find(i => i.id === productId);
      set({
        items: get().items.filter(item => item.id !== productId)
      });
      if (item) {
        toast.success(`${item.name} removed from cart`);
      }
    },
    
    setCustomer: (customer) => {
      set({ customer });
      if (customer) {
        toast.success(`Customer: ${customer.first_name} ${customer.last_name}`);
      }
    },
    
    setDiscount: (amount) => {
      set({ discountAmount: amount });
    },
    
    setNotes: (notes) => {
      set({ notes });
    },
    
    clearCart: () => {
      set({
        items: [],
        customer: null,
        discountAmount: 0,
        notes: ''
      });
    },
    
    getSubtotal: () => {
      return get().items.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
    },
    
    getTaxAmount: () => {
      return get().items.reduce((total, item) => {
        const itemTotal = item.unit_price * item.quantity;
        return total + (itemTotal * (item.tax_rate || 16) / 100);
      }, 0);
    },
    
    getTotal: () => {
      const subtotal = get().getSubtotal();
      const tax = get().getTaxAmount();
      const discount = get().discountAmount;
      return subtotal + tax - discount;
    }
  }))
);

// Products Store
export const useProductsStore = create(
  devtools((set, get) => ({
    products: [],
    categories: [],
    loading: false,
    filters: {
      search: '',
      category_id: null,
      is_active: true
    },
    
    fetchProducts: async () => {
      set({ loading: true });
      try {
        const result = await window.api.products.getAll(get().filters);
        if (result.success) {
          set({ products: result.products });
        } else {
          toast.error('Failed to load products');
        }
      } catch (error) {
        toast.error('Connection error');
      } finally {
        set({ loading: false });
      }
    },
    
    fetchCategories: async () => {
      try {
        const result = await window.api.categories.getAll();
        if (result.success) {
          set({ categories: result.categories });
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    },
    
    searchProducts: async (query) => {
      try {
        const result = await window.api.products.search(query);
        if (result.success) {
          return result.products;
        }
        return [];
      } catch (error) {
        console.error('Search error:', error);
        return [];
      }
    },
    
    setFilter: (key, value) => {
      set({
        filters: {
          ...get().filters,
          [key]: value
        }
      });
    },
    
    createProduct: async (productData) => {
      try {
        const result = await window.api.products.create(productData);
        if (result.success) {
          toast.success('Product created successfully');
          await get().fetchProducts();
          return true;
        } else {
          toast.error(result.error || 'Failed to create product');
          return false;
        }
      } catch (error) {
        toast.error('Connection error');
        return false;
      }
    },
    
    updateProduct: async (id, updates) => {
      try {
        const result = await window.api.products.update(id, updates);
        if (result.success) {
          toast.success('Product updated successfully');
          await get().fetchProducts();
          return true;
        } else {
          toast.error(result.error || 'Failed to update product');
          return false;
        }
      } catch (error) {
        toast.error('Connection error');
        return false;
      }
    }
  }))
);

// Sales Store
export const useSalesStore = create(
  devtools((set, get) => ({
    recentSales: [],
    dailySummary: null,
    loading: false,
    
    fetchRecentSales: async (limit = 20) => {
      set({ loading: true });
      try {
        const result = await window.api.sales.getRecent(limit);
        if (result.success) {
          set({ recentSales: result.sales });
        }
      } catch (error) {
        console.error('Failed to load sales:', error);
      } finally {
        set({ loading: false });
      }
    },
    
    fetchDailySummary: async (date = new Date().toISOString().split('T')[0]) => {
      try {
        const result = await window.api.sales.getDailySummary(date);
        if (result.success) {
          set({ dailySummary: result });
        }
      } catch (error) {
        console.error('Failed to load daily summary:', error);
      }
    },
    
    createSale: async (saleData) => {
      try {
        const result = await window.api.sales.create(saleData);
        console.log("STORE_RESULT ",saleData);
        if (result.success) {
          toast.success('Sale completed successfully!');
          // Refresh data
          get().fetchRecentSales();
          get().fetchDailySummary();
          return result.sale;
        } else {
          toast.error(result.error || 'Failed to complete sale');
          return null;
        }
      } catch (error) {
        toast.error('Connection error');
        return null;
      }
    },
    
    voidSale: async (id, reason) => {
      try {
        const result = await window.api.sales.void({ id, reason });
        if (result.success) {
          toast.success('Sale voided successfully');
          get().fetchRecentSales();
          return true;
        } else {
          toast.error(result.error || 'Failed to void sale');
          return false;
        }
      } catch (error) {
        toast.error('Connection error');
        return false;
      }
    }
  }))
);

// Settings Store
export const useSettingsStore = create(
  devtools(
    persist(
      (set, get) => ({
        theme: 'dark',
        soundEnabled: true,
        settings: {},
        
        loadSettings: async () => {
          try {
            const result = await window.api.settings.getAll();
            if (result.success) {
              set({ settings: result.settings });
            }
          } catch (error) {
            console.error('Failed to load settings:', error);
          }
        },
        
        updateSetting: async (key, value) => {
          try {
            const result = await window.api.settings.update(key, value);
            if (result.success) {
              set({
                settings: {
                  ...get().settings,
                  [key]: value
                }
              });
              toast.success('Setting updated');
              return true;
            }
            return false;
          } catch (error) {
            toast.error('Failed to update setting');
            return false;
          }
        },
        
        toggleSound: () => {
          set({ soundEnabled: !get().soundEnabled });
        },
        
        playSound: (type = 'success') => {
          if (!get().soundEnabled) return;
          
          // In production, implement actual sound playing
          console.log(`Playing ${type} sound`);
        }
      }),
      {
        name: 'settings-storage',
        partialize: (state) => ({
          theme: state.theme,
          soundEnabled: state.soundEnabled
        })
      }
    )
  )
);