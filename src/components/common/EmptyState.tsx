import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="glass-panel rounded-2xl px-6 py-14 text-center">
      <div className="w-12 h-12 rounded-xl glass-subtle text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto mb-4">
        {icon || <Inbox className="w-6 h-6 stroke-[1.5]" />}
      </div>
      <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
        {description}
      </p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionTo && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
