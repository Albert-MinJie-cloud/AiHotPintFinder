import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MOCK_TREND_DATA } from '../mockData';

export function TrendChart() {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">头部热点热度趋势</h2>
      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK_TREND_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
              tickFormatter={(value) => `${value / 1000}k`}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                color: '#0f172a',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                fontWeight: 'bold',
              }}
              itemStyle={{ fontSize: '13px' }}
              labelStyle={{ color: '#64748b', marginBottom: '4px' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '13px', paddingTop: '10px', fontWeight: 'bold', color: '#475569' }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="固态电池"
              stroke="#f43f5e"
              strokeWidth={3}
              dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="新能源补贴"
              stroke="#4f46e5"
              strokeWidth={3}
              dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="AI大模型"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
