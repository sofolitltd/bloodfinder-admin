"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import {
  Users,
  HeartHandshake,
  Droplet,
  Users2,
  Landmark,
  MessageSquareText,
  CalendarDays,
  ShieldAlert,
  Send,
  Plus,
  UserPlus,
  Globe,
} from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/lib/utils";

interface DashboardStats {
  totalUsers: number;
  totalDonors: number;
  emergencyDonors: number;
  activeBloodRequests: number;
  totalCommunities: number;
  totalBloodBanks: number;
  totalFeedback: number;
  upcomingEvents: number;
  donationsThisMonth: number;
}

interface DashboardData {
  configured: boolean;
  stats?: DashboardStats;
  charts?: {
    newUsersByDay: { date: string; count: number }[];
    donationsByMonth: { month: string; count: number }[];
    requestsByBloodGroup: { bloodGroup: string; count: number }[];
    usersByCountry: { country: string; count: number }[];
  };
  recent?: {
    users: { id: string; name: string; bloodGroup: string | null; createdAt: unknown }[];
    bloodRequests: { id: string; requesterName: string; bloodGroup: string; status: string; createdAt: unknown }[];
    feedback: { id: string; userName: string; category: string; message: string; createdAt: unknown }[];
  };
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-bold">{(value ?? 0).toLocaleString()}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const {
    data,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      return (await res.json()) as DashboardData;
    },
  });

  const stats = data?.stats;
  const charts = data?.charts;
  const recent = data?.recent;

  const newUsersChartData = (charts?.newUsersByDay || []).map((d) => ({
    label: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count: d.count,
  }));

  const donationsChartData = (charts?.donationsByMonth || []).map((d) => ({
    label: new Date(`${d.month}-01`).toLocaleDateString(undefined, { month: "short" }),
    count: d.count,
  }));

  const bloodGroupChartData = charts?.requestsByBloodGroup || [];
  const usersByCountry = charts?.usersByCountry || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of Blood Finder</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
          <CardContent className="p-4 text-sm text-red-600 dark:text-red-400">
            Failed to load stats: {error.message}
          </CardContent>
        </Card>
      )}

      {!loading && data && !data.configured && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="p-4 text-sm text-amber-700 dark:text-amber-400">
            Firebase isn&apos;t configured yet — set the Firebase Admin environment variables to see live data.
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers}
          icon={Users}
          color="text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
          loading={loading}
        />
        <StatCard
          label="Active Donors"
          value={stats?.totalDonors}
          icon={HeartHandshake}
          color="text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
          loading={loading}
        />
        <StatCard
          label="Active Requests"
          value={stats?.activeBloodRequests}
          icon={Droplet}
          color="text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
          loading={loading}
        />
        <StatCard
          label="Donations This Month"
          value={stats?.donationsThisMonth}
          icon={Droplet}
          color="text-pink-600 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400"
          loading={loading}
        />
        <StatCard
          label="Communities"
          value={stats?.totalCommunities}
          icon={Users2}
          color="text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400"
          loading={loading}
        />
        <StatCard
          label="Blood Banks"
          value={stats?.totalBloodBanks}
          icon={Landmark}
          color="text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
          loading={loading}
        />
        <StatCard
          label="Emergency Donors"
          value={stats?.emergencyDonors}
          icon={ShieldAlert}
          color="text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400"
          loading={loading}
        />
        <StatCard
          label="Upcoming Events"
          value={stats?.upcomingEvents}
          icon={CalendarDays}
          color="text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">New Users (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={newUsersChartData}>
                  <defs>
                    <linearGradient id="newUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" fontSize={11} tickLine={false} />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} width={28} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#dc2626"
                    fill="url(#newUsers)"
                    strokeWidth={2}
                    name="New Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requests by Blood Group</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bloodGroupChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="bloodGroup" fontSize={11} tickLine={false} />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} width={28} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#dc2626" radius={[4, 4, 0, 0]} name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Donations Trend (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donationsChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} fontSize={11} tickLine={false} width={28} />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} name="Donations" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Users by country */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Users by Country
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : usersByCountry.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No user data yet.</p>
          ) : (
            usersByCountry.map((c) => {
              const total = stats?.totalUsers || 1;
              const pct = Math.round((c.count / total) * 100);
              return (
                <div key={c.country} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm font-medium">
                    {c.country}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-red-600"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                    {c.count} ({pct}%)
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Recent activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Blood Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : recent?.bloodRequests.length ? (
              recent.bloodRequests.map((r) => (
                <Link
                  key={r.id}
                  href="/blood-requests"
                  className="flex items-center justify-between rounded-lg px-2 py-2 -mx-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.requesterName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-red-600">{r.bloodGroup}</span>
                    <StatusBadge status={r.status} />
                  </div>
                </Link>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No blood requests yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Signups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : recent?.users.length ? (
              recent.users.map((u) => (
                <Link
                  key={u.id}
                  href={`/users/${u.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-2 -mx-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {(u.name?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</p>
                    </div>
                  </div>
                  {u.bloodGroup && (
                    <span className="text-xs font-semibold text-red-600 shrink-0">{u.bloodGroup}</span>
                  )}
                </Link>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No signups yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : recent?.feedback.length ? (
              recent.feedback.map((f) => (
                <Link
                  key={f.id}
                  href="/feedback"
                  className="block rounded-lg px-2 py-2 -mx-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {(f.userName?.[0] || "?").toUpperCase()}
                      </span>
                      <span className="text-xs font-medium truncate">{f.userName}</span>
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(f.createdAt)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                      {f.category}
                    </span>
                    <p className="text-sm truncate">{f.message}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No feedback yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/notifications/send">
            <Button size="sm">
              <Send className="mr-1.5 h-4 w-4" />
              Send Notification
            </Button>
          </Link>
          <Link href="/blood-banks">
            <Button size="sm" variant="outline">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Blood Bank
            </Button>
          </Link>
          <Link href="/communities">
            <Button size="sm" variant="outline">
              <Users2 className="mr-1.5 h-4 w-4" />
              Manage Communities
            </Button>
          </Link>
          <Link href="/feedback">
            <Button size="sm" variant="outline">
              <MessageSquareText className="mr-1.5 h-4 w-4" />
              Review Feedback
            </Button>
          </Link>
          <Link href="/admins">
            <Button size="sm" variant="outline">
              <UserPlus className="mr-1.5 h-4 w-4" />
              Manage Admins
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
