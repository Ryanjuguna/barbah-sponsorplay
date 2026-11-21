/* ============================================================================
   DHAMINI — Utilities
   ============================================================================ */

/* Simple className merger — replaces clsx + tailwind-merge to avoid extra deps */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatKES(value: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getCreatorTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PRO_PLAYER_STREAMER: 'Pro Player / Streamer',
    CAMPUS_ESPORTS_CLUB: 'Campus Esports Club',
    GRASSROOTS_GAMING_DEN: 'Gaming Den',
    TOURNAMENT_ORGANIZER: 'Tournament Organizer',
  };
  return labels[type] || type;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-slate-800/50 text-slate-300 border-slate-700/50',
    COMMITTED_IN_LEDGER: 'bg-blue-900/20 text-blue-300 border-blue-500/30',
    PENDING_FUNDING: 'bg-amber-900/20 text-amber-300 border-amber-500/30',
    IN_PROGRESS: 'bg-blue-900/20 text-blue-300 border-blue-500/30',
    VERIFIED: 'bg-emerald-900/20 text-emerald-300 border-emerald-500/30',
    REQUIRES_REVISION: 'bg-amber-900/20 text-amber-300 border-amber-500/30',
    FAILED: 'bg-red-900/20 text-red-300 border-red-500/30',
    DISBURSED: 'bg-green-900/20 text-green-300 border-green-500/30',
    PAID: 'bg-emerald-900/20 text-emerald-300 border-emerald-500/30',
  };
  return colors[status] || colors.DRAFT;
}

export function getDecisionColor(decision: string): string {
  const colors: Record<string, string> = {
    PASSED: 'bg-emerald-900/20 text-emerald-300 border-emerald-500/30',
    REQUIRES_REVISION: 'bg-amber-900/20 text-amber-300 border-amber-500/30',
    FAILED: 'bg-red-900/20 text-red-300 border-red-500/30',
  };
  return colors[decision] || colors.REQUIRES_REVISION;
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}…`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}