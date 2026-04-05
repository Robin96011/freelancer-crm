import { Skeleton } from "@/components/ui/skeleton";

export default function ClientDetailLoading() {
  return (
    <div className="p-6 md:p-8">
      <Skeleton className="mb-6 h-4 w-32" />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-1" />
        <Skeleton className="h-96 rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}
