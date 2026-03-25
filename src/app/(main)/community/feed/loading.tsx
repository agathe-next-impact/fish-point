import { Skeleton } from '@/components/ui/skeleton';

export default function FeedLoading() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <Skeleton className="h-8 w-32 mb-6" />
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-96 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
