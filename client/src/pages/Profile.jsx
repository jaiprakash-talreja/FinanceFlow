import { useState } from "react";
import { KeyRound, Save } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { Badge, PageHeader } from "../components/ui/misc";
import useForm from "../hooks/useForm";
import { rules } from "../lib/validators";
import { api } from "../lib/api";
import { shortDate } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Profile() {
  const { user, setUser, startSession } = useAuth();
  const toast = useToast();
  const [pwError, setPwError] = useState("");

  const profile = useForm(
    { name: user.name, currency: user.currency || "INR", monthlyIncomeGoal: String(user.monthlyIncomeGoal || 0) },
    { name: [rules.required("Name")] }
  );
  const pw = useForm(
    { currentPassword: "", newPassword: "", confirm: "" },
    {
      currentPassword: [rules.required("Current password")],
      newPassword: [rules.password],
      confirm: [(v, all) => (v === all.newPassword ? "" : "Passwords do not match")],
    }
  );

  const saveProfile = (e) =>
    profile.handleSubmit(async (v) => {
      const res = await api("/auth/me", { method: "PATCH", body: { name: v.name.trim(), currency: v.currency, monthlyIncomeGoal: Number(v.monthlyIncomeGoal) || 0 } });
      setUser(res.user);
      toast.success("Profile saved");
    })(e).catch((err) => toast.error("Could not save profile", err.message));

  const changePassword = (e) =>
    pw.handleSubmit(async ({ currentPassword, newPassword }) => {
      setPwError("");
      startSession(await api("/auth/password", { method: "PATCH", body: { currentPassword, newPassword } }));
      pw.reset();
      toast.success("Password changed", "Other devices have been signed out.");
    })(e).catch((err) => setPwError(err.message));

  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your account details and security." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-600 text-3xl font-bold text-white">{user.name[0]?.toUpperCase()}</div>
            <p className="mt-3 text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="mt-3"><Badge color={user.role === "admin" ? "violet" : "green"}>{user.role}</Badge></div>
            <dl className="mt-6 w-full space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
              <div className="flex justify-between"><dt className="text-slate-500">Member since</dt><dd className="font-medium">{shortDate(user.createdAt)}</dd></div>
              {user.lastLoginAt && <div className="flex justify-between"><dt className="text-slate-500">Last login</dt><dd className="font-medium">{shortDate(user.lastLoginAt)}</dd></div>}
            </dl>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Account details">
            <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2" noValidate>
              <Input className="sm:col-span-2" label="Full name" name="name" value={profile.values.name} onChange={profile.onChange} error={profile.errors.name} />
              <Select label="Currency" name="currency" value={profile.values.currency} onChange={profile.onChange}>
                <option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option>
              </Select>
              <Input label="Monthly income goal" name="monthlyIncomeGoal" type="number" min="0" value={profile.values.monthlyIncomeGoal} onChange={profile.onChange} />
              <div className="sm:col-span-2"><Button type="submit" icon={Save} loading={profile.submitting}>Save changes</Button></div>
            </form>
          </Card>

          <Card title="Change password">
            <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2" noValidate>
              {pwError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 sm:col-span-2" role="alert">{pwError}</p>}
              <Input className="sm:col-span-2" label="Current password" name="currentPassword" type="password" autoComplete="current-password" value={pw.values.currentPassword} onChange={pw.onChange} error={pw.errors.currentPassword} />
              <Input label="New password" name="newPassword" type="password" autoComplete="new-password" value={pw.values.newPassword} onChange={pw.onChange} error={pw.errors.newPassword} />
              <Input label="Confirm new password" name="confirm" type="password" autoComplete="new-password" value={pw.values.confirm} onChange={pw.onChange} error={pw.errors.confirm} />
              <div className="sm:col-span-2"><Button type="submit" variant="secondary" icon={KeyRound} loading={pw.submitting}>Update password</Button></div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
