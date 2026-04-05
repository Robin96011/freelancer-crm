import { Skeleton } from "@/components/ui/skeleton";

export default function InvoicesLoading() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex justify-between">
        <div>
          <Skeleton className="mb-2 h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
