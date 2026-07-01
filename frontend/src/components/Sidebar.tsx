import { NavLink } from 'react-router-dom';
import { LayoutDashboard, SearchCode, BellRing } from 'lucide-react';

export function Sidebar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors w-full cursor-pointer ${
      isActive
        ? 'bg-indigo-50 text-indigo-600'
        : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
    }`;

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 shadow-sm">
      <div className="h-20 flex items-center px-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center font-black text-indigo-900 text-xl shadow-sm">H</div>
          <span className="text-2xl font-bold text-indigo-900 tracking-tight">Pulse</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 flex flex-col gap-2">
        <div className="px-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Overview
        </div>
        <NavLink to="/" end className={linkClass}>
          <LayoutDashboard size={20} />
          监控概览
        </NavLink>
        <NavLink to="/keywords" className={linkClass}>
          <SearchCode size={20} />
          搜索词管理
        </NavLink>

        <div className="px-2 mt-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Settings
        </div>
        <NavLink to="/notifications" className={linkClass}>
          <BellRing size={20} />
          通知配置
        </NavLink>
      </div>
    </div>
  );
}
