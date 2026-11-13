import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import AuthShell from "./AuthShell";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import useForm from "../../hooks/useForm";
import { rules } from "../../lib/validators";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const DEMO = [
  { label: "Demo user", email: "demo@financeflow.dev", password: "Demo@1234" },
  { label: "Admin", email: "admin@financeflow.dev", password: "Admin@1234" },
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState("");
  const { values, setValues, errors, submitting, onChange, handleSubmit } = useForm(
    { email: "", password: "" },
    { email: [rules.required("Email"), rules.email], password: [rules.required("Password")] }
  );

  const submit = handleSubmit(async ({ email, password }) => {
    setFormError("");
    await login(email, password);
    toast.success("Welcome back!");
    navigate(location.state?.from || "/", { replace: true });
  });

  const onSubmit = (e) => submit(e).catch((err) => setFormError(err.message));

  return (
    <AuthShell title="Log in" subtitle="Good to see you again."
      footer={<>New here? <Link to="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Create an account</Link></>}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300" role="alert">{formError}</div>}
        <Input label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={onChange} error={errors.email} />
        <Input label="Password" name="password" type="password" autoComplete="current-password" value={values.password} onChange={onChange} error={errors.password} />
        <Button type="submit" className="w-full" size="lg" loading={submitting} icon={LogIn}>Log in</Button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-700">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Try a demo account</p>
        <div className="flex gap-2">
          {DEMO.map((d) => (
            <Button key={d.email} type="button" variant="secondary" size="sm" className="flex-1"
              onClick={() => setValues({ email: d.email, password: d.password })}>{d.label}</Button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
