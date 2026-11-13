import { Activity, ArrowLeftRight, Megaphone, ShieldCheck, UserPlus, Users } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import useForm from "../../hooks/useForm";
import useSocketEvent from "../../hooks/useSocketEvent";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Field";
import { PageLoader } from "../../components/ui/Spinner";
import { ErrorState, PageHeader, StatCard } from "../../components/ui/misc";
import { api } from "../../lib/api";
import { rules } from "../../lib/validators";
import { compactMoney } from "../../lib/format";
import { useToast } from "../../context/ToastContext";

export default function AdminOverview() {
  const toast = useToast();
  const stats = useFetch("/admin/stats");
  const form = useForm({ title: "", message: "" }, {
    title: [rules.required("Title"), (v) => (v.trim().length >= 3 ? "" : "At least 3 characters")],
    message: [rules.required("Message"), rules.maxLen(500)],
  });

  // Live "online now" counter
  useSocketEvent("presence:update", (ids) => stats.setData((s) => (s ? { ...s, online: ids.length } : s)));

  const announce = (e) =>
    form.handleSubmit(async (v) => {
      const res = await api("/admin/announcements", { method: "POST", body: { title: v.title.trim(), message: v.message.trim() } });
      toast.success("Announcement sent", `Delivered live to ${res.sent} users.`);
      form.reset();
    })(e).catch((err) => toast.error("Could not send", err.message));

  if (stats.loading) return <PageLoader />;
  if (stats.error) return <ErrorState error={stats.error} onRetry={stats.refetch} />;
  const s = stats.data;

  return (
    <>
      <PageHeader title="Admin overview" subtitle="Platform health and user activity at a glance." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={s.users} icon={Users} tone="blue" sub={`${s.active} active · ${s.admins} admin(s)`} />
        <StatCard label="Online now" value={s.online} icon={Activity} tone="green" sub="Live via WebSocket" />
        <StatCard label="New this week" value={s.newThisWeek} icon={UserPlus} />
        <StatCard label="Transactions" value={s.transactions} icon={ArrowLeftRight} tone="red"
          sub={`${compactMoney(s.volume.income || 0)} in · ${compactMoney(s.volume.expense || 0)} out`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Send announcement">
          <form onSubmit={announce} className="space-y-4" noValidate>
            <Input label="Title" name="title" value={form.values.title} onChange={form.onChange} error={form.errors.title} placeholder="Scheduled maintenance" />
            <Textarea label="Message" name="message" value={form.values.message} onChange={form.onChange} error={form.errors.message} placeholder="FinanceFlow will be unavailable for 10 minutes tonight at 11 PM." />
            <Button type="submit" icon={Megaphone} loading={form.submitting}>Broadcast to all users</Button>
          </form>
        </Card>
        <Card title="Access control">
          <div className="flex gap-3 text-sm text-muted">
            <ShieldCheck className="h-5 w-5 shrink-0 text-brand-500" />
            <div className="space-y-2">
              <p>Admin routes are protected twice: the React router hides admin pages from normal users, and the API checks the role from the verified JWT on every <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">/api/admin/*</code> request (403 otherwise).</p>
              <p>Deactivating a user invalidates their tokens immediately and closes their live connections.</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
