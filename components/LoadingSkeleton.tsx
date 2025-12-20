export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="skeleton h-28 rounded-2xl" />
      
      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-12 rounded-xl" />
      </div>
      
      {/* Cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <ExerciseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ExerciseCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="skeleton h-16 rounded-none" />
      
      {/* Body */}
      <div className="p-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <div className="skeleton h-3 w-12 mx-auto rounded" />
            <div className="skeleton h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-3 w-12 mx-auto rounded" />
            <div className="skeleton h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-3 w-12 mx-auto rounded" />
            <div className="skeleton h-12 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen gradient-hero">
      {/* Nav skeleton */}
      <div className="glass border-b border-dark-200/50 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-xl" />
            <div className="skeleton h-5 w-24 rounded" />
          </div>
          <div className="skeleton w-10 h-10 rounded-full" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-6 max-w-6xl mx-auto">
        <LoadingSkeleton />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 rounded" />
        <div className="skeleton h-3 w-5/6 rounded" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-dark-100">
      <div className="skeleton w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-1/3 rounded" />
        <div className="skeleton h-3 w-1/4 rounded" />
      </div>
      <div className="skeleton h-6 w-16 rounded-full" />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="skeleton h-32 rounded-2xl" />
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="card divide-y divide-dark-100">
      {Array.from({ length: count }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}
