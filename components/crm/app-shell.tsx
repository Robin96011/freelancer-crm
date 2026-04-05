"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { AppSidebar } from "@/components/crm/app-sidebar";
import { SidebarNavList } from "@/components/crm/sidebar-nav";
import { ThemeToggle } from "@/components/crm/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-background flex min-h-screen">
      <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed left-0 right-0 top-0 z-40 flex h-14 items-center gap-3 border-b px-3 backdrop-blur md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-[min(280px,88vw)] flex-col p-0">
            <SheetHeader className="border-border shrink-0 border-b py-4">
              <SheetTitle className="text-left">Freelancer CRM</SheetTitle>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-2">
                <SidebarNavList onNavigate={() => setMobileOpen(false)} />
              </div>
              <Separator />
              <div className="shrink-0 space-y-1 p-2">
                <ThemeToggle fullWidth />
                <SignOutButton variant="ghost" fullWidth />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <Link
          href="/dashboard"
          className="text-foreground min-w-0 truncate font-semibold tracking-tight"
          onClick={() => setMobileOpen(false)}
        >
          Freelancer CRM
        </Link>
      </header>

      <AppSidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
