import { useEffect, useState } from "react";
import { KpiCards } from "../components/KpiCards";
import { TrendChart } from "../components/TrendChart";
import { CategoryChart } from "../components/CategoryChart";
import { HotspotTable } from "../components/HotspotTable";
import {
  fetchOverviewStats,
  fetchTrends,
  fetchCategories,
  fetchHotspots,
  mapStats,
  mapTrends,
  mapCategories,
  mapHotspots,
} from "../api";
import type {
  KpiData,
  ChartDataPoint,
  CategoryData,
  HotspotItem,
} from "../types";

interface OverviewStatsRaw {
  total_hotspots: number;
  total_change_percent: number;
  new_today: number;
  new_change_percent: number;
  avg_sentiment: number;
  sentiment_change: number;
  active_sources: number;
  sources_status: string;
}

interface TrendsRaw {
  keywords: string[];
  data: Array<Record<string, string | number>>;
}

export default function Overview() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [statsRaw, setStatsRaw] = useState<OverviewStatsRaw | null>(null);
  const [trendData, setTrendData] = useState<ChartDataPoint[] | null>(null);
  const [trendKeywords, setTrendKeywords] = useState<string[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[] | null>(null);
  const [hotspots, setHotspots] = useState<HotspotItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, trendsRes, catRes, hsRes] = await Promise.all([
          fetchOverviewStats(),
          fetchTrends(),
          fetchCategories(),
          fetchHotspots(),
        ]);
        if (cancelled) return;

        setStatsRaw(statsRes);
        setKpi(mapStats(statsRes));

        const t = mapTrends(trendsRes as unknown as TrendsRaw);
        setTrendData(t.data);
        setTrendKeywords(t.keywords);

        setCategoryData(mapCategories(catRes));
        setHotspots(mapHotspots(hsRes as any));
      } catch (err: any) {
        if (!cancelled) setError(err.message || "数据加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-rose-500 font-bold text-lg mb-2">数据加载失败</p>
          <p className="text-slate-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <KpiCards data={kpi} statsRaw={statsRaw} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 min-h-[350px]">
          <TrendChart
            data={trendData}
            keywords={trendKeywords}
            loading={loading}
          />
        </div>
        <div className="min-h-[350px]">
          <CategoryChart data={categoryData} loading={loading} />
        </div>
      </div>

      <div className="min-h-[400px]">
        <HotspotTable data={hotspots} loading={loading} />
      </div>
    </>
  );
}
