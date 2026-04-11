import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="p-6 max-w-2xl">
      <Skeleton className="mb-6 h-8 w-40" />
      <div className="space-y-6">
        <Skeleton className="h-64 rounded-lg border" />
        <Skeleton className="h-40 rounded-lg border" />
        <Skeleton className="h-16 rounded-lg border" />
      </div>
    </div>
  );
}
