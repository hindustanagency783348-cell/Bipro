/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IndianRupee, PieChart as PieChartIcon, TrendingUp, DollarSign, Wallet, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { cn } from '../lib/utils';

const PROJECTION_DATA = [
  { month: 'M1', revenue: 5000, visitors: 1000 },
  { month: 'M2', revenue: 12000, visitors: 3000 },
  { month: 'M3', revenue: 35000, visitors: 8000 },
  { month: 'M4', revenue: 85000, visitors: 20000 },
  { month: 'M5', revenue: 190000, visitors: 45000 },
  { month: 'M6', revenue: 450000, visitors: 100000 },
];

export default function MonetizationView() {
  return (
    <div className="space-y-24">
      <header className="flex flex-col">
        <div className="flex items-center space-x-4 mb-4">
          <span className="w-12 h-[1px] bg-[#FF3E00]"></span>
          <span className="text-[10px] uppercase tracking-[0.5em] text-[#FF3E00] font-bold italic">Phase 05 / monetisation</span>
        </div>
        <h2 className="text-[140px] leading-[0.75] font-black uppercase tracking-[-0.06em] m-0 p-0 mb-8">
          SCALE<br/>
          <span className="text-transparent" style={{ webkitTextStroke: '2px #F5F5F5' }}>REVENUE.</span>
        </h2>
        <p className="text-[14px] uppercase tracking-widest text-white/40 max-w-xl leading-relaxed">
          Flipkart affiliate is your core engine. Layer additional streams as traffic grows to build a bulletproof revenue machine.
        </p>
      </header>

      {/* Commission Rates */}
      <section>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[#FF3E00] mb-12">
          [ FLIPKART_COMMISSION_STRUCTURE ]
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/10">
          {[
            { label: "Electronics / Mob", rate: "4-8%" },
            { label: "Fashion / Life", rate: "10-15%" },
            { label: "Home / Appliances", rate: "6-10%" },
            { label: "Beauty / Personal", rate: "8-12%" },
          ].map((cat) => (
            <div key={cat.label} className="border-r border-b border-white/10 p-10 hover:bg-white/[0.01]">
              <div className="text-4xl font-black text-[#FF3E00] tracking-tighter">{cat.rate}</div>
              <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-6">{cat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Revenue Projections Chart */}
      <section>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[#FF3E00] mb-12">
          [ GROWTH_PROJECTION ]
        </div>
        <div className="bg-[#0A0A0A] border border-white/10 p-12 overflow-hidden relative">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h4 className="text-2xl font-black uppercase tracking-tighter">Performance Trajectory</h4>
              <p className="text-[10px] uppercase tracking-widest text-white/20 mt-2">Est. monthly revenue (INR)</p>
            </div>
            <div className="bg-[#FF3E00] text-black text-[10px] font-black px-4 py-2 tracking-widest">LIVE_PROJECTION</div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PROJECTION_DATA}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF3E00" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#FF3E00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.2)' }}
                  dy={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.2)' }}
                  tickFormatter={(value) => `₹${value >= 1000 ? value / 1000 + 'k' : value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0' }}
                  itemStyle={{ color: '#FF3E00', fontWeight: 'bold' }}
                />
                <Area type="stepAfter" dataKey="revenue" stroke="#FF3E00" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Revenue Streams */}
      <section>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[#FF3E00] mb-12">
          [ LAYERED_REVENUE_STREAMS ]
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 border border-white/10">
          {[
            { title: "FK Affiliate", tag: "CORE", desc: "Primary engine. Link products across reviews, comparisons, and deals hub." },
            { title: "Direct Deals", tag: "GROWTH", desc: "Partner with brands for fixed-fee featured spots or exclusive coupons." },
            { title: "Display Ads", tag: "SCALE", desc: "Unlock passive income once traffic crosses 50k sessions via AdSense or Mediavine." }
          ].map((stream) => (
            <div key={stream.title} className="p-12 border-r last:border-r-0 border-white/10 group hover:bg-[#FF3E00]/[0.02]">
              <div className="flex justify-between items-center mb-8">
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#FF3E00] border border-[#FF3E00]/40 px-3 py-1">{stream.tag}</span>
                 <ArrowUpRight className="w-5 h-5 text-white/10 group-hover:text-[#FF3E00] transition-colors" />
              </div>
              <h4 className="text-2xl font-black uppercase tracking-tight mb-4">{stream.title}</h4>
              <p className="text-sm text-white/40 leading-relaxed font-medium">{stream.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
