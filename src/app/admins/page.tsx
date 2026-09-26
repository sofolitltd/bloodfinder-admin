"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Admin } from "@/lib/types/admin";
import { queryKeys } from "@/lib/query-keys";

export default function AdminsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Admin | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admins.list(),
    queryFn: async () => {
      const res = await fetch("/api/admins");
      return (await res.json()) as { admins: Admin[] };
    },
  });
  const admins = data?.admins ?? [];

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; email: string; password: string }) => {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create admin");
      return resData;
    },
    onSuccess: () => {
      toast.success("Admin added");
      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: queryKeys.admins.list() });
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (admin: Admin) => {
      const res = await fetch(`/api/admins/${admin.id}`, { method: "DELETE" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to remove admin");
    },
    onSuccess: () => {
      toast.success("Admin removed");
      queryClient.invalidateQueries({ queryKey: queryKeys.admins.list() });
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setConfirmTarget(null),
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setFormError(null);
  };

  const handleCreate = () => {
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError("Email and password are required");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }

    createMutation.mutate({ name: name.trim(), email: email.trim(), password });
  };

  const handleDelete = (admin: Admin) => deleteMutation.mutate(admin);
  const submitting = createMutation.isPending;
  const deletingId = deleteMutation.isPending ? deleteMutation.variables?.id : null;

  const initialsFor = (admin: Admin) => {
    const source = admin.name?.trim() || admin.email;
    return (source?.[0] || "?").toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Admins</h1>
          <p className="text-muted-foreground">
            Control who can sign in to this dashboard
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) resetForm();
          }}
        >
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Admin
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Admin</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "Adding..." : "Add Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  No admins found.
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2.5">
                      <Avatar>
                        <AvatarFallback className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          {initialsFor(admin)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{admin.name || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{admin.email}</TableCell>
                  <TableCell>
                    {admin.isSuperAdmin ? (
                      <Badge className="gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Super Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!admin.isSuperAdmin && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setConfirmTarget(admin)}
                        disabled={deletingId === admin.id}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(next) => {
          if (!next) setConfirmTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove admin?</DialogTitle>
            <DialogDescription>
              {confirmTarget && (
                <>
                  This will revoke dashboard access for{" "}
                  <span className="font-medium text-foreground">
                    {confirmTarget.name || confirmTarget.email}
                  </span>
                  . This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmTarget(null)}
              disabled={deletingId === confirmTarget?.id}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmTarget && handleDelete(confirmTarget)}
              disabled={deletingId === confirmTarget?.id}
            >
              {deletingId === confirmTarget?.id ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
