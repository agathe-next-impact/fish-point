import { Skeleton } from '@/components/ui/skeleton';

export default function RegulationsLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Skeleton className="h-8 w-56 mb-6" />
      <Skeleton className="h-12 w-full mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
