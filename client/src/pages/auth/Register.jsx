import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import AuthShell from "./AuthShell";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import useForm from "../../hooks/useForm";
import { rules } from "../../lib/validators";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");
  const { values, errors, submitting, onChange, handleSubmit } = useForm(
    { name: "", email: "", password: "", confirm: "" },
    {
      name: [rules.required("Name"), (v) => (v.trim().length >= 2 ? "" : "Name is too short")],
      email: [rules.required("Email"), rules.email],
      password: [rules.password],
      confirm: [(v, all) => (v === all.password ? "" : "Passwords do not match")],
    }
  );

  const onSubmit = (e) =>
    handleSubmit(async ({ name, email, password }) => {
      setFormError("");
      await register(name.trim(), email, password);
      toast.success("Account created", "We added some starter categories for you.");
      navigate("/dashboard", { replace: true });
    })(e).catch((err) => setFormError(err.message));

  return (
    <AuthShell title="Create your account" subtitle="Free forever. Takes less than a minute."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Log in</Link></>}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300" role="alert">{formError}</div>}
        <Input label="Full name" name="name" autoComplete="name" value={values.name} onChange={onChange} error={errors.name} />
        <Input label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={onChange} error={errors.email} />
        <Input label="Password" name="password" type="password" autoComplete="new-password" value={values.password} onChange={onChange} error={errors.password} hint="At least 8 characters with a number" />
        <Input label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={values.confirm} onChange={onChange} error={errors.confirm} />
        <Button type="submit" className="w-full" size="lg" loading={submitting} icon={UserPlus}>Create account</Button>
      </form>
    </AuthShell>
  );
}
