import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/weather", label: "Live Weather" },
  { to: "/predict", label: "Prediction" },
  { to: "/results", label: "Results" },
  { to: "/report", label: "Detailed Report" },
  { to: "/history", label: "History" },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between py-3">
            <NavLink to="/" className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="font-semibold text-slate-900">Renewable Energy Forecasting</span>
            </NavLink>
            <span className="hidden sm:block text-xs text-slate-500">AI-Driven · Machine Learning</span>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    isActive ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                Forecasting solar and wind generation to support cleaner, better-planned energy grids
      </footer>
    </div>
  );
}
