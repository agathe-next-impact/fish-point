import { Skeleton } from '@/components/ui/skeleton';

export default function SpotLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Skeleton className="h-80 w-full rounded-lg mb-6" />
      <Skeleton className="h-8 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/3 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
