"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Plus, Filter, Globe, MapPin, Users, Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import type { AnnouncementItem } from "./types";

export function AnnouncementList({
  showCountryFilter = false,
}: {
  showCountryFilter?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/announcements");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.announcements ?? []);
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

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setItems((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert("Failed to delete: " + (err instanceof Error ? err.message : err));
    }
  };

  // Extract unique countries
  const countries = showCountryFilter
    ? [...new Set(items.map((b) => b.country).filter(Boolean as unknown as <T>(x: T | null | undefined) => x is T))]
    : [];

  // Filter by country
  const filtered = showCountryFilter && selectedCountry
    ? items.filter((b) => b.country === selectedCountry)
    : items;

  const columns: Column<AnnouncementItem>[] = [
    {
      key: "target",
      label: "Target",
      render: (b) => {
        const targetLabel = () => {
          if (b.target === "all") return "All Users";
          if (b.target === "country") return b.country || "Country";
          if (b.target === "selected") return "Selected Users";
          return b.target;
        };
        const icon = b.target === "all"
          ? <Globe className="h-3 w-3" />
          : b.target === "country"
            ? <MapPin className="h-3 w-3" />
            : <Users className="h-3 w-3" />;
        return (
          <Badge
            variant="outline"
            className="text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 flex items-center gap-1 w-fit"
          >
            {icon}
            {targetLabel()}
          </Badge>
        );
      },
    },
    {
      key: "title",
      label: "Title / Body",
      render: (b) => (
        <div>
          <p className="text-sm font-medium">{b.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{b.body}</p>
          {b.link && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate max-w-[200px]">
              Link: {b.link}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (b) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {b.createdAt ? new Date(b.createdAt).toLocaleString() : "—"}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "actions",
      label: "",
      render: (b) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            deleteItem(b.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {items.length > 0 ? `${items.length} sent` : "No notifications sent yet"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/notifications/send")}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New
          </Button>
          <Button variant="outline" size="sm" onClick={fetchItems}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Country filter chips */}
      {showCountryFilter && countries.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
          <button
            onClick={() => setSelectedCountry(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCountry === null
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            All
          </button>
          {countries.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCountry(c)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCountry === c
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <DataTable<AnnouncementItem>
        columns={columns}
        data={filtered}
        isLoading={loading}
        error={error}
        page={1}
        totalPages={1}
        onPageChange={() => {}}
        emptyMessage={
          showCountryFilter && selectedCountry
            ? "No announcements for this country"
            : "No notifications sent yet"
        }
      />
    </div>
  );
}
