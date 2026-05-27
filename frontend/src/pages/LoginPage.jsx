import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";

export default function LoginPage({ onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  
  async function handleDemoLogin(e) {
    e.preventDefault();
    setError("");
    setEmail("demo@example.com");
    setPassword("demo123456");
    setTimeout(async () => {
      setLoading(true);
      try {
        await login("demo@example.com", "demo123456");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 100);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("请填写邮箱和密码。");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white mb-4">TL</div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Trade Lead</h1>
          <p className="mt-2 text-sm text-slate-500">外贸客户开发平台</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">登录</h2>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">邮箱</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">密码</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位密码"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="mt-6 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition">
            {loading ? "登录中..." : "登录"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            没有账号？{" "}
            <button type="button" onClick={onSwitch} className="font-medium text-indigo-600 hover:text-indigo-700">立即注册</button>
          </p>
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400">或</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="mt-4 w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition"
          >
            {loading ? "登录中..." : "使用演示账号快速登录"}
          </button>

          <p className="mt-2 text-center text-[11px] text-slate-400">演示账号数据每24小时自动重置</p>
        </form>
      </div>
    </div>
  );
}
