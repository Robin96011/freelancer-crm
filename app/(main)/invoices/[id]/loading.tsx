import { Skeleton } from "@/components/ui/skeleton";

export default function InvoiceDetailLoading() {
  return (
    <div className="p-6 md:p-8">
      <Skeleton className="mb-6 h-4 w-32" />
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-8 h-4 w-64" />
      <Skeleton className="h-[480px] rounded-xl" />
    </div>
  );
}
