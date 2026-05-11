import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Send, Trash2, ShieldCheck, ShieldAlert, Clock, Info, CheckCircle2, Layout, Megaphone, Upload, Plus, Image as ImageIcon, Video, X, Edit2, Calendar, Zap, AlertTriangle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addHours, isAfter, parseISO } from 'date-fns';

interface Offer {
  id: string;
  title: string;
  content: string;
  imageUrls?: string[];
  active: boolean;
  createdAt: string;
  expiresAt?: string;
  duration?: string;
  product_ids?: string[];
}

export default function OffersView() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [duration, setDuration] = useState('24'); // Default 24 hours
  const [loading, setLoading] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dealerProducts, setDealerProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // Multimedia state
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{url: string, type: string}[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch initial offers
    const fetchOffers = async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setOffers(data.map(o => ({
          id: o.id,
          title: o.title,
          content: o.content,
          imageUrls: o.image_urls,
          active: o.active,
          createdAt: o.created_at,
          expiresAt: o.expires_at,
          duration: o.duration,
          product_ids: o.product_ids || []
        } as Offer)));
      }
    };

    const fetchProducts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('products')
        .select('id, title, price, category')
        .eq('dealer_id', user.id)
        .order('title');
      
      if (data) setDealerProducts(data);
    };

    fetchOffers();
    fetchProducts();

    // Subscribe to changes
    const subscription = supabase
      .channel('offers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
        fetchOffers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 5) return alert("Maximum 5 media assets allowed per broadcast.");
    
    const validFiles = files.filter((file: File) => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for ads
        alert(`${file.name} is too large (Max 10MB)`);
        return false;
      }
      return file.type.startsWith('image/') || file.type.startsWith('video/');
    });

    setMediaFiles(prev => [...prev, ...validFiles]);
    const newPreviews = validFiles.map((file: File) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image'
    }));
    setMediaPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const path = `${timestamp}_${safeName}`;

    // Mock progress since basic Supabase JS upload doesn't expose it easily without more complex setup
    setUploadProgress(prev => ({ ...prev, [file.name]: 30 }));

    const { data, error } = await supabase.storage
      .from('broadcasts')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error(`Upload failed for ${file.name}:`, error);
      throw error;
    }

    setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

    const { data: { publicUrl } } = supabase.storage
      .from('broadcasts')
      .getPublicUrl(path);

    return publicUrl;
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Authentication required to broadcast.");
      return;
    }

    setLoading(true);
    // Reset progress for this attempt
    const initialProgress: { [key: string]: number } = {};
    mediaFiles.forEach(f => initialProgress[f.name] = 0);
    setUploadProgress(initialProgress);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Authentication required to broadcast.");
        return;
      }

      let imageUrls: string[] = [...existingImageUrls];
      if (mediaFiles.length > 0) {
        try {
          const uploaded = await Promise.all(mediaFiles.map(file => uploadMedia(file)));
          imageUrls = [...imageUrls, ...uploaded];
        } catch (uploadErr: any) {
          console.error("Detailed Upload Failure:", uploadErr);
          const errorMessage = uploadErr.message || uploadErr.error_description || "Unknown Storage Error";
          if (errorMessage.includes('row-level security')) {
            throw new Error(`STORAGE_RLS_FAULT: Your node cannot write to 'broadcasts' bucket.\n\nFIX: Run this in Supabase SQL Editor:\n\nCREATE POLICY "Allow Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'broadcasts');`);
          }
          throw new Error(`MEDIA_UPLOAD_FAILED: ${errorMessage}`);
        }
      }

      const expiresAt = duration === 'indefinite' ? null : addHours(new Date(), parseInt(duration)).toISOString();

      const adData = {
        title: title.trim(),
        content: content.trim(),
        image_urls: imageUrls,
        product_ids: selectedProductIds,
        dealer_id: user.id,
        active: true,
        duration,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        const { error } = await supabase
          .from('offers')
          .update(adData)
          .eq('id', editingId);
        
        if (error) throw error;
        alert('SIGNAL_UPDATED: Transmission modified successfully.');
      } else {
        const { error } = await supabase
          .from('offers')
          .insert({
            ...adData,
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
        alert('SIGNAL_LIVE: Transmission broadcasted to all customer nodes.');
      }
      
      resetForm();
      setShowArchive(true);
    } catch (error: any) {
      console.error("Submission error detail:", error);
      if (error.message?.includes('row-level security')) {
         alert(`SECURITY_AUTH_FAULT: Broadcast node deactivated by firewall.\n\nFIX: Run this in Supabase SQL Editor:\n\nCREATE POLICY "Allow Auth Insert" ON public.offers FOR INSERT TO authenticated WITH CHECK (auth.uid() = dealer_id);`);
      } else {
         alert(`BROADCAST_FAILED: ${error.message || 'Check your internet connection and permissions.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setMediaFiles([]);
    setExistingImageUrls([]);
    setMediaPreviews([]);
    setUploadProgress({});
    setEditingId(null);
    setDuration('24');
    setSelectedProductIds([]);
    setProductSearchTerm('');
  };

  const startEdit = (offer: Offer) => {
    setTitle(offer.title);
    setContent(offer.content);
    setExistingImageUrls(offer.imageUrls || []);
    setDuration(offer.duration || '24');
    setSelectedProductIds(offer.product_ids || []);
    setEditingId(offer.id);
    setShowArchive(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleOfferStatus = async (id: string, current: boolean) => {
    await supabase
      .from('offers')
      .update({ active: !current })
      .eq('id', id);
  };

  const deleteOffer = async (id: string) => {
    if (confirm('Delete this broadcast archive?')) {
       await supabase
         .from('offers')
         .delete()
         .eq('id', id);
    }
  };

  const totalUploadProgress = mediaFiles.length > 0 
    ? (mediaFiles.reduce((acc, file) => acc + (uploadProgress[file.name] || 0), 0) / mediaFiles.length)
    : editingId ? 90 : 80;

  return (
    <div className="space-y-16 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-4">
           <div className="flex items-center gap-3 text-[#FF3E00]">
             <Megaphone className="w-5 h-5" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em]">Communications_Node</span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Broadcast<span className="text-white/20">.Archive</span></h1>
           <p className="text-[10px] uppercase tracking-widest text-white/40">Push high-frequency announcements to the platform Hub.</p>
        </div>

        <div className="flex gap-4">
           <button 
             onClick={() => setShowArchive(false)}
             className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${!showArchive ? 'bg-white text-black' : 'border-white/10 text-white/40'}`}
           >
             New_Broadcast
           </button>
           <button 
             onClick={() => setShowArchive(true)}
             className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${showArchive ? 'bg-white text-black' : 'border-white/10 text-white/40'}`}
           >
             Archive_Ledger
           </button>
        </div>
      </header>

      {!showArchive ? (
        <form onSubmit={handlePublish} className="space-y-12 bg-[#111] p-12 border border-white/10 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-black/99 z-50 flex flex-col items-center justify-center backdrop-blur-xl gap-8 animate-in fade-in duration-500">
               <div className="relative">
                  <div className="w-24 h-24 border-2 border-white/10 rounded-full" />
                  <div className="absolute inset-0 w-24 h-24 border-2 border-[#FF3E00] border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white/40">
                     {Math.round(totalUploadProgress)}%
                  </div>
               </div>
               <div className="space-y-4 text-center">
                  <div className="text-xl font-black uppercase tracking-[0.4em] text-white">Broadcasting_To_Hub</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#FF3E00] animate-pulse">
                    {mediaFiles.length > 0 ? `Uplinking Media Stream (${Object.keys(uploadProgress).length}/${mediaFiles.length})...` : 'Establishing secure frequency...'}
                  </div>
                  <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] max-w-[200px] mx-auto">Do not terminate connection until transmission is verified.</p>
               </div>
               <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${totalUploadProgress}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                    className="h-full bg-[#FF3E00]"
                  />
               </div>
               
               <button 
                 type="button"
                 onClick={() => window.location.reload()}
                 className="mt-12 px-6 py-3 bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-red-500 hover:border-red-500 transition-all"
               >
                 Abort_Transmission
               </button>
            </div>
          )}

          {editingId && (
            <div className="flex items-center gap-4 bg-[#FF3E00]/10 border border-[#FF3E00]/30 p-4 mb-4 animate-in fade-in slide-in-from-top-2">
              <Zap className="w-5 h-5 text-[#FF3E00]" />
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF3E00]">
                MODIFYING_EXISTING_TRANSMISSION: {editingId}
              </div>
              <button onClick={resetForm} className="ml-auto text-[10px] font-black uppercase tracking-widest text-[#FF3E00] hover:underline underline-offset-4">Cancel_Edit</button>
            </div>
          )}

          <div className="space-y-8">
             <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Existing Images (When Editing) */}
                {existingImageUrls.map((url, idx) => (
                  <div key={`existing-${idx}`} className="aspect-video bg-black border border-[#FF3E00]/30 relative group overflow-hidden">
                     {url.includes('video') ? <Video className="w-full h-full p-6 text-white/20" /> : <img src={url} className="w-full h-full object-cover grayscale opacity-50" />}
                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          type="button"
                          onClick={() => setExistingImageUrls(prev => prev.filter((_, i) => i !== idx))}
                          className="bg-red-500 text-white p-2 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                     </div>
                     <div className="absolute top-2 left-2 bg-[#FF3E00] text-black text-[7px] font-black px-1.5 py-0.5 uppercase">Persistent</div>
                  </div>
                ))}

                {mediaPreviews.map((preview, idx) => (
                  <div key={idx} className="aspect-video bg-black border border-white/10 relative group overflow-hidden">
                     {preview.type === 'video' ? (
                       <video src={preview.url} className="w-full h-full object-cover" />
                     ) : (
                       <img src={preview.url} className="w-full h-full object-cover" />
                     )}
                     
                     {/* Individual Progress Bar */}
                     {uploadProgress[mediaFiles[idx]?.name] > 0 && uploadProgress[mediaFiles[idx]?.name] < 100 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                           <div className="w-full h-1 bg-white/20 relative">
                              <div className="absolute left-0 top-0 h-full bg-[#FF3E00]" style={{ width: `${uploadProgress[mediaFiles[idx]?.name]}%` }} />
                           </div>
                        </div>
                     )}

                     <button 
                       type="button"
                       onClick={() => removeMedia(idx)}
                       className="absolute top-2 right-2 bg-red-500 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                     >
                       <X className="w-4 h-4" />
                     </button>
                     <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-black px-2 py-1 uppercase">
                        New_{preview.type}
                     </div>
                  </div>
                ))}
                
                {mediaPreviews.length + existingImageUrls.length < 5 && (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video bg-white/[0.02] border-2 border-dashed border-white/10 flex flex-col items-center justify-center hover:border-[#FF3E00]/50 transition-all group"
                  >
                     <Plus className="w-8 h-8 text-white/10 group-hover:text-[#FF3E00] mb-2" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Add_Media</span>
                  </button>
                )}
             </div>
             <input type="file" ref={fileInputRef} onChange={handleMediaChange} className="hidden" accept="image/*,video/*" multiple />
             <p className="text-[9px] uppercase tracking-widest text-white/20">Ingest high-impact visual advertisement streams. Supports images & videos (Max 10MB).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-12">
              <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Broadcast_Headline</label>
                  <input 
                      type="text" value={title} onChange={e => setTitle(e.target.value)} required
                      className="w-full bg-black border border-white/10 p-6 text-xl font-black uppercase tracking-widest focus:border-[#FF3E00] outline-none"
                      placeholder="E.G._MEGA_CLEARANCE_EVENT"
                  />
              </div>

              <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Transmission_Body</label>
                  <textarea 
                      value={content} onChange={e => setContent(e.target.value)} required
                      className="w-full bg-black border border-white/10 p-6 text-sm font-bold uppercase tracking-widest focus:border-[#FF3E00] outline-none min-h-[250px] leading-loose"
                      placeholder="WRITE_DEALER_ANNOUNCEMENT_MANIFEST..."
                  />
              </div>
            </div>

            <div className="space-y-12 bg-white/[0.01] p-8 border border-white/5 h-fit">
               <div className="space-y-6">
                  <div className="flex items-center gap-3 text-white/40">
                     <Calendar className="w-4 h-4 text-[#FF3E00]" />
                     <span className="text-[10px] font-black uppercase tracking-[0.3em]">Temporal_Control</span>
                  </div>
                  <div className="text-[9px] text-white/20 uppercase tracking-widest font-bold leading-relaxed">Define the survival duration of this signal. After expiration, the signal will self-destruct from active customer channels.</div>
                  
                  <div className="flex flex-col gap-3">
                     {[
                       { id: '1', label: '01 Hour Burst' },
                       { id: '6', label: '06 Hour Signal' },
                       { id: '24', label: '24 Hour Cycle' },
                       { id: '72', label: '72 Hour Event' },
                       { id: '168', label: '01 Week Campaign' },
                       { id: 'indefinite', label: 'Indefinite Loop' }
                     ].map((item) => (
                       <button 
                        key={item.id}
                        type="button"
                        onClick={() => setDuration(item.id)}
                        className={`w-full py-4 text-[10px] font-black uppercase tracking-widest border transition-all ${duration === item.id ? 'bg-[#FF3E00] border-[#FF3E00] text-black' : 'bg-black/40 border-white/10 text-white/40 hover:text-white'}`}
                       >
                         {item.label}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="p-6 border border-white/10 bg-black/40 space-y-4">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-[#FF3E00]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Signal_Summary</span>
                  </div>
                  <div className="space-y-2">
                     <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/20">
                        <span>Assets</span>
                        <span>{mediaPreviews.length + existingImageUrls.length}/05</span>
                     </div>
                     <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/20">
                        <span>Linked Products</span>
                        <span>{selectedProductIds.length}</span>
                     </div>
                     <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/20">
                        <span>Lifecycle</span>
                        <span>{duration === 'indefinite' ? 'Perpetual' : `${duration} Hours`}</span>
                     </div>
                  </div>
               </div>

               <div className="p-6 border border-white/10 bg-black/40 space-y-6">
                  <div className="flex items-center gap-3">
                    <Plus className="w-4 h-4 text-[#FF3E00]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Link_Inventory</span>
                  </div>
                  <div className="text-[8px] text-white/20 uppercase tracking-widest font-bold leading-relaxed">Select specific products to appear below this broadcast for customers.</div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="text"
                      placeholder="SEARCH_PRODUCTS..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-4 pl-10 text-[9px] font-black uppercase tracking-widest focus:border-[#FF3E00] outline-none"
                    />
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {dealerProducts
                      .filter(p => p.title.toLowerCase().includes(productSearchTerm.toLowerCase()))
                      .map(product => {
                        const isSelected = selectedProductIds.includes(product.id);
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => {
                              setSelectedProductIds(prev => 
                                isSelected 
                                  ? prev.filter(id => id !== product.id)
                                  : [...prev, product.id]
                              );
                            }}
                            className={`w-full p-4 flex items-center justify-between border transition-all ${
                              isSelected ? 'bg-[#FF3E00]/10 border-[#FF3E00]' : 'bg-black/20 border-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="text-left">
                              <div className={`text-[9px] font-black uppercase tracking-tight ${isSelected ? 'text-[#FF3E00]' : 'text-white'}`}>
                                {product.title}
                              </div>
                              <div className="text-[7px] font-bold text-white/20 uppercase tracking-widest">
                                ₹{product.price.toLocaleString()} • {product.category}
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FF3E00]" />}
                          </button>
                        );
                      })
                    }
                  </div>

                  {selectedProductIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                      <span className="text-[7px] font-black uppercase tracking-widest text-[#FF3E00]">Selected:</span>
                      {selectedProductIds.slice(0, 3).map(id => {
                        const p = dealerProducts.find(prod => prod.id === id);
                        return (
                          <span key={id} className="bg-white/5 px-2 py-1 text-[7px] font-bold uppercase tracking-tight text-white/40">
                            {p?.title}
                          </span>
                        );
                      })}
                      {selectedProductIds.length > 3 && (
                        <span className="bg-white/5 px-2 py-1 text-[7px] font-bold uppercase tracking-tight text-white/40">
                          +{selectedProductIds.length - 3} More
                        </span>
                      )}
                    </div>
                  )}
               </div>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-[#FF3E00] text-black py-8 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-xl shadow-[#FF3E00]/10"
          >
            {loading ? (
              <div className="flex items-center gap-6">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>UPDATING_PLATFORM_CORE...</span>
              </div>
            ) : (
              <><Send className="w-5 h-5" /> {editingId ? 'COMMIT_CHANGES_TO_STREAM' : 'INITIALISE_PLATFORM_BROADCAST'}</>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-16">
           {/* Section 1: Live Signals */}
           <section className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-2 h-2 bg-[#FF3E00] rounded-full animate-ping" />
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF3E00]">Active_Transmissions</span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                 {offers.filter(o => o.active && (!o.expiresAt || isAfter(parseISO(o.expiresAt), new Date()))).length === 0 ? (
                    <div className="p-20 text-center border border-dashed border-white/5 bg-white/[0.01]">
                       <p className="text-[10px] uppercase tracking-[0.4em] text-white/10 font-black italic">No active frequency detected.</p>
                    </div>
                 ) : (
                    offers.filter(o => o.active && (!o.expiresAt || isAfter(parseISO(o.expiresAt), new Date()))).map(offer => (
                      <BroadcastCard 
                        key={offer.id} 
                        offer={offer} 
                        onEdit={startEdit}
                        onToggle={toggleOfferStatus}
                        onDelete={deleteOffer}
                      />
                    ))
                 )}
              </div>
           </section>

           {/* Section 2: Archive */}
           <section className="space-y-8 opacity-50 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-4">
                 <div className="w-2 h-2 bg-white/20 rounded-full" />
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Deactivated_Archive</span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                 {offers.filter(o => !o.active || (o.expiresAt && !isAfter(parseISO(o.expiresAt), new Date()))).map(offer => (
                    <BroadcastCard 
                      key={offer.id} 
                      offer={offer} 
                      onEdit={startEdit}
                      onToggle={toggleOfferStatus}
                      onDelete={deleteOffer}
                      isArchived 
                    />
                 ))}
              </div>
           </section>
        </div>
      )}
    </div>
  );
}

