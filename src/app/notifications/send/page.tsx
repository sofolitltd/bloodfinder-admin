"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Globe,
  MapPin,
  Users,
  Terminal,
  X,
  Search,
  Check,
  Loader2,
  ArrowLeft,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

interface UserResult {
  id: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  bloodGroup: string;
  country?: string;
}

// ─── Target Button ────────────────────────────────────────────────────

function TargetButton({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
        selected
          ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
          : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function SendNotificationPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground">Loading...</div>}>
      <SendNotificationForm />
    </Suspense>
  );
}

function SendNotificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [target, setTarget] = useState<"all" | "country" | "selected">("all");
  const [country, setCountry] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // User search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Pre-select user from query params (e.g. from user details page)
  useEffect(() => {
    const userId = searchParams.get("userId");
    const userName = searchParams.get("name");
    if (userId && userName) {
      setSelectedUsers([
        {
          id: userId,
          firstName: userName,
          lastName: "",
          mobileNumber: "",
          bloodGroup: "",
        },
      ]);
      setTarget("selected");
    }
  }, [searchParams]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  // Debounced user search
  useEffect(() => {
    if (target !== "selected" || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/users?search=${encodeURIComponent(searchQuery)}&limit=20`
        );
        const data = await res.json();
        const users = (data.users || []) as UserResult[];
        const selectedIds = new Set(selectedUsers.map((u) => u.id));
        setSearchResults(users.filter((u) => !selectedIds.has(u.id)));
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, target, selectedUsers]);

  // Close search results on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addUser = (user: UserResult) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      alert("Please enter a title and body.");
      return;
    }
    if (target === "country" && !country.trim()) {
      alert("Please enter a country name.");
      return;
    }
    if (target === "selected" && selectedUsers.length === 0) {
      alert("Please select at least one user.");
      return;
    }

    setSending(true);
    setLogs([]);

    try {
      const bodyPayload: Record<string, unknown> = {
        title: title.trim(),
        body: body.trim(),
        link: link.trim() || undefined,
        target,
      };

      let logMsg: string;
      if (target === "all") {
        logMsg = "ALL users (topic)";
      } else if (target === "country") {
        bodyPayload.country = country.trim();
        logMsg = `users in "${country}"`;
      } else {
        bodyPayload.userIds = selectedUsers.map((u) => u.id);
        logMsg = `${selectedUsers.length} selected user(s)`;
      }

      addLog(`Sending to ${logMsg}...`);

      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        addLog(`❌ ${data.error || "Request failed"}`);
      } else if (data.method === "topic") {
        addLog(`✅ Sent to all_users topic`);
      } else if (data.method === "multicast") {
        addLog(`✅ Sent: ${data.sentCount}, ❌ Failed: ${data.failedCount}`);
      } else {
        addLog(`⚠️ ${data.message || "Unknown response"}`);
      }

      if (data.success) {
        setTitle("");
        setBody("");
        setLink("");
        setCountry("");
        setSelectedUsers([]);
      }
    } catch (err) {
      addLog(`❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with back */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/notifications")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Send Notification</h1>
          <p className="text-muted-foreground">Compose and send a push notification</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Notification Title</label>
            <Input
              placeholder="e.g. Blood Donation Camp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notification Body</label>
            <Textarea
              placeholder="Write your message..."
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Link <span className="text-muted-foreground font-normal">(optional — opens when notification is tapped)</span>
            </label>
            <Input
              placeholder="e.g. /blood-requests or https://example.com"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Send To</label>
            <div className="flex gap-3">
              <TargetButton
                icon={<Globe className="h-4 w-4" />}
                label="All Users"
                selected={target === "all"}
                onClick={() => setTarget("all")}
              />
              <TargetButton
                icon={<MapPin className="h-4 w-4" />}
                label="By Country"
                selected={target === "country"}
                onClick={() => setTarget("country")}
              />
              <TargetButton
                icon={<Users className="h-4 w-4" />}
                label="Selected"
                selected={target === "selected"}
                onClick={() => setTarget("selected")}
              />
            </div>
          </div>

          {target === "country" && (
            <div>
              <label className="block text-sm font-medium mb-1">Country Name</label>
              <Input
                placeholder="e.g. Bangladesh"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          )}

          {target === "selected" && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Users</label>

              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedUsers.map((user) => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      <span className="text-xs">
                        {user.firstName} {user.lastName}
                        <span className="text-muted-foreground ml-1">({user.bloodGroup})</span>
                      </span>
                      <button onClick={() => removeUser(user.id)} className="ml-0.5 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, mobile, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowResults(true);
                    }}
                    className="pl-8"
                  />
                  {searching && (
                    <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>

                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg dark:bg-gray-900 max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => addUser(user)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors border-b last:border-0"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          {(user.firstName?.[0] || "?").toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.mobileNumber}
                            {user.bloodGroup && ` · ${user.bloodGroup}`}
                            {user.country && ` · ${user.country}`}
                          </p>
                        </div>
                        <Check className="h-4 w-4 shrink-0 text-green-500 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}

                {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white p-3 text-center text-sm text-muted-foreground shadow-lg dark:bg-gray-900">
                    No users found
                  </div>
                )}
              </div>

              {selectedUsers.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedUsers.length} user(s) selected
                </p>
              )}
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={sending}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send Notification
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="h-4 w-4" />
              <span className="text-sm font-medium">Send Log</span>
            </div>
            <div className="rounded-lg bg-gray-900 p-3 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
              {logs.map((line, i) => {
                const isError = line.includes("❌");
                return (
                  <div key={i} className={isError ? "text-red-300" : "text-green-300"}>
                    {line}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
