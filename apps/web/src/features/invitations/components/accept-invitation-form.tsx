"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, ApiClientError } from "@/lib/api-client";

export function AcceptInvitationForm({ token }: { token: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) { toast.error("Display name is required."); return; }
    if (!password) { toast.error("Password is required."); return; }
    if (password.length < 12) { toast.error("Password must be at least 12 characters."); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match."); return; }

    setSaving(true);
    try {
      await apiRequest("/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token, displayName: trimmedName, password }),
      });
      toast.success("Account created. You can now sign in.");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to accept invitation.");
    } finally {
      setSaving(false);
    }
  }, [token, displayName, password, confirmPassword, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Accept invitation</CardTitle>
        <CardDescription>
          Set your display name and password to activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="accept-name" className="text-sm font-medium">Display name</label>
            <Input
              id="accept-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="accept-password" className="text-sm font-medium">Password</label>
            <Input
              id="accept-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 12 characters"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="accept-confirm" className="text-sm font-medium">Confirm password</label>
            <Input
              id="accept-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
