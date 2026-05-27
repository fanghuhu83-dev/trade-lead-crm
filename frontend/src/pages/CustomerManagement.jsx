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

const SOURCES = ["", "Alibaba", "LinkedIn", "展会", "Google", "老客户推荐", "其他"];

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
  mail: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>),
  note: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>),
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export default function CustomerManagement({ onSendEmail }) {
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
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Follow-up mini-modal
  const [followupTarget, setFollowupTarget] = useState(null);
  const [followupText, setFollowupText] = useState("");

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

  async function submitFollowup() {
    if (!followupTarget || !followupText.trim()) return;
    await fetchApi(`${API}/customers/${followupTarget}/followups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: followupText }),
    });
    setFollowupTarget(null);
    setFollowupText("");
    fetchCustomers();
  }

  function openEdit(customer) {
    setEditing(customer.id);
    setEditForm({
      companyName: customer.companyName || "",
      website: customer.website || "",
      email: customer.email || "",
      country: customer.country || "",
      contactName: customer.contactName || "",
      phone: customer.phone || "",
      productKeyword: customer.productKeyword || "",
      source: customer.source || "",
      status: customer.status || "potential",
      nextFollowUp: customer.nextFollowUp ? customer.nextFollowUp.slice(0, 10) : "",
      notes: customer.notes || "",
      tagIds: (customer.tags || []).map((t) => t.id),
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

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (prev.size === customers.length) return new Set();
      return new Set(customers.map((c) => c.id));
    });
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleExport(mode) {
    setShowExportMenu(false);
    setExporting(true);
    try {
      const token = localStorage.getItem("trade_lead_token");
      const body = { mode };
      if (mode === "selected") {
        body.ids = [...selectedIds];
      } else if (mode === "filtered") {
        body.filters = { q: search, status: statusFilter, favorite: favFilter ? "true" : "" };
      }
      const res = await fetch(`${API}/export/customers/xlsx`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers_export_${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  }

  function handleExportCSV() {
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
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition">
              {ICONS.download} {exporting ? "导出中..." : "导出 Excel"}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-30" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleExport("all")} className="w-full px-4 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 transition">
                  导出全部 ({customers.length} 项)
                </button>
                <button onClick={() => handleExport("filtered")} className="w-full px-4 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 transition">
                  导出筛选结果
                </button>
                <button onClick={() => handleExport("selected")}
                  disabled={selectedIds.size === 0}
                  className="w-full px-4 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
                  导出选中项 ({selectedIds.size})
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button onClick={() => { handleExportCSV(); setShowExportMenu(false); }} className="w-full px-4 py-2 text-left text-xs text-slate-400 hover:bg-slate-50 transition">
                  导出 CSV (全部)
                </button>
              </div>
            )}
          </div>
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
                    <th className="w-8 py-3 pl-5 pr-1">
                      <input type="checkbox" checked={selectedIds.size === customers.length && customers.length > 0}
                        onChange={toggleSelectAll} className="h-3.5 w-3.5 accent-indigo-600" />
                    </th>
                    <th className="py-3 px-2">公司名称</th>
                    <th className="hidden md:table-cell py-3 px-2">国家</th>
                    <th className="hidden md:table-cell py-3 px-2">联系人</th>
                    <th className="hidden lg:table-cell py-3 px-2">邮箱</th>
                    <th className="hidden lg:table-cell py-3 px-2">主营产品</th>
                    <th className="py-3 px-2">状态</th>
                    <th className="hidden xl:table-cell py-3 px-2">下次跟进</th>
                    <th className="w-[140px] py-3 pl-2 pr-5">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customers.map((c) => (
                    <tr key={c.id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="py-2.5 pl-5 pr-1">
                        <div className="flex items-center gap-1.5">
                          <input type="checkbox" checked={selectedIds.has(c.id)}
                            onChange={() => toggleSelect(c.id)} className="h-3.5 w-3.5 accent-indigo-600" />
                          <button onClick={() => toggleFavorite(c)} className="text-slate-300 hover:text-amber-400 transition">
                            {c.favorite ? <span className="text-amber-400">{ICONS.starFilled}</span> : ICONS.star}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <button onClick={() => setDetailCustomerId(c.id)} className="text-left w-full">
                          <div className="text-[13px] font-medium text-slate-900 hover:text-blue-600 transition-colors">{c.companyName}</div>
                        </button>
                      </td>
                      <td className="hidden md:table-cell py-2.5 px-2 text-[13px] text-slate-600">{c.country || "—"}</td>
                      <td className="hidden md:table-cell py-2.5 px-2 text-[13px] text-slate-600">{c.contactName || "—"}</td>
                      <td className="hidden lg:table-cell py-2.5 px-2 text-[12px] text-slate-500 truncate max-w-[140px]">{c.email || "—"}</td>
                      <td className="hidden lg:table-cell py-2.5 px-2 text-[13px] text-slate-500 truncate max-w-[120px]">{c.productKeyword || "—"}</td>
                      <td className="py-2.5 px-2">
                        <select value={c.status} onChange={(e) => changeStatus(c, e.target.value)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 outline-none cursor-pointer hover:border-slate-300 transition">
                          {STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                        </select>
                      </td>
                      <td className="hidden xl:table-cell py-2.5 px-2 text-[12px] text-slate-500">{formatDate(c.nextFollowUp)}</td>
                      <td className="py-2.5 pl-2 pr-5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setDetailCustomerId(c.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition" title="查看">
                            {ICONS.external}
                          </button>
                          <button onClick={() => openEdit(c)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition" title="编辑">
                            {ICONS.edit}
                          </button>
                          <button onClick={() => onSendEmail && onSendEmail(c)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition" title="发送邮件">
                            {ICONS.mail}
                          </button>
                          <button onClick={() => { setFollowupTarget(c.id); setFollowupText(""); }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 transition" title="添加跟进">
                            {ICONS.note}
                          </button>
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
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">编辑客户</h2>
              <button onClick={() => setShowEditModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">{ICONS.close}</button>
            </div>

            <div className="space-y-5">
              {/* Group 1: 基本信息 */}
              <div>
                <p className="mb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">基本信息</p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-500">公司名称</label>
                    <input value={editForm.companyName || ""} onChange={(e) => setEditForm((p) => ({ ...p, companyName: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "country", label: "国家" },
                      { key: "contactName", label: "联系人" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="mb-1 block text-[11px] font-medium text-slate-500">{f.label}</label>
                        <input value={editForm[f.key] || ""} onChange={(e) => setEditForm((p) => ({ ...p, [f.key]: e.target.value }))}
                          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: "email", label: "邮箱" },
                      { key: "phone", label: "电话" },
                      { key: "website", label: "网址" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="mb-1 block text-[11px] font-medium text-slate-500">{f.label}</label>
                        <input value={editForm[f.key] || ""} onChange={(e) => setEditForm((p) => ({ ...p, [f.key]: e.target.value }))}
                          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Group 2: 业务信息 */}
              <div>
                <p className="mb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">业务信息</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-500">主营产品</label>
                      <input value={editForm.productKeyword || ""} onChange={(e) => setEditForm((p) => ({ ...p, productKeyword: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-500">客户来源</label>
                      <select value={editForm.source || ""} onChange={(e) => setEditForm((p) => ({ ...p, source: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-700">
                        {SOURCES.map((s) => <option key={s} value={s}>{s || "未选择"}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-500">跟进状态</label>
                      <select value={editForm.status || "potential"} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-700">
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-500">下次跟进时间</label>
                      <input type="date" value={editForm.nextFollowUp || ""} onChange={(e) => setEditForm((p) => ({ ...p, nextFollowUp: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
                    </div>
                  </div>
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
                      rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"/>
                  </div>
                </div>
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

      {/* Follow-up Mini Modal */}
      {followupTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setFollowupTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900">添加跟进记录</h2>
            <p className="mt-1 text-xs text-slate-500">记录与客户的最新沟通内容</p>
            <textarea
              value={followupText}
              onChange={(e) => setFollowupText(e.target.value)}
              placeholder="例如：客户回复了邮件，要求提供 FOB 报价…"
              rows={3}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setFollowupTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">取消</button>
              <button onClick={submitFollowup} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition">提交</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

