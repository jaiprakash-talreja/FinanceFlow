import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    <AuthShell title="Start tracking." subtitle="Create a free account in under a minute."
      footer={<>Already have an account? <Link to="/login" className="link">Log in</Link></>}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && <div className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/30" role="alert">{formError}</div>}
        <Input label="Full name" name="name" autoComplete="name" value={values.name} onChange={onChange} error={errors.name} />
        <Input label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={onChange} error={errors.email} />
        <Input label="Password" name="password" type="password" autoComplete="new-password" value={values.password} onChange={onChange} error={errors.password} hint="At least 8 characters with a number" />
        <Input label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={values.confirm} onChange={onChange} error={errors.confirm} />
        <Button type="submit" className="w-full" size="lg" loading={submitting}>Create account</Button>
      </form>
    </AuthShell>
  );
}
