import { useState, useRef } from "react";

import { API, fetchApi } from "../config.js";

const STYLES = [
  { value: "concise", label: "简洁版 Concise", desc: "简短有力，直奔主题" },
  { value: "formal", label: "正式版 Formal", desc: "商务正式，结构完整" },
  { value: "marketing", label: "营销版 Marketing", desc: "说服力强，突出卖点" },
];

export default function EmailGenerator() {
  const [form, setForm] = useState({
    companyName: "",
    productName: "",
    country: "",
    industry: "",
    style: "concise",
  });
  const [email, setEmail] = useState("");
  const [currentStyle, setCurrentStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleGenerate() {
    if (!form.companyName.trim() || !form.productName.trim()) {
      setError("请至少填写客户名称和产品名称。");
      return;
    }
    setLoading(true); setError(""); setEmail("");
    try {
      const res = await fetchApi(`${API}/email/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "生成失败，请重试。"); return; }
      setEmail(data.data.email);
      setCurrentStyle(data.data.style);
    } catch {
      setError("网络错误，请确认后端服务已启动。");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!email) return;
    navigator.clipboard.writeText(email).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">AI 邮件生成</h1>
            <p className="mt-0.5 text-sm text-slate-500">基于 OpenAI 智能生成专业外贸英文开发信</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
          {/* Left: Input */}
          <div className="rounded-xl border border-slate-200/60 bg-white p-6">
            <h2 className="mb-1 text-sm font-semibold text-slate-900">邮件参数</h2>
            <p className="mb-5 text-xs text-slate-500">填写以下信息，AI 将自动生成专业的英文开发邮件。</p>

            <div className="space-y-4">
              {[
                { key: "companyName", label: "客户名称", req: true, placeholder: "Nordic Solar Components AB" },
                { key: "productName", label: "产品名称", req: true, placeholder: "Solar Panel Mounting System" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {f.label} {f.req && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    value={form[f.key]}
                    onChange={handleChange(f.key)}
                    placeholder={f.placeholder}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "country", label: "目标国家", placeholder: "Sweden" },
                  { key: "industry", label: "行业", placeholder: "Renewable Energy" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="mb-1 block text-xs font-medium text-slate-500">{f.label}</label>
                    <input
                      value={form[f.key]}
                      onChange={handleChange(f.key)}
                      placeholder={f.placeholder}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">邮件风格</label>
                <div className="space-y-1.5">
                  {STYLES.map((s) => (
                    <label
                      key={s.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                        form.style === s.value
                          ? "border-indigo-200 bg-indigo-50/50 ring-1 ring-indigo-100"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio" name="style" value={s.value}
                        checked={form.style === s.value}
                        onChange={handleChange("style")}
                        className="mt-0.5 h-3.5 w-3.5 accent-indigo-600"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{s.label}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{s.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    生成中...
                  </>
                ) : "生成邮件"}
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="rounded-xl border border-slate-200/60 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">邮件预览</h2>
                {currentStyle && (
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    风格：{STYLES.find((s) => s.value === currentStyle)?.label || currentStyle}
                  </p>
                )}
              </div>
              {email && (
                <div className="flex gap-1.5">
                  <button onClick={handleCopy} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition">
                    {copied ? "✓ 已复制" : "复制"}
                  </button>
                  <button onClick={handleGenerate} disabled={loading} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition">
                    重新生成
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="flex space-x-1.5">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.3s]"/>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.15s]"/>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-300"/>
                </div>
                <p className="mt-4 text-xs text-slate-500">AI 正在为您撰写邮件...</p>
              </div>
            ) : email ? (
              <div className="whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50/50 p-5 text-[13px] leading-7 text-slate-700" style={{ fontFamily: "Georgia, serif" }}>
                {email}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="h-8 w-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <p className="mt-4 text-xs font-medium text-slate-400">尚未生成邮件</p>
                <p className="mt-1 text-[11px] text-slate-400">填写左侧表单后点击"生成邮件"按钮</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
