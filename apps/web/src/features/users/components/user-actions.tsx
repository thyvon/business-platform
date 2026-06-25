"use client";

import { useCallback, useState } from "react";
import { Ellipsis, Pencil, Shield, ShieldOff, LogOut } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { useRouter } from "next/navigation";

interface RoleOption {
  id: string;
  name: string;
}

export function UserActions({
  userId,
  displayName,
  membershipStatus,
  roleIds: initialRoleIds,
  roleOptions,
}: {
  userId: string;
  displayName: string;
  membershipStatus: string;
  roleIds: string[];
  roleOptions: RoleOption[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  const onSuccess = useCallback(() => { router.refresh(); }, [router]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="User actions" className="size-8">
          <Ellipsis className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Edit
          </DropdownMenuItem>
          {membershipStatus === "active" ? (
            <DropdownMenuItem onClick={() => setSuspendOpen(true)}>
              <ShieldOff className="size-3.5 text-destructive" />
              Suspend
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setReactivateOpen(true)}>
              <Shield className="size-3.5 text-green-600" />
              Reactivate
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setRolesOpen(true)}>
            <Shield className="size-3.5" />
            Roles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setRevokeOpen(true)}>
            <LogOut className="size-3.5" />
            Revoke sessions
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
        userId={userId}
        displayName={displayName}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onSuccess}
      />

      {membershipStatus === "active" ? (
        <SuspendUserDialog
          userId={userId}
          displayName={displayName}
          open={suspendOpen}
          onOpenChange={setSuspendOpen}
          onSuccess={onSuccess}
        />
      ) : (
        <ReactivateUserDialog
          userId={userId}
          displayName={displayName}
          open={reactivateOpen}
          onOpenChange={setReactivateOpen}
          onSuccess={onSuccess}
        />
      )}

      <AssignRolesDialog
        userId={userId}
        displayName={displayName}
        roleIds={initialRoleIds}
        roleOptions={roleOptions}
        open={rolesOpen}
        onOpenChange={setRolesOpen}
        onSuccess={onSuccess}
      />

      <RevokeSessionsDialog
        userId={userId}
        displayName={displayName}
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}

function EditUserDialog({
  userId,
  displayName,
  open,
  onOpenChange,
  onSuccess,
}: {
  userId: string;
  displayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Display name is required."); return; }
    if (trimmed === displayName) { onOpenChange(false); return; }

    setSaving(true);
    try {
      await apiRequest(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ displayName: trimmed }),
      });
      toast.success("User updated.");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to update user.");
    } finally {
      setSaving(false);
    }
  }, [userId, name, displayName, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (next) setName(displayName); onOpenChange(next); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>Update the display name for this user.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="edit-name" className="text-sm font-medium">Display name</label>
          <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SuspendUserDialog({
  userId,
  displayName,
  open,
  onOpenChange,
  onSuccess,
}: {
  userId: string;
  displayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleSuspend = useCallback(async () => {
    setSaving(true);
    try {
      await apiRequest(`/users/${userId}/suspend`, { method: "POST" });
      toast.success(`${displayName} has been suspended.`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to suspend user.");
    } finally {
      setSaving(false);
    }
  }, [userId, displayName, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend user</DialogTitle>
          <DialogDescription>
            This will immediately suspend <strong>{displayName}</strong> and revoke all active sessions. They will not be able to log in until reactivated.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={handleSuspend} disabled={saving}>
            {saving ? "Suspending..." : "Suspend"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReactivateUserDialog({
  userId,
  displayName,
  open,
  onOpenChange,
  onSuccess,
}: {
  userId: string;
  displayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleReactivate = useCallback(async () => {
    setSaving(true);
    try {
      await apiRequest(`/users/${userId}/reactivate`, { method: "POST" });
      toast.success(`${displayName} has been reactivated.`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to reactivate user.");
    } finally {
      setSaving(false);
    }
  }, [userId, displayName, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reactivate user</DialogTitle>
          <DialogDescription>
            This will reactivate <strong>{displayName}</strong> and allow them to log in again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleReactivate} disabled={saving}>
            {saving ? "Reactivating..." : "Reactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignRolesDialog({
  userId,
  displayName,
  roleIds,
  roleOptions,
  open,
  onOpenChange,
  onSuccess,
}: {
  userId: string;
  displayName: string;
  roleIds: string[];
  roleOptions: RoleOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [selected, setSelected] = useState(roleIds);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await apiRequest(`/users/${userId}/roles`, {
        method: "PUT",
        body: JSON.stringify({ roleIds: selected }),
      });
      toast.success("Roles updated.");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to assign roles.");
    } finally {
      setSaving(false);
    }
  }, [userId, selected, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (next) setSelected(roleIds); onOpenChange(next); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign roles</DialogTitle>
          <DialogDescription>Select the roles for <strong>{displayName}</strong>.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">Roles</label>
          <MultiSelect
            value={selected}
            onValueChange={setSelected}
            options={roleOptions.map((r) => ({ value: r.id, label: r.name }))}
            placeholder="Select roles"
            searchable
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RevokeSessionsDialog({
  userId,
  displayName,
  open,
  onOpenChange,
  onSuccess,
}: {
  userId: string;
  displayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleRevoke = useCallback(async () => {
    setSaving(true);
    try {
      await apiRequest(`/users/${userId}/revoke-sessions`, { method: "POST" });
      toast.success(`All sessions for ${displayName} have been revoked.`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to revoke sessions.");
    } finally {
      setSaving(false);
    }
  }, [userId, displayName, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke sessions</DialogTitle>
          <DialogDescription>
            This will sign <strong>{displayName}</strong> out of all active sessions. They will need to log in again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleRevoke} disabled={saving}>
            {saving ? "Revoking..." : "Revoke sessions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

