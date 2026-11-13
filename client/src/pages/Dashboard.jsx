import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Plus, Receipt, Wallet } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useFetch from "../hooks/useFetch";
import useDisclosure from "../hooks/useDisclosure";
import useSocketEvent from "../hooks/useSocketEvent";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { PageLoader } from "../components/ui/Spinner";
import { EmptyState, ErrorState, PageHeader, ProgressBar, StatCard } from "../components/ui/misc";
import TransactionModal from "../components/TransactionModal";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { compactMoney, money, monthLabel, shortDate } from "../lib/format";

function TooltipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      {label && <p className="mb-1 font-semibold">{label.includes?.("-") ? monthLabel(label) : label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload.color }} />
          <span className="capitalize text-slate-500">{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums">{money(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const summary = useFetch("/transactions/summary");
  const recent = useFetch("/transactions", { limit: 6 });
  const budgets = useFetch("/budgets");
  const categories = useFetch("/categories");
  const modal = useDisclosure();

  // Refresh when transactions change in another tab or device
  useSocketEvent("transactions:changed", () => {
    summary.refetch(); recent.refetch(); budgets.refetch();
  });

  if (summary.loading) return <PageLoader label="Loading your dashboard…" />;
  if (summary.error) return <ErrorState error={summary.error} onRetry={summary.refetch} />;

  const s = summary.data;
  const savingsRate = s.income > 0 ? Math.round(((s.income - s.expense) / s.income) * 100) : 0;
  const axis = isDark ? "#64748b" : "#94a3b8";
  const grid = isDark ? "#1e293b" : "#f1f5f9";

  return (
    <>
      <PageHeader
        title={`Hi, ${user.name.split(" ")[0]} 👋`}
        subtitle={`Here's your money in ${monthLabel(s.month)}.`}
        actions={<Button icon={Plus} onClick={() => modal.open()}>Add transaction</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Balance" value={money(s.balance)} icon={Wallet} tone="blue" sub="Income minus expenses this month" />
        <StatCard label="Income" value={money(s.income)} icon={ArrowUpRight} tone="green" />
        <StatCard label="Expenses" value={money(s.expense)} icon={ArrowDownRight} tone="red" />
        <StatCard label="Savings rate" value={`${savingsRate}%`} icon={Receipt} sub={`${s.count} transactions this month`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card title="Income vs expenses (6 months)" className="lg:col-span-3">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={s.monthly} margin={{ left: -10, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b985" stopOpacity={0.35} /><stop offset="100%" stopColor="#10b985" stopOpacity={0} /></linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} /><stop offset="100%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => compactMoney(v)} tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipBox />} />
                <Area type="monotone" dataKey="income" stroke="#10b985" strokeWidth={2} fill="url(#inc)" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fill="url(#exp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Spending by category" className="lg:col-span-2">
          {s.byCategory.length === 0 ? (
            <EmptyState title="No expenses yet" message="Add an expense to see the breakdown." />
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={s.byCategory} dataKey="total" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
                      {s.byCategory.map((c) => <Cell key={c.categoryId} fill={c.color} />)}
                    </Pie>
                    <Tooltip content={<TooltipBox />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full space-y-2 text-sm">
                {s.byCategory.slice(0, 6).map((c) => (
                  <li key={c.categoryId} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                    <span className="truncate">{c.icon} {c.name}</span>
                    <span className="ml-auto font-semibold tabular-nums">{money(c.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card title="Recent transactions" className="lg:col-span-3" bodyClass="p-0"
          action={<Link to="/transactions" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">View all</Link>}>
          {recent.data?.items.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.data.items.map((t) => (
                <li key={t._id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base" style={{ background: `${t.category?.color}1f` }}>{t.category?.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.note || t.category?.name}</p>
                    <p className="text-xs text-slate-500">{t.category?.name} · {shortDate(t.date)}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${t.type === "income" ? "text-brand-600 dark:text-brand-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {t.type === "income" ? "+" : "−"}{money(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No transactions yet" message="Your latest income and expenses will show up here." action={<Button size="sm" icon={Plus} onClick={() => modal.open()}>Add one</Button>} />
          )}
        </Card>

        <Card title="Budgets this month" className="lg:col-span-2"
          action={<Link to="/budgets" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Manage</Link>}>
          {budgets.data?.length ? (
            <ul className="space-y-4">
              {budgets.data.map((b) => (
                <li key={b._id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{b.category?.icon} {b.category?.name}</span>
                    <span className="tabular-nums text-slate-500">{money(b.spent)} / {money(b.limit)}</span>
                  </div>
                  <ProgressBar value={b.spent} max={b.limit} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No budgets" message="Set a monthly limit for a category to get alerts." />
          )}
        </Card>
      </div>

      <TransactionModal open={modal.isOpen} onClose={modal.close} categories={categories.data}
        onSaved={() => { summary.refetch(); recent.refetch(); budgets.refetch(); }} />
    </>
  );
}
