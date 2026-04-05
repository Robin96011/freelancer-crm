import { Skeleton } from "@/components/ui/skeleton";

export default function ProposalDetailLoading() {
  return (
    <div className="p-6 md:p-8">
      <Skeleton className="mb-6 h-4 w-32" />
      <Skeleton className="mb-2 h-8 w-full max-w-md" />
      <Skeleton className="mb-8 h-4 w-96 max-w-full" />
      <Skeleton className="h-[520px] rounded-xl" />
    </div>
  );
}
