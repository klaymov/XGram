export default function SkeletonPost() {
  return (
    <div className="px-4 py-4 border-b border-surface-800/60 animate-skeleton">
      <div className="flex gap-3">
        {/* Avatar skeleton */}
        <div className="w-10 h-10 rounded-full bg-surface-800 shrink-0" />

        <div className="flex-1 min-w-0">
          {/* Header skeleton */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-4 w-28 bg-surface-800 rounded-md" />
            <div className="h-3 w-16 bg-surface-800/60 rounded-md" />
          </div>

          {/* Text skeleton */}
          <div className="space-y-2 mb-3">
            <div className="h-3.5 w-full bg-surface-800 rounded-md" />
            <div className="h-3.5 w-4/5 bg-surface-800 rounded-md" />
            <div className="h-3.5 w-3/5 bg-surface-800 rounded-md" />
          </div>

          {/* Media skeleton */}
          <div className="h-48 w-full bg-surface-800 rounded-xl mb-3" />

          {/* Actions skeleton */}
          <div className="flex items-center gap-8 mt-3">
            <div className="h-3 w-12 bg-surface-800/60 rounded-md" />
            <div className="h-3 w-12 bg-surface-800/60 rounded-md" />
            <div className="h-3 w-12 bg-surface-800/60 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
