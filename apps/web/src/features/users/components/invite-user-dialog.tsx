"use client";

import { useCallback, useState } from "react";
import { UserRoundPlus } from "@/components/ui/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MultiCombobox } from "@/components/ui/combobox";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { useRouter } from "next/navigation";

interface RoleOption {
  id: string;
  name: string;
}

export function InviteUserButton({ roleOptions }: { roleOptions: RoleOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserRoundPlus className="size-4" />
        Invite user
      </Button>
      <InviteUserDialog
        roleOptions={roleOptions}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

function InviteUserDialog({
  roleOptions,
  open,
  onOpenChange,
}: {
  roleOptions: RoleOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleInvite = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { toast.error("Email address is required."); return; }
    if (!trimmed.includes("@")) { toast.error("Enter a valid email address."); return; }
    if (selectedRoles.length === 0) { toast.error("Select at least one role."); return; }

    setSaving(true);
    try {
      await apiRequest("/invitations", {
        method: "POST",
        body: JSON.stringify({ email: trimmed, roleIds: selectedRoles }),
      });
      toast.success("Invitation sent.");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to send invitation.");
    } finally {
      setSaving(false);
    }
  }, [email, selectedRoles, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (nextOpen) {
        setEmail("");
        setSelectedRoles([]);
      }
      onOpenChange(nextOpen);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new member to the organization.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="invite-email" className="text-sm font-medium">Email</label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Roles</label>
            <MultiCombobox
              value={selectedRoles}
              onValueChange={setSelectedRoles}
              options={roleOptions.map((r) => ({ value: r.id, label: r.name }))}
              placeholder="Select roles"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleInvite} disabled={saving || !email.trim() || selectedRoles.length === 0}>
            {saving ? "Sending..." : "Send invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}





