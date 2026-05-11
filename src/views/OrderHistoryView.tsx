import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../lib/useSupabaseAuth';
import { motion } from 'motion/react';
import { Clock, Package, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrderHistoryView() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setOrders(data);
      setLoading(false);
    }
    fetchOrders();

    const subscription = supabase
      .channel('order-history')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `customer_id=eq.${user?.id}`
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-[10px] font-black text-[#FF3E00] uppercase tracking-[0.5em] animate-pulse">Retrieving_Order_Manifests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-16 max-w-5xl mx-auto">
      <header className="space-y-4">
        <div className="flex items-center space-x-4">
          <span className="w-12 h-[1px] bg-[#FF3E00]"></span>
          <span className="text-[10px] uppercase tracking-[0.5em] text-[#FF3E00] font-bold italic">Transaction_History / Archive</span>
        </div>
        <h1 className="text-[100px] leading-[0.75] font-black uppercase tracking-[-0.06em]">
          ACQUISITIONS.<br/>
          <span className="text-transparent" style={{ WebkitTextStroke: '2px #F5F5F5' }}>TIMELINE.</span>
        </h1>
      </header>

      {orders.length === 0 ? (
        <div className="p-24 border border-dashed border-white/10 text-center space-y-8 flex flex-col items-center">
          <Clock className="w-12 h-12 text-white/10" />
          <div className="space-y-2">
            <span className="block text-[10px] uppercase tracking-[0.4em] text-white/40">No previous transactions found in system</span>
            <button 
              onClick={() => navigate('/')}
              className="text-[#FF3E00] text-[10px] font-black uppercase tracking-widest hover:underline"
            >
              [INITIALISE_MARKET_SCAN]
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {orders.map((order: any) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={order.id}
              className="bg-[#111] border border-white/10 group hover:border-[#FF3E00]/30 transition-all overflow-hidden"
            >
              <div className="p-10 flex flex-col md:flex-row justify-between gap-12">
                <div className="space-y-6 flex-1">
                   <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-3">
                         <Package className="w-4 h-4 text-[#FF3E00]" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-white/40">ID: {order.id.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <Clock className="w-4 h-4 text-white/20" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className={`px-4 py-1 text-[8px] font-black uppercase tracking-widest border ${
                        order.status === 'completed' ? 'border-green-500 text-green-500' : 'border-[#FF3E00] text-[#FF3E00]'
                      }`}>
                         {order.status}
                      </div>
                   </div>

                   <div className="space-y-4">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                           <span className="text-sm font-bold uppercase tracking-tight">{item.title}</span>
                           <span className="text-[10px] font-mono text-white/30">x{item.quantity}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="flex flex-col justify-between items-end gap-8">
                   <div className="text-right">
                      <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Total Valuation</div>
                      <div className="text-4xl font-black tabular-nums">₹{order.total.toLocaleString()}</div>
                   </div>
                   
                   <button className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-[#FF3E00] group-hover:gap-6 transition-all">
                      View_Details <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
