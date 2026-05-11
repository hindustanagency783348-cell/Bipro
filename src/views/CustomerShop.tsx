import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../lib/useSupabaseAuth';
import { useCart } from '../lib/CartContext';
import { ShoppingCart, Plus, Bell, Search, Filter, ArrowRight, ShieldAlert, X, ShoppingBag, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { isAfter, parseISO } from 'date-fns';

interface Category {
  id: string;
  name: string;
}

export default function CustomerShop() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { addItem } = useCart();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [activeOffers, setActiveOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [linkedProducts, setLinkedProducts] = useState<any[]>([]);
  const [fetchingLinked, setFetchingLinked] = useState(false);
  const [activeZoomUrl, setActiveZoomUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  // Check user activation
  useEffect(() => {
    async function checkStatus() {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('active')
          .eq('id', user.id)
          .single();
        
        if (data) setIsActive(data.active);
      }
    }
    checkStatus();
  }, [user]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (data) setCategories(data);
    }
    fetchCategories();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Products
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    if (activeCategory !== 'ALL') {
      query = query.eq('category', activeCategory);
    }
    const { data: productsData } = await query;
    if (productsData) setProducts(productsData);

    // Fetch Offers
    const { data: offersData } = await supabase
      .from('offers')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    if (offersData) {
      setActiveOffers(offersData.filter((o: any) => !o.expires_at || isAfter(parseISO(o.expires_at), new Date())));
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const productSub = supabase
      .channel('shop-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchData();
      })
      .subscribe();

    const offerSub = supabase
      .channel('shop-offers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productSub);
      supabase.removeChannel(offerSub);
    };
  }, [activeCategory]);

  const filteredProducts = products.filter((p: any) => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openOffer = async (offer: any) => {
    setSelectedOffer(offer);
    if (offer.product_ids && offer.product_ids.length > 0) {
      setFetchingLinked(true);
      try {
        const { data } = await supabase
          .from('products')
          .select('*')
          .in('id', offer.product_ids);
        
        if (data) setLinkedProducts(data);
      } catch (err) {
        console.error("Linked fetch error:", err);
      } finally {
        setFetchingLinked(false);
      }
    } else {
      setLinkedProducts([]);
    }
  };

  if (isActive === false) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto text-center p-12 bg-[#111] border border-white/10">
       <div className="w-20 h-20 bg-[#FF3E00]/10 flex items-center justify-center border border-[#FF3E00]/30 animate-pulse">
          <ShieldAlert className="w-10 h-10 text-[#FF3E00]" />
       </div>
       <div className="space-y-4">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Access_Denied</h2>
          <p className="text-[10px] uppercase tracking-widest text-white/40 leading-relaxed font-bold">Your account is currently in the verification queue. The BRS ENTERPRISE fleet management system requires manual dealer authorization before data access is granted.</p>
       </div>
       <div className="h-[1px] bg-white/10 w-full" />
       <p className="text-[10px] uppercase tracking-widest text-[#FF3E00] font-black italic">Status: Awaiting_Biological_Signoff</p>
    </div>
  );

  return (
    <div className="space-y-32">
      {/* Announcements Hub */}
      {activeOffers.length > 0 && (
        <section className="space-y-8">
           <div className="flex items-center space-x-4">
              <span className="w-12 h-[1px] bg-[#FF3E00]"></span>
              <span className="text-[10px] uppercase tracking-[0.5em] text-[#FF3E00] font-black italic underline decoration-2 underline-offset-8">Active_Broadcast_Signals</span>
           </div>
           
           <div className={`grid grid-cols-1 ${activeOffers.length > 1 ? 'lg:grid-cols-2' : ''} gap-8`}>
              {activeOffers.map((offer: any, idx) => (
                <motion.div 
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => openOffer(offer)}
                  className={`${idx === 0 && activeOffers.length % 2 !== 0 ? 'lg:col-span-2' : ''} bg-white text-black p-10 relative overflow-hidden group border-8 border-black border-double shadow-2xl hover:scale-[1.02] transition-transform cursor-pointer`}
                >
                  <div className="absolute inset-0 opacity-5 brutalist-grid" />
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-black/40">
                        <Bell className={`w-4 h-4 ${idx === 0 ? 'animate-bounce' : ''}`} />
                        <span className="text-[9px] font-black uppercase tracking-[0.4em]">Signal_{idx + 1}</span>
                      </div>
                      <h2 className="text-4xl font-black uppercase tracking-tight leading-none">{offer.title}</h2>
                      <p className="text-[11px] font-bold text-black/60 max-w-2xl uppercase tracking-widest leading-relaxed whitespace-pre-wrap">{offer.content}</p>
                      
                      {offer.image_urls && offer.image_urls.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                           {offer.image_urls.map((url: string, i: number) => (
                             <div key={i} className="aspect-video bg-black/5 border border-black/10 relative group/media overflow-hidden">
                                {url.includes('.mp4') || url.includes('video') ? (
                                  <video 
                                    src={url} 
                                    className="w-full h-full object-cover" 
                                    muted 
                                    controls
                                    playsInline
                                  />
                                ) : (
                                  <img 
                                    src={url} 
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                                    alt={`Advertisement ${i + 1}`}
                                  />
                                )}
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                    {idx === 0 && (
                       <div className="bg-black text-white px-8 py-6 flex flex-col items-center justify-center space-y-1 min-w-[160px]">
                         <span className="text-[8px] font-black uppercase tracking-[0.5em] opacity-40">Priority</span>
                         <span className="text-lg font-black tracking-widest italic">URGENT</span>
                       </div>
                    )}
                  </div>
                </motion.div>
              ))}
           </div>
        </section>
      )}

      {/* Header & Controls */}
      <header className="space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-12">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <span className="w-12 h-[1px] bg-[#FF3E00]"></span>
              <span className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.5em] text-[#FF3E00] font-black italic underline decoration-2 underline-offset-8">Fleet_Distribution_Network</span>
            </div>
            <h1 className="text-4xl sm:text-7xl md:text-9xl lg:text-[120px] leading-[0.75] font-black uppercase tracking-[-0.06em] break-words">
              SELECT.<br/>
              <span className="text-transparent" style={{ WebkitTextStroke: '2px #F5F5F5' }}>COMPONENTS.</span>
            </h1>
          </div>

          <div className="w-full md:w-96 relative group">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#FF3E00] transition-colors" />
             <input 
               type="text" 
               placeholder="SEARCH_CATALOG..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-white/5 border border-white/10 px-16 py-6 text-[11px] font-black uppercase tracking-widest focus:border-[#FF3E00] outline-none transition-all placeholder:text-white/10"
             />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-4 pt-12 border-t border-white/10">
           <button 
             onClick={() => setActiveCategory('ALL')}
             className={`px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${activeCategory === 'ALL' ? 'bg-[#FF3E00] text-black border-[#FF3E00]' : 'border-white/10 text-white/40 hover:border-white/20'}`}
           >
             ALL_UNITS
           </button>
           {categories.map(cat => (
             <button 
               key={cat.id}
               onClick={() => setActiveCategory(cat.name)}
               className={`px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${activeCategory === cat.name ? 'bg-[#FF3E00] text-black border-[#FF3E00]' : 'border-white/10 text-white/40 hover:border-white/20'}`}
             >
               {cat.name}
             </button>
           ))}
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10 overflow-hidden shadow-2xl">
        {filteredProducts.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-4 p-48 text-center bg-black">
              <span className="text-[10px] uppercase tracking-[0.5em] text-white/10 font-black">No matching inventory transmissions found.</span>
          </div>
        ) : (
          filteredProducts.map((product: any) => (
            <motion.div 
              layout
              key={product.id} 
              className="bg-black p-8 group hover:bg-white/[0.02] transition-all flex flex-col justify-between min-h-[500px] relative"
            >
              <div className="space-y-8">
                <div 
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="aspect-square bg-white/[0.02] border border-white/5 overflow-hidden cursor-pointer relative group-hover:border-[#FF3E00]/30 transition-all"
                >
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                     <ArrowRight className="w-5 h-5 text-[#FF3E00]" />
                  </div>
                  {product.image_url ? (
                    <img referrerPolicy="no-referrer" src={product.image_url} alt={product.title} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-110 group-hover:scale-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <Plus className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[#FF3E00]">
                    <span className="text-[8px] font-black uppercase tracking-[0.4em]">{product.category || 'Standard'}</span>
                  </div>
                  <h3 
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="text-xl font-black uppercase tracking-tight leading-tight cursor-pointer hover:text-[#FF3E00] transition-colors"
                  >
                    {product.title}
                  </h3>
                  <p className="text-[9px] uppercase tracking-widest text-white/20 leading-relaxed font-bold line-clamp-3">
                    {product.description || "No technical specs provided for this hardware unit."}
                  </p>
                </div>
              </div>
              <div className="mt-12 flex items-center justify-between pt-8 border-t border-white/5">
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">MSRP_VALUATION</span>
                   <div className="text-2xl font-black tracking-tighter">₹{product.price.toLocaleString()}</div>
                </div>
                <button 
                  onClick={() => addItem(product)}
                  className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#FF3E00] hover:text-black hover:border-[#FF3E00] transition-all transform hover:-translate-y-1"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Full Screen Broadcast Explorer */}
      <AnimatePresence>
        {selectedOffer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col overflow-y-auto custom-scrollbar pt-20"
          >
            {/* Header Controls */}
            <div className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-[110] bg-gradient-to-b from-black to-transparent pointer-events-none">
               <div className="flex items-center gap-4 pointer-events-auto">
                  <div className="w-2 h-2 bg-[#FF3E00] rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Full_Immersion_Signal</span>
               </div>
               <button 
                onClick={() => { setSelectedOffer(null); setLinkedProducts([]); }}
                className="bg-white text-black p-4 pointer-events-auto hover:bg-[#FF3E00] transition-colors"
               >
                  <X className="w-6 h-6" />
               </button>
            </div>

            {/* Broadcast Content Layer */}
            <div className="max-w-7xl mx-auto px-8 w-full space-y-24 pb-32">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                  <div className="space-y-12">
                     <div className="space-y-4">
                        <span className="text-[10px] font-black text-[#FF3E00] uppercase tracking-[0.5em]">Transmission_Source_Verified</span>
                        <h1 className="text-7xl font-black uppercase tracking-tighter leading-[0.9]">{selectedOffer.title}</h1>
                     </div>
                     <p className="text-xl font-bold uppercase tracking-widest text-white/40 leading-relaxed whitespace-pre-wrap">
                        {selectedOffer.content}
                     </p>
                  </div>

                  <div className="space-y-8">
                     {(selectedOffer.image_urls || []).map((url: string, i: number) => (
                       <div key={i} className="aspect-video bg-white/5 border border-white/10 group overflow-hidden">
                          {url.includes('.mp4') || url.includes('video') ? (
                            <video src={url} className="w-full h-full object-cover" muted autoPlay loop playsInline controls />
                          ) : (
                            <div className="relative w-full h-full cursor-zoom-in group/img" onClick={() => { setActiveZoomUrl(url); setZoomScale(1); }}>
                              <img src={url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                <Search className="w-8 h-8 text-white" />
                              </div>
                            </div>
                          )}
                       </div>
                     ))}
                  </div>
               </div>

               {/* Linked Inbound Hardware Segment */}
               <div className="space-y-12 pt-24 border-t border-white/10">
                  <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                     <div className="space-y-4">
                        <div className="flex items-center gap-4 text-[#FF3E00]">
                           <Plus className="w-4 h-4" />
                           <span className="text-[10px] font-black uppercase tracking-[0.4em]">Integrated_Assets</span>
                        </div>
                        <h2 className="text-4xl font-black uppercase tracking-tight">Broadcasted_Hardware</h2>
                     </div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 max-w-sm">The following units are specifically tagged to this announcement. Secure them directly below.</p>
                  </div>

                  {fetchingLinked ? (
                    <div className="py-24 text-center">
                       <div className="w-12 h-12 border-2 border-[#FF3E00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                       <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Scanning_Linked_Nodes...</span>
                    </div>
                  ) : linkedProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
                       {linkedProducts.map(product => (
                         <div key={product.id} className="bg-black p-8 group hover:bg-white/[0.02] transition-all flex flex-col justify-between border border-white/5">
                            <div className="space-y-6">
                               <div className="aspect-square bg-white/[0.02] border border-white/5 overflow-hidden">
                                  <img referrerPolicy="no-referrer" src={product.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                               </div>
                               <div className="space-y-2">
                                  <span className="text-[8px] font-black text-[#FF3E00] uppercase tracking-widest">{product.category}</span>
                                  <h4 className="text-lg font-black uppercase tracking-tight">{product.title}</h4>
                               </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                               <div className="text-xl font-black tracking-tighter">₹{product.price.toLocaleString()}</div>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); addItem(product); }}
                                 className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#FF3E00] transition-colors flex items-center gap-2"
                               >
                                  <ShoppingBag className="w-4 h-4" /> Add
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="py-24 text-center border border-dashed border-white/5">
                       <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">No specific hardware tagged to this frequency.</span>
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* High-Immersion Media Viewer (Lightbox) */}
      <AnimatePresence>
        {activeZoomUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center p-8 backdrop-blur-xl"
            onKeyDown={(e) => e.key === 'Escape' && setActiveZoomUrl(null)}
          >
             <div className="absolute top-8 right-8 flex items-center gap-4">
                <div className="flex bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md">
                   <button 
                     onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.5))}
                     className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                   >
                     <ZoomOut className="w-5 h-5" />
                   </button>
                   <div className="flex items-center px-4 text-[10px] font-black uppercase text-[#FF3E00] min-w-[60px] justify-center">
                      {(zoomScale * 100).toFixed(0)}%
                   </div>
                   <button 
                     onClick={() => setZoomScale(prev => Math.min(3, prev + 0.5))}
                     className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                   >
                     <ZoomIn className="w-5 h-5" />
                   </button>
                </div>
                <button 
                  onClick={() => setActiveZoomUrl(null)}
                  className="bg-white text-black p-4 hover:bg-[#FF3E00] transition-colors"
                >
                   <X className="w-6 h-6" />
                </button>
             </div>

             <div className="w-full h-full flex items-center justify-center overflow-hidden cursor-move">
                <motion.div 
                  drag
                  dragConstraints={{ left: -1000 * zoomScale, right: 1000 * zoomScale, top: -1000 * zoomScale, bottom: 1000 * zoomScale }}
                  style={{ scale: zoomScale }}
                  className="relative transition-transform duration-200 ease-out"
                >
                   <img 
                     referrerPolicy="no-referrer"
                     src={activeZoomUrl} 
                     className="max-h-[85vh] max-w-[85vw] object-contain shadow-[0_0_100px_rgba(255,62,0,0.2)]" 
                     draggable="false"
                   />
                </motion.div>
             </div>

             <div className="fixed bottom-12 left-1/2 -translate-x-1/2 text-center space-y-2 pointer-events-none">
                <div className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Media_Immersion_Buffer</div>
                <div className="text-[8px] font-black uppercase tracking-[0.4em] text-[#FF3E00]">Drag to Pan • Use Controls to Scale</div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
