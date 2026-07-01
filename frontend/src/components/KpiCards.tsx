import { Activity, Flame, TrendingUp, Users } from 'lucide-react';
import { MOCK_KPI } from '../mockData';

export function KpiCards() {
  const kpis = [
    {
      title: '全网实时热点',
      value: MOCK_KPI.totalHotspots.toLocaleString(),
      change: '+12%',
      trend: 'up',
      bgColor: 'bg-indigo-600',
    },
    {
      title: '今日新增话题',
      value: MOCK_KPI.newToday.toLocaleString(),
      change: '+5.4%',
      trend: 'up',
      bgColor: 'bg-rose-500',
    },
    {
      title: '平均情感指数',
      value: `${MOCK_KPI.avgSentiment}`,
      change: '-2.1%',
      trend: 'down',
      bgColor: 'bg-emerald-500',
    },
    {
      title: '监控数据源',
      value: MOCK_KPI.activeSources.toLocaleString(),
      change: '稳定',
      trend: 'stable',
      bgColor: 'bg-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, idx) => (
        <div key={idx} className={`${kpi.bgColor} rounded-2xl p-5 flex flex-col justify-between text-white shadow-sm h-32`}>
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
