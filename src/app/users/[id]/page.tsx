"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Ban,
  UserCheck,
  Trash2,
  Droplet,
  HeartHandshake,
  ShieldAlert,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatName, formatDate } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";

interface FullUserDetail {
  user: Record<string, unknown>;
  donations: Record<string, unknown>[];
  bloodRequests: Record<string, unknown>[];
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = String(params.id);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error("User not found");
      return (await response.json()) as FullUserDetail;
    },
  });
  const user = data?.user ?? null;

  const updateUserMutation = useMutation({
    mutationFn: (updates: Record<string, unknown>) =>
      fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).then((res) => {
        if (!res.ok) throw new Error("Update failed");
      }),
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: () => toast.error("Failed to update user"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: () => fetch(`/api/users/${userId}`, { method: "DELETE" }).then((res) => {
      if (!res.ok) throw new Error();
    }),
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      router.push("/users");
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const updateUser = (updates: Record<string, unknown>) => updateUserMutation.mutate(updates);

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

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-red-600">
            {error?.message || "User not found"}
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = formatName(user.firstName as string, user.lastName as string);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {(user.firstName as string)?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{fullName}</h1>
            <p className="text-xs text-muted-foreground">ID: {userId}</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-4 w-4" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" /> Email
                  </p>
                  <p className="font-medium">{String(user.email || "—")}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> Mobile
                  </p>
                  <p className="font-medium font-mono">{String(user.mobileNumber || "—")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="font-medium">{String(user.gender || "—")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{String(user.dateOfBirth || "—")}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Blood Group</p>
                  <p className="text-lg font-bold text-red-600">{String(user.bloodGroup || "—")}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> Location
                  </p>
                  <p className="font-medium">{String(user.locationAddress || "—")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Country</p>
                  <p className="font-medium">{String(user.country || "—")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Coordinates</p>
                  {user.latitude != null && user.longitude != null ? (
                    <p className="font-medium font-mono text-xs">
                      {Number(user.latitude).toFixed(5)}, {Number(user.longitude).toFixed(5)}
                    </p>
                  ) : (
                    <p className="font-medium">—</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Geohash</p>
                  <p className="font-medium font-mono">{String(user.geohash || "—")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saved Addresses</p>
                  {Array.isArray(user.savedAddresses) && user.savedAddresses.length > 0 ? (
                    <div className="space-y-1.5 mt-1">
                      {(user.savedAddresses as Array<{ label?: string; addressText?: string }>).map((addr, i) => (
                        <p key={i} className="font-medium text-sm">
                          {addr.label ? <span className="text-muted-foreground">{addr.label}: </span> : null}
                          {addr.addressText || "—"}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="font-medium">Not set up</p>
                  )}
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" /> Joined
                  </p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <HeartHandshake className="mx-auto mb-1 h-5 w-5 text-green-600" />
                <p className="text-2xl font-bold">{Number(user.donationCount || 0)}</p>
                <p className="text-xs text-muted-foreground">Donations</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <Droplet className="mx-auto mb-1 h-5 w-5 text-red-600" />
                <p className="text-2xl font-bold">{data?.bloodRequests?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Requests</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Donor</span>
                <StatusBadge status={String(user.isDonor)} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Emergency Donor</span>
                {user.isEmergencyDonor ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                    <ShieldAlert className="h-3 w-3" /> Active
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">No</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Banned</span>
                <StatusBadge status={String(user.isBanned)} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Online</span>
                <StatusBadge status={String(user.isOnline)} />
              </div>
              {user.badge ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Badge</span>
                  <Badge variant="outline">{String(user.badge)}</Badge>
                </div>
              ) : null}
              {Array.isArray(user.communities) && user.communities.length > 0
                ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Communities</span>
                  <span className="font-medium">{user.communities.length}</span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant={user.isBanned ? "outline" : "destructive"}
            size="sm"
            onClick={() => updateUser({ isBanned: !user.isBanned })}
          >
            <Ban className="mr-1.5 h-4 w-4" />
            {user.isBanned ? "Unban User" : "Ban User"}
          </Button>
          <Button
            variant={user.isEmergencyDonor ? "outline" : "secondary"}
            size="sm"
            onClick={() => updateUser({ isEmergencyDonor: !user.isEmergencyDonor })}
          >
            <ShieldAlert className="mr-1.5 h-4 w-4" />
            {user.isEmergencyDonor ? "Remove Emergency" : "Mark Emergency"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateUser({ isDonor: !user.isDonor })}
          >
            <UserCheck className="mr-1.5 h-4 w-4" />
            {user.isDonor ? "Remove Donor Status" : "Mark as Donor"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(
                `/notifications/send?userId=${userId}&name=${encodeURIComponent(fullName)}`
              )
            }
          >
            <Mail className="mr-1.5 h-4 w-4" />
            Send Notification
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteUserMutation.isPending}
            onClick={() => {
              if (!confirm("Delete this user permanently?")) return;
              deleteUserMutation.mutate();
            }}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
