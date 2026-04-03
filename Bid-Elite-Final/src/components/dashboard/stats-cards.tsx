import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: number;
  icon?: ReactNode;
  accent?: boolean;
  trend?: { value: number; label: string };
}

export default function StatsCard({ title, value, icon, accent, trend }: StatsCardProps) {
  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/5 blur-2xl transition-all group-hover:bg-accent/10"></div>
      <div className="relative flex items-center justify-between z-10">
        <div>
          <p className="text-xs font-medium text-text-muted">{title}</p>
          <p className={"mt-1 text-2xl font-bold " + (accent ? "text-accent" : "text-text-primary")}>
            {value}
          </p>
          {trend && (
            <div className="mt-1 flex items-center gap-1">
              {trend.value > 0 ? (
                <svg className="h-3 w-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              ) : trend.value < 0 ? (
                <svg className="h-3 w-3 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
                </svg>
              ) : null}
              <span className={`text-[10px] font-medium ${trend.value > 0 ? "text-success" : trend.value < 0 ? "text-error" : "text-text-dim"}`}>
                {trend.value > 0 ? "+" : ""}{trend.value} {trend.label}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={"flex h-10 w-10 items-center justify-center rounded-lg " + (accent ? "bg-accent/10 text-accent" : "bg-bg-elevated text-text-muted")}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
