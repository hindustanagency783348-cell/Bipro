/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, MessageSquare, Twitter, Share2, Radio, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TrafficView() {
  return (
    <div className="space-y-24">
      <header className="flex flex-col">
        <div className="flex items-center space-x-4 mb-4">
          <span className="w-12 h-[1px] bg-[#FF3E00]"></span>
          <span className="text-[10px] uppercase tracking-[0.5em] text-[#FF3E00] font-bold italic">Phase 04 / capture</span>
        </div>
        <h2 className="text-[140px] leading-[0.75] font-black uppercase tracking-[-0.06em] m-0 p-0 mb-8">
          TRAFFIC.<br/>
          <span className="text-transparent" style={{ webkitTextStroke: '2px #F5F5F5' }}>SENSOR.</span>
        </h2>
        <p className="text-[14px] uppercase tracking-widest text-white/40 max-w-xl leading-relaxed">
          Diversify traffic sources from day one. SEO is your long-term engine; Social and Chat are your short-term amplifiers.
        </p>
      </header>

      {/* Traffic Channels */}
      <section>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[#FF3E00] mb-12">
          [ SIGNAL_SOURCES ]
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 border-t border-white/10">
          {[
            { title: "SEO", items: ["'Best of' lists", "Product reviews", "FAQ snippets", "Internal linking"] },
            { title: "WhatsApp", items: ["Daily deal blasts", "Flash sale alerts", "Flash coupons", "90% Open rate"] },
            { title: "Telegram", items: ["Auto-bot posts", "Deal community", "Direct deep links", "High speed"] },
            { title: "Social", items: ["IG Reel unboxings", "Shorts reveals", "X price alerts", "Pinterest boards"] }
          ].map((ch) => (
            <div key={ch.title} className="p-10 border-r border-b border-white/10 hover:bg-white/[0.01]">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF3E00] mb-8">/ {ch.title}</h4>
              <ul className="space-y-4">
                {ch.items.map(i => (
                  <li key={i} className="text-[11px] font-medium text-white/40 uppercase tracking-widest flex items-center gap-3">
                    <span className="w-1.5 h-[1px] bg-white/10" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Keyword Intent Grid */}
      <section>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[#FF3E00] mb-12">
          [ KEYWORD_CLUSTERS ]
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 border border-white/10">
          {[
            { phase: "Informational", tags: ["best phones 2025", "top laptops india", "smart tv guide", "gaming setup ideas"] },
            { phase: "Consideration", tags: ["iPhone 16 vs S25", "OnePlus vs Redmi", "boat vs jbl info", "bosch review"] },
            { phase: "Transactional", tags: ["buy s25 flipkart", "iphone 16 offer", "flipkart coupon", "BBD dates 2025"] }
          ].map((intent) => (
            <div key={intent.phase} className="p-12 border-r last:border-r-0 border-white/10">
              <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">{intent.phase} Intent</h5>
              <div className="flex flex-col gap-4">
                {intent.tags.map(tag => (
                  <span key={tag} className="text-[11px] font-black uppercase tracking-widest text-white/50 bg-white/5 px-4 py-3 border border-white/5 hover:border-[#FF3E00]/40 hover:text-[#FF3E00] transition-all cursor-crosshair">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
