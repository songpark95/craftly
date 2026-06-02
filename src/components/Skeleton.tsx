"use client";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", rounded = "md", style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-warm-wood-pale ${className}`}
      style={{ borderRadius: `var(--radius-${rounded})`, ...style }}
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
      {/* Progress bar */}
      <Skeleton className="h-2.5 w-full mb-4" rounded="full" />
      
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-1" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-12" rounded="md" />
      </div>
      
      {/* Row counter */}
      <div className="mb-3 flex items-baseline gap-2">
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between border-t border-warm-bg pt-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export function YarnCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft border border-warm-wood-pale">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 flex-shrink-0" rounded="xl" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      <div className="mt-3">
        <Skeleton className="h-7 w-full" rounded="lg" />
      </div>
    </div>
  );
}

export function PatternCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-soft border border-warm-wood-pale">
      <Skeleton className="h-24 w-full rounded-t-2xl" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-5 w-12" rounded="md" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12" rounded="md" />
          <Skeleton className="h-5 w-14" rounded="md" />
          <Skeleton className="h-5 w-10" rounded="md" />
        </div>
        <div className="flex items-center justify-between border-t border-warm-bg pt-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-2 w-2 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* LEFT: Counter + Timer + Notes */}
      <div className="lg:col-span-2 space-y-6">
        {/* Project Header */}
        <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-16" rounded="lg" />
          </div>
        </div>

        {/* Counter */}
        <div className="rounded-3xl bg-white p-8 shadow-soft border border-warm-wood-pale">
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-full mb-6" rounded="full" />
          <div className="mb-8 flex flex-col items-center">
            <Skeleton className="h-16 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="mb-4 flex items-center justify-center gap-4">
            <Skeleton className="h-14 w-14" rounded="2xl" />
            <Skeleton className="h-20 w-20" rounded="2xl" />
            <Skeleton className="h-14 w-14" rounded="2xl" />
          </div>
          <div className="flex items-center justify-center gap-3">
            <Skeleton className="h-10 w-16" rounded="xl" />
            <Skeleton className="h-10 w-16" rounded="xl" />
            <Skeleton className="h-10 w-16" rounded="xl" />
          </div>
        </div>

        {/* Timer */}
        <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-center gap-6">
            <Skeleton className="h-10 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-12 w-12" rounded="xl" />
              <Skeleton className="h-12 w-12" rounded="xl" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-7 w-16" rounded="lg" />
          </div>
          <Skeleton className="h-28 w-full" rounded="xl" />
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="space-y-6">
        {/* Yarn */}
        <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
          <Skeleton className="h-3 w-12 mb-3" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" rounded="lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
          <Skeleton className="h-3 w-28 mb-3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between border-b border-warm-bg pb-2 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2 w-20" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-3 w-12 ml-auto" />
                  <Skeleton className="h-2 w-10 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
          <Skeleton className="h-3 w-24 mb-3" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-square" rounded="xl" />
            ))}
          </div>
        </div>

        {/* Row History */}
        <div className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
          <Skeleton className="h-3 w-20 mb-3" />
          <div className="flex items-end gap-1.5 h-24">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="flex-1" style={{ height: `${20 + Math.random() * 80}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function JournalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-soft border border-warm-wood-pale">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-2 w-12" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-48 w-full" rounded="xl" />
      </div>

      {/* Recent Sessions */}
      <div className="rounded-2xl bg-white p-6 shadow-soft border border-warm-wood-pale">
        <Skeleton className="h-4 w-36 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between border-b border-warm-bg pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10" rounded="xl" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-16 ml-auto" />
                <Skeleton className="h-3 w-12 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
