"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/data-table";
import type { AdminNotificationItem } from "./types";

export function NotificationList() {
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.notifications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  const [fetched, setFetched] = useState(false);
  if (!fetched) {
    fetchItems();
    setFetched(true);
  }

  const columns: Column<AdminNotificationItem>[] = [
    {
      key: "user",
      label: "User",
      render: (n) =>
        n.uid ? (
          <Link
            href={`/users/${n.uid}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {(n.userName?.[0] || "?").toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{n.userName || "Unknown"}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {n.uid.slice(0, 12)}...
              </p>
            </div>
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (n) => (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
          >
            From Admin
          </Badge>
          {n.read && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Check className="h-3 w-3" /> Read
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "title",
      label: "Title",
      render: (n) => (
        <div>
          <p className="text-sm font-medium">{n.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{n.body}</p>
          {n.link && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate max-w-[200px]">
              Link: {n.link}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (n) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {n.createdAt ? new Date(n.createdAt).toLocaleString() : "—"}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "actions",
      label: "",
      render: () => null,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {items.length > 0
            ? `${items.length} admin notification(s)`
            : "No admin notifications sent"}
        </p>
        <Button variant="outline" size="sm" onClick={fetchItems}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <DataTable<AdminNotificationItem>
        columns={columns}
        data={items}
        isLoading={loading}
        error={error}
        page={1}
        totalPages={1}
        onPageChange={() => {}}
        emptyMessage="No admin notifications yet. Send notifications to Selected Users to see them here."
      />
    </div>
  );
}
