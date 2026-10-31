"use client";

import * as React from "react";
import { api } from "@/shared/trpc/react";
import {
  Card,
  Button,
  Badge,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  EmptyState,
  Skeleton,
} from "@/shared/ui";
import { PlusIcon, TrashIcon } from "@/shared/ui/icons";

export function StaffView() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const utils = api.useUtils();

  const { data, isLoading, error } = api.auth.listStaff.useQuery({ take: 50 });

  const createStaffMutation = api.auth.createStaff.useMutation({
    onSuccess: () => {
      utils.auth.listStaff.invalidate();
      setCreateModalOpen(false);
      setEmail("");
      setName("");
      setPassword("");
      setFormError(null);
    },
    onError: (err) => {
      setFormError(err.message || "Failed to create staff account");
    },
  });

  const deactivateMutation = api.auth.deactivateStaff.useMutation({
    onSuccess: () => utils.auth.listStaff.invalidate(),
  });

  function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !password) {
      setFormError("All fields are required");
      return;
    }

    createStaffMutation.mutate({
      email: email.trim(),
      name: name.trim(),
      password,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Internal Staff Management (FR-ADM-01)
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Admin-only staff provisioning: no public staff registration exists (FR-AUTH-06)
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="gap-1.5 text-xs h-9 font-medium"
        >
          <PlusIcon size={14} />
          <span>Provision Staff</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 flex items-center justify-between">
              <div className="space-y-2 w-1/3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-24" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Access Restricted or Error"
          description={error.message}
          action={<Button size="sm" onClick={() => utils.auth.listStaff.invalidate()}>Retry</Button>}
        />
      ) : !data?.items.length ? (
        <EmptyState
          title="No staff members found"
          description="Provision internal operations personnel to manage day-to-day subscriptions and billing."
          action={
            <Button size="sm" onClick={() => setCreateModalOpen(true)} className="gap-1.5">
              <PlusIcon size={14} />
              <span>Provision Staff</span>
            </Button>
          }
        />
      ) : (
        <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))] font-semibold">
                <tr>
                  <th className="px-4 py-3">Staff Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {data.items.map((member) => {
                  const isDeactivated = member.email.startsWith("deactivated::");
                  const displayEmail = isDeactivated
                    ? "Deactivated User"
                    : member.email;

                  return (
                    <tr key={member.id} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">
                        {displayEmail}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={member.role === "ADMIN" ? "default" : "neutral"} className="text-[10px] uppercase">
                          {member.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={isDeactivated ? "neutral" : "active"} className="text-[10px]">
                          {isDeactivated ? "Deactivated" : "Active"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] tabular-nums">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {member.role !== "ADMIN" && !isDeactivated && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deactivateMutation.mutate({ userId: member.id })}
                            disabled={deactivateMutation.isPending}
                            className="text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] h-7 px-2"
                          >
                            <TrashIcon size={12} className="mr-1" />
                            Deactivate
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provision Staff Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateStaff}>
            <DialogHeader>
              <DialogTitle>Provision Internal Staff (FR-ADM-01)</DialogTitle>
              <DialogDescription>
                Internal staff can operate day-to-day subscriptions, quotes, and billing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Staff Full Name</label>
                <Input
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Email Address</label>
                <Input
                  type="email"
                  required
                  placeholder="staff@brightloop.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[hsl(var(--foreground))]">Initial Password</label>
                <Input
                  type="password"
                  required
                  placeholder="Must satisfy password policy (>8 chars, upper, lower, special)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-xs"
                />
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  Policy: &gt;8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 special character.
                </p>
              </div>

              {formError && (
                <div className="rounded-[var(--radius-xs)] bg-[hsl(var(--status-overdue-bg))] p-2 text-xs text-[hsl(var(--status-overdue-ink))]">
                  {formError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={createStaffMutation.isPending}>
                Create Staff Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
