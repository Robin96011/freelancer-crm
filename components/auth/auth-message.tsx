import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type Variant = "success" | "error" | "info";

const styles: Record<
  Variant,
  string
> = {
  success:
    "border-emerald-500/40 bg-emerald-500/[0.07] text-emerald-950 dark:text-emerald-50",
  error: "border-destructive/40 bg-destructive/5 text-destructive",
  info: "border-border bg-muted/60 text-foreground",
};

const icons: Record<Variant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function AuthMessage({
  variant,
  title,
  children,
  className,
}: {
  variant: Variant;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const Icon = icons[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex gap-3 rounded-lg border p-4 text-sm leading-relaxed",
        styles[variant],
        className
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 opacity-90" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        {title ? <p className="font-medium leading-snug">{title}</p> : null}
        <div className="text-[13px] opacity-95">{children}</div>
      </div>
    </div>
  );
}
