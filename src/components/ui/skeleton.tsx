import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted/50 relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-muted/30 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

// Dashboard-specific skeleton components
function StatCardSkeleton() {
  return (
    <div className="bg-card/60 border border-border/50 rounded-lg p-4 text-center">
      <Skeleton className="w-10 h-10 mx-auto mb-2 rounded-lg" />
      <Skeleton className="w-16 h-7 mx-auto mb-1" />
      <Skeleton className="w-12 h-3 mx-auto" />
    </div>
  );
}

function LevelCardSkeleton() {
  return (
    <div className="bg-card border border-border/30 rounded-lg p-4 text-center">
      <Skeleton className="w-12 h-12 mx-auto mb-2 rounded-lg" />
      <Skeleton className="w-14 h-12 mx-auto mb-1" />
      <Skeleton className="w-10 h-3 mx-auto" />
    </div>
  );
}

function XPProgressSkeleton() {
  return (
    <div className="gaming-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="w-16 h-5" />
        <Skeleton className="w-24 h-4" />
      </div>
      <Skeleton className="w-full h-4 rounded-full" />
    </div>
  );
}

function QuestItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
      <Skeleton className="w-9 h-9 rounded-md shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="w-32 h-4 mb-1" />
        <Skeleton className="w-20 h-3" />
      </div>
    </div>
  );
}

function PlayerItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
      <Skeleton className="w-7 h-7 rounded-md" />
      <Skeleton className="w-8 h-8 rounded-md" />
      <div className="flex-1 min-w-0">
        <Skeleton className="w-24 h-4 mb-1" />
        <Skeleton className="w-16 h-3" />
      </div>
    </div>
  );
}

function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-4">
      <Skeleton className="w-8 h-6" />
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="w-28 h-4 mb-1" />
        <Skeleton className="w-20 h-3" />
      </div>
      <div className="text-right">
        <Skeleton className="w-16 h-5 mb-1" />
        <Skeleton className="w-8 h-3" />
      </div>
    </div>
  );
}

function QuestCardSkeleton() {
  return (
    <div className="gaming-card overflow-hidden">
      <Skeleton className="h-24 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="w-3/4 h-5" />
        <Skeleton className="w-full h-4" />
        <div className="flex gap-4">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-12 h-4" />
        </div>
        <Skeleton className="w-full h-9 rounded-lg" />
      </div>
    </div>
  );
}

function PodiumSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-4xl mx-auto items-end">
      {/* 2nd Place */}
      <div className="bg-card/80 border border-border rounded-lg p-3 sm:p-4 text-center">
        <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 rounded-lg" />
        <Skeleton className="w-5 h-5 mx-auto mb-1 rounded" />
        <Skeleton className="w-16 h-4 mx-auto mb-1" />
        <Skeleton className="w-12 h-5 mx-auto" />
      </div>
      {/* 1st Place */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 text-center -mt-4">
        <Skeleton className="w-6 h-6 mx-auto mb-2 rounded" />
        <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 rounded-lg" />
        <Skeleton className="w-20 h-5 mx-auto mb-1" />
        <Skeleton className="w-12 h-3 mx-auto mb-1" />
        <Skeleton className="w-16 h-6 mx-auto" />
      </div>
      {/* 3rd Place */}
      <div className="bg-card/80 border border-border rounded-lg p-3 sm:p-4 text-center">
        <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 rounded-lg" />
        <Skeleton className="w-5 h-5 mx-auto mb-1 rounded" />
        <Skeleton className="w-16 h-4 mx-auto mb-1" />
        <Skeleton className="w-12 h-5 mx-auto" />
      </div>
    </div>
  );
}

export {
  Skeleton,
  StatCardSkeleton,
  LevelCardSkeleton,
  XPProgressSkeleton,
  QuestItemSkeleton,
  PlayerItemSkeleton,
  LeaderboardRowSkeleton,
  QuestCardSkeleton,
  PodiumSkeleton,
};
