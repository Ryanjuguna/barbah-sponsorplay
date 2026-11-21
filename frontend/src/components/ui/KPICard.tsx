import React from 'react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: { label: string; value: string; positive: boolean };
  icon?: React.ReactNode;
}

export function KPICard({
  title,
  value,
  trend,
  icon,
}: KPICardProps) {
  return (
    <div className="d-kpi">
      <div className="flex items-center justify-between mb-3">
        {icon && (
          <div className="p-2 rounded-xl bg-[hsl(var(--secondary))]/30 border border-[hsl(var(--border))]">
            {icon}
          </div>
        )}
      </div>
      <p className="d-kpi-label">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="d-kpi-value">{value}</span>
      </div>
      {trend && (
        <p className={cn('d-kpi-trend', trend.positive ? 'text-emerald-400' : 'text-red-400')}>
          {trend.label} {trend.value}
        </p>
      )}
    </div>
  );
}