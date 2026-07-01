import {
  CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { ChartDataPoint } from '../types';

const LINE_COLORS = ['#4F46E5', '#F43F5E', '#10B981', '#F59E0B', '#8B5CF6'];

interface Props {
  data: ChartDataPoint[] | null;
  keywords: string[];
  loading?: boolean;
}

export function TrendChart({ data, keywords, loading }: Props) {
  const colors = keywords.map((_, i) => LINE_COLORS[i % LINE_COLORS.length]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">头部热点热度趋势</h2>
        <div className="flex-1 min-h-[300px] bg-slate-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">头部热点热度趋势</h2>
        <div className="flex-1 min-h-[300px] flex items-center justify-center text-slate-400">
          暂无趋势数据
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">头部热点热度趋势</h2>
      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '13px',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: '12px', fontWeight: 600 }}
            />
            {keywords.map((kw, idx) => (
              <Line
                key={kw}
                type="monotone"
                dataKey={kw}
                stroke={colors[idx]}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
