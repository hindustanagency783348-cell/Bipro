import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../lib/useSupabaseAuth';
import { useCart } from '../lib/CartContext';
import { motion } from 'motion/react';
import { ShoppingCart, ArrowLeft, Trash2, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CartView() {
  const { user } = useSupabaseAuth();
  const { items, removeFromCart, total, clearCart } = useCart();
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  const handlePlaceOrder = async () => {
    if (items.length === 0 || !user) return;
    setIsOrdering(true);
    try {
      // Fetch user data to get the custom identity/username
      const { data: userData } = await supabase
        .from('profiles')
        .select('username, name')
        .eq('id', user.id)
        .single();
      
      const customerIdentifier = userData?.username || userData?.name || user.email || 'UNKNOWN_IDENTITY';

      const orderData = {
        customer_id: user.id,
        customer_name: customerIdentifier,
        dealer_id: items[0].dealer_id || items[0].dealerId, // Support both formats
        items: items,
        total: total,
        status: 'pending',
        viewed: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      
      if (error) throw error;

      setOrderSuccess({ id: data.id, ...orderData });
      clearCart();
    } catch (e: any) {
      console.error(e);
      alert(`Order submission failed: ${e.message}`);
    } finally {
      setIsOrdering(false);
    }
  };

  const notifyViaWhatsApp = () => {
    if (!orderSuccess) return;
    const message = `*NEW ORDER PLACED BY ${orderSuccess.customer_name}*%0A%0AOrder ID: ${orderSuccess.id.slice(0, 8)}%0ATotal: ₹${orderSuccess.total.toLocaleString()}%0A%0AItems:%0A${orderSuccess.items.map((i: any) => `- ${i.title} (x${i.quantity})`).join('%0A')}%0A%0APlease process this order immediately.`;
    window.open(`https://wa.me/916001206460?text=${encodeURIComponent(message)}`);
  };

  if (orderSuccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-12 max-w-2xl mx-auto text-center p-12 bg-[#111] border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#FF3E00]" />
        <div className="w-24 h-24 bg-[#FF3E00] flex items-center justify-center shadow-2xl shadow-[#FF3E00]/20">
           <Send className="w-10 h-10 text-black" />
        </div>
        <div className="space-y-4">
           <h2 className="text-5xl font-black uppercase tracking-tighter">Mission_Success</h2>
           <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold leading-relaxed">Order #{orderSuccess.id.slice(0, 8)} has been committed to the ledger.</p>
        </div>
        
        <div className="flex flex-col gap-4 w-full">
           <button 
             onClick={notifyViaWhatsApp}
             className="w-full bg-[#25D366] text-white py-8 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-4 border-b-8 border-black/20"
           >
              <Send className="w-5 h-5" /> Notify_Dealer_On_WhatsApp
           </button>
           <button 
             onClick={() => setOrderSuccess(null)}
             className="w-full bg-white/5 border border-white/10 text-white/40 py-6 text-[10px] font-black uppercase tracking-widest hover:text-white"
           >
              Back_To_Systems
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 max-w-4xl mx-auto">
      <header className="space-y-4">
        <div className="flex items-center space-x-4">
          <span className="w-12 h-[1px] bg-[#FF3E00]"></span>
          <span className="text-[10px] uppercase tracking-[0.5em] text-[#FF3E00] font-bold italic">Transaction / Cart</span>
        </div>
        <h1 className="text-[100px] leading-[0.75] font-black uppercase tracking-[-0.06em]">
          CHECKOUT.<br/>
          <span className="text-transparent" style={{ WebkitTextStroke: '2px #F5F5F5' }}>SECURE.</span>
        </h1>
      </header>

      {items.length === 0 ? (
        <div className="p-24 border border-dashed border-white/10 text-center space-y-8 flex flex-col items-center">
          <ShoppingCart className="w-12 h-12 text-white/10" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/20">The payload is currently empty</span>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="border border-white/10">
            {items.map((item) => (
              <div key={item.id} className="p-8 border-b border-white/10 flex items-center justify-between group bg-white/[0.01]">
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-white/5" />
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">{item.title}</h3>
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Qty: {item.quantity} • ₹{item.price}</div>
                  </div>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="text-white/20 hover:text-[#FF3E00] transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-end justify-between gap-8 py-12 border-t border-white/10">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4">Total Amount</div>
              <div className="text-7xl font-black tabular-nums tracking-tighter">₹{total.toLocaleString()}</div>
            </div>
            <button 
              onClick={handlePlaceOrder}
              disabled={isOrdering}
              className="bg-[#FF3E00] text-black px-12 py-8 text-xl font-black uppercase tracking-[0.3em] hover:bg-white transition-all disabled:opacity-50"
            >
              {isOrdering ? "PROCESSING..." : "CONFIRM_ORDER"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
