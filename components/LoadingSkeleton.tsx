export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl h-32"></div>
      
      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 bg-gray-200 rounded-xl"></div>
        <div className="h-14 bg-gray-200 rounded-xl"></div>
      </div>
      
      {/* Exercise cards skeleton */}
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
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/30 rounded-xl"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-white/40 rounded w-2/3"></div>
            <div className="h-4 bg-white/30 rounded w-1/3"></div>
          </div>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
            <div className="h-12 bg-gray-200 rounded-xl"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
            <div className="h-12 bg-gray-200 rounded-xl"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
            <div className="h-12 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="animate-pulse min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Nav skeleton */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="w-20 h-8 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-4">
        <LoadingSkeleton />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-2xl shadow-soft p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
}
