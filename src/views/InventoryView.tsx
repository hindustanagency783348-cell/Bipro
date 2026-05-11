import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Plus, Upload, Tag, Search, FileText, CheckCircle2, AlertCircle, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Category {
  id: string;
  name: string;
}

export default function InventoryView() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Staging Area State
  const [stagedProducts, setStagedProducts] = useState<any[]>([]);
  const [isStaging, setIsStaging] = useState(false);

  // Image Upload State
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Upload State
  const [showBulk, setShowBulk] = useState(false);
  const [activeTab, setActiveTab] = useState<'manage' | 'manual' | 'bulk'>('manage');
  const [bulkStatus, setBulkStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setInitialLoading(true);

      // Fetch Products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('dealer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (productsData) setProducts(productsData);

      // Fetch Categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (categoriesData) setCategories(categoriesData);

      setInitialLoading(false);
    };

    fetchData();

    // Subscription for products
     const subscription = supabase
      .channel('products-view-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 5) return alert("Maximum 5 visual assets allowed per unit.");
    
    const validFiles = files.filter((file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (Max 5MB)`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid optical asset.`);
        return false;
      }
      return true;
    });

    setImageFiles(prev => [...prev, ...validFiles]);
    const newPreviews = validFiles.map((file: File) => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const path = `${timestamp}_${safeName}`;

    setUploadProgress(20);

    const { data, error } = await supabase.storage
      .from('products')
      .upload(path, file);

    if (error) throw error;

    setUploadProgress(100);

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(path);

    return publicUrl;
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return alert("Missing required fields: PRODUCT_NAME and VALUATION required.");
    
    // In edit mode we might have existing previews but no new files
    if (!editingId && imageFiles.length === 0) return alert("Visual Asset required for new unit.");
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("AUTH_REQUIRED");

      let finalUrls = [...imagePreviews.filter(url => url.startsWith('http'))];
      
      if (imageFiles.length > 0) {
        try {
          const newUrls = await Promise.all(
            imageFiles.map(file => uploadImage(file))
          );
          finalUrls = [...finalUrls, ...newUrls];
        } catch (uploadErr: any) {
          console.error("Storage Fault:", uploadErr);
          if (uploadErr.message?.includes('row-level security')) {
            throw new Error(`STORAGE_RLS_FAULT: Access denied to 'products' bucket.\n\nFIX: Run this in Supabase SQL Editor:\n\nCREATE POLICY "Allow Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');`);
          }
          throw uploadErr;
        }
      }

      const data = {
        title: title.trim(),
        price: Number(price),
        description: description.trim(),
        category: category || 'UNCATEGORIZED',
        image_url: finalUrls[0] || 'https://placehold.co/600x400/111/white?text=AWAITING_ASSET',
        image_urls: finalUrls,
        dealer_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', editingId);
        
        if (error) throw error;
        alert('Unit specifications updated in fleet.');
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            ...data,
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
        alert('Product successfully committed to system.');
      }
      
      resetForm();
      setActiveTab('manage');
    } catch (error: any) {
      console.error("System Fault:", error);
      if (error.message?.includes('row-level security')) {
        alert(`SECURITY_AUTH_FAULT: Your administrative node does not have permission to write to this sector.\n\nFIX: Run this in Supabase SQL Editor:\n\nCREATE POLICY "Allow Auth Insert" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = dealer_id);`);
      } else {
        alert(`Critical transmission failure: ${error.message || 'Unknown Error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName) return;
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newCategoryName.toUpperCase(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;

      const newCat = { id: data.id, name: data.name };
      setCategories(prev => [...prev, newCat]);
      setCategory(newCat.name);
      setNewCategoryName('');
      setShowNewCategory(false);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to create category: ${err.message}`);
    }
  };

  const resetForm = () => {
    setTitle('');
    setPrice('');
    setDescription('');
    setCategory('');
    setImageFiles([]);
    setImagePreviews([]);
    setUploadProgress(0);
    setEditingId(null);
  };

  const startEdit = (product: any) => {
    setEditingId(product.id);
    setTitle(product.title);
    setPrice(product.price.toString());
    setDescription(product.description || '');
    setCategory(product.category || '');
    setImagePreviews(product.image_urls || [product.image_url]);
    setImageFiles([]);
    setActiveTab('manual');
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Decommission this unit from active service?')) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) alert(`Failed to delete product: ${error.message}`);
    }
  };

  const processBulkFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBulkStatus('processing');
    try {
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1] || '';
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });

      const prompt = `
        Analyze this document/file and extract product information. 
        Return a JSON array of objects. Each object MUST have:
        - title (string, the product name)
        - price (number, numeric value only)
        - description (string, tech specs or details)
        - category (string, best guess category)

        If the file is an image or PDF, perform OCR first. If it's Excel/CSV, parse the data.
        Return ONLY valid JSON.
      `;

      const response = await fetch('/api/analyze-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData, mimeType: file.type, prompt })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server processing fault');
      }
      
      const parsedData = await response.json();
      
      setStagedProducts(parsedData.map((p: any, idx: number) => ({ ...p, tempId: idx })));
      setIsStaging(true);
      setBulkStatus('success');
    } catch (error: any) {
      console.error(error);
      alert(`AI_ANALYSIS_FAILURE: ${error.message}`);
      setBulkStatus('error');
    }
  };

  const confirmStagedImport = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("AUTH_REQUIRED");

      const itemsToInsert = stagedProducts.map(item => ({
        title: item.title,
        price: Number(item.price),
        description: item.description,
        category: item.category,
        image_url: 'https://placehold.co/600x400/111/white?text=Invoiced_Asset',
        dealer_id: user.id,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('products')
        .insert(itemsToInsert);

      if (error) throw error;

      setStagedProducts([]);
      setIsStaging(false);
      setActiveTab('manage');
      alert('Batch import successful.');
    } catch (err: any) {
      console.error(err);
      alert(`Bulk import failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateStagedItem = (tempId: number, field: string, value: any) => {
    setStagedProducts(prev => prev.map(p => 
      p.tempId === tempId ? { ...p, [field]: value } : p
    ));
  };

  const removeStagedItem = (tempId: number) => {
    setStagedProducts(prev => prev.filter(p => p.tempId !== tempId));
  };

  return (
    <div className="space-y-16 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-4">
           <div className="flex items-center gap-3 text-[#FF3E00]">
             <Package className="w-5 h-5" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em]">Fleet_Management</span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Inventory<span className="text-white/20">.Ops</span></h1>
           <p className="text-[10px] uppercase tracking-widest text-white/40">Register single units or ingest bulk asset streams.</p>
        </div>

        <div className="flex flex-wrap gap-4">
           <button 
             onClick={() => setActiveTab('manage')}
             className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${activeTab === 'manage' ? 'bg-white text-black' : 'border-white/10 text-white/40 hover:border-white/20'}`}
           >
             Manage_Units
           </button>
           <button 
             onClick={() => { resetForm(); setActiveTab('manual'); }}
             className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${activeTab === 'manual' ? 'bg-white text-black' : 'border-white/10 text-white/40 hover:border-white/20'}`}
           >
             {editingId ? 'Edit_Unit' : 'Manual_Entry'}
           </button>
           <button 
             onClick={() => setActiveTab('bulk')}
             className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${activeTab === 'bulk' ? 'bg-white text-black' : 'border-white/10 text-white/40 hover:border-white/20'}`}
           >
             Bulk_Ingest
           </button>
        </div>
      </header>

      {activeTab === 'manage' && (
        <div className="grid grid-cols-1 gap-px bg-white/10 border border-white/10">
           {products.length === 0 ? (
             <div className="p-24 text-center bg-black border border-dashed border-white/5">
                <span className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-black">Fleet is currently empty.</span>
             </div>
           ) : (
             products.map((p: any) => (
               <motion.div 
                 layout
                 key={p.id}
                 className="bg-black p-8 flex flex-col md:flex-row items-center justify-between gap-12 group hover:bg-white/[0.02]"
               >
                  <div className="flex items-center gap-8 w-full md:w-auto">
                    <div className="w-24 h-24 bg-white/5 border border-white/10 overflow-hidden relative shrink-0">
                       <img referrerPolicy="no-referrer" src={p.image_url} className="w-full h-full object-cover grayscale opacity-50 group-hover:opacity-100 group-hover:grayscale-0 transition-all" />
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black text-[#FF3E00] uppercase tracking-widest">{p.category || 'Standard'}</span>
                         <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest">ID: {p.id.slice(0, 8)}</span>
                       </div>
                       <h3 className="text-xl font-black uppercase tracking-tight">{p.title}</h3>
                       <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">₹{p.price.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 w-full md:w-auto">
                    <button 
                      onClick={() => startEdit(p)}
                      className="flex-1 md:flex-none h-14 px-8 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black hover:border-white transition-all flex items-center justify-center gap-3"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button 
                      onClick={() => deleteProduct(p.id)}
                      className="flex-1 md:flex-none h-14 px-8 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex items-center justify-center gap-3"
                    >
                      <Trash2 className="w-4 h-4" /> Decommission
                    </button>
                  </div>
               </motion.div>
             ))
           )}
        </div>
      )}

      {activeTab === 'manual' && (
        <form onSubmit={handleManualAdd} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-12 space-y-6">
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreviews.map((url, idx) => (
                  <div key={idx} className="aspect-square bg-white/[0.02] border border-white/10 relative group overflow-hidden">
                     <img referrerPolicy="no-referrer" src={url} className="w-full h-full object-cover" />
                     <button 
                       type="button"
                       onClick={() => removeImage(idx)}
                       className="absolute top-2 right-2 bg-red-500 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                ))}
                
                {imagePreviews.length < 5 && (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square bg-white/[0.02] border-2 border-dashed border-white/10 flex flex-col items-center justify-center hover:border-[#FF3E00]/50 transition-all group"
                  >
                     <Plus className="w-8 h-8 text-white/10 group-hover:text-[#FF3E00] mb-2" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Add_Image</span>
                  </button>
                )}
             </div>
             <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" multiple />
             <p className="text-[9px] uppercase tracking-widest text-white/20">Max 5 units of high-frequency industrial optics. Order matters for catalog display.</p>
          </div>

          {/* Configuration */}
          <div className="lg:col-span-12 space-y-8 bg-[#111] p-6 sm:p-12 border border-white/10 relative">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Product Name</label>
                   <input 
                     type="text" value={title} onChange={e => setTitle(e.target.value)} required
                     className="w-full bg-black border border-white/10 p-5 text-sm font-black uppercase tracking-widest focus:border-[#FF3E00] outline-none"
                     placeholder="E.G. TURBO_VALVE_X1"
                   />
                </div>
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Category</label>
                      <button 
                        type="button"
                        onClick={() => setShowNewCategory(!showNewCategory)}
                        className="text-[8px] font-black uppercase tracking-widest text-[#FF3E00] hover:underline"
                      >
                        {showNewCategory ? '[CLOSE]' : '[CREATE_NEW]'}
                      </button>
                   </div>
                   
                   <AnimatePresence>
                      {showNewCategory ? (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex gap-2"
                        >
                           <input 
                             type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                             className="flex-1 bg-black border border-[#FF3E00]/30 p-4 text-[10px] font-black uppercase outline-none focus:border-[#FF3E00]"
                             placeholder="NEW_CATEGORY_NAME..."
                           />
                           <button 
                             type="button"
                             onClick={createCategory}
                             className="bg-[#FF3E00] text-black px-4 text-[10px] font-black uppercase"
                           >
                             ADD
                           </button>
                        </motion.div>
                      ) : (
                        <select 
                          value={category} onChange={e => setCategory(e.target.value)} required
                          className="w-full bg-black border border-white/10 p-5 text-sm font-black uppercase tracking-widest focus:border-[#FF3E00] outline-none"
                        >
                          <option value="">SELECT_CATEGORY</option>
                          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      )}
                   </AnimatePresence>
                </div>
             </div>

             <div className="space-y-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Valuation (INR)</label>
                <input 
                  type="number" value={price} onChange={e => setPrice(e.target.value)} required
                  className="w-full bg-black border border-white/10 p-5 text-2xl font-black uppercase tracking-tighter focus:border-[#FF3E00] outline-none"
                  placeholder="0.00"
                />
             </div>

             <div className="space-y-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Technical Summary</label>
                <textarea 
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full bg-black border border-white/10 p-5 text-xs font-medium uppercase tracking-[0.2em] focus:border-[#FF3E00] outline-none min-h-[120px]"
                  placeholder="SPECIFICATIONS_MANIFEST..."
                />
             </div>

             <button 
               type="submit"
               disabled={loading}
               className="w-full bg-[#FF3E00] text-black py-8 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-4"
             >
                {loading ? (
                  <>Processing...</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> Submit</>
                )}
             </button>
          </div>
        </form>
      )}

      {activeTab === 'bulk' && (
        <div className="space-y-12">
           {!isStaging ? (
              <div className="bg-[#111] p-12 border border-white/10 space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#FF3E00]/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#FF3E00]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black uppercase tracking-tight">AI_Ingestion_Core</h3>
                      <p className="text-[10px] uppercase tracking-widest text-white/20">Upload Excel, PDF, or scanned invoices for automatic inventory mapping.</p>
                    </div>
                </div>

                <div className="border-2 border-dashed border-white/10 p-12 text-center relative group hover:border-[#FF3E00]/30 transition-all">
                   <input 
                     type="file" 
                     className="absolute inset-0 opacity-0 cursor-pointer" 
                     accept=".xlsx,.pdf,.jpg,.jpeg,.png,.csv"
                     onChange={processBulkFile}
                   />
                   <Upload className="w-12 h-12 text-white/10 mx-auto mb-4 group-hover:text-[#FF3E00] transition-colors" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Drop payload files here or click to browse</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="p-6 bg-white/[0.02] border border-white/5 space-y-2">
                      <span className="text-[8px] font-black text-[#FF3E00] uppercase tracking-widest">Excel / CSV</span>
                      <p className="text-[10px] font-bold text-white/30 uppercase leading-relaxed">Direct data mapping for large catalogs.</p>
                   </div>
                   <div className="p-6 bg-white/[0.02] border border-white/5 space-y-2">
                      <span className="text-[8px] font-black text-[#FF3E00] uppercase tracking-widest">PDF Documents</span>
                      <p className="text-[10px] font-bold text-white/30 uppercase leading-relaxed">Full OCR extraction for supplier invoices.</p>
                   </div>
                   <div className="p-6 bg-white/[0.02] border border-white/5 space-y-2">
                      <span className="text-[8px] font-black text-[#FF3E00] uppercase tracking-widest">JPG / PNG Scans</span>
                      <p className="text-[10px] font-bold text-white/30 uppercase leading-relaxed">Visual intelligence for handwritten menus.</p>
                   </div>
                </div>

                {bulkStatus === 'processing' && (
                  <div className="p-12 text-center bg-black/50 border border-[#FF3E00]/20 animate-pulse">
                     <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF3E00]">Gemini_AI: Analysing_Contextual_Data...</span>
                  </div>
                )}
              </div>
           ) : (
              <div className="space-y-12">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <h2 className="text-3xl font-black uppercase tracking-tighter">Staging_Grid<span className="text-white/20">.Audit</span></h2>
                       <p className="text-[10px] uppercase tracking-widest text-white/40">Review and verify AI extraction results before database commitment.</p>
                    </div>
                    <div className="flex gap-4">
                       <button 
                         onClick={() => { setStagedProducts([]); setIsStaging(false); }}
                         className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white"
                       >
                         Discard_Stream
                       </button>
                       <button 
                         onClick={confirmStagedImport}
                         disabled={loading}
                         className="bg-[#FF3E00] text-black px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-[#FF3E00]/20"
                       >
                         {loading ? 'Transmitting...' : 'Confirm_&_Import_Units'}
                       </button>
                    </div>
                 </div>

                 <div className="bg-[#111] border border-white/10 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="border-b border-white/10 uppercase tracking-widest">
                             <th className="p-6 text-[9px] font-black text-white/30">Unit_Identity</th>
                             <th className="p-6 text-[9px] font-black text-white/30">Category</th>
                             <th className="p-6 text-[9px] font-black text-white/30">Valuation</th>
                             <th className="p-6 text-[9px] font-black text-white/30">Specs</th>
                             <th className="p-6 text-[9px] font-black text-white/30">Action</th>
                          </tr>
                       </thead>
                       <tbody>
                          {stagedProducts.map((p) => (
                             <tr key={p.tempId} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <td className="p-6">
                                   <input 
                                     value={p.title} 
                                     onChange={(e) => updateStagedItem(p.tempId, 'title', e.target.value)}
                                     className="bg-transparent border-none text-white font-black uppercase text-sm outline-none w-full"
                                   />
                                </td>
                                <td className="p-6">
                                   <input 
                                     value={p.category} 
                                     onChange={(e) => updateStagedItem(p.tempId, 'category', e.target.value)}
                                     className="bg-transparent border-none text-white/60 font-bold uppercase text-[10px] outline-none w-full"
                                   />
                                </td>
                                <td className="p-6">
                                   <div className="flex items-center gap-2">
                                      <span className="text-[#FF3E00] font-black">₹</span>
                                      <input 
                                        type="number"
                                        value={p.price} 
                                        onChange={(e) => updateStagedItem(p.tempId, 'price', e.target.value)}
                                        className="bg-transparent border-none text-white font-black text-lg outline-none w-32"
                                      />
                                   </div>
                                </td>
                                <td className="p-6">
                                   <input 
                                     value={p.description} 
                                     onChange={(e) => updateStagedItem(p.tempId, 'description', e.target.value)}
                                     className="bg-transparent border-none text-white/30 font-medium uppercase text-[10px] outline-none w-full italic"
                                     placeholder="NO_SPECS"
                                   />
                                </td>
                                <td className="p-6">
                                   <button 
                                     onClick={() => removeStagedItem(p.tempId)}
                                     className="text-white/20 hover:text-red-500 transition-colors"
                                   >
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}
        </div>
      )}
    </div>
  );
}
