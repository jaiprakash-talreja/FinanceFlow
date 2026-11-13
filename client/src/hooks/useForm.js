import { useCallback, useState } from "react";
import { validate } from "../lib/validators";

// Form state + validation + submit handling, reused by every form in the app.
export default function useForm(initial, schema = {}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }));
    setErrors((er) => (er[name] ? { ...er, [name]: "" } : er));
  }, []);

  const handleSubmit = (fn) => async (e) => {
    e?.preventDefault();
    const found = validate(values, schema);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    setSubmitting(true);
    try {
      await fn(values);
    } catch (err) {
      // Map server field errors back onto inputs when available
      if (err.details?.length) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      }
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const reset = useCallback((next = initial) => { setValues(next); setErrors({}); }, [initial]);

  return { values, setValues, errors, setErrors, submitting, onChange, handleSubmit, reset };
}
