import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Shield, ShieldOff, Search, Clock, UserCheck, ChevronDown, ChevronUp, ShoppingBag, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface UserData {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
  active: boolean;
  created_at: string;
}

interface OrderData {
  id: string;
  customer_id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  items: any[];
}

export default function LedgerView() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const fetchData = async () => {
    // Fetch Users (Profiles)
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });
    
    if (profilesData) setUsers(profilesData);

    // Fetch Orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (ordersData) setOrders(ordersData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const profileSub = supabase
      .channel('ledger-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .subscribe();

    const orderSub = supabase
      .channel('ledger-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileSub);
      supabase.removeChannel(orderSub);
    };
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedUser) {
    const userOrders = orders.filter(o => o.customer_id === selectedUser.id);
    const totalSpend = userOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);

    return (
      <div className="space-y-12 pb-20">
        <button 
          onClick={() => setSelectedUser(null)}
          className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Back_To_Ops_Stream</span>
        </button>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 border-b border-white/10 pb-16">
          <div className="space-y-6">
             <div className="flex items-center gap-4">
                <div className={`w-16 h-16 flex items-center justify-center border-2 ${selectedUser.active ? 'border-[#FF3E00] text-[#FF3E00]' : 'border-white/10 text-white/10'}`}>
                   <UserCheck className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                   <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Identity_Profile</div>
                   <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">{selectedUser.username}</h1>
                </div>
             </div>
             <div className="flex flex-wrap gap-8 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <span>{selectedUser.name}</span>
                <span>•</span>
                <span>{selectedUser.email}</span>
                <span>•</span>
                <span>Joined {new Date(selectedUser.created_at).toLocaleDateString()}</span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/10 w-full md:w-auto">
             <div className="bg-[#111] p-8 space-y-2">
                <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Acquisition_Volume</div>
                <div className="text-3xl font-black text-[#FF3E00]">{userOrders.length}</div>
             </div>
             <div className="bg-[#111] p-8 space-y-2 min-w-[200px]">
                <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Lifetime_Valuation</div>
                <div className="text-3xl font-black text-[#FF3E00]">₹{totalSpend.toLocaleString()}</div>
             </div>
          </div>
        </header>

        <section className="space-y-8">
           <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
              <ShoppingBag className="w-4 h-4 text-[#FF3E00]" />
              Historical_Log_Audit
           </div>

           {userOrders.length === 0 ? (
             <div className="p-20 text-center border border-dashed border-white/5 bg-white/[0.01]">
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/10 font-black italic">No historical data available for this identity.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-4">
                {userOrders.map((order) => (
                  <div key={order.id} className="p-8 border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
                     <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#FF3E00]">{order.status}</div>
                        <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{format(new Date(order.created_at), 'PPP p')}</div>
                     </div>
                     <div className="md:col-span-2">
                        <div className="flex flex-wrap gap-2">
                           {order.items.map((item, idx) => (
                             <span key={idx} className="text-[9px] border border-white/10 px-3 py-1 bg-white/5 text-white/60 uppercase tracking-widest font-black">
                                {item.title} ×{item.quantity}
                             </span>
                           ))}
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Valuation</div>
                        <div className="text-2xl font-black italic">₹{order.total.toLocaleString()}</div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-3 text-[#FF3E00]">
             <Users className="w-5 h-5" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em]">Administration</span>
           </div>
           <h1 className="text-5xl font-black uppercase tracking-tighter">Customer<span className="text-white/20">.Ledger</span></h1>
           <p className="text-[10px] uppercase tracking-widest text-white/40">Manage client identities and system authorization.</p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#FF3E00] transition-colors" />
          <input 
            type="text" 
            placeholder="SEARCH_CLIENTS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 px-12 py-4 text-[10px] font-black uppercase tracking-widest focus:border-[#FF3E00] outline-none transition-all"
          />
        </div>
      </header>

      {loading ? (
        <div className="h-64 flex items-center justify-center border border-white/5 bg-white/[0.01]">
          <div className="text-[10px] uppercase tracking-[0.5em] text-[#FF3E00] font-black animate-pulse">Scanning_Biological_Signatures...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {filteredUsers.map((client) => {
              const userOrders = orders.filter(o => o.customer_id === client.id);
              const totalSpend = userOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);

              return (
                <motion.div 
                  layout
                  key={client.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setSelectedUser(client)}
                  className="bg-white/[0.02] border border-white/5 overflow-hidden group hover:bg-white/[0.04] transition-all cursor-pointer"
                >
                  <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                       <div className={`w-12 h-12 flex items-center justify-center border ${client.active ? 'border-[#FF3E00] text-[#FF3E00]' : 'border-white/10 text-white/20'}`}>
                          <UserCheck className="w-5 h-5" />
                       </div>
                       <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-sm font-black uppercase tracking-widest">{client.username}</h3>
                            {!client.active && <span className="bg-white/5 text-[8px] font-bold px-2 py-0.5 text-white/40 uppercase tracking-widest">Awaiting_Action</span>}
                          </div>
                          <p className="text-[10px] text-white/20 font-medium uppercase tracking-widest">{client.email} / {client.name}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-12 w-full md:w-auto justify-between md:justify-end">
                       <div className="text-right">
                          <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Lifetime_Valuation</div>
                          <div className="text-xl font-black text-[#FF3E00]">₹{totalSpend.toLocaleString()}</div>
                       </div>

                       <div className="flex items-center gap-4">
                          <button 
                            onClick={(e) => toggleStatus(client.id, client.active, e)}
                            className={`px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${
                              client.active 
                              ? 'bg-transparent border border-[#FF3E00] text-[#FF3E00] hover:bg-[#FF3E00] hover:text-black' 
                              : 'bg-[#FF3E00] text-black hover:bg-white'
                            }`}
                          >
                            {client.active ? (
                              <><ShieldOff className="w-4 h-4" /> Deactivate</>
                            ) : (
                              <><Shield className="w-4 h-4" /> Activate</>
                            )}
                          </button>
                          <ChevronDown className="w-4 h-4 text-white/10 group-hover:text-white" />
                       </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {filteredUsers.length === 0 && (
             <div className="p-20 text-center border border-white/5 bg-white/[0.01]">
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-black">No matching transmissions found.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
