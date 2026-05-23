import { useState, useEffect, useCallback } from "react";
import CustomerDetail from "./CustomerDetail.jsx";

import { API, fetchApi } from "../config.js";

const STATUSES = [
  { value: "potential", label: "潜在客户", color: "bg-slate-100 text-slate-700" },
  { value: "contacted", label: "已联系", color: "bg-blue-50 text-blue-700" },
  { value: "following", label: "跟进中", color: "bg-amber-50 text-amber-700" },
  { value: "won", label: "已成交", color: "bg-emerald-50 text-emerald-700" },
  { value: "lost", label: "无效客户", color: "bg-rose-50 text-rose-500" },
];

const TAG_COLORS = {
  slate: "bg-slate-100 text-slate-600", blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600", rose: "bg-rose-50 text-rose-600",
  cyan: "bg-cyan-50 text-cyan-600",
};

const ICONS = {
  star: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  starFilled: (<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  search: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  download: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>),
  edit: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>),
  trash: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>),
  plus: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  close: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  external: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>),
};

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [favFilter, setFavFilter] = useState(false);

  // Detail panel
  const [detailCustomerId, setDetailCustomerId] = useState(null);

  // Edit modal
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCustomers = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter) params.set("status", statusFilter);
    if (favFilter) params.set("favorite", "true");

    const res = await fetchApi(`${API}/customers?${params}`);
    const data = await res.json();
    setCustomers(data.data || []);
  }, [search, statusFilter, favFilter]);

  const fetchTags = useCallback(async () => {
    const res = await fetchApi(`${API}/customers/tags/list`);
    const data = await res.json();
    setTags(data.data || []);
  }, []);

  useEffect(() => { setLoading(true); fetchCustomers().then(() => setLoading(false)); }, [fetchCustomers]);
  useEffect(() => { fetchTags(); }, [fetchTags]);

  async function toggleFavorite(customer) {
    await fetchApi(`${API}/customers/${customer.id}/favorite`, { method: "PATCH" });
    fetchCustomers();
  }

  async function changeStatus(customer, newStatus) {
    await fetchApi(`${API}/customers/${customer.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchCustomers();
  }

  function openEdit(customer) {
    setEditing(customer.id);
    setEditForm({
      companyName: customer.companyName, website: customer.website, email: customer.email,
      country: customer.country, industry: customer.industry,
      productKeyword: customer.productKeyword, notes: customer.notes,
      tagIds: customer.tags.map((t) => t.id),
    });
    setShowEditModal(true);
  }

  async function saveEdit() {
    if (!editing) return;
    await fetchApi(`${API}/customers/${editing}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setShowEditModal(false);
    setEditing(null);
    fetchCustomers();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await fetchApi(`${API}/customers/${deleteTarget}`, { method: "DELETE" });
    setDeleteTarget(null);
    fetchCustomers();
  }

  function handleExport() {
    window.open(`${API}/customers/export/csv`, "_blank");
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">客户管理</h1>
            <p className="mt-0.5 text-sm text-slate-500">{customers.length} 位客户</p>
          </div>
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
            {ICONS.download} 导出 CSV
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Toolbar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{ICONS.search}</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索客户、邮箱、国家…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFavFilter(!favFilter)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${
                favFilter ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              {favFilter ? ICONS.starFilled : ICONS.star} 收藏
            </button>
            <div className="hidden sm:flex items-center gap-1.5">
              <button onClick={() => setStatusFilter("")} className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${!statusFilter ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>全部</button>
              {STATUSES.map((s) => (
                <button key={s.value} onClick={() => setStatusFilter(statusFilter === s.value ? "" : s.value)} className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${statusFilter === s.value ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table with detail panel */}
        <div className="flex gap-0 rounded-xl border border-slate-200/60 bg-white overflow-hidden">
          <div className={`flex-1 min-w-0 ${detailCustomerId ? "hidden lg:block" : ""}`}>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex space-x-1.5"><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]"/><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]"/><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300"/></div>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    <th className="w-8 py-3 pl-5 pr-1"></th>
                    <th className="py-3 px-2">客户名称</th>
                    <th className="hidden md:table-cell py-3 px-2">国家</th>
                    <th className="hidden lg:table-cell py-3 px-2">行业</th>
                    <th className="hidden xl:table-cell py-3 px-2">邮箱</th>
                    <th className="py-3 px-2">状态</th>
                    <th className="w-24 py-3 pl-2 pr-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customers.map((c) => (
                    <tr key={c.id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="py-2.5 pl-5 pr-1">
                        <button onClick={() => toggleFavorite(c)} className="text-slate-300 hover:text-amber-400 transition">
                          {c.favorite ? <span className="text-amber-400">{ICONS.starFilled}</span> : ICONS.star}
                        </button>
                      </td>
                      <td className="py-2.5 px-2">
                        <button onClick={() => setDetailCustomerId(c.id)} className="text-left w-full">
                          <div className="text-[13px] font-medium text-slate-900 hover:text-blue-600 transition-colors">{c.companyName}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[160px]">{c.productKeyword}</div>
                        </button>
                      </td>
                      <td className="hidden md:table-cell py-2.5 px-2 text-[13px] text-slate-600">{c.country}</td>
                      <td className="hidden lg:table-cell py-2.5 px-2 text-[13px] text-slate-500">{c.industry || "—"}</td>
                      <td className="hidden xl:table-cell py-2.5 px-2 text-[13px] text-slate-500">{c.email || "—"}</td>
                      <td className="py-2.5 px-2">
                        <select value={c.status} onChange={(e) => changeStatus(c, e.target.value)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition">
                          {STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                        </select>
                      </td>
                      <td className="py-2.5 pl-2 pr-5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setDetailCustomerId(c.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition" title="详情">{ICONS.external}</button>
                          <button onClick={() => openEdit(c)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition" title="编辑">{ICONS.edit}</button>
                          <button onClick={() => setDeleteTarget(c.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition" title="删除">{ICONS.trash}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail panel */}
          {detailCustomerId && (
            <div className="w-full lg:w-[420px] lg:border-l border-slate-100 shrink-0">
              <CustomerDetail
                customerId={detailCustomerId}
                onClose={() => setDetailCustomerId(null)}
              />
            </div>
          )}
        </div>

        {!loading && customers.length === 0 && (
          <div className="mt-8 flex flex-col items-center py-16 text-center">
            <p className="text-sm text-slate-500">暂无客户数据</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">编辑客户</h2>
              <button onClick={() => setShowEditModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">{ICONS.close}</button>
            </div>
            <div className="space-y-4">
              {[
                { key: "companyName", label: "客户名称" },
                { key: "website", label: "网站" }, { key: "email", label: "邮箱" },
                { key: "country", label: "国家" }, { key: "industry", label: "行业" },
                { key: "productKeyword", label: "产品关键词" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-[11px] font-medium text-slate-500">{f.label}</label>
                  <input value={editForm[f.key] || ""} onChange={(e) => setEditForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
                </div>
              ))}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-500">标签</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <button key={t.id} onClick={() => {
                      const ids = editForm.tagIds || [];
                      setEditForm((p) => ({ ...p, tagIds: ids.includes(t.id) ? ids.filter((id) => id !== t.id) : [...ids, t.id] }));
                    }} className={`rounded-lg px-3 py-1.5 text-[11px] font-medium border transition ${
                      (editForm.tagIds || []).includes(t.id) ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}>{t.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-500">备注</label>
                <textarea value={editForm.notes || ""} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"/>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowEditModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">取消</button>
              <button onClick={saveEdit} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900">确认删除</h2>
            <p className="mt-2 text-sm text-slate-500">此操作不可撤销。确定要删除该客户吗？</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">取消</button>
              <button onClick={confirmDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 transition">删除</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
