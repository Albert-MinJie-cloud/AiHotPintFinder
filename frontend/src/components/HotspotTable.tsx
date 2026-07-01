import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  Flame,
  Link2,
  Zap,
} from "lucide-react";
import { useState, useMemo } from "react";
import type { HotspotItem } from "../types";

interface Props {
  data: HotspotItem[] | null;
  loading?: boolean;
}

export function HotspotTable({ data, loading }: Props) {
  const items = data || [];
  const [selectedPlatform, setSelectedPlatform] = useState("全部");
  const [selectedTopic, setSelectedTopic] = useState("全部");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const platforms = [
    "全部",
    ...Array.from(new Set(items.map((i) => i.platform || "").filter(Boolean))),
  ];
  const topics = [
    "全部",
    ...Array.from(new Set(items.map((i) => i.keyword || "").filter(Boolean))),
  ];

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchPlatform =
        selectedPlatform === "全部" || item.platform === selectedPlatform;
      const matchTopic =
        selectedTopic === "全部" || item.keyword === selectedTopic;
      return matchPlatform && matchTopic;
    });
  }, [items, selectedPlatform, selectedTopic]);

  useMemo(() => {
    setCurrentPage(1);
  }, [selectedPlatform, selectedTopic]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "text-rose-500";
    if (rank === 2) return "text-orange-500";
    if (rank === 3) return "text-amber-500";
    return "text-slate-400";
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full gap-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800">实时热点榜单</h2>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-100 animate-pulse rounded-2xl h-32"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col h-full gap-5">
        <h2 className="text-xl font-black text-slate-800">实时热点榜单</h2>
        <div className="text-center py-16 text-slate-400">暂无热点数据</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800">实时热点榜单</h2>
        <span className="text-xs bg-indigo-100 px-2.5 py-1 rounded-md text-indigo-700 font-bold uppercase tracking-wider cursor-pointer shadow-sm">
          Live
        </span>
      </div>
      <div className="flex items-center gap-6 overflow-x-auto">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest shrink-0">
            筛选条件:
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            平台
          </label>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 cursor-pointer min-w-[120px]"
          >
            {platforms.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            热点话题
          </label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 cursor-pointer min-w-[120px]"
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 pb-4">
        <div className="flex flex-col gap-4">
          {currentItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-colors shadow-sm group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500" />
                  {/* <span className="text-sm font-bold text-slate-700">
                    {(item.heatScore / 10000).toFixed(1)}W 热度
                  </span> */}
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <div className="flex items-center">
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-widest rounded">
                    {item.source}
                  </span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <div className="flex items-center gap-1 font-bold">
                  {item.trend === "up" && (
                    <span className="text-emerald-500 flex items-center text-xs gap-1">
                      <ArrowUp className="w-3 h-3" /> 上升
                    </span>
                  )}
                  {item.trend === "down" && (
                    <span className="text-rose-500 flex items-center text-xs gap-1">
                      <ArrowDown className="w-3 h-3" /> 下降
                    </span>
                  )}
                  {item.trend === "new" && (
                    <span className="text-amber-500 flex items-center text-xs gap-1">
                      <Zap className="w-3 h-3" /> 新晋
                    </span>
                  )}
                  {item.trend === "stable" && (
                    <span className="text-slate-400 flex items-center text-xs gap-1">
                      持平
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 mb-4">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-3">
                  <span className={`text-xl ${getRankStyle(item.rank)}`}>
                    {item.rank < 10 ? `0${item.rank}` : item.rank}
                  </span>
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed pl-8">
                  {item.summary}
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 pl-8">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      相关性
                    </span>
                    <span className="text-sm font-black text-indigo-600">
                      {(item.authenticity_score != null ? (item.authenticity_score * 100).toFixed(0) + '%' : '--')}
                    </span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      发现时间
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {item.timestamp}
                    </span>
                  </div>
                </div>
                <button
                  className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    console.log("Opening URL:", item.url);
                    window.open(item.url, "_blank");
                  }}
                >
                  <Link2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {currentItems.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm font-medium">
              没有找到匹配的热点
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 pb-4 px-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium">
            共 {filtered.length} 条记录，第 {currentPage} / {totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
