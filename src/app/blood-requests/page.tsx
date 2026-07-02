"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, Trash2, MapPin } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";

interface BloodRequestItem {
  id: string;
  uid: string;
  userName: string;
  name: string;
  mobile: string;
  bloodGroup: string;
  bag: string;
  address: string;
  locationAddress?: string;
  date: string;
  time: string;
  note?: string;
  status: string;
  createdAt: { _seconds: number; _nanoseconds: number } | string | null;
}

function formatTimestamp(
  ts: { _seconds: number } | string | null | undefined,
): string {
  if (!ts) return "—";
  if (typeof ts === "string") return new Date(ts).toLocaleString();
  return new Date(ts._seconds * 1000).toLocaleString();
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    active:
      "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400",
    fulfilled:
      "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400",
    cancelled:
      "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${
        styles[status] || styles.active
      }`}
    >
      {status}
    </span>
  );
}

export default function BloodRequestsPage() {
  const [requests, setRequests] = useState<BloodRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequestItem | null>(null);
  const pageSize = 20;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/blood-requests");
      if (!res.ok) throw new Error("Failed to fetch blood requests");
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const deleteRequest = async (id: string) => {
    if (!confirm("Delete this blood request?")) return;
    try {
      const res = await fetch(`/api/blood-requests?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert("Failed to delete: " + (err instanceof Error ? err.message : err));
    }
  };

  const lowerSearch = search.toLowerCase();
  const filtered = search
    ? requests.filter(
        (r) =>
          r.userName.toLowerCase().includes(lowerSearch) ||
          r.name.toLowerCase().includes(lowerSearch) ||
          r.bloodGroup.toLowerCase().includes(lowerSearch) ||
          r.mobile.toLowerCase().includes(lowerSearch) ||
          r.address.toLowerCase().includes(lowerSearch) ||
          r.status.toLowerCase().includes(lowerSearch),
      )
    : requests;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<BloodRequestItem>[] = [
    {
      key: "user",
      label: "User",
      render: (r) => (
        <Link
          href={`/users/${r.uid}`}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {(r.userName?.[0] || "?").toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{r.userName}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {r.uid.slice(0, 12)}...
            </p>
          </div>
        </Link>
      ),
    },
    {
      key: "name",
      label: "Requester",
      render: (r) => (
        <div>
          <p className="text-sm font-medium">{r.name}</p>
          <p className="text-xs text-muted-foreground">{r.mobile}</p>
        </div>
      ),
    },
    {
      key: "bloodGroup",
      label: "Blood Group",
      render: (r) => (
        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-900/30 dark:text-red-400">
          {r.bloodGroup}
        </span>
      ),
    },
    {
      key: "bag",
      label: "Bag",
      className: "text-center",
      render: (r) => <span className="text-sm">{r.bag}</span>,
    },
    {
      key: "address",
      label: "Address",
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelectedRequest(r)}
          className="max-w-[200px] text-left cursor-pointer hover:text-blue-600 transition-colors"
        >
          <p className="text-sm truncate">{r.address}</p>
          {r.locationAddress && (
            <p className="text-xs text-muted-foreground truncate">
              {r.locationAddress}
            </p>
          )}
        </button>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => statusBadge(r.status),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (r) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatTimestamp(r.createdAt)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            deleteRequest(r.id);
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
          <h1 className="text-2xl font-bold tracking-tight">
            Blood Requests
          </h1>
          <p className="text-muted-foreground">
            {requests.length > 0
              ? `${filtered.length} request(s) from users`
              : "Blood requests submitted from the mobile app"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <DataTable<BloodRequestItem>
        columns={columns}
        data={paged}
        isLoading={loading}
        error={error}
        searchPlaceholder="Search by name, blood group, phone, status..."
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No blood requests found."
      />

      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      >
        {selectedRequest && (
          <DialogContent className="sm:max-w-md">
            <DialogTitle>Full Address</DialogTitle>
            <div className="space-y-3 py-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Address
                </p>
                <p className="text-sm">{selectedRequest.address}</p>
              </div>
              {selectedRequest.locationAddress && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Location
                  </p>
                  <p className="text-sm">
                    {selectedRequest.locationAddress}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
