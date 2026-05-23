import { useState, useEffect, useCallback, useRef } from "react";

import { API, fetchApi } from "../config.js";

const STATUS_MAP = {
  potential: { label: "潜在客户", color: "#94a3b8", bg: "bg-slate-50", text: "text-slate-600", ring: "ring-slate-200" },
  contacted: { label: "已联系", color: "#60a5fa", bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-200" },
  following: { label: "跟进中", color: "#f59e0b", bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-200" },
  won: { label: "已成交", color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-200" },
  lost: { label: "无效客户", color: "#f43f5e", bg: "bg-rose-50", text: "text-rose-500", ring: "ring-rose-200" },
};

export default function PipelineBoard({ onSelectCustomer }) {
  const [columns, setColumns] = useState({});
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPipeline = useCallback(async () => {
    const res = await fetchApi(`${API}/analytics/pipeline`);
    const data = await res.json();
    setColumns(data.data || {});
    setLoading(false);
  }, []);

  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

  function handleDragStart(e, customer) {
    e.dataTransfer.setData("customerId", String(customer.id));
    e.dataTransfer.setData("fromStatus", customer.status);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e, status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  }

  function handleDragLeave() {
    setDragOverStatus(null);
  }

  async function handleDrop(e, toStatus) {
    e.preventDefault();
    setDragOverStatus(null);
    const customerId = e.dataTransfer.getData("customerId");
    const fromStatus = e.dataTransfer.getData("fromStatus");
    if (!customerId || fromStatus === toStatus) return;

    await fetchApi(`${API}/customers/${customerId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: toStatus }),
    });
    fetchPipeline();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex space-x-1.5"><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]"/><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]"/><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300"/></div>
      </div>
    );
  }

  const statuses = Object.keys(STATUS_MAP);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
      {statuses.map((status) => {
        const s = STATUS_MAP[status];
        const items = columns[status] || [];
        const isOver = dragOverStatus === status;

        return (
          <div
            key={status}
            className={`flex-1 min-w-[220px] max-w-[300px] rounded-xl border transition-all ${
              isOver ? "border-blue-300 bg-blue-50/30 ring-2 ring-blue-100" : "border-slate-200/60 bg-white"
            }`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }}/>
                <span className="text-xs font-semibold text-slate-700">{s.label}</span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">{items.length}</span>
            </div>

            <div className="flex flex-col gap-2 p-2">
              {items.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, c)}
                  onClick={() => onSelectCustomer && onSelectCustomer(c)}
                  className="group cursor-pointer rounded-lg border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-slate-200 hover:shadow-md active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-slate-800 leading-snug line-clamp-2">{c.companyName}</p>
                    {c.favorite && (
                      <svg className="h-3 w-3 shrink-0 mt-0.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                    {c.country && <span>{c.country}</span>}
                    {c.industry && <span className="truncate">{c.industry}</span>}
                  </div>
                  {c.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.tags.slice(0, 2).map((t) => (
                        <span key={t.id} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{t.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <div className="flex flex-col items-center py-8 text-center">
                  <p className="text-[11px] text-slate-400">拖拽客户到此列</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
