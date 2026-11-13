import { useEffect, useState } from "react";
import { Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import useFetch from "../hooks/useFetch";
import useDebounce from "../hooks/useDebounce";
import useDisclosure from "../hooks/useDisclosure";
import useSocketEvent from "../hooks/useSocketEvent";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Spinner from "../components/ui/Spinner";
import { Badge, EmptyState, ErrorState, PageHeader, Pagination } from "../components/ui/misc";
import TransactionModal from "../components/TransactionModal";
import { api } from "../lib/api";
import { money, shortDate } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { CategoryTile } from "../components/CategoryIcon";

const initialFilters = { type: "", category: "", from: "", to: "", sort: "-date" };

export default function Transactions() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const debounced = useDebounce(search);

  const categories = useFetch("/categories");
  const list = useFetch("/transactions", { ...filters, search: debounced, page, limit: 10 });
  const editor = useDisclosure();
  const remover = useDisclosure();

  useEffect(() => setPage(1), [debounced, filters]);
  useSocketEvent("transactions:changed", list.refetch);

  const setFilter = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  const activeFilters = Object.entries(filters).filter(([k, v]) => v && k !== "sort").length;

  const remove = async () => {
    await api(`/transactions/${remover.data._id}`, { method: "DELETE" });
    toast.success("Transaction deleted");
    list.refetch();
  };

  const data = list.data;

  return (
    <>
      <PageHeader title="Transactions" subtitle="Search, filter and manage all your income and expenses."
        actions={<Button icon={Plus} onClick={() => editor.open()}>Add transaction</Button>} />

      <Card bodyClass="p-0">
        <div className="flex flex-col gap-3 border-b border-line/70 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes…" aria-label="Search transactions" className="field pl-9" />
            {list.loading && data && <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
          </div>
          <div className="flex gap-2">
            <Select name="sort" value={filters.sort} onChange={setFilter} aria-label="Sort" className="flex-1 sm:w-40">
              <option value="-date">Newest first</option>
              <option value="date">Oldest first</option>
              <option value="-amount">Highest amount</option>
              <option value="amount">Lowest amount</option>
            </Select>
            <Button variant="secondary" icon={SlidersHorizontal} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
              Filters{activeFilters > 0 && <Badge color="green">{activeFilters}</Badge>}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid animate-fade-in gap-3 border-b border-line/70 bg-slate-50/60 p-4 dark:bg-slate-900/40 sm:grid-cols-2 lg:grid-cols-5">
            <Select label="Type" name="type" value={filters.type} onChange={setFilter}>
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
            <Select label="Category" name="category" value={filters.category} onChange={setFilter}>
              <option value="">All</option>
              {categories.data?.filter((c) => !filters.type || c.type === filters.type).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
            <Input label="From" name="from" type="date" value={filters.from} onChange={setFilter} />
            <Input label="To" name="to" type="date" value={filters.to} onChange={setFilter} />
            <div className="flex items-end">
              <Button variant="ghost" icon={X} className="w-full" onClick={() => setFilters(initialFilters)}>Clear filters</Button>
            </div>
          </div>
        )}

        {list.loading && !data ? (
          <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-brand-500" /></div>
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : data.items.length === 0 ? (
          <EmptyState title="No transactions found" message={search || activeFilters ? "Try a different search or clear the filters." : "Add your first transaction to get started."} />
        ) : (
          <>
            {/* Table on tablet/desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Note</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {data.items.map((t) => (
                    <tr key={t._id} className="transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-5 py-3 text-muted">{shortDate(t.date)}</td>
                      <td className="px-5 py-3"><span className="inline-flex items-center gap-2 font-medium"><CategoryTile category={t.category} size="sm" />{t.category?.name}</span></td>
                      <td className="max-w-xs truncate px-5 py-3 text-muted">{t.note || "—"}</td>
                      <td className="px-5 py-3 uppercase text-muted">{t.paymentMethod}</td>
                      <td className={`whitespace-nowrap px-5 py-3 text-right font-medium tabular-nums ${t.type === "income" ? "text-pos-600 dark:text-pos-400" : "text-ink"}`}>
                        {t.type === "income" ? "+" : "−"}{money(t.amount)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => editor.open(t)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remover.open(t)} aria-label="Delete" className="hover:!text-brand-600"><Trash2 className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards on mobile */}
            <ul className="divide-y divide-line/70 md:hidden">
              {data.items.map((t) => (
                <li key={t._id} className="flex items-center gap-3 px-4 py-3">
                  <CategoryTile category={t.category} size="lg" />
                  <button className="min-w-0 flex-1 text-left" onClick={() => editor.open(t)}>
                    <p className="truncate text-sm font-medium">{t.note || t.category?.name}</p>
                    <p className="text-xs text-muted">{t.category?.name} · {shortDate(t.date)}</p>
                  </button>
                  <div className="text-right">
                    <p className={`text-sm font-medium tabular-nums ${t.type === "income" ? "text-pos-600" : "text-ink"}`}>{t.type === "income" ? "+" : "−"}{money(t.amount)}</p>
                    <button onClick={() => remover.open(t)} className="text-xs text-slate-400 hover:text-brand-600">Delete</button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line/70 p-4">
              <Pagination page={data.page} pages={data.pages} onChange={setPage} />
              {data.pages <= 1 && <p className="text-sm text-muted">{data.total} transaction{data.total === 1 ? "" : "s"}</p>}
            </div>
          </>
        )}
      </Card>

      <TransactionModal open={editor.isOpen} onClose={editor.close} editing={editor.data} categories={categories.data} onSaved={list.refetch} />
      <ConfirmDialog open={remover.isOpen} onClose={remover.close} onConfirm={remove} title="Delete transaction?"
        message={remover.data ? `This will permanently delete "${remover.data.note || remover.data.category?.name}" (${money(remover.data.amount)}).` : ""} />
    </>
  );
}
