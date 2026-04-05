import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8">
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-8 h-4 w-96 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-10 mb-4 h-6 w-40" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
