export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <Skeleton className="mb-3 h-4 w-32" />
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="mb-2 h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
