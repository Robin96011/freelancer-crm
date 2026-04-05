import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex justify-between">
        <div>
          <Skeleton className="mb-2 h-8 w-40" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="flex gap-4 overflow-hidden pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[min(280px,45vh)] w-[min(100%,300px)] shrink-0 rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}
