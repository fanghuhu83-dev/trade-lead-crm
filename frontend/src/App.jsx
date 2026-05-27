import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PipelineBoard from "./pages/PipelineBoard.jsx";
import CustomerManagement from "./pages/CustomerManagement.jsx";
import AnalyticsDashboard from "./pages/AnalyticsDashboard.jsx";
import EmailGenerator from "./pages/EmailGenerator.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Home from "./pages/Home.jsx";

const NAV_ITEMS = [
  { id: "dashboard", label: "工作台" },
  { id: "pipeline", label: "客户管道" },
  { id: "customers", label: "客户管理" },
  { id: "analytics", label: "数据分析" },
  { id: "email", label: "AI 邮件生成" },
];

function NavButton({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      {item.label}
    </button>
  );
}

export default function App() {
  const { user, loading, logout } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [authPage, setAuthPage] = useState("home");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Sync hash with authPage state
  useEffect(() => {
    function sync() {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash === "login" || hash === "register") {
        setAuthPage(hash);
      } else if (hash === "" && (authPage === "login" || authPage === "register")) {
        setAuthPage("home");
      }
    }
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // Auto-fill demo credentials from localStorage
  useEffect(() => {
    const demo = localStorage.getItem("demo_auto_login");
    if (demo) {
      try {
        const { email, password } = JSON.parse(demo);
        const form = document.querySelector("form");
        if (form) {
          const emailInput = form.querySelector("input[type=email]");
          const passInput = form.querySelector("input[type=password]");
          if (emailInput) emailInput.value = email;
          if (passInput) passInput.value = password;
        }
        localStorage.removeItem("demo_auto_login");
      } catch { /* ignore */ }
    }
  }, [authPage]);

  const handleSelectCustomer = useCallback((customer) => {
    setSelectedCustomer(customer);
    setPage("customers");
  }, []);

  const handleNavToPipeline = useCallback(() => {
    setPage("pipeline");
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <div className="flex space-x-1.5">
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
        </div>
      </div>
    );
  }

  // Not logged in — show landing, login, or register
  if (!user) {
    if (authPage === "register") {
      return <RegisterPage onSwitch={() => { window.location.hash = "login"; }} />;
    }
    if (authPage === "login") {
      return <LoginPage onSwitch={() => { window.location.hash = "register"; }} />;
    }
    return <Home />;
  }

  // Logged in — show main app
  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard onSelectCustomer={handleSelectCustomer} onNavToPipeline={handleNavToPipeline} />;
      case "pipeline":
        return <PipelineBoard onSelectCustomer={handleSelectCustomer} />;
      case "customers":
        return <CustomerManagement />;
      case "analytics":
        return <AnalyticsDashboard />;
      case "email":
        return <EmailGenerator />;
      default:
        return <Dashboard onSelectCustomer={handleSelectCustomer} onNavToPipeline={handleNavToPipeline} />;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-56 flex-col border-r border-slate-200/60 bg-white md:flex">
        <div className="flex h-14 items-center gap-3 border-b border-slate-200/60 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-bold text-white">TL</div>
          <span className="text-sm font-semibold tracking-tight text-slate-900">Trade Lead</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <NavButton key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} />
          ))}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-slate-200/60 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
              {user.companyName ? user.companyName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-700 truncate">{user.companyName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <nav className="fixed top-0 z-20 flex h-12 w-full items-center justify-between border-b border-slate-200/60 bg-white md:hidden px-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[10px] font-bold text-white">TL</div>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition whitespace-nowrap ${
                page === item.id ? "bg-slate-100 text-slate-900" : "text-slate-500"
              }`}>
              {item.label}
            </button>
          ))}
        </div>
        <button onClick={logout} className="shrink-0 rounded-md px-2 py-1 text-[10px] font-medium text-slate-400 hover:text-slate-600">
          退出
        </button>
      </nav>

      {/* Main */}
      <div className="flex-1 md:ml-56 mt-12 md:mt-0">
        {renderPage()}
      </div>
    </div>
  );
}
