import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-surface p-10 text-center">
      <Icon className="mb-1 h-8 w-8 text-ink-muted" strokeWidth={1.5} />
      <p className="text-ink">{title}</p>
      {subtitle && <p className="max-w-xs text-sm text-ink-muted">{subtitle}</p>}
      {action}
    </div>
  );
}