"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={signOut}
      className="h-9 gap-2 px-3.5 text-[14px] font-medium text-foreground/80 hover:bg-accent hover:text-foreground"
    >
      <LogOut className="h-4 w-4 opacity-70" strokeWidth={2} aria-hidden="true" />
      Sign out
    </Button>
  );
}
