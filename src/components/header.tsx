"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogOut } from "lucide-react";

export function Header() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.email) setEmail(data.email);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
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
    } finally {
      setLoggingOut(false);
      setConfirmOpen(false);
    }
  }

  const initials = (email?.[0] || "?").toUpperCase();

  return (
    <header className="flex h-14 items-center justify-end gap-3 border-b bg-card px-4 lg:px-6">
      {email && (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {email}
          </span>
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
        <LogOut className="mr-1.5 h-4 w-4" />
        Logout
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>
              You&apos;ll need to sign in again to access the dashboard.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={loggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
