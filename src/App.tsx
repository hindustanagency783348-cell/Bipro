import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useSupabaseAuth } from './lib/useSupabaseAuth';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layout, 
  ShoppingBag, 
  Package, 
  Bell, 
  User, 
  LogOut,
  ShoppingCart,
  Menu,
  X,
  Users,
  Tag,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Heart,
  MessageCircle
} from 'lucide-react';
import Lottie from 'lottie-react';
import callingAnimation from './assets/calling-animation.json';

import LoginView from './views/LoginView';
import DealerDashboard from './views/DealerDashboard';
import InventoryView from './views/InventoryView';
import OffersView from './views/OffersView';
import CustomerShop from './views/CustomerShop';
import CartView from './views/CartView';
import LedgerView from './views/LedgerView';
import CategoryView from './views/CategoryView';
import ProductDetailView from './views/ProductDetailView';
import OrderHistoryView from './views/OrderHistoryView';
import { CartProvider, useCart } from './lib/CartContext';

function AppContent() {
  const { user, loading } = useSupabaseAuth();
  const [userRole, setUserRole] = useState<'dealer' | 'customer' | null>(null);
  const [username, setUsername] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { items: cartItems } = useCart();

  useEffect(() => {
    async function fetchData() {
      if (user) {
        setRoleLoading(true);
        
        // Check for profile
        let { data, error } = await supabase
          .from('profiles')
          .select('role, username') // Reduced to core columns for stability
          .eq('id', user.id)
          .maybeSingle(); // Better for handling missing profiles
        
        // If profile doesn't exist, create it from pending metadata
        if (!data) {
          const pendingRole = localStorage.getItem('pending_profile_role') || 'customer';
          const pendingFullName = localStorage.getItem('pending_profile_fullName');
          const pendingShopName = localStorage.getItem('pending_profile_shopName');
          const pendingPhoneNumber = localStorage.getItem('pending_profile_phoneNumber');
          const pendingIdentity = localStorage.getItem('pending_profile_identity') || user.email;
          
          const newProfile: any = {
            id: user.id,
            email: user.email,
            username: pendingIdentity,
            role: pendingRole,
            active: true,
            created_at: new Date().toISOString()
          };

          // Conditionally add other fields to avoid schema errors
          if (pendingShopName) newProfile.shop_name = pendingShopName;
          if (pendingPhoneNumber) newProfile.phone_number = pendingPhoneNumber;
          
          // NOTE: We assume the column is 'name', but the app was trying 'full_name'
          // We'll try 'name' first as it's the standard for this app's UI
          newProfile.name = pendingFullName || user.user_metadata?.full_name || 'System_User';

          const { data: created, error: createError } = await supabase
            .from('profiles')
            .upsert(newProfile)
            .select()
            .maybeSingle();

          if (createError) {
            console.error("PRFL_INIT_FAULT:", createError);
            // Fallback for UI if persistent storage fails
            data = { role: pendingRole, username: pendingIdentity };
          } else {
            data = created;
          }
          
          // Clear pending items
          localStorage.removeItem('pending_profile_role');
          localStorage.removeItem('pending_profile_identity');
          localStorage.removeItem('pending_profile_fullName');
          localStorage.removeItem('pending_profile_shopName');
          localStorage.removeItem('pending_profile_phoneNumber');
        }

        if (data) {
          setUserRole(data.role as 'dealer' | 'customer');
          setUsername(data.username || (data as any).name || 'System_User');
        }
        setRoleLoading(false);
      } else {
        setUserRole(null);
        setUsername('');
      }
    }
    fetchData();
  }, [user]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 brutalist-grid opacity-20" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-12"
        >
          <div className="w-32 h-32 bg-white flex items-center justify-center p-6 shadow-[0_0_50px_rgba(255,62,0,0.3)]">
             <ShoppingBag className="w-full h-full text-black" />
          </div>
          <div className="flex flex-col items-center gap-4">
             <div className="text-4xl font-black tracking-tighter text-white">BRS<span className="text-white/40">ENTERPRISE</span></div>
             <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-[#FF3E00] border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#FF3E00] animate-pulse">Establishing_Secure_Link</span>
             </div>
          </div>
        </motion.div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest text-white/10 uppercase">
           Powered by Bipro • Secure Core v4.0.1
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const dealerNav = [
    { name: 'Dashboard', path: '/', icon: <ShoppingBag className="w-4 h-4" /> },
    { name: 'Inventory', path: '/inventory', icon: <Package className="w-4 h-4" /> },
    { name: 'Categories', path: '/categories', icon: <Tag className="w-4 h-4" /> },
    { name: 'Ledger', path: '/ledger', icon: <Users className="w-4 h-4" /> },
    { name: 'Offers', path: '/offers', icon: <Bell className="w-4 h-4" /> },
  ];

  const customerNav = [
    { name: 'Shop_Market', path: '/', icon: <ShoppingBag className="w-4 h-4" /> },
    { name: 'Order_History', path: '/history', icon: <Clock className="w-4 h-4" /> },
    { name: 'My_Cart', path: '/cart', icon: <ShoppingCart className="w-4 h-4" /> },
  ];

  const navItems = userRole === 'dealer' ? dealerNav : customerNav;
  const CONTACT_NUMBER = '6001206460';

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] font-sans selection:bg-[#FF3E00]/30 selection:text-[#FF3E00] brutalist-grid border-[12px] border-[#111]">
      <nav className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-white/10 px-4 md:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden sm:flex flex-col items-end border-r border-white/10 pr-6">
            <span className="text-[10px] font-black text-[#FF3E00] uppercase tracking-[0.4em] leading-none mb-1">Partner</span>
            <span className="text-[14px] font-black text-white/40 uppercase tracking-[0.2em] italic leading-none">Voltas</span>
          </div>
          <div className="flex flex-col">
            <div className="text-[10px] uppercase tracking-[0.4em] font-black text-white/20 mb-1">
              {userRole === 'dealer' ? 'Dealer_Executive' : 'Platform_Client'}
            </div>
            <Link to="/" className="text-xl md:text-2xl font-black tracking-[-0.04em] flex items-center gap-1">
              BRS<span className="text-white/40">ENTERPRISE</span>
            </Link>
          </div>
        </div>

        {/* Contact Quick Actions (Always Visible) */}
        <div className="flex items-center gap-3 md:gap-4 ml-auto mr-4 lg:mr-0">
          <div className="flex flex-col items-center">
            <motion.a 
              href={`tel:${CONTACT_NUMBER}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[#FF3E00] rounded-full overflow-hidden transition-colors shadow-lg shadow-[#FF3E00]/20 group"
              title="Call Support"
            >
              <div className="w-full h-full scale-150">
                <Lottie animationData={callingAnimation} loop={true} />
              </div>
            </motion.a>
            <span className="text-[8px] font-black uppercase tracking-widest text-[#FF3E00] mt-1">call me</span>
          </div>
          <motion.a 
            href={`https://wa.me/91${CONTACT_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-[#25D366] text-white rounded-full border-2 border-transparent hover:border-white transition-colors shadow-lg shadow-[#25D366]/10 group"
            title="WhatsApp Support"
          >
            <MessageCircle className="w-4 h-4 md:w-4.5 md:h-4.5" />
          </motion.a>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center space-x-12">
          <div className="flex items-center space-x-8 text-[11px] uppercase tracking-widest font-black">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`transition-all hover:text-[#FF3E00] flex items-center gap-3 ${location.pathname === item.path ? 'text-[#FF3E00]' : 'text-white/40'}`}
              >
                {item.icon}
                {item.name}
                {item.name === 'My_Cart' && cartItems.length > 0 && (
                  <span className="bg-[#FF3E00] text-black px-1.5 py-0.5 text-[8px] font-black">{cartItems.length}</span>
                )}
              </Link>
            ))}
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">{username}</span>
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">Verified_ID</span>
            </div>
            
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="w-12 h-12 flex items-center justify-center border border-white/10 hover:border-[#FF3E00] hover:text-[#FF3E00] transition-all group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        <button 
          className="lg:hidden text-white p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-x-0 top-[88px] bg-[#0A0A0A] z-40 p-6 border-b border-white/10 flex flex-col gap-6 shadow-2xl"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-xs uppercase tracking-[0.3em] font-black flex items-center gap-4 ${location.pathname === item.path ? 'text-[#FF3E00]' : 'text-white/40'}`}
              >
                {item.icon}
                {item.name}
                {item.name === 'My_Cart' && cartItems.length > 0 && (
                  <span className="bg-[#FF3E00] text-black px-1.5 py-0.5 text-[8px] font-black">{cartItems.length}</span>
                )}
              </Link>
            ))}
            <button 
              onClick={() => supabase.auth.signOut()}
              className="mt-4 text-xs uppercase tracking-[0.3em] font-black text-white/20 flex items-center gap-4"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-24 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Routes>
              {userRole === 'dealer' ? (
                <>
                  <Route path="/" element={<DealerDashboard />} />
                  <Route path="/inventory" element={<InventoryView />} />
                  <Route path="/categories" element={<CategoryView />} />
                  <Route path="/ledger" element={<LedgerView />} />
                  <Route path="/offers" element={<OffersView />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<CustomerShop />} />
                  <Route path="/cart" element={<CartView />} />
                  <Route path="/history" element={<OrderHistoryView />} />
                  <Route path="/product/:productId" element={<ProductDetailView />} />
                </>
              )}
            </Routes>
          </motion.div>
        </AnimatePresence>

        {/* Global Logout Modal */}
        <AnimatePresence>
          {showLogoutModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setShowLogoutModal(false)}
                 className="absolute inset-0 bg-[#050505]/95 backdrop-blur-sm"
               ></motion.div>
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="bg-[#111] border border-white/10 p-12 max-w-md w-full relative z-10 space-y-12 shadow-2xl"
               >
                  <div className="space-y-6 text-center">
                    <div className="flex justify-center">
                       <div className="w-20 h-20 bg-[#FF3E00]/10 flex items-center justify-center border border-[#FF3E00]/30">
                          <AlertTriangle className="w-10 h-10 text-[#FF3E00]" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-3xl font-black uppercase tracking-tighter">Terminate_Session?</h3>
                       <p className="text-[10px] uppercase tracking-widest text-white/40 leading-relaxed font-bold">You are about to disconnect from the BRS ENTERPRISE secure core. All active data streams will be closed.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <button 
                       onClick={() => setShowLogoutModal(false)}
                       className="border border-white/10 py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all"
                     >
                       Stay_Connected
                     </button>
                     <button 
                        onClick={() => supabase.auth.signOut()}
                        className="bg-[#FF3E00] text-black py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl shadow-[#FF3E00]/20"
                     >
                       Confirm_Logout
                     </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-white/10 px-6 py-24 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center">
           <div className="flex flex-col items-center gap-4">
              <div className="text-[14px] font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] text-white flex flex-wrap items-center justify-center gap-3">
                <span>MADE WITH</span>
                <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
                <span>BY</span>
                <span className="text-[#FF3E00]">BIPRO</span>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
}
