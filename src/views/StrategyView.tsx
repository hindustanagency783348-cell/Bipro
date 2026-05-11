/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Target, Layers, Share2, MousePointer2, IndianRupee } from 'lucide-react';
import { CORE_STATS, FUNNEL_STEPS } from '../constants';
import { cn } from '../lib/utils';

export default function StrategyView() {
  return (
    <div className="space-y-24">
      <header className="flex flex-col">
        <div className="flex items-center space-x-4 mb-4">
          <span className="w-12 h-[1px] bg-[#FF3E00]"></span>
          <span className="text-[10px] uppercase tracking-[0.5em] text-[#FF3E00] font-bold italic">Phase 01 / Strategy</span>
        </div>
        <h2 className="text-[140px] leading-[0.75] font-black uppercase tracking-[-0.06em] m-0 p-0 mb-8">
          ZERO<br/>
          <span className="text-transparent" style={{ webkitTextStroke: '2px #F5F5F5' }}>INVENTORY.</span><br/>
          MAX GAIN.
        </h2>
        <p className="text-[14px] uppercase tracking-widest text-white/40 max-w-xl leading-relaxed">
          Arriving at dominance through affiliate arbitrage. We don't stock the product, we control the intent.
        </p>
      </header>

      {/* Target Metrics */}
      <section>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[#FF3E00] mb-8">
          [ CORE_METRICS ]
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 border-t border-white/10">
          {CORE_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="border-r border-b border-white/10 p-10 hover:bg-white/[0.02] transition-colors"
            >
              <div className="text-4xl font-light tabular-nums tracking-tighter">{stat.value}</div>
              <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-6">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Business Model */}
      <section>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[#FF3E00] mb-8">
          [ OPERATIONAL_PILLARS ]
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 border border-white/10">
          {[
            { 
              title: "Arbitrage", 
              tag: "01",
              desc: "Drive qualified traffic to Flipkart product pages. Earn commission on every purchase completed within the 7-day cookie window."
            },
            { 
              title: "Aggregation", 
              tag: "02",
              desc: "Curate real-time flash sales, bank offers, coupons, and price drops. Build urgency with countdown timers and live trackers."
            },
            { 
              title: "Comparison", 
              tag: "03",
              desc: "Side-by-side spec comparisons and pros/cons breakdowns. One clear 'buy now' CTA linked to the best Flipkart listing."
            }
          ].map((item, i) => (
            <div key={item.title} className="p-12 border-r last:border-r-0 border-white/10 group flex flex-col justify-between min-h-[320px]">
              <span className="text-[10px] font-black text-[#FF3E00] opacity-40 group-hover:opacity-100 transition-opacity">{item.tag}</span>
              <div>
                <h3 className="text-4xl font-bold uppercase tracking-tight mb-4">{item.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* User Intent Funnel */}
      <section>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[#FF3E00] mb-8">
          [ INTENT_FUNNEL ]
        </div>
        <div className="space-y-4">
          {FUNNEL_STEPS.map((step, i) => (
            <div key={step.number} className="flex flex-col md:flex-row gap-8 bg-[#111] p-10 border border-white/5 items-start md:items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="text-6xl font-black text-white/50">{step.number}</div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#FF3E00] mb-1">{step.intent} Phase</div>
                  <h4 className="text-xl font-bold uppercase tracking-tight">{step.title}</h4>
                </div>
              </div>
              <p className="text-sm text-white/40 max-w-sm font-medium leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
