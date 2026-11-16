export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="glass-panel rounded-2xl overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-slate-200/70 dark:bg-slate-800/70" />
          <div className="p-5 space-y-3">
            <div className="h-3 w-28 bg-slate-200/80 dark:bg-slate-800/80 rounded" />
            <div className="h-5 w-3/4 bg-slate-200/80 dark:bg-slate-800/80 rounded" />
            <div className="h-4 w-24 bg-slate-200/80 dark:bg-slate-800/80 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-12 w-full glass-subtle rounded-xl animate-pulse"
        />
      ))}
    </div>
  );
}
