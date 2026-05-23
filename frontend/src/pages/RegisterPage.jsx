import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";

export default function RegisterPage({ onSwitch }) {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password || !companyName.trim()) {
      setError("请填写所有字段。");
      return;
    }
    if (password.length < 6) {
      setError("密码至少需要 6 位。");
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, companyName.trim());
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
          <p className="mt-2 text-sm text-slate-500">创建免费账号，开始客户开发</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">注册</h2>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">公司名称</label>
              <input
                value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                placeholder="例如：华兴贸易有限公司"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
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
            {loading ? "注册中..." : "免费注册"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            已有账号？{" "}
            <button type="button" onClick={onSwitch} className="font-medium text-indigo-600 hover:text-indigo-700">立即登录</button>
          </p>
        </form>
      </div>
    </div>
  );
}
