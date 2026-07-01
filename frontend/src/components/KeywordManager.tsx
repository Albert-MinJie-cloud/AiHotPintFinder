import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Zap, Trash2, X } from "lucide-react";

interface Keyword {
  id: string;
  keyword: string;
  category: string;
  is_active: number;
  created_at: string;
  last_checked_at: string | null;
}

const API_BASE = "/api";

export function KeywordManager() {
  // Data
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrapingIds, setScrapingIds] = useState<Set<string>>(new Set());

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [addingKeyword, setAddingKeyword] = useState(false);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ---- API calls ----

  const fetchKeywords = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/keywords`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setKeywords(data);
    } catch (err) {
      console.error("Failed to fetch keywords:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    setAddingKeyword(true);
    try {
      const res = await fetch(`${API_BASE}/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          category: newCategory.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "添加失败");
        return;
      }
      setShowAdd(false);
      setNewKeyword("");
      setNewCategory("");
      await fetchKeywords();
    } catch (err) {
      alert("添加失败，请检查网络");
    } finally {
      setAddingKeyword(false);
    }
  };

  const toggleKeyword = async (id: string) => {
    try {
      await fetch(`${API_BASE}/keywords/${id}/toggle`, { method: "PATCH" });
      await fetchKeywords();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const toggleAll = async () => {
    try {
      await fetch(`${API_BASE}/keywords/toggle-all`, { method: "PATCH" });
      await fetchKeywords();
    } catch (err) {
      console.error("Toggle all failed:", err);
    }
  };

  const deleteKeyword = async (id: string) => {
    try {
      await fetch(`${API_BASE}/keywords/${id}`, { method: "DELETE" });
      setConfirmDeleteId(null);
      await fetchKeywords();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const scrapeKeyword = async (id: string) => {
    setScrapingIds((prev) => new Set(prev).add(id));
    try {
      await fetch(`${API_BASE}/scrape/${id}`, { method: "POST" });
      await fetchKeywords();
    } catch (err) {
      console.error("Scrape failed:", err);
    } finally {
      setScrapingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ---- Derived ----

  const filtered = keywords.filter((k) =>
    k.keyword.includes(searchTerm.trim()),
  );

  const allActive = keywords.length > 0 && keywords.every((k) => k.is_active);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("zh-CN");
    } catch {
      return dateStr;
    }
  };

  // ---- Render ----

  return (
    <div className="flex flex-col space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            配置并管理系统持续追踪的重点业务词汇及热点风向标
          </h2>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} strokeWidth={3} />
          <span>添加搜索词</span>
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Toolbar */}
        <div className="p-6 rounded-3xl border border-slate-200 flex justify-between items-center bg-white shadow-sm">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
            <input
              type="text"
              placeholder="搜索词名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm text-slate-800 rounded-xl pl-9 pr-4 py-2 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-600">
              一键开启全部监控
            </span>
            <button
              onClick={toggleAll}
              className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors cursor-pointer ${
                allActive ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                  allActive ? "translate-x-6" : "translate-x-0"
                }`}
              ></div>
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-sm font-medium text-slate-400">
            加载中...
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-sm font-medium text-slate-400">
            {keywords.length === 0
              ? "暂无搜索词，点击右上角添加"
              : "无匹配结果"}
          </div>
        )}

        {/* Cards Grid */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-all shadow-sm flex items-center justify-between group"
              >
                <div className="flex items-center gap-8">
                  <h3 className="text-lg font-bold text-slate-800 min-w-[160px]">
                    {item.keyword}
                  </h3>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="flex items-center gap-8">
                    {item.category && (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          分类
                        </span>
                        <span className="text-sm font-medium text-indigo-600 mt-1">
                          {item.category}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        添加时间
                      </span>
                      <span className="text-xs text-slate-500 font-mono mt-1">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Scrape button */}
                  <button
                    onClick={() => scrapeKeyword(item.id)}
                    disabled={!item.is_active || scrapingIds.has(item.id)}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      item.is_active && !scrapingIds.has(item.id)
                        ? "text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                        : "text-slate-300 cursor-not-allowed"
                    }`}
                    title="立即采集"
                  >
                    <Zap
                      className={`w-4 h-4 ${scrapingIds.has(item.id) ? "animate-pulse" : ""}`}
                    />
                  </button>

                  {/* Delete */}
                  <div className="relative inline-flex">
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {confirmDeleteId === item.id && (
                      <div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 whitespace-nowrap">
                          <span className="text-xs font-bold text-rose-500">确认删除？</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => deleteKeyword(item.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors cursor-pointer"
                            >
                              确定
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1 rounded-lg text-slate-400 text-xs hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              取消
                            </button>
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold ${item.is_active ? "text-indigo-600" : "text-slate-400"}`}
                  >
                    {item.is_active ? "监控中" : "已暂停"}
                  </span>
                  <button
                    onClick={() => toggleKeyword(item.id)}
                    className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors cursor-pointer ${
                      item.is_active ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                        item.is_active ? "translate-x-6" : "translate-x-0"
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Keyword Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAdd(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">添加搜索词</h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  关键词 *
                </label>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="例如：固态电池"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  分类（可选，默认"综合"）
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="例如：科技、新能源"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-medium"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim() || addingKeyword}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer ${
                    newKeyword.trim() && !addingKeyword
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {addingKeyword ? "添加中..." : "确认添加"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
