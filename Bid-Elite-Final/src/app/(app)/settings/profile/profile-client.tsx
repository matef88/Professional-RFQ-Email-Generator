"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface ProfileClientProps {
  initialName: string;
  initialEmail: string;
  role: string;
}

export default function ProfileClient({ initialName, initialEmail, role }: ProfileClientProps) {
  const { toast } = useToast();

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveProfile() {
    if (!name.trim() || !email.trim()) {
      toast("Name and email are required", "error");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to update profile", "error");
        return;
      }

      toast("Profile updated successfully", "success");
    } catch {
      toast("Failed to update profile", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast("All password fields are required", "error");
      return;
    }

    if (newPassword.length < 6) {
      toast("New password must be at least 6 characters", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast("New passwords do not match", "error");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to change password", "error");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Password changed successfully", "success");
    } catch {
      toast("Failed to change password", "error");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-text-primary">Personal Information</h3>
        </div>
        <div className="space-y-4 p-5">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div>
            <label className="text-xs font-medium text-text-muted">Role</label>
            <p className="text-sm capitalize text-text-dim">{role}</p>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-text-primary">Change Password</h3>
        </div>
        <div className="space-y-4 p-5">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint="Minimum 6 characters"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="flex justify-end pt-2">
            <Button onClick={handleChangePassword} disabled={savingPassword}>
              {savingPassword ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
