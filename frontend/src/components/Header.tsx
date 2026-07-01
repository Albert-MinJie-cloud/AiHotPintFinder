import { useLocation } from 'react-router-dom';
import { BellDot, Search } from 'lucide-react';

export function Header() {
  const location = useLocation();
  const isOverview = location.pathname === '/';
  const isKeywords = location.pathname === '/keywords';
  const isNotifications = location.pathname === '/notifications';

  const title = isOverview ? '监控概览' : isKeywords ? '搜索词管理' : isNotifications ? '通知配置' : '热点雷达';

  return (
    <header className="h-20 bg-indigo-600 px-8 flex items-center justify-between shadow-lg shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        {isOverview && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-200" />
            <input
              type="text"
              placeholder="搜索话题、关键字..."
              className="w-full bg-indigo-500/50 border border-indigo-400 text-sm text-white rounded-full pl-10 pr-4 py-2 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all placeholder:text-indigo-200"
            />
          </div>
        )}

        <button className="relative text-white hover:text-yellow-400 transition-colors">
          <BellDot className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-indigo-600 translate-x-0.5 -translate-y-0.5" />
        </button>
      </div>
    </header>
  );
}
