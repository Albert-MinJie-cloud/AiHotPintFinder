import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryData } from '../types';

interface Props {
  data: CategoryData[] | null;
  loading?: boolean;
}

export function CategoryChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">热点分类分布</h2>
        <div className="flex-1 min-h-[250px] bg-slate-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">热点分类分布</h2>
        <div className="flex-1 min-h-[250px] flex items-center justify-center text-slate-400">
          暂无分类数据
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">热点分类分布</h2>
      <div className="flex-1 min-h-[250px] w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={105}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={"cell-" + index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                borderColor: "#e2e8f0",
                color: "#0f172a",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        {data.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </div>
        ))}
      </div>
    </div>
  );
}
