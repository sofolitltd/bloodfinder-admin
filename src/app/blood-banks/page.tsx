"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/data-table";
import { Plus, Pencil, Trash2, Phone, MapPin, Droplet } from "lucide-react";
import { toast } from "sonner";
import type { BloodBank } from "@/lib/types/blood-bank";
import { queryKeys } from "@/lib/query-keys";

const emptyForm = {
  name: "",
  address: "",
  mobile1: "",
  mobile2: "",
  country: "",
  locationAddress: "",
  latitude: "",
  longitude: "",
};

export default function BloodBanksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BloodBank | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [confirmTarget, setConfirmTarget] = useState<BloodBank | null>(null);

  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.bloodBanks.list(),
    queryFn: async () => {
      const res = await fetch("/api/blood-banks");
      return (await res.json()) as { bloodBanks: BloodBank[] };
    },
  });
  const bloodBanks = data?.bloodBanks ?? [];

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(editing ? `/api/blood-banks/${editing.id}` : "/api/blood-banks", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save blood bank");
      return resData;
    },
    onSuccess: () => {
      toast.success(editing ? "Blood bank updated" : "Blood bank added");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.bloodBanks.list() });
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/blood-banks/${id}`, { method: "DELETE" }).then((res) => {
        if (!res.ok) throw new Error();
      }),
    onSuccess: () => {
      toast.success("Blood bank deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.bloodBanks.list() });
    },
    onError: () => toast.error("Failed to delete blood bank"),
    onSettled: () => setConfirmTarget(null),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (bank: BloodBank) => {
    setEditing(bank);
    setForm({
      name: bank.name || "",
      address: bank.address || "",
      mobile1: bank.mobile1 || "",
      mobile2: bank.mobile2 || "",
      country: bank.country || "",
      locationAddress: bank.locationAddress || "",
      latitude: bank.latitude != null ? String(bank.latitude) : "",
      longitude: bank.longitude != null ? String(bank.longitude) : "",
    });
    setFormError(null);
    setOpen(true);
  };

  const handleSubmit = () => {
    setFormError(null);

    if (!form.name.trim() || !form.address.trim() || !form.mobile1.trim()) {
      setFormError("Name, address, and mobile number are required");
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      address: form.address.trim(),
      mobile1: form.mobile1.trim(),
      mobile2: form.mobile2.trim(),
      country: form.country.trim(),
      locationAddress: form.locationAddress.trim(),
    };
    if (form.latitude.trim()) payload.latitude = Number(form.latitude);
    if (form.longitude.trim()) payload.longitude = Number(form.longitude);

    saveMutation.mutate(payload);
  };

  const handleDelete = () => {
    if (!confirmTarget) return;
    deleteMutation.mutate(confirmTarget.id);
  };
  const submitting = saveMutation.isPending;
  const deleting = deleteMutation.isPending;

  const lowerSearch = search.toLowerCase();
  const filtered = search
    ? bloodBanks.filter(
        (b) =>
          b.name?.toLowerCase().includes(lowerSearch) ||
          b.address?.toLowerCase().includes(lowerSearch) ||
          b.mobile1?.toLowerCase().includes(lowerSearch) ||
          b.country?.toLowerCase().includes(lowerSearch)
      )
    : bloodBanks;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<BloodBank>[] = [
    {
      key: "name",
      label: "Name",
      render: (b) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <Droplet className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium">{b.name}</span>
        </div>
      ),
    },
    {
      key: "mobile1",
      label: "Mobile",
      render: (b) => (
        <span className="inline-flex items-center gap-1 text-sm font-mono">
          <Phone className="h-3 w-3 text-muted-foreground" /> {b.mobile1}
        </span>
      ),
    },
    {
      key: "address",
      label: "Address",
      render: (b) => (
        <span className="flex items-center gap-1 text-sm truncate max-w-[220px]">
          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
          {b.locationAddress || b.address || "—"}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "country",
      label: "Country",
      render: (b) =>
        b.country ? (
          <span className="text-sm">{b.country}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
      hideOnMobile: true,
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (b) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(b);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmTarget(b);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blood Banks</h1>
          <p className="text-muted-foreground">
            {bloodBanks.length > 0
              ? `${filtered.length} blood bank(s)`
              : "Manage the blood bank directory"}
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) {
              setEditing(null);
              setForm(emptyForm);
            }
          }}
        >
          <DialogTrigger render={<Button size="sm" onClick={openCreate} />}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Blood Bank
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Blood Bank" : "Add Blood Bank"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  placeholder="e.g. Red Crescent Blood Bank"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <Input
                  placeholder="Street address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile</label>
                  <Input
                    placeholder="Primary mobile"
                    value={form.mobile1}
                    onChange={(e) => setForm((f) => ({ ...f, mobile1: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mobile 2 <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Input
                    placeholder="Secondary mobile"
                    value={form.mobile2}
                    onChange={(e) => setForm((f) => ({ ...f, mobile2: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <Input
                  placeholder="e.g. Bangladesh"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location Address <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="Display address for map view"
                  value={form.locationAddress}
                  onChange={(e) => setForm((f) => ({ ...f, locationAddress: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Latitude <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 23.8103"
                    value={form.latitude}
                    onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Longitude <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 90.4125"
                    value={form.longitude}
                    onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                  />
                </div>
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </div>

            <DialogFooter>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving..." : editing ? "Save Changes" : "Add Blood Bank"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable<BloodBank>
        columns={columns}
        data={paged}
        isLoading={isLoading}
        searchPlaceholder="Search by name, address, mobile, or country..."
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No blood banks found."
      />

      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(next) => {
          if (!next) setConfirmTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete blood bank?</DialogTitle>
            <DialogDescription>
              {confirmTarget && (
                <>
                  This will permanently delete{" "}
                  <span className="font-medium text-foreground">{confirmTarget.name}</span>.
                  This action cannot be undone.
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
