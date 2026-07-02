"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, ShieldAlert } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";

interface FeedbackItem {
  id: string;
  uid: string;
  userName: string;
  category: string;
  message: string;
  createdAt: { _seconds: number; _nanoseconds: number } | string | null;
}

function formatTimestamp(
  ts: { _seconds: number } | string | null | undefined,
): string {
  if (!ts) return "—";
  if (typeof ts === "string") return new Date(ts).toLocaleString();
  return new Date(ts._seconds * 1000).toLocaleString();
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback");
      if (!res.ok) throw new Error("Failed to fetch feedbacks");
      const data = await res.json();
      setFeedbacks(data.feedbacks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const deleteFeedback = async (id: string) => {
    if (!confirm("Delete this feedback?")) return;
    try {
      const res = await fetch(`/api/feedback?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      alert("Failed to delete: " + (err instanceof Error ? err.message : err));
    }
  };

  const lowerSearch = search.toLowerCase();
  const filtered = search
    ? feedbacks.filter(
        (fb) =>
          fb.userName.toLowerCase().includes(lowerSearch) ||
          fb.category.toLowerCase().includes(lowerSearch) ||
          fb.message.toLowerCase().includes(lowerSearch),
      )
    : feedbacks;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<FeedbackItem>[] = [
    {
      key: "user",
      label: "User",
      render: (fb) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {(fb.userName?.[0] || "?").toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{fb.userName}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {fb.uid.slice(0, 12)}...
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (fb) => (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400">
          {fb.category}
        </span>
      ),
    },
    {
      key: "message",
      label: "Message",
      className: "max-w-md",
      render: (fb) => (
        <p className="text-sm truncate">{fb.message}</p>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (fb) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatTimestamp(fb.createdAt)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "actions",
      label: "",
      render: (fb) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            deleteFeedback(fb.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feedbacks</h1>
          <p className="text-muted-foreground">
            {feedbacks.length > 0
              ? `${filtered.length} feedback(s) from users`
              : "User-submitted feedback from the mobile app"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFeedbacks}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <DataTable<FeedbackItem>
        columns={columns}
        data={paged}
        isLoading={loading}
        error={error}
        searchPlaceholder="Search by user, category, or message..."
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No feedbacks found."
      />
    </div>
  );
}
