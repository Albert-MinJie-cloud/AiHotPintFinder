export type TrendStatus = "up" | "down" | "new" | "stable";

export interface HotspotItem {
  id: string;
  rank: number;
  title: string;
  summary?: string;
  authenticity_score?: number;
  heatScore: number;
  trend: TrendStatus;
  category: string;
  source: string;
  timestamp: string;
  platform?: string;
  url?: string;
  isAuthentic?: boolean;
  keyword?: string;
}

export interface ChartDataPoint {
  time: string;
  [key: string]: string | number; // Dynamic keys for different topic names
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface KpiData {
  totalHotspots: number;
  newToday: number;
  avgSentiment: number;
  activeSources: number;
}
