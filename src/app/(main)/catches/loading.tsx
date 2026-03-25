import { Skeleton } from '@/components/ui/skeleton';

export default function CatchesLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Skeleton className="h-8 w-40 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
