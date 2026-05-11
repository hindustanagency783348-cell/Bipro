/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target, Timer, ShieldCheck, Zap, ArrowRight, MousePointer2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ConversionView() {
  return (
    <div className="space-y-24">
      <header className="flex flex-col">
        <div className="flex items-center space-x-4 mb-4">
          <span className="w-12 h-[1px] bg-[#FF3E00]"></span>
          <span className="text-[10px] uppercase tracking-[0.5em] text-[#FF3E00] font-bold italic">Phase 03 / conversion</span>
        </div>
        <h2 className="text-[140px] leading-[0.75] font-black uppercase tracking-[-0.06em] m-0 p-0 mb-8">
          EXECUTE<br/>
          <span className="text-transparent" style={{ webkitTextStroke: '2px #F5F5F5' }}>CONVERT.</span>
        </h2>
        <p className="text-[14px] uppercase tracking-widest text-white/40 max-w-xl leading-relaxed">
          Design every element with one goal: reducing friction and increasing intent for that final Flipkart click.
        </p>
      </header>

      {/* CTA Framework */}
      <section>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[#FF3E00] mb-12">
          [ CTA_CLUSTERS ]
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12">
          {[
            {
              title: "Primary Action",
              tag: "01",
              roles: ["'Check best price on Flipkart'", "High Contrast Red", "Sticky on mobile scroll", "Navigational signifiers"]
            },
            {
              title: "Urgency Node",
              tag: "02",
              roles: ["Live countdown timers", "'X people viewing now'", "Real-time stock alerts", "Sale expiry warnings"]
            },
            {
              title: "Trust Node",
              tag: "03",
              roles: ["Verified Affiliate badge", "'Last checked: 5m ago'", "Price match guarantees", "Expert rating scores"]
            }
          ].map((item) => (
            <div key={item.title} className="p-10 border-l border-white/10 hover:bg-white/[0.01] transition-colors group">
              <span className="text-[10px] font-black text-[#FF3E00] opacity-40 mb-6 block">{item.tag}</span>
              <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 group-hover:text-[#FF3E00] transition-colors">{item.title}</h3>
              <ul className="space-y-4">
                {item.roles.map(r => (
                  <li key={r} className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-4">
                    <span className="w-2 h-[1px] bg-[#FF3E00]/40" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Conversion Tactics */}
      <section>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[#FF3E00] mb-12">
          [ TACTICAL_REGISTRY ]
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 border border-white/10">
          {[
            { id: '01', title: "Price Comparison", desc: "Show Flipkart vs Amazon vs Meesho. When Flipkart wins, highlight with a 'Best Deal' banner." },
            { id: '02', title: "EMI Cost Calc", desc: "Show monthly costs directly. Reduces sticker shock on big-ticket items like premium phones." },
            { id: '03', title: "Exit-Intent Capture", desc: "Detect intent and offer a direct link to the day's best flash coupon." },
            { id: '04', title: "Social Proof", desc: "Real-time purchase notifications or Flipkart star-rating sync for category dominance." }
          ].map((tactic) => (
            <div key={tactic.id} className="p-12 border-r border-b border-white/10 group hover:bg-white/[0.02]">
              <div className="flex justify-between items-start mb-8">
                 <div className="text-4xl font-black text-white/10 group-hover:text-[#FF3E00]/20 transition-colors">{tactic.id}</div>
                 <ArrowRight className="w-6 h-6 text-white/10 group-hover:text-[#FF3E00] transition-all transform group-hover:translate-x-2" />
              </div>
              <h4 className="text-2xl font-black uppercase tracking-tight mb-4">{tactic.title}</h4>
              <p className="text-sm text-white/40 leading-relaxed font-medium">{tactic.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
