import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { MOCK_CATEGORY_DATA } from '../mockData';

export function CategoryChart() {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">热点分类分布</h2>
      <div className="flex-1 min-h-[250px] w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={MOCK_CATEGORY_DATA}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={105}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {MOCK_CATEGORY_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                color: '#0f172a',
                borderRadius: '8px',
                fontWeight: 'bold',
              }}
              itemStyle={{ color: '#0f172a', fontSize: '13px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Custom Legend */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-3xl font-black text-slate-900">1,248</div>
          <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">总热点数</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-4">
        {MOCK_CATEGORY_DATA.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm font-bold text-slate-600">{item.name}</span>
            <span className="text-sm text-slate-900 font-black ml-auto">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
