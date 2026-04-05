"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  FileText,
  Receipt,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type CrmNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const CRM_NAV_ITEMS: CrmNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/assistant", label: "Assistant", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNavList({
  onNavigate,
  className,
}: {
  /** Call when a link is clicked (e.g. close mobile sheet). */
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-0.5", className)}>
      {CRM_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => onNavigate?.()}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
