import { useState, useEffect, useCallback } from "react";

import { API, fetchApi } from "../config.js";

const STATUS_MAP = {
  potential: { label: "潜在客户", color: "#94a3b8", bg: "bg-slate-50", text: "text-slate-600" },
  contacted: { label: "已联系", color: "#60a5fa", bg: "bg-blue-50", text: "text-blue-600" },
  following: { label: "跟进中", color: "#f59e0b", bg: "bg-amber-50", text: "text-amber-600" },
  won: { label: "已成交", color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-600" },
  lost: { label: "无效客户", color: "#f43f5e", bg: "bg-rose-50", text: "text-rose-500" },
};

const ACTION_ICONS = {
  created: "●",
  status_changed: "↻",
  followup_added: "✎",
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CustomerDetail({ customerId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [newNote, setNewNote] = useState("");

  const fetchDetail = useCallback(async () => {
    const res = await fetchApi(`${API}/customers/${customerId}`);
    const result = await res.json();
    setData(result.data);
    setLoading(false);
  }, [customerId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  async function addFollowup() {
    if (!newNote.trim()) return;
    await fetchApi(`${API}/customers/${customerId}/followups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote }),
    });
    setNewNote("");
    fetchDetail();
  }

  async function toggleFavorite() {
    await fetchApi(`${API}/customers/${customerId}/favorite`, { method: "PATCH" });
    fetchDetail();
  }

  async function changeStatus(newStatus) {
    await fetchApi(`${API}/customers/${customerId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchDetail();
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex space-x-1.5"><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]"/><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]"/><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300"/></div>
      </div>
    );
  }

  if (!data) return null;
  const s = STATUS_MAP[data.status] || STATUS_MAP.potential;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900 truncate">{data.companyName}</h2>
              <button onClick={toggleFavorite} className="shrink-0">
                {data.favorite ? (
                  <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                ) : (
                  <svg className="h-4 w-4 text-slate-300 hover:text-amber-400 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                )}
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
              {data.country && <span>{data.country}</span>}
              {data.industry && <><span>·</span><span>{data.industry}</span></>}
            </div>
          </div>
        </div>
        <select
          value={data.status}
          onChange={(e) => changeStatus(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium outline-none cursor-pointer hover:border-slate-300 transition"
        >
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 px-6">
        {[
          { id: "overview", label: "概览" },
          { id: "followups", label: `跟进 (${(data.followups || []).length})` },
          { id: "activity", label: `活动 (${(data.activities || []).length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-xs font-medium transition border-b-2 -mb-px ${
              tab === t.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "邮箱", value: data.email || "—" },
                { label: "网站", value: data.website || "—" },
                { label: "产品关键词", value: data.productKeyword || "—" },
                { label: "标签", value: data.tags.length > 0 ? data.tags.map((t) => t.name).join(", ") : "—" },
                { label: "创建时间", value: formatDate(data.createdAt) },
                { label: "更新时间", value: formatDate(data.updatedAt) },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{f.label}</p>
                  <p className="mt-1 text-sm text-slate-700">{f.value}</p>
                </div>
              ))}
            </div>
            {data.notes && (
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">备注</p>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-600 whitespace-pre-wrap">{data.notes}</div>
              </div>
            )}
          </div>
        )}

        {tab === "followups" && (
          <div>
            <div className="mb-4 flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFollowup()}
                placeholder="添加跟进记录…"
                className="flex-1 h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <button onClick={addFollowup} className="rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 transition">添加</button>
            </div>
            <div className="space-y-3">
              {(data.followups || []).length === 0 && <p className="text-sm text-slate-400 py-8 text-center">暂无跟进记录</p>}
              {(data.followups || []).map((f) => (
                <div key={f.id} className="rounded-lg border border-slate-100 p-4">
                  <p className="text-sm text-slate-700">{f.content}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{formatDate(f.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "activity" && (
          <div className="space-y-3">
            {(data.activities || []).length === 0 && <p className="text-sm text-slate-400 py-8 text-center">暂无活动记录</p>}
            {(data.activities || []).map((a) => (
              <div key={a.id} className="flex gap-3 items-start">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] text-slate-500">
                  {ACTION_ICONS[a.action] || "·"}
                </div>
                <div>
                  <p className="text-sm text-slate-700">{a.detail}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatDate(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
