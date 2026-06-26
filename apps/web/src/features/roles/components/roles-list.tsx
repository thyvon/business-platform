"use client";

import { useCallback, useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2 } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { CreateRoleDialog, EditRoleDialog, DeleteRoleDialog } from "./role-actions";

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

export function RolesList({
  roles,
  permissions,
  canCreate,
  canUpdate,
  canDelete,
}: {
  roles: Role[];
  permissions: Permission[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role & { permissions: Permission[] } | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const handleEdit = useCallback(async (role: Role) => {
    setEditLoading(true);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
    try {
      const response = await fetch(`${apiBaseUrl}/roles/${role.id}`);
      if (!response.ok) return;
      const payload = await response.json() as { data: Role & { permissions: Permission[] } };
      setEditingRole(payload.data);
    } catch {
      setEditingRole(null);
    } finally {
      setEditLoading(false);
    }
  }, []);

  const columnDefinitions: Array<DataTableColumn<Role>> = [
    {
      id: "name",
      header: "Role",
      cell: (role) => (
        <div>
          <div className="flex items-center gap-2 font-medium text-foreground">
            {role.name}
            {role.isSystem && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">System</Badge>
            )}
          </div>
          {role.description && (
            <div className="mt-0.5 text-xs text-muted-foreground max-w-sm truncate">{role.description}</div>
          )}
        </div>
      ),
    },
    {
      id: "members",
      header: "Members",
      cell: (role) => (
        <span className="text-sm text-muted-foreground">{role.memberCount}</span>
      ),
      className: "w-24",
    },
    {
      id: "actions",
      header: "",
      className: "w-0",
      cell: (role) => (
        <div className="flex items-center gap-1">
          {canUpdate && !role.isSystem && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleEdit(role)}
              title="Edit role"
              disabled={editLoading}
            >
              <Pencil className="size-3.5" />
            </Button>
          )}
          {canDelete && !role.isSystem && role.memberCount === 0 && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setDeletingRole(role)}
              title="Delete role"
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <ShieldCheck className="size-6" />
            Roles
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage custom roles and assign granular permissions to organization members.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create role
          </Button>
        )}
      </div>

      <DataTable
        columns={columnDefinitions}
        items={roles}
        getItemKey={(role) => role.id}
        emptyTitle="No roles found"
        emptyDescription="Create your first role to start assigning permissions."
      />

      <CreateRoleDialog
        permissions={permissions}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {editingRole && (
        <EditRoleDialog
          key={editingRole.id}
          role={editingRole}
          permissions={permissions}
          open={true}
          onOpenChange={() => setEditingRole(null)}
        />
      )}

      {deletingRole && (
        <DeleteRoleDialog
          role={deletingRole}
          open={true}
          onOpenChange={() => setDeletingRole(null)}
        />
      )}
    </>
  );
}


