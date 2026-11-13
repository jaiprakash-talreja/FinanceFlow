import Logo from "../../components/Logo";

// Three tilted "clay" cards that preview what the app does.
function CardStack() {
  return (
    <div className="relative mx-auto h-[300px] w-[480px] max-w-full" aria-hidden="true">
      <div className="absolute left-[286px] top-8 h-60 w-48 rotate-[9deg] rounded-[36px] bg-[#e9e5da] p-6 pl-16 shadow-clay transition duration-700 ease-soft hover:rotate-[12deg] dark:bg-[#d9d4c7]">
        <p className="font-display text-lg text-[#14130f]">Live alert</p>
        <p className="mt-2 text-xs leading-relaxed text-[#5b574e]">Food budget at 82% this month.</p>
        <div className="mt-4 h-1.5 rounded-full bg-[#14130f]/10"><div className="h-full w-[82%] rounded-full bg-[#d9a441]" /></div>
      </div>
      <div className="absolute left-[130px] top-2 z-10 h-64 w-52 -rotate-[2deg] rounded-[40px] bg-[#1c1c1a] p-6 text-[#f4f2ec] shadow-clay transition duration-700 ease-soft hover:-rotate-[4deg]">
        <p className="font-display text-lg">This month</p>
        <ul className="mt-4 space-y-2.5 text-xs text-[#f4f2ec]/75">
          <li className="flex justify-between"><span>Salary</span><span className="text-[#9fd0ae]">+45,000</span></li>
          <li className="flex justify-between"><span>Rent</span><span>−12,000</span></li>
          <li className="flex justify-between"><span>Groceries</span><span>−3,240</span></li>
          <li className="flex justify-between"><span>Metro card</span><span>−500</span></li>
        </ul>
      </div>
      <div className="absolute left-0 top-16 h-56 w-44 -rotate-[11deg] rounded-[36px] bg-brand-500 p-6 text-[#14130f] shadow-clay transition duration-700 ease-soft hover:-rotate-[14deg]">
        <p className="text-xs font-medium opacity-70">Balance</p>
        <p className="mt-1 font-display text-[2rem] leading-none">₹15,968</p>
        <p className="mt-auto pt-16 text-xs opacity-70">Saved 35% of income</p>
      </div>
    </div>
  );
}

// Split-screen layout shared by the login and register pages.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden p-4 lg:block">
        <div className="flex h-full flex-col justify-between overflow-hidden rounded-[36px] bg-slate-100 p-12 shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] dark:bg-slate-900">
          <Logo />
          <div>
            <h2 className="font-serif-display max-w-md text-[3.4rem] leading-[1.02]">
              Know where every rupee goes.
            </h2>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted">
              Budgets that warn you before you overspend, a dashboard that updates live, and a support team one message away.
            </p>
          </div>
          <CardStack />
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[380px] animate-rise">
          <div className="mb-10 lg:hidden"><Logo /></div>
          <h1 className="font-serif-display text-[2.6rem] leading-none">{title}</h1>
          <p className="mt-3 text-[15px] text-muted">{subtitle}</p>
          <div className="mt-9">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
