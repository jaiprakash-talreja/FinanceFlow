import { useEffect, useMemo } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { Input, Select } from "./ui/Field";
import useForm from "../hooks/useForm";
import { rules } from "../lib/validators";
import { api } from "../lib/api";
import { todayISO } from "../lib/format";
import { useToast } from "../context/ToastContext";

const empty = { type: "expense", category: "", amount: "", date: todayISO(), note: "", paymentMethod: "upi" };

// Add / edit a transaction. `editing` is the transaction being edited, or null to create.
export default function TransactionModal({ open, onClose, editing, categories, onSaved }) {
  const toast = useToast();
  const { values, setValues, errors, submitting, onChange, handleSubmit, reset } = useForm(empty, {
    category: [rules.required("Category")],
    amount: [rules.required("Amount"), rules.positive("Amount")],
    date: [rules.required("Date")],
    note: [rules.maxLen(200)],
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      reset({
        type: editing.type,
        category: editing.category?._id || "",
        amount: String(editing.amount),
        date: editing.date.slice(0, 10),
        note: editing.note || "",
        paymentMethod: editing.paymentMethod || "upi",
      });
    } else {
      reset({ ...empty, date: todayISO() });
    }
  }, [open, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const options = useMemo(() => (categories || []).filter((c) => c.type === values.type), [categories, values.type]);

  const setType = (type) => setValues((v) => ({ ...v, type, category: "" }));

  const submit = (e) =>
    handleSubmit(async (v) => {
      const body = { category: v.category, amount: Number(v.amount), date: v.date, note: v.note.trim(), paymentMethod: v.paymentMethod };
      const saved = editing
        ? await api(`/transactions/${editing._id}`, { method: "PUT", body })
        : await api("/transactions", { method: "POST", body });
      toast.success(editing ? "Transaction updated" : "Transaction added");
      onSaved?.(saved);
      onClose();
    })(e).catch((err) => toast.error("Could not save", err.message));

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit transaction" : "New transaction"}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="tx-form" loading={submitting}>{editing ? "Save changes" : "Add transaction"}</Button>
      </>}>
      <form id="tx-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-[13px] font-medium text-muted">Type</span>
          <div className="grid grid-cols-2 gap-1 rounded-clay bg-slate-100 p-1 shadow-[inset_0_1px_2px_rgb(20_19_15/0.06)] dark:bg-slate-800/70">
            {["expense", "income"].map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`rounded-[10px] py-2 text-sm font-medium capitalize transition duration-200 ease-soft ${values.type === t
                  ? `bg-card shadow-clay-sm ${t === "income" ? "text-pos-600 dark:text-pos-400" : "text-ink"}`
                  : "text-muted hover:text-ink"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <Select label="Category" name="category" value={values.category} onChange={onChange} error={errors.category}>
          <option value="">Select…</option>
          {options.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
        </Select>
        <Input label="Amount (₹)" name="amount" type="number" inputMode="decimal" min="0" step="0.01" value={values.amount} onChange={onChange} error={errors.amount} />
        <Input label="Date" name="date" type="date" value={values.date} onChange={onChange} error={errors.date} />
        <Select label="Payment method" name="paymentMethod" value={values.paymentMethod} onChange={onChange}>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
          <option value="cash">Cash</option>
          <option value="bank">Bank transfer</option>
        </Select>
        <Input className="sm:col-span-2" label="Note" name="note" placeholder="e.g. Groceries at DMart" value={values.note} onChange={onChange} error={errors.note} />
      </form>
    </Modal>
  );
}
