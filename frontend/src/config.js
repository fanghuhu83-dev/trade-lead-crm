const API_BASE = import.meta.env.VITE_API_URL || "https://brakes-alphabetical-innovative-nhs.trycloudflare.com";
export const API = `${API_BASE}/api`;

export function fetchApi(url, options = {}) {
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
