import { useState, useEffect } from "react";
import { API, fetchApi } from "../config.js";

const STYLES = [
  { value: "concise", label: "简洁版 Concise", desc: "简短有力，直奔主题" },
  { value: "formal", label: "正式版 Formal", desc: "商务正式，结构完整" },
  { value: "marketing", label: "营销版 Marketing", desc: "说服力强，突出卖点" },
];

const SCENES = [
  { value: "first_contact", label: "首次开发信", desc: "初次接触，自我介绍 + 产品亮点" },
  { value: "sample_followup", label: "样品跟进", desc: "确认样品收到，推进下一步" },
  { value: "order_confirmation", label: "订单确认", desc: "确认订单详情，安排发货" },
  { value: "holiday_greeting", label: "节日问候", desc: "节日祝福，维护客户关系" },
  { value: "after_sales", label: "售后跟进", desc: "询问使用体验，促进复购" },
];

const INDUSTRIES = [
  "户外家具", "厨房用品", "电子产品", "服装纺织", "五金工具", "其他",
];

const TONES = [
  { value: "formal", label: "正式", desc: "商务正式，结构严谨" },
  { value: "neutral", label: "中性", desc: "专业得体，不失亲切" },
  { value: "friendly", label: "友好", desc: "轻松自然，拉近距离" },
];

const SAMPLE_EMAILS = {
  first_contact: `Dear Sir/Madam,

I hope this message finds you well. My name is Kevin Zhang, Sales Director at Huaxing Outdoor Products Co., Ltd., a leading manufacturer of premium outdoor furniture based in China with over 12 years of export experience.

We specialize in high-quality aluminum and rattan outdoor furniture sets, serving clients across Europe, North America, and Australia. All our products meet ISO 9001 and FSC certification standards.

I would love to introduce our 2025 summer collection, which features weather-resistant materials and modern minimalist designs that have performed exceptionally well in the German and Dutch markets.

Would you be open to receiving our catalog with pricing? I would be happy to arrange sample delivery at your convenience.

Looking forward to your reply.

Best regards,
Kevin Zhang
Sales Director
Huaxing Outdoor Products Co., Ltd.`,

  sample_followup: `Dear Anna,

I hope you are having a great week.

I wanted to follow up on the samples of our 304 stainless steel cookware set that we shipped to you on May 10th. According to the tracking information, the package has been delivered — I hope everything arrived safely and in good condition.

We included 3 SKUs from our premium line: the 10-piece cookware set, the non-stick frying pan, and the tri-ply stockpot. I am very keen to hear your first impressions — especially on the handle ergonomics and lid fit.

If you have any questions about the materials, customization options, or minimum order quantities, please feel free to reach out. I am also happy to schedule a video call to walk you through our full catalog and production capabilities.

I look forward to hearing your feedback.

Warm regards,
Kevin Zhang
Sales Director
Huaxing Outdoor Products Co., Ltd.`,

  holiday_greeting: `Dear Michael,

Warmest wishes to you and your team during this holiday season!

As the year draws to a close, I wanted to take a moment to express my sincere gratitude for your partnership and trust throughout 2025. It has been a true pleasure working with you, and we deeply value the strong relationship we have built.

We have some exciting new collections launching in early 2026, including an eco-friendly bamboo fiber line that I think would resonate well with your Nordic market. I will be sure to share the new catalog with you as soon as it is ready.

Wishing you a joyful holiday and a prosperous New Year. May 2026 bring continued success to your business and happiness to you and your loved ones.

Looking forward to our continued cooperation in the year ahead.

Warm regards,
Kevin Zhang
Sales Director
Huaxing Outdoor Products Co., Ltd.`,
};

