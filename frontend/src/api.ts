// API response types (snake_case from backend)
interface OverviewStatsRes {
  total_hotspots: number;
  total_change_percent: number;
  new_today: number;
  new_change_percent: number;
  avg_sentiment: number;
  sentiment_change: number;
  active_sources: number;
  sources_status: string;
}

interface TrendsRes {
  keywords: string[];
  data: Array<Record<string, string | number>>;
}

interface CategoriesRes {
  categories: Array<{ name: string; value: number; color: string }>;
  total: number;
}

interface HotspotRow {
  id: string;
  keyword_id: string;
  keyword: string;
  title: string;
  url: string;
  source: string;
  summary: string;
  content: string;
  hot_score: number;
  detected_at: string;
  category: string;
  platform: string;
  trend: string;
  relevance_score: number;
  authenticity_score: number;
  sentiment_score: number;
  is_authentic: number;
  is_notified: number;
}

import type {
  KpiData,
  ChartDataPoint,
  CategoryData,
  HotspotItem,
  TrendStatus,
} from "./types";

// ---- Fetch helpers ----

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`);
  return res.json();
}

// ---- Mappers ----

export function mapStats(stats: OverviewStatsRes): KpiData {
  return {
    totalHotspots: stats.total_hotspots,
    newToday: stats.new_today,
    avgSentiment: stats.avg_sentiment,
    activeSources: stats.active_sources,
  };
}

export function mapStatsExtras(stats: OverviewStatsRes) {
  return {
    totalChange: stats.total_change_percent,
    newChange: stats.new_change_percent,
    sentimentChange: stats.sentiment_change,
    sourcesStatus: stats.sources_status,
  };
}

export function mapTrends(trends: TrendsRes): {
  keywords: string[];
  data: ChartDataPoint[];
} {
  return {
    keywords: trends.keywords,
    data: trends.data.map((d) => ({
      time: String(d.hour ?? d.time ?? ""),
      ...Object.fromEntries(
        Object.entries(d).filter(([k]) => k !== "hour" && k !== "time"),
      ),
    })) as ChartDataPoint[],
  };
}

export function mapCategories(cat: CategoriesRes): CategoryData[] {
  return cat.categories;
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const diff = now - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

function inferTrend(row: HotspotRow): TrendStatus {
  const t = row.trend?.toLowerCase() || "";
  if (t === "up") return "up";
  if (t === "down") return "down";
  if (t === "new") return "new";
  if (t === "stable") return "stable";
  // Infer from hot_score
  if (row.hot_score >= 85) return "new";
  if (row.hot_score >= 60) return "up";
  return "stable";
}

export function mapHotspots(rows: HotspotRow[]): HotspotItem[] {
  return rows
    .sort((a, b) => b.hot_score - a.hot_score)
    .map((row, idx) => ({
      id: row.id,
      rank: idx + 1,
      title: row.title,
      summary: row.summary || "",
      authenticity_score: row.authenticity_score || 0,
      heatScore: row.hot_score,
      trend: inferTrend(row),
      category: row.category || row.platform || "综合",
      source: row.source || row.platform || "",
      platform: row.platform || "",
      timestamp: relativeTime(row.detected_at),
      keyword: row.keyword || "",
      url: row.url || "",
    }));
}

// ---- API calls ----

export function fetchOverviewStats() {
  return get<OverviewStatsRes>("/api/overview/stats");
}
export function fetchTrends() {
  return get<TrendsRes>("/api/overview/trends");
}
export function fetchCategories() {
  return get<CategoriesRes>("/api/overview/categories");
}
export function fetchHotspots(limit = 30) {
  return get<HotspotRow[]>(`/api/hotspots/recent?limit=${limit}`);
}
