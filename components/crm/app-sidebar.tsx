"use client";

import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { SidebarNavList } from "@/components/crm/sidebar-nav";
import { ThemeToggle } from "@/components/crm/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function AppSidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "bg-card border-border hidden h-screen w-[240px] shrink-0 flex-col border-r md:flex",
        className
      )}
    >
      <div className="flex h-14 shrink-0 items-center px-4">
        <Link
          href="/dashboard"
          className="text-foreground font-semibold tracking-tight transition-opacity hover:opacity-80"
        >
          Freelancer CRM
        </Link>
      </div>
      <Separator />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2">
          <SidebarNavList />
        </div>
        <Separator />
        <div className="shrink-0 space-y-1 p-2">
          <ThemeToggle fullWidth />
          <SignOutButton variant="ghost" fullWidth />
        </div>
      </div>
    </aside>
  );
}
