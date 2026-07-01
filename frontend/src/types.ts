export type TrendStatus = 'up' | 'down' | 'new' | 'stable';

export interface HotspotItem {
  id: string;
  rank: number;
  title: string;
  summary?: string;
  relevance?: number;
  heatScore: number;
  trend: TrendStatus;
  category: string;
  source: string;
  timestamp: string;
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
