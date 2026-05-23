import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { API } from "./config.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("trade_lead_token");
    const savedUser = localStorage.getItem("trade_lead_user");
    if (saved && savedUser) {
      setToken(saved);
      try { setUser(JSON.parse(savedUser)); } catch { /* stale */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    const t = data.data.token, u = data.data.user;
    setToken(t); setUser(u);
    localStorage.setItem("trade_lead_token", t);
    localStorage.setItem("trade_lead_user", JSON.stringify(u));
    return u;
  }, []);

  const register = useCallback(async (email, password, companyName) => {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, companyName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    const t = data.data.token, u = data.data.user;
    setToken(t); setUser(u);
    localStorage.setItem("trade_lead_token", t);
    localStorage.setItem("trade_lead_user", JSON.stringify(u));
    return u;
  }, []);

  const logout = useCallback(() => {
    setToken(null); setUser(null);
    localStorage.removeItem("trade_lead_token");
    localStorage.removeItem("trade_lead_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Helper: fetch with auth token
export function authFetch(url, options = {}) {
  const token = localStorage.getItem("trade_lead_token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}
