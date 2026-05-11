/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Star, GitCompare, Zap, Trophy, TrendingDown, Layout } from 'lucide-react';
import { PAGE_TYPES } from '../constants';
import { cn } from '../lib/utils';

const iconMap: Record<string, any> = {
  Home, Star, GitCompare, Zap, Trophy, TrendingDown
};

export default function ArchitectureView() {
  return (
    <div className="space-y-24">
      <header className="flex flex-col">
        <div className="flex items-baseline space-x-4 mb-4">
          <span className="w-12 h-[1px] bg-[#FF3E00]"></span>
          <span className="text-[10px] uppercase tracking-[0.5em] text-[#FF3E00] font-bold italic">Phase 02 / Archive</span>
        </div>
        <h2 className="text-[120px] leading-[0.75] font-black uppercase tracking-[-0.06em] m-0 p-0 mb-8">
          ARCHITECT.<br/>
          <span className="text-transparent" style={{ webkitTextStroke: '2px #F5F5F5' }}>SYSTEM.</span>
        </h2>
        <p className="text-[14px] uppercase tracking-widest text-white/40 max-w-xl leading-relaxed">
          The blueprint of high conversion. Every page is a dedicated node in the conversion cluster.
        </p>
      </header>

      {/* Page Types Grid */}
      <section>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[#FF3E00] mb-12">
          [ NODE_DEFINITIONS ]
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 border border-white/10">
          {PAGE_TYPES.map((page) => {
            return (
              <div key={page.title} className="p-12 border-r border-b border-white/10 group flex flex-col justify-between min-h-[340px] hover:bg-white/[0.01]">
                <div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter mb-8 group-hover:text-[#FF3E00] transition-colors">{page.title}</h4>
                  <ul className="space-y-4">
                    {page.roles.map((role) => (
                      <li key={role} className="flex items-center gap-4 text-xs font-medium text-white/40 uppercase tracking-widest leading-none">
                        <span className="w-1.5 h-[1px] bg-[#FF3E00]" />
                        {role}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Wireframe Section */}
      <section>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[#FF3E00] mb-12">
          [ STRUCTURAL_WIREFRAME ]
        </div>
        
        <div className="bg-[#111] border border-white/10 p-12 overflow-hidden relative group">
          <div className="absolute inset-0 opacity-[0.03] brutalist-grid pointer-events-none" />
          <div className="relative z-10 space-y-12">
            {/* Header Mockup */}
            <div className="flex items-center justify-between border-b border-white/10 pb-6 text-[10px] font-black tracking-widest grayscale group-hover:grayscale-0 transition-all">
              <div className="flex gap-4">
                <span className="text-[#FF3E00]">FKP_LOGO</span>
                <span className="opacity-20">|</span>
                <span className="opacity-40">CATALOGUE_V0</span>
              </div>
              <div className="flex gap-8 opacity-40">
                <span>REVIEWS</span>
                <span>DEALS</span>
                <span>COMPARE</span>
              </div>
              <div className="bg-[#FF3E00] text-black px-4 py-2">CONNECT</div>
            </div>

            {/* Hero Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="md:col-span-3 space-y-8">
                <div className="text-[10px] font-black text-[#FF3E00] tracking-widest uppercase">/ / Featured_Engine</div>
                <div className="h-64 border-4 border-white/10 bg-[#050505] flex items-center justify-center relative overflow-hidden group-hover:border-[#FF3E00]/40 transition-colors">
                  <div className="text-8xl font-black text-white/5 opacity-40 absolute select-none">HERO_UNIT</div>
                  <div className="z-10 text-center">
                    <h5 className="text-2xl font-black uppercase tracking-tighter mb-4">iPhone 16 Pro Max</h5>
                    <div className="bg-[#FF3E00] text-black text-[10px] font-black px-6 py-2 tracking-widest inline-block">INITIATE BUY</div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                 {[1,2].map(i => (
                    <div key={i} className="p-6 border border-white/10 bg-[#050505] space-y-4">
                       <div className="w-8 h-[1px] bg-[#FF3E00]" />
                       <div className="text-[10px] font-black uppercase tracking-widest text-white/20">Slot_{i}</div>
                       <div className="h-1 bg-white/10 w-full" />
                       <div className="h-1 bg-white/10 w-2/3" />
                    </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
