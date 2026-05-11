/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Stat {
  label: string;
  value: string;
  description?: string;
  trend?: "up" | "down" | "neutral";
}

export interface FunnelStep {
  number: number;
  title: string;
  description: string;
  intent: "Awareness" | "Consideration" | "Decision";
}

export interface PageDefinition {
  title: string;
  icon: string;
  roles: string[];
}

export interface Phase {
  id: string;
  title: string;
  icon: string;
  description: string;
}

export type PhaseId = "strategy" | "architecture" | "conversion" | "traffic" | "tech" | "monetize" | "launch" | "tools";
