import { useState, useEffect } from "react";

import { API, fetchApi } from "../config.js";

const STATUS_MAP = {
  potential: { label: "潜在客户", color: "#94a3b8", count: 0 },
  contacted: { label: "已联系", color: "#60a5fa", count: 0 },
  following: { label: "跟进中", color: "#f59e0b", count: 0 },
  won: { label: "已成交", color: "#10b981", count: 0 },
  lost: { label: "无效客户", color: "#f43f5e", count: 0 },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  const days = Math.floor(hrs / 24);
  return `${days}天前`;
}

export default function Dashboard({ onSelectCustomer, onNavToPipeline }) {
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const [ov, act, pl] = await Promise.all([
        fetchApi(`${API}/analytics/overview`).then((r) => r.json()),
        fetchApi(`${API}/analytics/activity`).then((r) => r.json()),
        fetchApi(`${API}/analytics/pipeline`).then((r) => r.json()),
      ]);
      setOverview(ov.data);
      setActivity(act.data || []);
      setPipeline(pl.data || {});
      setLoading(false);
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <div className="flex space-x-1.5"><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]"/><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]"/><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300"/></div>
      </main>
    );
  }

  const statusCounts = overview?.statusCounts || {};
  const total = overview?.total || 0;
  const conversionRate = overview?.conversionRate || 0;

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">工作台</h1>
            <p className="mt-0.5 text-sm text-slate-500">销售管道总览</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onNavToPipeline}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              查看完整管道
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "客户总数", value: total, unit: "位" },
            { label: "已成交", value: statusCounts.won || 0, unit: "位" },
            { label: "转化率", value: conversionRate, unit: "%" },
            { label: "跟进中", value: statusCounts.following || 0, unit: "位" },
            { label: "收藏客户", value: overview?.favorited || 0, unit: "位" },
          ].map((kpi, i) => (
            <div key={i} className="rounded-xl border border-slate-200/60 bg-white p-5 transition-shadow hover:shadow-md">
              <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-slate-900">{kpi.value}</span>
                <span className="text-sm text-slate-400">{kpi.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline summary - takes 2/3 */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200/60 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-5">销售管道</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Object.entries(STATUS_MAP).map(([status, s]) => {
                const items = (pipeline[status] || []).slice(0, 3);
                const count = statusCounts[status] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                  <div key={status} className="flex-1 min-w-[160px]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }}/>
                        <span className="text-xs font-medium text-slate-600">{s.label}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">{count}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="mb-3 h-1 w-full rounded-full bg-slate-100">
                      <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: s.color }}/>
                    </div>
                    {/* Recent items */}
                    <div className="space-y-2">
                      {items.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => onSelectCustomer && onSelectCustomer(c)}
                          className="block w-full text-left rounded-lg border border-slate-100 bg-white p-2.5 transition hover:border-slate-200 hover:shadow-sm"
                        >
                          <p className="text-[13px] font-medium text-slate-800 truncate">{c.companyName}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400 truncate">{c.country}{c.industry ? ` · ${c.industry}` : ""}</p>
                        </button>
                      ))}
                      {items.length === 0 && (
                        <p className="text-[11px] text-slate-400 py-3 text-center">暂无</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Feed - takes 1/3 */}
          <div className="rounded-xl border border-slate-200/60 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-5">最近动态</h3>
            <div className="space-y-4">
              {activity.slice(0, 10).map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] text-slate-500">
                    {a.action === "created" ? "●" : a.action === "status_changed" ? "↻" : "✎"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-slate-700 truncate">
                      <span className="font-medium">{a.customerName}</span>
                      <span className="text-slate-400 ml-1">{a.detail}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
