import { useEffect } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import useFetch from "../hooks/useFetch";
import useDisclosure from "../hooks/useDisclosure";
import useForm from "../hooks/useForm";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { Input, Select } from "../components/ui/Field";
import { PageLoader } from "../components/ui/Spinner";
import { EmptyState, ErrorState, PageHeader } from "../components/ui/misc";
import { api } from "../lib/api";
import { rules } from "../lib/validators";
import { useToast } from "../context/ToastContext";

const COLORS = ["#10b985", "#0d9488", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#ef4444", "#f97316", "#eab308", "#64748b"];
const ICONS = ["🍔", "🏠", "🚌", "🛍️", "💡", "💊", "🎬", "📚", "✈️", "🎁", "💼", "💻", "📈", "🐶", "☕", "🏷️"];

function CategoryModal({ open, onClose, editing, onSaved }) {
  const toast = useToast();
  const { values, setValues, errors, submitting, onChange, handleSubmit, reset } = useForm(
    { name: "", type: "expense", color: COLORS[0], icon: "🏷️" },
    { name: [rules.required("Name"), rules.maxLen(40)] }
  );

  useEffect(() => {
    if (open) reset(editing ? { name: editing.name, type: editing.type, color: editing.color, icon: editing.icon } : { name: "", type: "expense", color: COLORS[0], icon: "🏷️" });
  }, [open, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e) =>
    handleSubmit(async (v) => {
      if (editing) await api(`/categories/${editing._id}`, { method: "PATCH", body: { name: v.name.trim(), color: v.color, icon: v.icon } });
      else await api("/categories", { method: "POST", body: { ...v, name: v.name.trim() } });
      toast.success(editing ? "Category updated" : "Category created");
      onSaved();
      onClose();
    })(e).catch((err) => toast.error("Could not save category", err.message));

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit category" : "New category"} size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="cat-form" loading={submitting}>Save</Button></>}>
      <form id="cat-form" onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Name" name="name" value={values.name} onChange={onChange} error={errors.name} placeholder="e.g. Groceries" />
        <Select label="Type" name="type" value={values.type} onChange={onChange} disabled={Boolean(editing)}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </Select>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Color</legend>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setValues((v) => ({ ...v, color: c }))} aria-label={`Color ${c}`}
                className={`h-8 w-8 rounded-full transition hover:scale-110 ${values.color === c ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-900" : ""}`} style={{ background: c }} />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Icon</legend>
          <div className="grid grid-cols-8 gap-1.5">
            {ICONS.map((i) => (
              <button key={i} type="button" onClick={() => setValues((v) => ({ ...v, icon: i }))}
                className={`grid h-9 place-items-center rounded-lg text-lg transition hover:bg-slate-100 dark:hover:bg-slate-800 ${values.icon === i ? "bg-brand-50 ring-2 ring-brand-500 dark:bg-brand-500/10" : ""}`}>{i}</button>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

function CategoryList({ title, items, onEdit, onDelete }) {
  return (
    <Card title={title} bodyClass="p-0">
      {items.length === 0 ? <EmptyState title="Nothing here yet" /> : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((c) => (
            <li key={c._id} className="flex items-center gap-3 px-5 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg text-base" style={{ background: `${c.color}22` }}>{c.icon}</span>
              <span className="flex-1 font-medium">{c.name}</span>
              <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
              <Button variant="ghost" size="icon" onClick={() => onEdit(c)} aria-label={`Edit ${c.name}`}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(c)} aria-label={`Delete ${c.name}`} className="hover:!text-rose-600"><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function Categories() {
  const toast = useToast();
  const cats = useFetch("/categories");
  const editor = useDisclosure();
  const remover = useDisclosure();

  if (cats.loading) return <PageLoader />;
  if (cats.error) return <ErrorState error={cats.error} onRetry={cats.refetch} />;

  const remove = async () => {
    try {
      await api(`/categories/${remover.data._id}`, { method: "DELETE" });
      toast.success("Category deleted");
      cats.refetch();
    } catch (err) {
      toast.error("Cannot delete category", err.message);
    }
  };

  return (
    <>
      <PageHeader title="Categories" subtitle="Organise transactions with your own categories, colours and icons."
        actions={<Button icon={Plus} onClick={() => editor.open()}>New category</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryList title="Expense categories" items={cats.data.filter((c) => c.type === "expense")} onEdit={editor.open} onDelete={remover.open} />
        <CategoryList title="Income categories" items={cats.data.filter((c) => c.type === "income")} onEdit={editor.open} onDelete={remover.open} />
      </div>
      <CategoryModal open={editor.isOpen} onClose={editor.close} editing={editor.data} onSaved={cats.refetch} />
      <ConfirmDialog open={remover.isOpen} onClose={remover.close} onConfirm={remove} title="Delete category?"
        message={`Delete "${remover.data?.name}"? Categories that are used by transactions cannot be deleted.`} />
    </>
  );
}
