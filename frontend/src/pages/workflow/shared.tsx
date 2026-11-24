/* ============================================================================
   Small structural pieces shared by the workflow pages.
   Styling here is deliberately plain — the visual owner restyles this layer.
   ============================================================================ */

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const FAMILY_VARIANT: Record<string, 'terracotta' | 'green' | 'gold' | 'slate'> = {
  neutral: 'slate',
  waiting: 'gold',
  active: 'terracotta',
  success: 'green',
  danger: 'slate',
};

export function StatusBadge({ status, family }: { status: string; family?: string }) {
  const label = status.replace(/_/g, ' ').toLowerCase();
  return (
    <Badge variant={FAMILY_VARIANT[family || 'neutral'] || 'slate'} className="uppercase">
      {label}
    </Badge>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[hsl(var(--foreground))]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-[hsl(var(--muted-foreground))]">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <Card className="text-center py-12">
      <p className="font-bold text-lg">{title}</p>
      {body && <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </Card>
  );
}

export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    info: 'border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30',
    warning: 'border-amber-500/30 bg-amber-500/10',
    danger: 'border-red-500/30 bg-red-900/10',
    success: 'border-emerald-500/30 bg-emerald-500/10',
  };
  return (
    <div className={cn('rounded-xl border px-4 py-3 text-sm', tones[tone])}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div className="text-[hsl(var(--muted-foreground))]">{children}</div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
        {label}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-[hsl(var(--muted-foreground))]">{hint}</span>}
    </label>
  );
}

export function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-[hsl(var(--muted-foreground))]">
      {label}…
    </div>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);
  return <Notice tone="danger">{message}</Notice>;
}
