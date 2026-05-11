import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShoppingCart, ArrowLeft, Shield, Package, Tag, Info, CheckCircle2, Maximize2, Search, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useCart } from '../lib/CartContext';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  image_urls?: string[];
  category: string;
  dealer_id: string;
}

export default function ProductDetailView() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [zoomEnabled, setZoomEnabled] = useState(true);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);
  const [activeZoomUrl, setActiveZoomUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (data) {
        setProduct(data as Product);
        setSelectedImage(data.image_url);
        
        // Fetch related products
        const { data: relData } = await supabase
          .from('products')
          .select('*')
          .eq('category', data.category)
          .neq('id', data.id)
          .limit(4);
        
        if (relData) setRelated(relData as Product[]);
      }
      setLoading(false);
    }
    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < qty; i++) {
        addItem(product);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomEnabled) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="text-[10px] font-black text-[#FF3E00] uppercase tracking-[0.5em] animate-pulse">Requesting_Data_Stream...</div>
    </div>
  );

  if (!product) return <div className="p-20 text-center font-black uppercase text-white/40 tracking-widest">Signal Lost: Product not found.</div>;

  const images = product.image_urls && product.image_urls.length > 0 ? product.image_urls : [product.image_url];

  return (
    <div className="space-y-16 pb-20">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Back_To_Market</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-6">
          {/* Main Product Image with Zoom */}
          <div 
            className="bg-[#111] border border-white/5 relative aspect-square overflow-hidden cursor-crosshair group"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setShowZoom(true)}
            onMouseLeave={() => setShowZoom(false)}
            onClick={() => { setActiveZoomUrl(selectedImage); setZoomScale(1); }}
          >
            <img 
              referrerPolicy="no-referrer"
              src={selectedImage} 
              alt={product.title} 
              className={`w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ${zoomEnabled && showZoom ? 'scale-150' : 'scale-100'}`}
              style={zoomEnabled && showZoom ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
            />
            
            <div className="absolute top-8 left-8 flex flex-col gap-2">
                <div className="bg-[#FF3E00] text-black px-4 py-1 text-[10px] font-black uppercase tracking-widest italic">
                   Voltas_Direct
                </div>
                {zoomEnabled && (
                  <div className="bg-black/80 text-white/40 px-3 py-1 text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                     <Search className="w-3 h-3 text-[#FF3E00]" /> Intelligence_Zoom_Active
                  </div>
                )}
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); setZoomEnabled(!zoomEnabled); }}
              className={`absolute bottom-8 right-8 p-4 border transition-all ${zoomEnabled ? 'bg-[#FF3E00] border-[#FF3E00] text-black' : 'bg-black/40 border-white/10 text-white/40 hover:text-white'}`}
              title="Toggle Intelligence Zoom"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-4">
               {images.map((img, idx) => (
                 <button 
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-square border-2 transition-all overflow-hidden ${selectedImage === img ? 'border-[#FF3E00]' : 'border-white/5 opacity-40 hover:opacity-100'}`}
                 >
                    <img referrerPolicy="no-referrer" src={img} className="w-full h-full object-cover" />
                 </button>
               ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-12 flex flex-col justify-center">
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-[#FF3E00]">
                <Tag className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">{product.category || 'Standard_Class'}</span>
             </div>
             <h1 className="text-6xl font-black uppercase tracking-tighter leading-[0.9]">{product.title}</h1>
             <p className="text-white/40 leading-relaxed text-sm uppercase tracking-widest whitespace-pre-wrap">{product.description}</p>
          </div>

          <div className="h-[1px] bg-white/10 w-full" />

          <div className="space-y-8">
             <div className="flex items-baseline gap-4">
                <span className="text-5xl font-black tracking-tighter">₹{product.price.toLocaleString()}</span>
                <span className="text-[10px] text-white/20 uppercase font-bold tracking-[0.2em]">Excl._GST / Unit</span>
             </div>

             <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex items-center bg-white/5 border border-white/10 h-16">
                   <button onClick={() => setQty(Math.max(1, qty-1))} className="w-16 h-full flex items-center justify-center hover:bg-white/5 font-black text-xl text-white/40 hover:text-white">-</button>
                   <span className="w-20 text-center font-black tracking-widest">{qty.toString().padStart(2, '0')}</span>
                   <button onClick={() => setQty(qty+1)} className="w-16 h-full flex items-center justify-center hover:bg-white/5 font-black text-xl text-white/40 hover:text-white">+</button>
                </div>

                <button 
                  onClick={handleAddToCart}
                  disabled={added}
                  className={`flex-1 h-16 flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-[0.3em] transition-all ${
                    added ? 'bg-green-500 text-black' : 'bg-[#FF3E00] text-black hover:bg-white shadow-lg shadow-[#FF3E00]/10'
                  }`}
                >
                  {added ? (
                    <><CheckCircle2 className="w-5 h-5" /> Operation_Success</>
                  ) : (
                    <><ShoppingCart className="w-5 h-5" /> Add_To_Order</>
                  )}
                </button>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-white/[0.02] border border-white/5 flex items-center gap-4 group">
                <Shield className="w-5 h-5 text-[#FF3E00] group-hover:scale-110 transition-transform" />
                <div className="text-[10px] font-black uppercase tracking-widest">Genuine_Parts</div>
             </div>
             <div className="p-4 bg-white/[0.02] border border-white/5 flex items-center gap-4 group">
                <Package className="w-5 h-5 text-[#FF3E00] group-hover:scale-110 transition-transform" />
                <div className="text-[10px] font-black uppercase tracking-widest">Doorstep_Delivery</div>
             </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="space-y-12 pt-24 border-t border-white/5">
           <div className="space-y-2">
              <div className="text-[10px] font-black text-[#FF3E00] uppercase tracking-[0.4em]">Intelligence_Pulse</div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Syncronised<span className="text-white/20">.Components</span></h2>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="bg-white/[0.02] border border-white/5 p-6 space-y-4 group cursor-pointer hover:border-[#FF3E00]/30 transition-all"
                >
                   <div className="aspect-square bg-black overflow-hidden relative">
                      <img referrerPolicy="no-referrer" src={p.image_url} alt={p.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500" />
                      <div className="absolute inset-0 bg-[#FF3E00]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-[10px] font-black uppercase tracking-widest truncate">{p.title}</h4>
                      <p className="text-[10px] text-white/20 font-bold">₹{p.price.toLocaleString()}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>
      )}

      {/* Media Lightbox */}
      <AnimatePresence>
        {activeZoomUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center p-8 backdrop-blur-xl"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
