export default function Card({ title, action, className = "", bodyClass = "p-5 sm:p-6", children }) {
  return (
    <section className={`surface animate-rise ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          <h2 className="font-serif-display text-xl text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}
