/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Rocket, CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

const ROADMAP = [
  { timeframe: "Month 1", title: "Foundation & Setup", desc: "Flipkart affiliate registration, domain setup, tech stack implementation (Next.js + Vercel), and first 10 core pages.", status: "current" },
  { timeframe: "Month 2", title: "Content Engine", desc: "Scaling to 30+ pages. Launching WhatsApp and Telegram channels for daily deal broadcasts.", status: "upcoming" },
  { timeframe: "Month 3-4", title: "Traffic Explosion", desc: "SEO rankings begin maturing. Expanding into Instagram Reels and YouTube Shorts for social-proof driven traffic.", status: "upcoming" },
  { timeframe: "Month 5", title: "Conversion Maxing", desc: "A/B testing CTAs, implementing price trackers and automated alerts for repeat visits.", status: "upcoming" },
  { timeframe: "Month 6+", title: "Scale & Exit", desc: "Layering display ads, hiring content writers, and potentially prepping for asset exit (36x EBITDA).", status: "upcoming" },
];

export default function LaunchPlanView() {
  return (
    <div className="space-y-24">
      <header className="flex flex-col">
        <div className="flex items-center space-x-4 mb-4">
          <span className="w-12 h-[1px] bg-[#FF3E00]"></span>
          <span className="text-[10px] uppercase tracking-[0.5em] text-[#FF3E00] font-bold italic">Phase 06 / deployment</span>
        </div>
        <h2 className="text-[140px] leading-[0.75] font-black uppercase tracking-[-0.06em] m-0 p-0 mb-8">
          LAUNCH.<br/>
          <span className="text-transparent" style={{ webkitTextStroke: '2px #F5F5F5' }}>STRIKE.</span>
        </h2>
        <p className="text-[14px] uppercase tracking-widest text-white/40 max-w-xl leading-relaxed">
          A phased 6-month approach to building a self-sustaining, high-revenue affiliate ecosystem. Strike hard, strike early.
        </p>
      </header>

      {/* Roadmap Timeline */}
      <section>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[#FF3E00] mb-12">
          [ EXECUTION_TIMELINE ]
        </div>

        <div className="space-y-0 border-l border-white/10 ml-8">
          {ROADMAP.map((step, i) => (
            <div key={step.timeframe} className="flex gap-12 group relative">
              <div className={cn(
                "w-4 h-4 rounded-full border-4 border-[#050505] absolute -left-2 top-2 z-10 transition-colors",
                step.status === 'current' ? 'bg-[#FF3E00]' : 'bg-white/10 group-hover:bg-white/30'
              )} />
              <div className="pb-16 pt-0 ml-8">
                <div className="flex items-baseline gap-6 mb-4">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    step.status === 'current' ? 'text-[#FF3E00]' : 'text-white/20'
                  )}>
                    {step.timeframe}
                  </span>
                  <h4 className="text-3xl font-black uppercase tracking-tight">{step.title}</h4>
                </div>
                <p className="text-sm text-white/40 leading-relaxed max-w-2xl font-medium">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Week 1 Checklist */}
      <section>
        <div className="bg-[#111] border-[12px] border-[#1A1A2E] p-16 relative overflow-hidden group">
          <div className="absolute inset-0 opacity-[0.03] brutalist-grid pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-5xl font-black uppercase tracking-tighter mb-12 flex items-center gap-6">
              <span className="w-12 h-[1px] bg-[#FF3E00]" />
              Week_01_Checklist.run()
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {[
                "Register Flipkart Affiliate Account",
                "Purchase high-intent domain (e.g., dealsniche.in)",
                "Deploy Next.js framework to Vercel",
                "Integrate GA4 and Clarity tracking",
                "Secure all social handles (IG, TG, WA)",
                "Publish first 5 authority reviews",
                "Configure price alert capture system",
                "Join Flipkart Affiliate API testing"
              ].map((item, i) => (
                <div key={item} className="flex gap-6 items-center border-b border-white/5 pb-4 group cursor-crosshair">
                  <div className="text-[10px] font-black text-white/20 group-hover:text-[#FF3E00] transition-colors">{i+1 < 10 ? `0${i+1}` : i+1}</div>
                  <span className="text-xs uppercase tracking-widest font-bold text-white/60 group-hover:text-white transition-colors">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
