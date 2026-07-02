"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Bell, Megaphone } from "lucide-react";
import { NotificationList } from "@/components/notifications/notification-list";
import { AnnouncementList } from "@/components/notifications/announcement-list";

export default function NotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"notifications" | "announcements">("notifications");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Sent notifications and announcements
          </p>
        </div>
        <Button onClick={() => router.push("/notifications/send")}>
          <Plus className="mr-1.5 h-4 w-4" />
          New
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "notifications"
              ? "border-amber-500 text-amber-700 dark:text-amber-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className="h-4 w-4" />
          Notifications
        </button>
        <button
          onClick={() => setTab("announcements")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "announcements"
              ? "border-amber-500 text-amber-700 dark:text-amber-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Megaphone className="h-4 w-4" />
          Announcements
        </button>
      </div>

      {tab === "notifications" ? (
        <NotificationList />
      ) : (
        <AnnouncementList showCountryFilter />
      )}
    </div>
  );
}
