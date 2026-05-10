import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  color?: string;
}

export function StatCard({ label, value, icon, color = "bg-slate-50" }: StatCardProps) {
  return (
    <div className={`rounded-3xl border border-slate-100 p-5 shadow-sm ${color}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}
