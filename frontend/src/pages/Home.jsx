import { useState } from "react";

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group rounded-xl border border-slate-200/60 bg-white p-6 transition-all duration-200 hover:border-slate-300 hover:shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-200">
        {icon}
      </div>
      <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-[13px] leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
        <path d="M11 8v6" />
        <path d="M8 11h6" />
      </svg>
    ),
    title: "智能获客",
    description: "输入产品关键词，1小时获取200+精准客户"
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: "AI写邮件",
    description: "3分钟生成个性化开发信，回复率提升2.5倍"
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "客户管理",
    description: "一站式管理客户全生命周期，自动跟进提醒"
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: "数据分析",
    description: "可视化销售漏斗，快速识别高价值客户"
  }
];

export default function Home({ onNavigate }) {
  const [demoClicked, setDemoClicked] = useState(false);

  function handleDemoLogin() {
    setDemoClicked(true);
    localStorage.setItem("demo_auto_login", JSON.stringify({ email: "demo@example.com", password: "demo123" }));
    window.location.hash = "login";
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-bold text-white">
              TL
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900">Trade Lead</span>
          </div>
          <button
            onClick={() => { window.location.hash = "login"; }}
            className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800 transition"
          >
            登录
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200/60 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-24 md:py-32 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-[11px] font-medium text-slate-500">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            已服务 50+ 外贸企业
          </div>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl leading-[1.15]">
            让外贸业务员的效率提升3倍
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-500 leading-relaxed">
            AI智能获客与客户管理平台 —— 从找客户到发邮件，一站式解决外贸获客难题
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => { window.location.hash = "login"; }}
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition shadow-sm"
            >
              立即体验
            </button>
            <button
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              功能介绍
            </button>
          </div>
        </div>
        {/* Subtle gradient at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">核心功能</h2>
          <p className="mt-2 text-sm text-slate-500">从获客到成交，全流程覆盖</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </div>
      </section>

      {/* Demo Account */}
      <section className="border-t border-slate-200/60 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">立即体验</h2>
          <p className="mt-2 text-sm text-slate-500">使用演示账号直接登录，无需注册</p>
          <div className="mt-6 inline-flex flex-col items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-50 px-8 py-6">
            <div className="flex items-center gap-6 text-[13px] text-slate-600">
              <span>
                <span className="font-medium text-slate-400">账号：</span>
                <code className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-xs text-slate-700">demo@example.com</code>
              </span>
              <span>
                <span className="font-medium text-slate-400">密码：</span>
                <code className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-xs text-slate-700">demo123</code>
              </span>
            </div>
            <button
              onClick={handleDemoLogin}
              disabled={demoClicked}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition"
            >
              {demoClicked ? "跳转中..." : "一键登录"}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-8 text-center sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Trade Lead. All rights reserved.
          </p>
          <a
            href="https://github.com/fanghuhu83-dev/trade-lead-crm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-700 transition"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