interface BroadcastCardProps {
  key?: React.Key;
  offer: Offer;
  isArchived?: boolean;
  onEdit: (offer: Offer) => void;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}

function BroadcastCard({ offer, isArchived = false, onEdit, onToggle, onDelete }: BroadcastCardProps) {
  const isExpired = offer.expiresAt && !isAfter(parseISO(offer.expiresAt), new Date());
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/[0.02] border border-white/10 p-8 flex flex-col gap-12 group hover:bg-white/[0.04] transition-all relative overflow-hidden ${isArchived ? 'grayscale' : ''}`}
    >
      {!isArchived && offer.expiresAt && (
         <div className="absolute top-0 right-0 p-2 px-4 bg-white/5 border-l border-b border-white/10 text-[8px] font-black uppercase tracking-widest text-[#FF3E00] flex items-center gap-2">
            <Clock className="w-3 h-3" /> Expires: {format(parseISO(offer.expiresAt), 'MMM dd, HH:mm')}
         </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-8 w-full md:w-auto">
            <div className={`w-16 h-16 flex items-center justify-center border-2 ${offer.active && !isExpired ? 'border-[#FF3E00] bg-[#FF3E00]/10' : 'border-white/5 bg-white/5'}`}>
                {offer.active && !isExpired ? <ShieldCheck className="w-8 h-8 text-[#FF3E00]" /> : <ShieldAlert className="w-8 h-8 text-white/10" />}
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black uppercase tracking-tight">{offer.title}</h3>
                  {offer.active && !isExpired && <span className="bg-[#FF3E00] text-black text-[8px] font-black px-2 py-0.5 uppercase flex items-center gap-1"><Zap className="w-2 h-2" /> Live</span>}
                  {isExpired && <span className="bg-red-500/20 text-red-500 text-[8px] font-black px-2 py-0.5 uppercase border border-red-500/30">Expired</span>}
                </div>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest max-w-xl truncate">{offer.content}</p>
            </div>
          </div>

          <div className="flex items-center gap-12 w-full md:w-auto justify-between md:justify-end">
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest text-right">
                  <Clock className="w-3 h-3" />
                  Transmission_Init: {format(parseISO(offer.createdAt), 'PP p')}
                </div>
                <div className="text-[8px] font-black text-white/10 uppercase tracking-[0.2em]">NodeID: {offer.id.slice(0, 8)}</div>
            </div>

            <div className="flex items-center gap-4">
                <button 
                  onClick={() => onEdit(offer)}
                  className="p-3 bg-white/5 border border-white/10 text-white/20 hover:text-white hover:border-white transition-all"
                  title="Edit Broadcast"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => onToggle(offer.id, offer.active)}
                  className={`px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                    offer.active ? 'border-[#FF3E00] text-[#FF3E00] hover:bg-[#FF3E00] hover:text-black' : 'border-white/10 text-white/40 hover:border-white'
                  }`}
                >
                  {offer.active ? 'Disable' : 'Enable'}
                </button>
                <button 
                  onClick={() => onDelete(offer.id)}
                  className="text-white/20 hover:text-red-500 transition-colors p-3"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
            </div>
          </div>
      </div>

      {offer.imageUrls && offer.imageUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-8 border-t border-white/5">
            {offer.imageUrls.map((url, i) => (
                <div key={i} className="aspect-square bg-black border border-white/5 relative group/media overflow-hidden">
                  {url.includes('.mp4') || url.includes('video') ? (
                    <video src={url} className="w-full h-full object-cover grayscale group-hover/media:grayscale-0" muted loop onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} />
                  ) : (
                    <img src={url} className="w-full h-full object-cover grayscale group-hover/media:grayscale-0" />
                  )}
                </div>
            ))}
        </div>
      )}
    </motion.div>
  );
}
