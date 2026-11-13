// Labelled form controls with inline error messages.
function Wrapper({ label, error, hint, htmlFor, children, className = "" }) {
  return (
    <div className={className}>
      {label && <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ label, error, hint, className, id, name, ...props }) {
  const fieldId = id || name;
  return (
    <Wrapper label={label} error={error} hint={hint} htmlFor={fieldId} className={className}>
      <input id={fieldId} name={name} aria-invalid={Boolean(error)} className={`field ${error ? "field-error" : ""}`} {...props} />
    </Wrapper>
  );
}

export function Select({ label, error, hint, className, id, name, children, ...props }) {
  const fieldId = id || name;
  return (
    <Wrapper label={label} error={error} hint={hint} htmlFor={fieldId} className={className}>
      <select id={fieldId} name={name} aria-invalid={Boolean(error)} className={`field pr-8 ${error ? "field-error" : ""}`} {...props}>
        {children}
      </select>
    </Wrapper>
  );
}

export function Textarea({ label, error, hint, className, id, name, ...props }) {
  const fieldId = id || name;
  return (
    <Wrapper label={label} error={error} hint={hint} htmlFor={fieldId} className={className}>
      <textarea id={fieldId} name={name} aria-invalid={Boolean(error)} className={`field min-h-[80px] ${error ? "field-error" : ""}`} {...props} />
    </Wrapper>
  );
}
