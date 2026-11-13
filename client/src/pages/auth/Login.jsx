import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
    <AuthShell title="Welcome back." subtitle="Log in to see where your money is going."
      footer={<>New here? <Link to="/register" className="link">Create an account</Link></>}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && <div className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/30" role="alert">{formError}</div>}
        <Input label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={onChange} error={errors.email} />
        <Input label="Password" name="password" type="password" autoComplete="current-password" value={values.password} onChange={onChange} error={errors.password} />
        <Button type="submit" className="w-full" size="lg" loading={submitting}>Log in</Button>
      </form>

      <div className="mt-8">
        <div className="mb-3 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-line" />or try a demo account<span className="h-px flex-1 bg-line" />
        </div>
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
