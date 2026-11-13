// Client-side validation rules (the server validates again).
export const rules = {
  required: (label) => (v) => (String(v ?? "").trim() ? "" : `${label} is required`),
  email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? "" : "Enter a valid email"),
  password: (v) => {
    if (!v || v.length < 8) return "At least 8 characters";
    if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return "Use letters and at least one number";
    return "";
  },
  positive: (label) => (v) => (Number(v) > 0 ? "" : `${label} must be greater than 0`),
  maxLen: (n) => (v) => (String(v ?? "").length <= n ? "" : `Maximum ${n} characters`),
};

// schema: { field: [rule, rule] } -> { field: "first error" }
export function validate(values, schema) {
  const errors = {};
  for (const [field, fns] of Object.entries(schema)) {
    for (const fn of fns) {
      const msg = fn(values[field], values);
      if (msg) { errors[field] = msg; break; }
    }
  }
  return errors;
}
