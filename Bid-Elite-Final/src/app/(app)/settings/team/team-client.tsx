"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Modal from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  lastLogin: Date | null;
}

interface TeamClientProps {
  members: TeamMember[];
  currentUserId: string;
}

export default function TeamClient({ members: initialMembers, currentUserId }: TeamClientProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState(initialMembers);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("member");

  async function handleAddUser() {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast("All fields are required", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to add user", "error");
        return;
      }

      setMembers((prev) => [data.user, ...prev]);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("member");
      setAddModalOpen(false);
      toast("User added successfully", "success");
    } catch {
      toast("Failed to add user", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser() {
    if (!selectedMember) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedMember.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to delete user", "error");
        return;
      }

      setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
      setDeleteModalOpen(false);
      setSelectedMember(null);
      toast("User deleted", "success");
    } catch {
      toast("Failed to delete user", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(member: TeamMember, newRole: string) {
    try {
      const res = await fetch(`/api/users/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to update role", "error");
        return;
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
      );
      toast("Role updated", "success");
    } catch {
      toast("Failed to update role", "error");
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">
          {members.length} team member{members.length !== 1 ? "s" : ""}
        </h2>
        <Button size="sm" onClick={() => setAddModalOpen(true)}>
          Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-secondary p-8 text-center text-sm text-text-dim">
          No team members found.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="divide-y divide-border/50">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text-primary">
                    {member.name}
                    {member.id === currentUserId && (
                      <span className="ml-2 text-[10px] text-text-dim">(you)</span>
                    )}
                  </div>
                  <div className="text-xs text-text-dim">
                    {member.email}
                    {member.lastLogin && (
                      <span className="ml-2">
                        Last login: {new Date(member.lastLogin).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member, e.target.value)}
                    disabled={member.id === currentUserId}
                    className="rounded-md border border-border bg-bg-tertiary px-2 py-1 text-xs text-text-secondary disabled:opacity-50"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                  {member.id !== currentUserId && (
                    <button
                      onClick={() => {
                        setSelectedMember(member);
                        setDeleteModalOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-error/10 hover:text-error"
                      title="Remove user"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Team Member">
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="John Doe"
          />
          <Input
            label="Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="john@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 6 characters"
          />
          <Select
            label="Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            options={[
              { value: "member", label: "Member" },
              { value: "admin", label: "Admin" },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={saving}>
              {saving ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Remove Team Member">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to remove <span className="font-semibold text-text-primary">{selectedMember?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteUser} disabled={saving}>
              {saving ? "Removing..." : "Remove"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
