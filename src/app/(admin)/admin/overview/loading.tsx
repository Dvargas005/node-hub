import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-32" />
    </div>
  );
}
