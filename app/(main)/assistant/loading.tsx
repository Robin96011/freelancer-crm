import { Skeleton } from "@/components/ui/skeleton";

export default function AssistantLoading() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="h-[420px] rounded-xl" />
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    </div>
  );
}
