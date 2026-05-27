import { useState, useEffect, useCallback } from "react";
import { API, fetchApi } from "../config.js";

const SCENE_LABELS = {
  first_contact: "首次开发信",
  sample_followup: "样品跟进",
  order_confirmation: "订单确认",
  holiday_greeting: "节日问候",
  after_sales: "售后跟进",
};
const TONE_LABELS = { formal: "正式", neutral: "中性", friendly: "友好" };

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function EmailHistory() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [exporting, setExporting] = useState(false);

  const fetchEmails = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    const res = await fetchApi(`${API}/emails?${params}`);
    const data = await res.json();
    setEmails(data.data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { setLoading(true); fetchEmails(); }, [fetchEmails]);

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === emails.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(emails.map((e) => e.id)));
    }
  }

  async function handleBatchExport() {
    if (selected.size === 0) return;
    setExporting(true);
    try {
      const token = localStorage.getItem("trade_lead_token");
      const res = await fetch(`${API}/export/emails/word`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: [...selected] }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "emails_export.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  }

  async function handleSingleExport(emailId) {
    setExporting(true);
    try {
      const token = localStorage.getItem("trade_lead_token");
      const res = await fetch(`${API}/export/emails/word`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: [emailId] }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "email_export.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(emailId) {
    await fetchApi(`${API}/emails/${emailId}`, { method: "DELETE" });
    setSelected((prev) => { const next = new Set(prev); next.delete(emailId); return next; });
    fetchEmails();
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">邮件历史</h1>
            <p className="mt-0.5 text-sm text-slate-500">{emails.length} 封已保存的邮件</p>
          </div>
          <button
            onClick={handleBatchExport}
            disabled={selected.size === 0 || exporting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {exporting ? "导出中..." : `批量导出 Word (${selected.size})`}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Search */}
        <div className="mb-5 w-full sm:w-80">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索公司名或产品…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex space-x-1.5"><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]"/><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]"/><div className="h-2 w-2 animate-bounce rounded-full bg-slate-300"/></div>
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-sm text-slate-500">暂无保存的邮件</p>
              <p className="mt-1 text-xs text-slate-400">在 AI 邮件生成页面生成邮件后点击"保存模板"即可</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  <th className="w-10 py-3 pl-5 pr-1">
                    <input type="checkbox" checked={selected.size === emails.length && emails.length > 0} onChange={toggleAll} className="h-3.5 w-3.5 accent-indigo-600" />
                  </th>
                  <th className="py-3 px-2">公司名称</th>
                  <th className="hidden md:table-cell py-3 px-2">产品</th>
                  <th className="hidden lg:table-cell py-3 px-2">场景</th>
                  <th className="hidden sm:table-cell py-3 px-2">语气</th>
                  <th className="hidden lg:table-cell py-3 px-2">时间</th>
                  <th className="w-28 py-3 pl-2 pr-5">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {emails.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pl-5 pr-1">
                      <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} className="h-3.5 w-3.5 accent-indigo-600" />
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-[13px] font-medium text-slate-900">{e.companyName || "—"}</div>
                      {e.country && <div className="text-[11px] text-slate-400 mt-0.5">{e.country}</div>}
                    </td>
                    <td className="hidden md:table-cell py-3 px-2 text-[13px] text-slate-600">{e.productName || "—"}</td>
                    <td className="hidden lg:table-cell py-3 px-2">
                      <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-medium text-indigo-700">
                        {SCENE_LABELS[e.scene] || e.scene}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell py-3 px-2 text-[12px] text-slate-500">{TONE_LABELS[e.tone] || e.tone}</td>
                    <td className="hidden lg:table-cell py-3 px-2 text-[12px] text-slate-400">{formatDate(e.createdAt)}</td>
                    <td className="py-3 pl-2 pr-5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleSingleExport(e.id)} className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition">导出</button>
                        <button onClick={() => handleDelete(e.id)} className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
