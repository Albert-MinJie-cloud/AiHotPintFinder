import { Activity, Flame, TrendingUp, Users } from 'lucide-react';
import type { KpiData } from '../types';
import { mapStatsExtras } from '../api';

interface Props {
  data: KpiData | null;
  statsRaw?: Parameters<typeof mapStatsExtras>[0] | null;
  loading?: boolean;
}

export function KpiCards({ data, statsRaw, loading }: Props) {
  const extras = statsRaw ? mapStatsExtras(statsRaw) : null;

  const kpiCards = !data ? [] : [
    { title: "全网实时热点" as const, value: data.totalHotspots.toLocaleString(), change: extras ? (extras.totalChange >= 0 ? "+"+extras.totalChange+"%" : extras.totalChange+"%") : "--", trend: "up" as const, bgColor: "bg-indigo-600" },
    { title: "今日新增话题" as const, value: data.newToday.toLocaleString(), change: extras ? (extras.newChange >= 0 ? "+"+extras.newChange+"%" : extras.newChange+"%") : "--", trend: "up" as const, bgColor: "bg-rose-500" },
    { title: "平均情感指数" as const, value: String(data.avgSentiment), change: extras ? (extras.sentimentChange >= 0 ? "+"+extras.sentimentChange+"%" : extras.sentimentChange+"%") : "--", trend: "up" as const, bgColor: "bg-emerald-500" },
    { title: "监控数据源" as const, value: data.activeSources.toLocaleString(), change: extras?.sourcesStatus === "stable" ? "稳定" : "警告", trend: (extras?.sourcesStatus === "stable" ? "stable" as const : "down" as const), bgColor: "bg-amber-500" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-200 animate-pulse rounded-2xl h-32" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="col-span-full text-center text-slate-400 py-8">
          无法加载 KPI 数据，请检查后端服务
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpiCards.map((kpi, idx) => (
        <div key={idx} className={kpi.bgColor + " rounded-2xl p-5 flex flex-col justify-between text-white shadow-sm h-32"}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold opacity-70 tracking-widest">{kpi.title}</span>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">
              {kpi.change}
            </span>
          </div>
          <span className="text-4xl font-black mt-2">{kpi.value}</span>
        </div>
      ))}
    </div>
  );
}
