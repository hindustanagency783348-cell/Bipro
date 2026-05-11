import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Shield, User, Key, Info, Phone, ArrowRight, Activity, Cpu } from 'lucide-react';

const DEALER_MASTER_KEY = "BRS-MASTER-2024";

export default function LoginView() {
  const [loading, setLoading] = useState(false);
  const [dealerKey, setDealerKey] = useState('');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // New Client Fields
  const [shopName, setShopName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  // Master Fields
  const [emailVerifyCode, setEmailVerifyCode] = useState(false);
  
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState<'customer' | 'dealer'>('customer');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleLogin = async (mode: 'customer' | 'dealer') => {
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (authError) throw authError;
      
      localStorage.setItem('pending_profile_role', mode);
      localStorage.setItem('pending_profile_fullName', fullName);
      localStorage.setItem('pending_profile_shopName', shopName);
      localStorage.setItem('pending_profile_phoneNumber', phoneNumber);
    } catch (err: any) {
      setError(err.message || 'AUTH_STREAM_INTERRUPTED');
      setLoading(false);
    }
  };

  const handleManualAuth = async (mode: 'customer' | 'dealer') => {
    if (mode === 'dealer' && dealerKey !== DEALER_MASTER_KEY) {
      setError('INVALID_SECURITY_CLEARANCE_KEY');
      return;
    }
    
    if (!identity.trim() || !password.trim()) {
      setError('MISSING_CREDENTIALS_FOR_UPLINK');
      return;
    }

    if (mode === 'customer' && isSignUp && (!shopName || !fullName || !phoneNumber)) {
      setError('CLIENT_DATA_INCOMPLETE');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('SECURITY_KEYS_DO_NOT_MATCH');
      return;
    }

    // Basic email validation for Supabase manual auth
    if (!identity.includes('@')) {
      setError('VALID_EMAIL_REQUIRED_FOR_MANUAL_AUTH');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Set pending data for profile creation
        localStorage.setItem('pending_profile_role', mode);
        localStorage.setItem('pending_profile_fullName', fullName);
        localStorage.setItem('pending_profile_shopName', shopName);
        localStorage.setItem('pending_profile_phoneNumber', phoneNumber);

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: identity,
          password: password,
          options: {
            data: {
              role: mode,
              full_name: fullName,
              shop_name: shopName,
              phone_number: phoneNumber,
              username: fullName || identity.split('@')[0]
            }
          }
        });
        if (signUpError) throw signUpError;
        
        if (data.user && data.session) {
          // Profile will be created by App.tsx
        } else if (data.user) {
          alert('VERIFICATION_REQUIRED: A security pulse has been sent to your email. Confirm it to activate system access.');
          setLoading(false);
          setIsSignUp(false); // Switch to login
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: identity,
          password: password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'AUTH_STREAM_INTERRUPTED');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center p-4 md:p-8 font-sans selection:bg-[#FF3E00] selection:text-black">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF3E00]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 brutalist-grid opacity-[0.03]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-[#0A0A0A] border border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row relative z-10"
      >
        {/* Branding Section */}
        <div className="lg:w-5/12 p-10 md:p-16 bg-[#0D0D0D] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col justify-between">
          <div className="space-y-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <div className="h-8 w-1 bg-blue-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Official_Account</span>
                <span className="text-xl font-bold tracking-tighter text-white">VOLTAS PARTNER</span>
              </div>
            </motion.div>

            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.3 }}
                className="text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85]"
              >
                BRS<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/40 to-white/10 italic">ENTERPRISE.</span>
              </motion.h1>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF3E00] flex items-center gap-3">
                <Activity className="w-3 h-3" /> Industrial Ingestion Node
              </p>
            </div>
          </div>

          <div className="mt-20 space-y-8">
            <div className="flex items-center gap-6">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] bg-[#111] flex items-center justify-center">
                    <User className="w-3 h-3 text-white/40" />
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                Authorized by <span className="text-white">Professional Division</span>
              </p>
            </div>
            
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm space-y-3">
               <div className="flex items-center gap-3">
                 <Cpu className="w-4 h-4 text-blue-500" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Protocol.Security.Active</span>
               </div>
               <p className="text-[10px] text-white/20 uppercase tracking-widest leading-relaxed font-medium">
                 Data encryption stream active. Multi-tenant architectural validation required for system entry.
               </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:w-7/12 p-10 md:p-14 flex flex-col justify-center">
           <div className="max-w-md mx-auto w-full space-y-10">
              <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-[2px] ${loginMode === 'dealer' ? 'bg-blue-600' : 'bg-[#FF3E00]'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
                      {loginMode === 'customer' ? 'Client_Protocol' : 'Command_Center'}
                    </span>
                 </div>
                 <h2 className="text-3xl font-black uppercase tracking-tighter">
                    {loginMode === 'dealer' ? 'Master_Authentication' : (isSignUp ? 'Establish_Client_Node' : 'Client_Login')}
                  </h2>
                 <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 leading-relaxed">
                    {loginMode === 'dealer' 
                      ? 'Administrative clearance required for central relay control.' 
                      : (isSignUp ? 'Create your professional credentials for the network.' : 'Initialise your verification sequence.')}
                  </p>
              </div>

              <div className="space-y-6">
                 {/* Google Login for Customer */}
                 {loginMode === 'customer' && (
                    <button 
                      type="button"
                      onClick={() => handleGoogleLogin('customer')}
                      disabled={loading}
                      className="w-full bg-white text-black py-5 text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 group hover:bg-[#FF3E00] hover:text-white transition-all transform active:scale-[0.98]"
                    >
                       <Activity className="w-5 h-5" />
                       Quick_Google_Auth
                    </button>
                 )}

                 {loginMode === 'customer' && isSignUp && (
                   <div className="grid grid-cols-1 gap-6 pt-4">
                      {/* Shop Name */}
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Enterprise_ID</label>
                         <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 pr-3 border-r border-white/5">
                               <Cpu className="w-3.5 h-3.5 text-white/20 group-focus-within:text-[#FF3E00] transition-colors" />
                            </div>
                            <input 
                              type="text" 
                              value={shopName}
                              onChange={(e) => setShopName(e.target.value)}
                              placeholder="YOUR SHOP NAME"
                              className="w-full bg-[#0D0D0D] border border-white/5 px-14 py-4 text-xs font-black tracking-widest focus:border-[#FF3E00]/50 outline-none transition-all placeholder:text-white/10 uppercase"
                            />
                         </div>
                      </div>

                      {/* Full Name */}
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Operator_Name</label>
                         <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 pr-3 border-r border-white/5">
                               <User className="w-3.5 h-3.5 text-white/20 group-focus-within:text-[#FF3E00] transition-colors" />
                            </div>
                            <input 
                              type="text" 
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="ENTER YOUR NAME"
                              className="w-full bg-[#0D0D0D] border border-white/5 px-14 py-4 text-xs font-black tracking-widest focus:border-[#FF3E00]/50 outline-none transition-all placeholder:text-white/10 uppercase"
                            />
                         </div>
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Contact_Relay</label>
                         <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 pr-3 border-r border-white/5">
                               <Phone className="w-3.5 h-3.5 text-white/20 group-focus-within:text-[#FF3E00] transition-colors" />
                            </div>
                            <input 
                              type="text" 
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="+91 98765 43210"
                              className="w-full bg-[#0D0D0D] border border-white/5 px-14 py-4 text-xs font-black tracking-widest focus:border-[#FF3E00]/50 outline-none transition-all placeholder:text-white/10 uppercase"
                            />
                         </div>
                      </div>
                   </div>
                 )}

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">System_Alias</label>
                    <div className="relative group">
                       <div className="absolute left-5 top-1/2 -translate-y-1/2 pr-3 border-r border-white/5">
                          <User className="w-3.5 h-3.5 text-white/20 group-focus-within:text-[#FF3E00] transition-colors" />
                       </div>
                       <input 
                         type="email" 
                         value={identity}
                         onChange={(e) => setIdentity(e.target.value)}
                         placeholder="EMAIL_ADDRESS"
                         className="w-full bg-[#0D0D0D] border border-white/5 px-14 py-4 text-xs font-black tracking-widest focus:border-[#FF3E00]/50 outline-none transition-all placeholder:text-white/10 uppercase"
                       />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Security_Key</label>
                    <div className="relative group">
                       <div className="absolute left-5 top-1/2 -translate-y-1/2 pr-3 border-r border-white/5">
                          <Key className="w-3.5 h-3.5 text-white/20 group-focus-within:text-[#FF3E00] transition-colors" />
                       </div>
                       <input 
                         type="password" 
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         placeholder="••••••••"
                         className="w-full bg-[#0D0D0D] border border-white/5 px-14 py-4 text-xs font-black tracking-widest focus:border-[#FF3E00]/50 outline-none transition-all placeholder:text-white/10 uppercase"
                       />
                    </div>
                 </div>

                 {isSignUp && (
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Validate_Key</label>
                      <div className="relative group">
                         <div className="absolute left-5 top-1/2 -translate-y-1/2 pr-3 border-r border-white/5">
                            <Key className="w-3.5 h-3.5 text-white/20 group-focus-within:text-[#FF3E00] transition-colors" />
                         </div>
                         <input 
                           type="password" 
                           value={confirmPassword}
                           onChange={(e) => setConfirmPassword(e.target.value)}
                           placeholder="••••••••"
                           className="w-full bg-[#0D0D0D] border border-white/5 px-14 py-4 text-xs font-black tracking-widest focus:border-[#FF3E00]/50 outline-none transition-all placeholder:text-white/10 uppercase"
                         />
                      </div>
                   </div>
                 )}

                 {loginMode === 'dealer' && (
                   <div className="space-y-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Master_Verification_Key</label>
                         <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 pr-3 border-r border-white/5">
                               <Shield className="w-3.5 h-3.5 text-white/20 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input 
                              type="password" 
                              value={dealerKey}
                              onChange={(e) => setDealerKey(e.target.value)}
                              placeholder="SYS_MASTER_SIG"
                              className="w-full bg-[#0D0D0D] border border-white/5 px-14 py-4 text-xs font-black tracking-widest focus:border-blue-500/50 outline-none transition-all placeholder:text-white/10 uppercase"
                            />
                         </div>
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={emailVerifyCode}
                          onChange={(e) => setEmailVerifyCode(e.target.checked)}
                          className="hidden"
                        />
                        <div className={`w-4 h-4 border flex items-center justify-center transition-all ${emailVerifyCode ? 'bg-blue-600 border-blue-600' : 'border-white/10 group-hover:border-white/30'}`}>
                           {emailVerifyCode && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-white/60 transition-colors">Authenticate via Email Verification Code</span>
                      </label>
                   </div>
                 )}

                 {loginMode === 'customer' && (
                   <label className="flex items-center gap-3 cursor-pointer group pt-2">
                     <input 
                       type="checkbox" 
                       checked={rememberMe}
                       onChange={(e) => setRememberMe(e.target.checked)}
                       className="hidden"
                     />
                     <div className={`w-4 h-4 border flex items-center justify-center transition-all ${rememberMe ? 'bg-[#FF3E00] border-[#FF3E00]' : 'border-white/10 group-hover:border-white/30'}`}>
                        {rememberMe && <ArrowRight className="w-2.5 h-2.5 text-black" />}
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-white/60 transition-colors">Remember Operator Identity (Persistent Session)</span>
                   </label>
                 )}

                 {error && (
                   <div className="p-4 bg-red-500/5 border border-red-500/20 flex items-center gap-4">
                      <Shield className="w-4 h-4 text-red-500" />
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{error}</span>
                   </div>
                 )}

                 <button 
                   onClick={() => handleManualAuth(loginMode)}
                   disabled={loading}
                   className={`w-full relative py-6 overflow-hidden group transition-all transform active:scale-[0.98] ${
                     loginMode === 'dealer' ? 'bg-blue-600' : 'bg-[#FF3E00]'
                   }`}
                 >
                    <div className="relative z-10 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.6em] text-white">
                       {loading ? 'PROCESSING_UPLINK...' : (isSignUp ? 'ESTABLISH_NODE' : 'ACCESS_SYSTEM')}
                    </div>
                 </button>

                 <div className="flex flex-col gap-4 pt-4">
                    <button 
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setLoginMode('customer');
                      }}
                      className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors text-center"
                    >
                      {isSignUp ? 'Return to Login Terminal' : "New User? Request Access Node"}
                    </button>

                    {loginMode === 'customer' ? (
                      <button 
                        onClick={() => {
                          setLoginMode('dealer');
                          setIsSignUp(false);
                        }}
                        className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500/40 hover:text-blue-500 transition-colors py-4 border-t border-white/5"
                      >
                        --- Secure Master Entry Portal ---
                      </button>
                    ) : (
                      <button 
                        onClick={() => setLoginMode('customer')}
                        className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors py-4 border-t border-white/5"
                      >
                        --- Return to Client Terminal ---
                      </button>
                    )}
                 </div>

                 <div className="flex items-center justify-center gap-4 pt-8 border-t border-white/5">
                    <Info className="w-3 h-3 text-white/20" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/20 leading-none">
                       System Encryption v4.0.21 / Stable
                    </span>
                 </div>
              </div>
           </div>
        </div>
      </motion.div>

      {/* Footer Branding Overlay */}
      <div className="fixed bottom-8 left-8 flex items-center gap-4 opacity-20 hover:opacity-100 transition-opacity">
         <div className="w-10 h-[1px] bg-white" />
         <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">BRS ENTERPRISE Hub</span>
      </div>
    </div>
  );
}
