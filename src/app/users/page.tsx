"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BLOOD_GROUPS } from "@/lib/constants";
import { formatName } from "@/lib/utils";
import { Ban, CheckCircle, Download, ShieldAlert } from "lucide-react";

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email?: string;
  bloodGroup: string;
  locationAddress?: string;
  savedAddresses?: Array<{ id: string; label: string; addressText: string; latitude?: number; longitude?: number }>;
  gender?: string;
  dateOfBirth?: string;
  isDonor: boolean;
  isBanned?: boolean;
  isEmergencyDonor: boolean;
  isOnline: boolean;
  donationCount: number;
  badge?: string;
  image?: string;
  communities?: string[];
  createdAt: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  geohash?: string;
}

const columns: Column<UserRow>[] = [
  {
    key: "name",
    label: "Name",
    render: (user) => (
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {(user.firstName?.[0] || "?").toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-sm">
            {formatName(user.firstName, user.lastName)}
          </p>
          {user.email && (
            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
              {user.email}
            </p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "mobileNumber",
    label: "Mobile",
    render: (user) => <span className="text-sm font-mono">{user.mobileNumber}</span>,
  },
  {
    key: "bloodGroup",
    label: "Blood",
    render: (user) => (
      <span className="font-semibold text-red-600">{user.bloodGroup}</span>
    ),
  },
  {
    key: "country",
    label: "Country",
    render: (user) =>
      user.country ? (
        <span className="text-sm">{user.country}</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    hideOnMobile: true,
  },
  {
    key: "location",
    label: "Location",
    render: (user) => {
      const hasSaved =
        Array.isArray(user.savedAddresses) && user.savedAddresses.length > 0;
      const hasCoords = user.latitude != null && user.longitude != null;
      if (hasSaved && hasCoords) {
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Set
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-gray-300" /> Not set
        </span>
      );
    },
    hideOnMobile: true,
  },
  {
    key: "isDonor",
    label: "Donor",
    render: (user) => <StatusBadge status={String(user.isDonor)} />,
  },
  {
    key: "isEmergencyDonor",
    label: "Emergency",
    render: (user) =>
      user.isEmergencyDonor ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
          <ShieldAlert className="h-3 w-3" /> Active
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    hideOnMobile: true,
  },
  {
    key: "isBanned",
    label: "Status",
    render: (user) =>
      user.isBanned ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
          <Ban className="h-3 w-3" /> Banned
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
          <CheckCircle className="h-3 w-3" /> Active
        </span>
      ),
  },
  {
    key: "donationCount",
    label: "Donations",
    render: (user) => (
      <span className="text-sm font-medium">{user.donationCount ?? 0}</span>
    ),
    hideOnMobile: true,
  },
  {
    key: "createdAt",
    label: "Joined",
    render: (user) => (
      <span className="text-xs text-muted-foreground">
        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
      </span>
    ),
    hideOnMobile: true,
  },
];

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [bloodGroup, setBloodGroup] = useState(searchParams.get("bloodGroup") || "");
  const [donorStatus, setDonorStatus] = useState(searchParams.get("donorStatus") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [totalPages, setTotalPages] = useState(1);

  const syncUrl = useCallback(
    (overrides: { search?: string; bloodGroup?: string; donorStatus?: string; page?: number }) => {
      const params = new URLSearchParams();
      const s = overrides.search ?? search;
      const bg = overrides.bloodGroup ?? bloodGroup;
      const ds = overrides.donorStatus ?? donorStatus;
      const p = overrides.page ?? page;
      if (s) params.set("search", s);
      if (bg) params.set("bloodGroup", bg);
      if (ds) params.set("donorStatus", ds);
      params.set("page", String(p));
      router.replace(`/users?${params}`, { scroll: false });
    },
    [router, search, bloodGroup, donorStatus, page],
  );

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (bloodGroup) params.set("bloodGroup", bloodGroup);
      if (donorStatus) params.set("donorStatus", donorStatus);
      params.set("page", String(page));

      const response = await fetch(`/api/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  }, [search, bloodGroup, donorStatus, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    syncUrl({ search: value, page: 1 });
  };

  const handleBloodGroupChange = (v: string | null) => {
    const val = !v || v === "all" ? "" : v;
    setBloodGroup(val);
    setPage(1);
    syncUrl({ bloodGroup: val, page: 1 });
  };

  const handleDonorStatusChange = (v: string | null) => {
    const val = !v || v === "all" ? "" : v;
    setDonorStatus(val);
    setPage(1);
    syncUrl({ donorStatus: val, page: 1 });
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    syncUrl({ page: p });
  };

  const downloadCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (bloodGroup) params.set("bloodGroup", bloodGroup);
      if (donorStatus) params.set("donorStatus", donorStatus);
      params.set("page", "1");
      params.set("limit", "10000");

      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      const allUsers = data.users || [];

      const headers = [
        "First Name", "Last Name", "Mobile", "Email", "Blood Group",
        "Country", "Latitude", "Longitude", "Geohash",
        "Location Address", "Saved Addresses", "Gender", "Date of Birth",
        "Donor", "Emergency Donor", "Banned", "Online", "Donations",
        "Badge", "Communities", "Joined",
        "UID", "Token",
      ];

      const rows = allUsers.map((u: Record<string, unknown>) => [
        `"${(u.firstName || "").toString().replace(/"/g, '""')}"`,
        `"${(u.lastName || "").toString().replace(/"/g, '""')}"`,
        u.mobileNumber || "",
        `"${(u.email || "").toString().replace(/"/g, '""')}"`,
        u.bloodGroup || "",
        u.country || "",
        u.latitude ?? "",
        u.longitude ?? "",
        u.geohash || "",
        `"${(u.locationAddress || "").toString().replace(/"/g, '""')}"`,
        `"${(Array.isArray(u.savedAddresses) ? (u.savedAddresses as Array<{ addressText?: string }>).map((a) => a.addressText || "").join("; ") : "").replace(/"/g, '""')}"`,
        u.gender || "",
        u.dateOfBirth || "",
        u.isDonor ? "Yes" : "No",
        u.isEmergencyDonor ? "Yes" : "No",
        u.isBanned ? "Yes" : "No",
        u.isOnline ? "Yes" : "No",
        u.donationCount ?? 0,
        u.badge || "",
        Array.isArray(u.communities) ? u.communities.join("; ") : "",
        u.createdAt ? String(u.createdAt).slice(0, 10) : "",
        u.uid || "",
        `"${(u.token || "").toString().replace(/"/g, '""')}"`,
      ]);

      const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bloodfinder-users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            {users.length > 0
              ? `${page} of ${totalPages} pages — showing ${users.length} users`
              : "Manage registered users"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadCsv}>
          <Download className="mr-1.5 h-4 w-4" />
          CSV
        </Button>
      </div>

      <DataTable<UserRow>
        columns={columns}
        data={users}
        isLoading={isLoading}
        error={error}
        searchPlaceholder="Search by name, mobile, or email..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        emptyMessage="No users found."
        onRowClick={(user) => router.push(`/users/${user.id}`)}
        filterContent={
          <div className="flex gap-2">
            <Select
              value={bloodGroup}
              onValueChange={handleBloodGroupChange}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Blood Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {BLOOD_GROUPS.map((bg) => (
                  <SelectItem key={bg} value={bg}>
                    {bg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={donorStatus}
              onValueChange={handleDonorStatusChange}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Donor Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="donor">Donors</SelectItem>
                <SelectItem value="non-donor">Non-Donors</SelectItem>
                <SelectItem value="emergency">Emergency Donors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}
