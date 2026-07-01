"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Header() {
  const router = useRouter();

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/");
        router.refresh();
      }
    } catch {
      console.error("Logout failed");
    }
  }

  return (
    <header className="flex h-14 items-center justify-end gap-4 border-b bg-card px-4 lg:px-6">
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="mr-1.5 h-4 w-4" />
        Logout
      </Button>
    </header>
  );
}
