import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../lib/useSupabaseAuth';
import { motion, AnimatePresence } from 'motion/react';
import { Package, ShoppingBag, Bell, MessageSquare, TrendingUp, Plus, CheckCircle2, XCircle, ArrowRight, Activity, FileText, Share2, Eye, X, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DealerDashboard() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rlsError, setRlsError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      setRlsError(null);
      
      try {
        // Fetch Orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('dealer_id', user.id)
          .order('created_at', { ascending: false });
        
        if (ordersError) throw ordersError;
        if (ordersData) setOrders(ordersData);

        // Fetch Products count
        const { count, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('dealer_id', user.id);
        
        if (productsError) throw productsError;
        setProductsCount(count || 0);
      } catch (err: any) {
        console.error("Dashboard Fetch Error:", err);
        if (err.message?.includes('row-level security')) {
          setRlsError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Stats were reactive, let's keep orders reactive
    const subscription = supabase
      .channel('orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const totalRevenue = orders.filter((o: any) => o.status === 'completed').reduce((acc, curr: any) => acc + (curr.total || 0), 0);
  const pendingOrdersCount = orders.filter((o: any) => o.status === 'pending').length;
  const unviewedOrders = orders.filter((o: any) => !o.viewed);
  const viewedOrders = orders.filter((o: any) => o.viewed);

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await supabase.from('orders').update({ status }).eq('id', id);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsViewed = async (id: string) => {
    try {
      await supabase.from('orders').update({ viewed: true }).eq('id', id);
    } catch (err) {
      console.error(err);
    }
  };

  const generatePDF = (order: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('BRS ENTERPRISE - ORDER INVOICE', 14, 22);
    doc.setFontSize(10);
    doc.text(`Order ID: ${order.id}`, 14, 30);
    doc.text(`Customer: ${order.customerName}`, 14, 35);
    doc.text(`Date: ${format(new Date(order.createdAt), 'PPP p')}`, 14, 40);

    const tableData = order.items.map((item: any) => [
      item.title,
      item.quantity,
      `₹${item.price}`,
      `₹${item.price * item.quantity}`
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Product', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    doc.text(`Grand Total: ₹${order.total}`, 14, finalY + 10);
    doc.save(`Order_${order.id.slice(0, 8)}.pdf`);
  };

  const shareOnWhatsApp = (order: any) => {
    const message = `*BRS ENTERPRISE - NEW ORDER*%0AOrder ID: ${order.id.slice(0, 8)}%0ACustomer: ${order.customerName}%0ATotal: ₹${order.total.toLocaleString()}%0A%0AItems:%0A${order.items.map((i: any) => `- ${i.title} (x${i.quantity})`).join('%0A')}`;
    window.open(`https://wa.me/916001206460?text=${encodeURIComponent(message)}`);
  };

  return (
    <div className="space-y-16">
      <AnimatePresence>
        {unviewedOrders.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#FF3E00] p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4 text-black font-black uppercase text-[10px] tracking-widest">
               <Bell className="w-4 h-4 animate-bounce" />
               Critical_Signal: {unviewedOrders.length} New Unprocessed Orders Detected
            </div>
            <button 
              onClick={() => markAsViewed(unviewedOrders[0].id)}
              className="text-[8px] font-black uppercase border border-black/20 px-3 py-1 hover:bg-black hover:text-white transition-all"
            >
              Acknowledge_Signal
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
        <div className="space-y-6">
          <div className="flex items-center space-x-6">
            <div className="bg-[#FF3E00] px-3 py-1 text-[10px] font-black text-black uppercase tracking-[0.2em]">Live_Ops</div>
            <span className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.5em] text-white/40 font-black italic">BRS ENTERPRISE / Operational Command</span>
          </div>
          <h1 className="text-4xl sm:text-7xl md:text-9xl lg:text-[120px] leading-[0.75] font-black uppercase tracking-[-0.06em] break-words">
            SYSTEM.<br/>
            <span className="text-transparent" style={{ WebkitTextStroke: '2px #F5F5F5' }}>METRICS.</span>
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/10 border border-white/10 shadow-2xl">
          <div className="bg-[#111] p-10 space-y-4">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Revenue_Stream</div>
            <div className="text-4xl font-black tabular-nums text-[#FF3E00]">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-[8px] font-bold text-white/10 uppercase tracking-widest italic">Confirmed_Fulfillment</div>
          </div>
          <div className="bg-[#111] p-10 space-y-4">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Inventory_Depth</div>
            <div className="text-4xl font-black tabular-nums">{productsCount}</div>
            <div className="text-[8px] font-bold text-white/10 uppercase tracking-widest italic">Registered_Units</div>
          </div>
          <div className="bg-[#111] p-10 space-y-4 hidden sm:block">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Active_Requests</div>
            <div className="text-4xl font-black tabular-nums">{pendingOrdersCount}</div>
            <div className="text-[8px] font-bold text-white/10 uppercase tracking-widest italic">Action_Required</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* RLS Diagnostic Patch (Only visible when RLS errors occur) */}
        {rlsError && (
          <div className="lg:col-span-12 bg-red-500/10 border-2 border-red-500/30 p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-4 text-red-500">
                <AlertTriangle className="w-8 h-8" />
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tight">Supabase_Connection_Fault</h3>
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Row-Level Security (RLS) is blocking data transmission.</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">1. Database Table Patch</h4>
                   <p className="text-[9px] uppercase tracking-widest text-white/20">Run this SQL in your Supabase SQL Editor to allow metadata persistence:</p>
                   <pre className="bg-black p-4 text-[10px] text-[#FF3E00] font-mono border border-white/5 overflow-x-auto">
{`-- 1. Metadata Schema Fix
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS product_ids uuid[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shop_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;

-- 2. Table Access Policies
CREATE POLICY "Allow All" ON public.products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow All" ON public.offers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow All" ON public.orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow All" ON public.categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow All" ON public.profiles FOR ALL TO authenticated USING (true);`}
                   </pre>
                </div>
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">2. Storage Bucket Patch</h4>
                   <p className="text-[9px] uppercase tracking-widest text-white/20">Run this SQL to enable high-frequency media uplinks:</p>
                   <pre className="bg-black p-4 text-[10px] text-[#FF3E00] font-mono border border-white/5 overflow-x-auto">
{`-- Enable Storage Access
-- Make sure buckets 'products' and 'broadcasts' are created first
CREATE POLICY "Allow Auth Upload" ON storage.objects FOR ALL TO authenticated USING (bucket_id IN ('products', 'broadcasts'));`}
                   </pre>
                </div>
             </div>
             
             <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                <span className="text-[8px] font-black uppercase tracking-[0.5em] text-red-500/60">Awaiting Hardware Configuration via Supabase Dashboard</span>
             </div>
          </div>
        )}

        {/* Recent Orders Ledger */}
        <div className="lg:col-span-8 space-y-12">
          <div className="flex items-center justify-between border-b border-white/10 pb-8">
            <div className="space-y-1">
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                <ShoppingBag className="w-5 h-5 text-[#FF3E00]" />
                Inbound_Order_Ledger
              </h2>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Real-time data stream of platform requests.</p>
            </div>
            <div className="flex items-center gap-6">
               <span className="text-[10px] font-black text-white/40 tracking-[0.2em]">{orders.length} TOTAL_ENTRIES</span>
               <div className="w-8 h-8 rounded-full border border-[#FF3E00]/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#FF3E00] animate-pulse" />
               </div>
            </div>
          </div>

          <div className="space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-[#FF3E00]">
                 <span className="w-8 h-[1px] bg-[#FF3E00]" />
                 Live_Transmissions (Unviewed)
              </div>
              {loading ? (
                <div className="p-24 border border-dashed border-white/10 text-center animate-pulse bg-white/[0.01]">
                  <span className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-black">Initialising_Ops_Stream...</span>
                </div>
              ) : unviewedOrders.length === 0 ? (
                <div className="p-12 border border-white/5 bg-white/[0.01] text-center">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-white/10 font-black italic">No new signals detected. All processed.</span>
                </div>
              ) : (
                unviewedOrders.map((order: any) => (
                  <div key={order.id} className="p-10 border-2 border-[#FF3E00]/40 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-12 group hover:bg-white/[0.04] transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                       <span className="text-[8px] font-black text-[#FF3E00] uppercase tracking-widest animate-pulse">New_Arrival</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-6">
                        <span className="text-2xl font-black uppercase tracking-tighter">{order.customerName}</span>
                        <span className="bg-[#FF3E00] text-black text-[10px] font-black px-4 py-1 uppercase tracking-[0.2em] shadow-lg shadow-[#FF3E00]/20">
                          {order.status}
                        </span>
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-black flex flex-wrap gap-x-8 gap-y-2">
                        <span>{order.items.length} Units</span>
                        <span>₹{order.total.toLocaleString()}</span>
                        <span>{format(new Date(order.createdAt), 'MMM dd | hh:mm a')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          setSelectedOrder(order);
                          markAsViewed(order.id);
                        }}
                        className="bg-[#FF3E00] text-black h-14 px-8 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center gap-3"
                      >
                         <Eye className="w-4 h-4" /> View_Manifest
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Minimized History Section */}
            <div className="space-y-4 pt-12">
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
                 <span className="w-8 h-[1px] bg-white/10" />
                 Minimized_Signal_Archive (Viewed)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewedOrders.slice(0, 8).map((order: any) => (
                  <div key={order.id} className="p-6 border border-white/5 bg-white/[0.01] flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                    <div className="space-y-1">
                      <div className="text-sm font-black uppercase tracking-tight truncate max-w-[150px]">{order.customerName}</div>
                      <div className="text-[9px] text-white/20 uppercase tracking-[0.2em]">₹{order.total.toLocaleString()} • {order.status}</div>
                    </div>
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-3 text-white/20 hover:text-white transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }}
                 onClick={() => setSelectedOrder(null)}
                 className="absolute inset-0 bg-black/90 backdrop-blur-md" 
               />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 p-6 md:p-12 shadow-2xl overflow-hidden"
               >
                  <div className="absolute top-0 right-0 p-4 md:p-8">
                     <button onClick={() => setSelectedOrder(null)} className="text-white/20 hover:text-white">
                        <X className="w-6 h-6" />
                     </button>
                  </div>

                  <div className="space-y-8 md:space-y-12">
                     <header className="space-y-4">
                        <div className="flex items-center gap-4">
                           <div className="px-3 py-1 bg-[#FF3E00] text-black text-[10px] font-black uppercase">Order_Manifest</div>
                           <span className="text-[10px] text-white/20 font-black uppercase tracking-widest truncate max-w-[150px]">{selectedOrder.id}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">{selectedOrder.customerName}</h2>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest">{format(new Date(selectedOrder.createdAt), 'PPPP p')}</div>
                     </header>

                     <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4">
                        {selectedOrder.items.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-4 border-b border-white/5">
                             <div>
                                <div className="text-sm font-black uppercase tracking-tight">{item.title}</div>
                                <div className="text-[10px] text-white/20 uppercase tracking-widest">Qty: {item.quantity} • ₹{item.price}</div>
                             </div>
                             <div className="text-lg font-black text-white/60">₹{(item.price * item.quantity).toLocaleString()}</div>
                          </div>
                        ))}
                     </div>

                     <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-8 border-t border-white/10 gap-8">
                        <div>
                           <div className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-1">Grand Valuation</div>
                           <div className="text-4xl font-black text-[#FF3E00]">₹{selectedOrder.total.toLocaleString()}</div>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                           <button 
                             onClick={() => generatePDF(selectedOrder)}
                             className="flex-1 md:flex-none px-6 py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#FF3E00] transition-colors"
                           >
                             PDF
                           </button>
                           <button 
                             onClick={() => shareOnWhatsApp(selectedOrder)}
                             className="flex-1 md:flex-none px-6 py-4 border border-[#25D366] text-[#25D366] text-[10px] font-black uppercase tracking-widest hover:bg-[#25D366] hover:text-white transition-colors"
                           >
                             WhatsApp
                           </button>
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Command Sidebar */}
        <div className="lg:col-span-4 space-y-12">
          <section className="space-y-8 bg-[#111] p-10 border border-white/10">
             <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF3E00] flex items-center gap-3">
              <Plus className="w-4 h-4" />
              Strategic_Operational_Hub
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <button 
                 onClick={() => navigate('/inventory')}
                 className="p-8 border-2 border-[#FF3E00] bg-[#FF3E00]/5 flex items-center justify-between group hover:bg-[#FF3E00] hover:text-black transition-all transform hover:-translate-y-1 shadow-2xl"
               >
                  <div className="flex flex-col items-start">
                     <span className="text-xl font-black uppercase tracking-tight">NEW_UNIT_INGEST</span>
                     <span className="text-[8px] opacity-60 uppercase tracking-widest mt-1">Manual Product Upload</span>
                  </div>
                  <Plus className="w-8 h-8" />
               </button>
               <button 
                 onClick={() => navigate('/inventory')}
                 className="p-8 border border-white/5 bg-white/[0.02] flex items-center justify-between group hover:bg-white hover:text-black transition-all transform hover:-translate-y-1 shadow-xl"
               >
                  <div className="flex flex-col items-start">
                     <span className="text-lg font-black uppercase tracking-tight">MANAGE_FLEET</span>
                     <span className="text-[8px] opacity-40 uppercase tracking-widest mt-1">Edit / Audit Inventory</span>
                  </div>
                  <Package className="w-6 h-6" />
               </button>
               <button 
                 onClick={() => navigate('/offers')}
                 className="p-8 border border-white/5 bg-white/[0.02] flex items-center justify-between group hover:bg-white hover:text-black transition-all transform hover:-translate-y-1 shadow-xl col-span-1 sm:col-span-2"
               >
                  <div className="flex flex-col items-start">
                     <span className="text-lg font-black uppercase tracking-tight">PUSH_BROADCAST_SIGNAL</span>
                     <span className="text-[8px] opacity-40 uppercase tracking-widest mt-1">Platform Announcements</span>
                  </div>
                  <Bell className="w-6 h-6" />
               </button>
            </div>
          </section>

          <section className="p-10 border border-white/10 bg-[#FF3E00]/5 space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <MessageSquare className="w-16 h-16" />
            </div>
            <div className="space-y-4">
               <div className="flex items-center gap-4 text-[#FF3E00]">
                 <span className="w-8 h-[1px] bg-[#FF3E00]" />
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Signal_Alerts</h2>
               </div>
               <p className="text-[12px] font-bold text-white/60 uppercase tracking-widest leading-loose italic">
                 Automated order notifications are active for nodal point <span className="text-[#FF3E00] selection:bg-white selection:text-black">+91 6001206460</span>.
               </p>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between text-[8px] font-black uppercase text-white/20 tracking-widest">
                  <span>Connection_Stability</span>
                  <span>99.9%_UPTIME</span>
               </div>
               <div className="h-1.5 bg-white/5 w-full relative">
                  <motion.div 
                    className="h-full bg-[#FF3E00]" 
                    animate={{ x: ['-100%', '100%'], opacity: [0, 1, 0] }} 
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="absolute inset-0 bg-[#FF3E00]/20" style={{ width: '85%' }} />
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
