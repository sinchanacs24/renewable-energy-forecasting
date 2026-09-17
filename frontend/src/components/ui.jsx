// Small reusable UI pieces used across the screens.

export function PageTitle({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
    </div>
  );
}

export function StatCard({ label, value, unit, icon, color = "text-slate-900" }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className={`mt-2 text-2xl font-bold ${color}`}>
        {value}
        {unit && <span className="ml-1 text-base font-medium text-slate-500">{unit}</span>}
      </p>
    </div>
  );
}

export function Loading({ text = "Loading..." }) {
  return (
    <div className="flex items-center gap-3 py-10 justify-center text-slate-600">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      {text}
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
      <p>{message}</p>
      {onRetry && (
        <button className="btn-secondary mt-3" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="card text-center py-12">
      <p className="text-lg font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-slate-500">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Formats "2026-09-17T14:00" -> "14:00"
export function hourLabel(time) {
  return time ? time.slice(11, 16) : "";
}

// Formats an ISO date string in the user's local time.
export function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}