export default function EmailGenerator({ prefill, onConsumed }) {
  const [form, setForm] = useState({
    companyName: "",
    productName: "",
    contactName: "",
    country: "",
    industry: "其他",
    style: "concise",
    scene: "first_contact",
    tone: "neutral",
  });
  const [email, setEmail] = useState("");
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("result");

  // Pre-fill form when navigating from customer management
  useEffect(() => {
    if (prefill) {
      setForm((prev) => ({
        ...prev,
        companyName: prefill.companyName || prev.companyName,
        country: prefill.country || prev.country,
        industry: prefill.industry || prev.industry,
      }));
      if (onConsumed) onConsumed();
    }
  }, [prefill, onConsumed]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleGenerate() {
    if (!form.companyName.trim() || !form.productName.trim()) {
      setError("请至少填写客户名称和产品名称。");
      return;
    }
    setLoading(true); setError(""); setEmail(""); setActiveTab("result");
    try {
      const res = await fetchApi(`${API}/email/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "生成失败，请重试。"); return; }
      setEmail(data.data.email);
      setMeta({ style: data.data.style, scene: data.data.scene, tone: data.data.tone });
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

  const [savedEmailId, setSavedEmailId] = useState(null);

  async function handleSaveTemplate() {
    if (!email) return;
    try {
      const res = await fetchApi(`${API}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          productName: form.productName,
          country: form.country,
          industry: form.industry,
          contactName: form.contactName,
          scene: form.scene,
          tone: form.tone,
          style: form.style,
          body: email,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedEmailId(data.data.id);
        setSaved(true); setTimeout(() => setSaved(false), 2000);
      }
    } catch { /* ignore */ }
  }

  async function handleExportWord() {
    const emailId = savedEmailId;
    if (!emailId) return;
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
    } catch { /* ignore */ }
  }

  const styleMeta = STYLES.find((s) => s.value === meta.style);
  const sceneMeta = SCENES.find((s) => s.value === meta.scene);
  const toneMeta = TONES.find((t) => t.value === meta.tone);

  function getPreviewContent() {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex space-x-1.5">
            <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.3s]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-300 [animation-delay:-0.15s]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-300" />
          </div>
          <p className="mt-4 text-xs text-slate-500">AI 正在为您撰写邮件...</p>
        </div>
      );
    }
    if (email && activeTab === "result") {
      return (
        <div className="whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50/50 p-5 text-[13px] leading-7 text-slate-700" style={{ fontFamily: "Georgia, serif" }}>
          {email}
        </div>
      );
    }
    if (activeTab === "sample") {
      const scene = form.scene || "first_contact";
      const sample = SAMPLE_EMAILS[scene] || SAMPLE_EMAILS.first_contact;
      return (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-medium text-indigo-700">
              {SCENES.find((s) => s.value === scene)?.label || "示例"}
            </span>
            <span className="text-[10px] text-slate-400">示例邮件，仅供参考</span>
          </div>
          <div className="whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50/50 p-5 text-[13px] leading-7 text-slate-700" style={{ fontFamily: "Georgia, serif" }}>
            {sample}
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg className="h-8 w-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <p className="mt-4 text-xs font-medium text-slate-400">尚未生成邮件</p>
        <p className="mt-1 text-[11px] text-slate-400">填写左侧表单后点击"生成邮件"按钮</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">AI 邮件生成</h1>
            <p className="mt-0.5 text-sm text-slate-500">基于 DeepSeek 智能生成专业外贸英文开发信</p>
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
              {/* Scene selector */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">邮件场景</label>
                <div className="space-y-1.5">
                  {SCENES.map((s) => (
                    <label
                      key={s.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-2.5 transition ${
                        form.scene === s.value
                          ? "border-indigo-200 bg-indigo-50/50 ring-1 ring-indigo-100"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio" name="scene" value={s.value}
                        checked={form.scene === s.value}
                        onChange={handleChange("scene")}
                        className="mt-0.5 h-3.5 w-3.5 accent-indigo-600"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{s.label}</div>
                        <div className="mt-0.5 text-[10px] text-slate-500">{s.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Core fields */}
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
                  { key: "contactName", label: "联系人", placeholder: "Anna Lindberg" },
                  { key: "country", label: "目标国家", placeholder: "Sweden" },
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

              <div className="grid grid-cols-2 gap-4">
                {/* Industry dropdown */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">客户行业</label>
                  <select
                    value={form.industry}
                    onChange={handleChange("industry")}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-700"
                  >
                    {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
                {/* Tone dropdown */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">邮件语气</label>
                  <select
                    value={form.tone}
                    onChange={handleChange("tone")}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-700"
                  >
                    {TONES.map((t) => <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>)}
                  </select>
                </div>
              </div>

              {/* Style radios (existing, preserved) */}
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
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    生成中...
                  </>
                ) : "生成邮件"}
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="rounded-xl border border-slate-200/60 bg-white p-6">
            {/* Tabs */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
                <button
                  onClick={() => setActiveTab("result")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === "result" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {email ? "生成结果" : "邮件预览"}
                </button>
                <button
                  onClick={() => setActiveTab("sample")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === "sample" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  示例邮件
                </button>
              </div>
              {email && activeTab === "result" && (
                <div className="flex gap-1.5">
                  <button onClick={handleCopy} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition">
                    {copied ? "✓ 已复制" : "复制"}
                  </button>
                  <button onClick={handleSaveTemplate} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition">
                    {saved ? "✓ 已保存" : "保存模板"}
                  </button>
                  {savedEmailId && (
                    <button onClick={handleExportWord} className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-1.5 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50 transition">
                      导出 Word
                    </button>
                  )}
                  <button onClick={handleGenerate} disabled={loading} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition">
                    重新生成
                  </button>
                </div>
              )}
            </div>

            {/* Meta info */}
            {email && activeTab === "result" && (styleMeta || sceneMeta || toneMeta) && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                {sceneMeta && <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-medium text-indigo-700">{sceneMeta.label}</span>}
                {styleMeta && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">{styleMeta.label}</span>}
                {toneMeta && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">{toneMeta.label}语气</span>}
              </div>
            )}

            {getPreviewContent()}
          </div>
        </div>
      </div>
    </main>
  );
}



