"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Users,
  Check,
  X,
  Trash2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import type { Community, CommunityMember } from "@/lib/types/community";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/lib/utils";

interface CommunityDetail {
  community: Community;
  approvedMembers: CommunityMember[];
  pendingMembers: CommunityMember[];
}

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const communityId = String(params.id);

  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.communities.detail(communityId),
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communityId}`);
      if (!res.ok) throw new Error("Community not found");
      return (await res.json()) as CommunityDetail;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (uid: string) =>
      fetch(`/api/communities/${communityId}/members/${uid}`, { method: "PATCH" }).then((res) => {
        if (!res.ok) throw new Error();
      }),
    onSuccess: () => {
      toast.success("Member approved");
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.detail(communityId) });
    },
    onError: () => toast.error("Failed to approve member"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ uid }: { uid: string; wasPending: boolean }) =>
      fetch(`/api/communities/${communityId}/members/${uid}`, { method: "DELETE" }).then((res) => {
        if (!res.ok) throw new Error();
      }),
    onSuccess: (_data, variables) => {
      toast.success(variables.wasPending ? "Request rejected" : "Member removed");
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.detail(communityId) });
    },
    onError: () => toast.error("Failed to update member"),
  });

  const deleteCommunityMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/communities/${communityId}`, { method: "DELETE" }).then((res) => {
        if (!res.ok) throw new Error();
      }),
    onSuccess: () => {
      toast.success("Community deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.list() });
      queryClient.removeQueries({ queryKey: queryKeys.communities.detail(communityId) });
      router.push("/communities");
    },
    onError: () => toast.error("Failed to delete community"),
    onSettled: () => setConfirmDelete(false),
  });

  const approveMember = (uid: string) => approveMutation.mutate(uid);

  const removeMember = (uid: string, wasPending: boolean) => {
    if (!confirm(wasPending ? "Reject this join request?" : "Remove this member?")) return;
    removeMemberMutation.mutate({ uid, wasPending });
  };

  const busyUid =
    (approveMutation.isPending ? approveMutation.variables : null) ||
    (removeMemberMutation.isPending ? removeMemberMutation.variables?.uid : null);

  const handleDeleteCommunity = () => deleteCommunityMutation.mutate();
  const deleting = deleteCommunityMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-red-600">
            {error?.message || "Community not found"}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { community, approvedMembers, pendingMembers } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/communities")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {(community.name?.[0] || "?").toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{community.name}</h1>
            <p className="text-xs text-muted-foreground">
              {community.code ? `Code: ${community.code}` : `ID: ${communityId}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-4 w-4" /> Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" /> Mobile
              </p>
              <p className="font-medium font-mono">{community.mobile || "—"}</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> Address
              </p>
              <p className="font-medium">{community.locationAddress || community.address || "—"}</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" /> Created
              </p>
              <p className="font-medium">{formatDate(community.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Admins</p>
              <p className="font-medium">{community.admin?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <Users className="mx-auto mb-1 h-5 w-5 text-green-600" />
                <p className="text-2xl font-bold">{approvedMembers.length}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <Clock className="mx-auto mb-1 h-5 w-5 text-amber-600" />
                <p className="text-2xl font-bold">{pendingMembers.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete Community
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending join requests */}
      {pendingMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Join Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <Link
                  href={`/users/${m.uid}`}
                  className="flex items-center gap-2.5 hover:opacity-80"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {(m.name?.[0] || "?").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.mobileNumber}
                      {m.bloodGroup && ` · ${m.bloodGroup}`}
                    </p>
                  </div>
                </Link>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveMember(m.uid)}
                    disabled={busyUid === m.uid}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMember(m.uid, true)}
                    disabled={busyUid === m.uid}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Members ({approvedMembers.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {approvedMembers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No members yet.
            </p>
          ) : (
            approvedMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <Link
                  href={`/users/${m.uid}`}
                  className="flex items-center gap-2.5 hover:opacity-80"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {(m.name?.[0] || "?").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.mobileNumber}
                      {m.bloodGroup && ` · ${m.bloodGroup}`}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  {community.admin?.includes(m.uid) && (
                    <Badge variant="outline">Admin</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeMember(m.uid, false)}
                    disabled={busyUid === m.uid}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete community?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">{community.name}</span> and
              all of its memberships. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCommunity} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
