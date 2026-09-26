"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, Users, Phone } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Community } from "@/lib/types/community";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/lib/utils";

export default function CommunitiesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState<Community | null>(null);
  const pageSize = 20;

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.communities.list(),
    queryFn: async () => {
      const res = await fetch("/api/communities");
      if (!res.ok) throw new Error("Failed to fetch communities");
      return (await res.json()) as { communities: Community[] };
    },
  });
  const communities = data?.communities ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/communities?id=${id}`, { method: "DELETE" }).then((res) => {
        if (!res.ok) throw new Error();
      }),
    onSuccess: () => {
      toast.success("Community deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.list() });
    },
    onError: () => toast.error("Failed to delete community"),
    onSettled: () => setConfirmTarget(null),
  });

  const handleDelete = () => {
    if (!confirmTarget) return;
    deleteMutation.mutate(confirmTarget.id);
  };
  const deleting = deleteMutation.isPending;

  const lowerSearch = search.toLowerCase();
  const filtered = search
    ? communities.filter(
        (c) =>
          c.name?.toLowerCase().includes(lowerSearch) ||
          c.code?.toLowerCase().includes(lowerSearch) ||
          c.mobile?.toLowerCase().includes(lowerSearch) ||
          c.address?.toLowerCase().includes(lowerSearch)
      )
    : communities;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<Community>[] = [
    {
      key: "name",
      label: "Community",
      render: (c) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {(c.name?.[0] || "?").toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{c.name}</p>
            {c.code && (
              <p className="text-xs text-muted-foreground font-mono">{c.code}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "mobile",
      label: "Mobile",
      render: (c) =>
        c.mobile ? (
          <span className="inline-flex items-center gap-1 text-sm font-mono">
            <Phone className="h-3 w-3 text-muted-foreground" /> {c.mobile}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "address",
      label: "Address",
      render: (c) => (
        <span className="text-sm truncate max-w-[220px] block">
          {c.locationAddress || c.address || "—"}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "memberCount",
      label: "Members",
      render: (c) => (
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" />
          {c.memberCount ?? 0}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (c) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(c.createdAt)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "actions",
      label: "",
      render: (c) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmTarget(c);
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
          <h1 className="text-2xl font-bold tracking-tight">Communities</h1>
          <p className="text-muted-foreground">
            {communities.length > 0
              ? `${filtered.length} communit${filtered.length === 1 ? "y" : "ies"}`
              : "Manage communities and their members"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <DataTable<Community>
        columns={columns}
        data={paged}
        isLoading={loading}
        error={error?.message}
        searchPlaceholder="Search by name, code, mobile, or address..."
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No communities found."
        onRowClick={(c) => router.push(`/communities/${c.id}`)}
      />

      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(next) => {
          if (!next) setConfirmTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete community?</DialogTitle>
            <DialogDescription>
              {confirmTarget && (
                <>
                  This will permanently delete{" "}
                  <span className="font-medium text-foreground">
                    {confirmTarget.name}
                  </span>{" "}
                  and all of its memberships. This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
