/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Phase, Stat, FunnelStep, PageDefinition } from "./types";

export const PHASES: Phase[] = [
  { id: "strategy", title: "Strategy", icon: "Target", description: "Zero-inventory affiliate business model" },
  { id: "architecture", title: "Architecture", icon: "Map", description: "Conversion-optimized site structure" },
  { id: "conversion", title: "Conversion", icon: "Percent", description: "High-impact CTA and urgency tactics" },
  { id: "traffic", title: "Traffic", icon: "Radio", description: "SEO, Social & WhatsApp acquisition" },
  { id: "monetize", title: "Monetize", icon: "IndianRupee", description: "Revenue streams and projections" },
  { id: "launch", title: "Launch Plan", icon: "Rocket", description: "6-month execution roadmap" },
  { id: "tools", title: "Tools", icon: "Wrench", description: "AI and calculation utilities" },
];

export const CORE_STATS: Stat[] = [
  { label: "Commission Rate", value: "4–12%", description: "Flipkart standard rates", trend: "up" },
  { label: "Target CVR", value: "3–5×", description: "Competitive advantage", trend: "up" },
  { label: "Cookie Window", value: "7 Days", description: "Last-click attribution" },
  { label: "Inventory Cost", value: "₹0", description: "Pure affiliate play" },
];

export const FUNNEL_STEPS: FunnelStep[] = [
  { number: 1, title: "Informational Intent", intent: "Awareness", description: "Capturing broad searches like 'best phone under 20k'." },
  { number: 2, title: "Comparison Intent", intent: "Consideration", description: "Helping users choose between specific models." },
  { number: 3, title: "Transactional Intent", intent: "Decision", description: "Directing high-intent buyers to Flipkart links." },
];

export const PAGE_TYPES: PageDefinition[] = [
  { title: "Homepage", icon: "Home", roles: ["Hero deal banner", "Category grid", "Trending products"] },
  { title: "Review Pages", icon: "Star", roles: ["Pros/Cons", "Expert verdict", "Sticky CTAs"] },
  { title: "Compare Pages", icon: "GitCompare", roles: ["Side-by-side specs", "Category winners", "Dual CTAs"] },
  { title: "Deals Hub", icon: "Zap", roles: ["Real-time offers", "Bank discounts", "Expiry timers"] },
  { title: "Best-of Lists", icon: "Trophy", roles: ["Ranked lists", "Quick-buy buttons", "Expert picks"] },
  { title: "Price Tracker", icon: "TrendingDown", roles: ["Price history", "Drop alerts", "Prediction"] },
];
