"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  /** Wider sidebar-style button */
  fullWidth?: boolean;
};

export function SignOutButton({
  className,
  variant = "ghost",
  fullWidth = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoading(false);
      return;
    }
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={variant}
      disabled={loading}
      onClick={signOut}
      className={cn(
        fullWidth && "w-full justify-start gap-2 font-normal",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4 shrink-0" />
      )}
      {loading ? "Signing out…" : "Log out"}
    </Button>
  );
}
