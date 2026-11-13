const SYMBOL = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

export function money(value, currency = "INR") {
  const n = Number(value) || 0;
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return `${SYMBOL[currency] || ""}${n.toLocaleString(locale, { maximumFractionDigits: 2 })}`;
}

export function compactMoney(value, currency = "INR") {
  const n = Number(value) || 0;
  return `${SYMBOL[currency] || ""}${Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;
}

export function shortDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return shortDate(d);
}

export function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
