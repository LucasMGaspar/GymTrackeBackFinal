export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="card">
        <div className="animate-pulse space-y-3">
          <div className="h-7 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-2/3"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-1/3"></div>
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-3">
        <div className="flex-1 h-12 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
        <div className="flex-1 h-12 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
      </div>

      {/* Exercise cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <ExerciseCardSkeleton key={i} delay={i * 100} />
        ))}
      </div>
    </div>
  );
}

interface ExerciseCardSkeletonProps {
  delay?: number;
}

export function ExerciseCardSkeleton({ delay = 0 }: ExerciseCardSkeletonProps) {
  return (
    <div 
      className="card animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="space-y-4">
        {/* Exercise name and muscle group */}
        <div className="space-y-2">
          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-3/4"></div>
          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-1/4"></div>
        </div>
        
        {/* Input fields */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            <div className="h-11 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            <div className="h-11 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-2/3"></div>
            <div className="h-11 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav skeleton */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
            <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-24 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <LoadingSkeleton />
      </div>
    </div>
  );
}
