import { useEffect, useState } from "react";
import { Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
import useFetch from "../hooks/useFetch";
import useDisclosure from "../hooks/useDisclosure";
import useForm from "../hooks/useForm";
import useSocketEvent from "../hooks/useSocketEvent";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { Input, Select } from "../components/ui/Field";
import { PageLoader } from "../components/ui/Spinner";
import { Badge, EmptyState, ErrorState, PageHeader, ProgressBar } from "../components/ui/misc";
import { api } from "../lib/api";
import { rules } from "../lib/validators";
import { currentMonth, money, monthLabel } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { CategoryTile } from "../components/CategoryIcon";

function BudgetModal({ open, onClose, editing, month, categories, onSaved }) {
  const toast = useToast();
  const { values, errors, submitting, onChange, handleSubmit, reset } = useForm(
    { category: "", limit: "" },
    { category: [rules.required("Category")], limit: [rules.required("Limit"), rules.positive("Limit")] }
  );

  useEffect(() => {
    if (open) reset(editing ? { category: editing.category?._id, limit: String(editing.limit) } : { category: "", limit: "" });
  }, [open, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e) =>
    handleSubmit(async (v) => {
      if (editing) await api(`/budgets/${editing._id}`, { method: "PATCH", body: { limit: Number(v.limit) } });
      else await api("/budgets", { method: "POST", body: { category: v.category, month, limit: Number(v.limit) } });
      toast.success(editing ? "Budget updated" : "Budget created");
      onSaved();
      onClose();
    })(e).catch((err) => toast.error("Could not save budget", err.message));

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit budget" : "New budget"} description={`For ${monthLabel(month)}`} size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="budget-form" loading={submitting}>Save</Button></>}>
      <form id="budget-form" onSubmit={submit} className="space-y-4" noValidate>
        <Select label="Category" name="category" value={values.category} onChange={onChange} error={errors.category} disabled={Boolean(editing)}>
          <option value="">Select…</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
        <Input label="Monthly limit (₹)" name="limit" type="number" min="1" value={values.limit} onChange={onChange} error={errors.limit} />
      </form>
    </Modal>
  );
}

export default function Budgets() {
  const toast = useToast();
  const [month, setMonth] = useState(currentMonth());
  const budgets = useFetch("/budgets", { month });
  const categories = useFetch("/categories", { type: "expense" });
  const editor = useDisclosure();
  const remover = useDisclosure();

  useSocketEvent("transactions:changed", budgets.refetch);

  const used = new Set((budgets.data || []).map((b) => b.category?._id));
  const available = (categories.data || []).filter((c) => !used.has(c._id) || c._id === editor.data?.category?._id);

  const totalLimit = (budgets.data || []).reduce((s, b) => s + b.limit, 0);
  const totalSpent = (budgets.data || []).reduce((s, b) => s + b.spent, 0);

  return (
    <>
      <PageHeader title="Budgets" subtitle="Set monthly spending limits. You'll get a live alert at 80% and when a budget is exceeded."
        actions={<>
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="field w-auto" aria-label="Month" />
          <Button icon={Plus} onClick={() => editor.open()} disabled={!available.length}>New budget</Button>
        </>} />

      {budgets.loading ? <PageLoader /> : budgets.error ? <ErrorState error={budgets.error} onRetry={budgets.refetch} /> : budgets.data.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
          <EmptyState icon={PiggyBank} title={`No budgets for ${monthLabel(month)}`} message="Create a budget for a category such as Food or Shopping."
            action={<Button icon={Plus} onClick={() => editor.open()}>Create budget</Button>} />
        </div>
      ) : (
        <>
          <div className="mb-6 surface p-5 sm:p-6">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-muted">Total budgeted for {monthLabel(month)}</p>
              <p className="text-sm tabular-nums"><span className="font-serif-display text-2xl">{money(totalSpent)}</span> <span className="text-muted">of {money(totalLimit)}</span></p>
            </div>
            <ProgressBar value={totalSpent} max={totalLimit} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {budgets.data.map((b) => {
              const pct = Math.round((b.spent / b.limit) * 100);
              const left = b.limit - b.spent;
              return (
                <div key={b._id} className="surface group p-5 transition duration-300 ease-soft hover:-translate-y-0.5 hover:shadow-lift sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <CategoryTile category={b.category} size="lg" />
                      <div>
                        <p className="font-medium">{b.category?.name}</p>
                        <p className="text-xs text-muted">Limit {money(b.limit)}</p>
                      </div>
                    </div>
                    <Badge color={pct >= 100 ? "red" : pct >= 80 ? "amber" : "green"}>{pct}%</Badge>
                  </div>
                  <div className="mt-4"><ProgressBar value={b.spent} max={b.limit} /></div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="tabular-nums text-muted">{money(b.spent)} spent</span>
                    <span className={`font-medium tabular-nums ${left < 0 ? "text-brand-600" : "text-muted"}`}>{left < 0 ? `${money(-left)} over` : `${money(left)} left`}</span>
                  </div>
                  <div className="mt-3 flex justify-end gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <Button variant="ghost" size="sm" icon={Pencil} onClick={() => editor.open(b)}>Edit</Button>
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => remover.open(b)} className="hover:!text-brand-600">Delete</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <BudgetModal open={editor.isOpen} onClose={editor.close} editing={editor.data} month={month} categories={available} onSaved={budgets.refetch} />
      <ConfirmDialog open={remover.isOpen} onClose={remover.close} title="Delete budget?"
        message={`Remove the ${remover.data?.category?.name} budget for ${monthLabel(month)}? Your transactions are not affected.`}
        onConfirm={async () => { await api(`/budgets/${remover.data._id}`, { method: "DELETE" }); toast.success("Budget deleted"); budgets.refetch(); }} />
    </>
  );
}
