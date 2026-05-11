import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tag, Plus, Trash2, Edit3, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function CategoryView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', description: '' });

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setCategories(data);
      setLoading(false);
    };

    fetchData();

    const subscription = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          ...newCat,
          name: newCat.name.trim().toUpperCase(),
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;

      setNewCat({ name: '', description: '' });
      setIsAdding(false);
    } catch (err: any) {
      console.error(err);
      alert(`Error creating category: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? This might affect products using this category.')) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) alert(`Error deleting category: ${error.message}`);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-3 text-[#FF3E00]">
             <Tag className="w-5 h-5" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em]">Structure</span>
           </div>
           <h1 className="text-5xl font-black uppercase tracking-tighter">Inventory<span className="text-white/20">.Classes</span></h1>
           <p className="text-[10px] uppercase tracking-widest text-white/40">Define product organizational taxonomies.</p>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="bg-white text-black px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#FF3E00] transition-all flex items-center gap-3 shadow-xl"
        >
          <Plus className="w-4 h-4" />
          Create_Category
        </button>
      </header>

      {isAdding && (
        <motion.form 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAdd}
          className="bg-[#111] border border-white/10 p-8 space-y-6"
        >
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                 <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em]">Category Name</label>
                 <input 
                   autoFocus
                   required
                   value={newCat.name}
                   onChange={e => setNewCat({...newCat, name: e.target.value})}
                   className="w-full bg-black border border-white/10 px-6 py-4 text-xs font-black uppercase tracking-widest focus:border-[#FF3E00] outline-none"
                   placeholder="E.G._AIR_CONDITIONERS"
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em]">Description (Optional)</label>
                 <input 
                   value={newCat.description}
                   onChange={e => setNewCat({...newCat, description: e.target.value})}
                   className="w-full bg-black border border-white/10 px-6 py-4 text-xs font-black uppercase tracking-widest focus:border-[#FF3E00] outline-none"
                   placeholder="SYSTEM_SPECIFICATIONS..."
                 />
              </div>
           </div>
           <div className="flex justify-end gap-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white">Cancel</button>
              <button type="submit" className="bg-[#FF3E00] text-black px-12 py-4 text-[10px] font-black uppercase tracking-[0.3em]">Initialise_Category</button>
           </div>
        </motion.form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {categories.map((cat) => (
           <div key={cat.id} className="bg-white/[0.02] border border-white/5 p-8 space-y-6 group hover:border-[#FF3E00]/30 transition-all">
              <div className="space-y-2">
                 <h3 className="text-xl font-black uppercase tracking-tight">{cat.name}</h3>
                 <p className="text-[10px] text-white/30 uppercase leading-loose tracking-widest h-10 overflow-hidden">{cat.description || 'No description provided.'}</p>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                 <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.2em]">{new Date(cat.created_at).toLocaleDateString()}</span>
                 <button 
                   onClick={() => handleDelete(cat.id)}
                   className="text-white/20 hover:text-red-500 transition-colors p-2"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
