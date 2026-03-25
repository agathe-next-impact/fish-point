import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-30" />
        ))}
      </div>
      <Skeleton className="h-12 w-full mb-6" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-100" />
        <Skeleton className="h-100" />
        <Skeleton className="h-100" />
        <Skeleton className="h-100" />
      </div>
    </div>
  );
}
