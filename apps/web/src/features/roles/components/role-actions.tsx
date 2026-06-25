"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { PermissionMatrixEditor } from "./permission-matrix-editor";
import { useRouter } from "next/navigation";

interface Permission {
  id: string;
  key: string;
  module: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  memberCount: number;
}

export function CreateRoleDialog({
  permissions,
  open,
  onOpenChange,
}: {
  permissions: Permission[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);


  const handleCreate = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) { toast.error("Role name is required."); return; }

    setSaving(true);
    try {
      await apiRequest("/roles", {
        method: "POST",
        body: JSON.stringify({ name: trimmedName, description: description.trim(), permissionKeys: selectedKeys }),
      });
      toast.success("Role created.");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to create role.");
    } finally {
      setSaving(false);
    }
  }, [name, description, selectedKeys, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (next) {
        setName("");
        setDescription("");
        setSelectedKeys([]);
      }
      onOpenChange(next);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create role</DialogTitle>
          <DialogDescription>Add a new custom role with specific permissions.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="role-name" className="text-sm font-medium">Name</label>
            <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Inventory Manager" />
          </div>
          <div className="space-y-2">
            <label htmlFor="role-description" className="text-sm font-medium">Description</label>
            <textarea
  id="role-description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  placeholder="Optional description"
  rows={2}
  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors resize-none dark:bg-input/30"
/>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Permissions</label>
            <PermissionMatrixEditor
              permissions={permissions}
              selected={selectedKeys}
              onSelectionChange={setSelectedKeys}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleCreate} disabled={saving || !name.trim()}>
            {saving ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditRoleDialog({
  role,
  permissions,
  open,
  onOpenChange,
}: {
  role: Role & { permissions: Permission[] };
  permissions: Permission[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(role.permissions.map((p) => p.key));
  const [saving, setSaving] = useState(false);


  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) { toast.error("Role name is required."); return; }

    setSaving(true);
    try {
      await apiRequest(`/roles/${role.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: trimmedName !== role.name ? trimmedName : undefined,
          description: description.trim() !== role.description ? description.trim() : undefined,
          permissionKeys: selectedKeys,
        }),
      });
      toast.success("Role updated.");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to update role.");
    } finally {
      setSaving(false);
    }
  }, [name, description, selectedKeys, role, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit role</DialogTitle>
          <DialogDescription>Update the name, description, or permissions for <strong>{role.name}</strong>.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-role-name" className="text-sm font-medium">Name</label>
            <Input id="edit-role-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-role-description" className="text-sm font-medium">Description</label>
            <textarea
  id="edit-role-description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  rows={2}
  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors resize-none dark:bg-input/30"
/>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Permissions</label>
            <PermissionMatrixEditor
              permissions={permissions}
              selected={selectedKeys}
              onSelectionChange={setSelectedKeys}
            />
          </div>
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

export function DeleteRoleDialog({
  role,
  open,
  onOpenChange,
}: {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleDelete = useCallback(async () => {
    setSaving(true);
    try {
      await apiRequest(`/roles/${role.id}`, { method: "DELETE" });
      toast.success(`"${role.name}" has been deleted.`);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to delete role.");
    } finally {
      setSaving(false);
    }
  }, [role, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete role</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{role.name}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>
            {saving ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


