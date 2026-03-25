import { Skeleton } from '@/components/ui/skeleton';

export default function MapLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <Skeleton className="h-full w-full" />
    </div>
  );
}
