import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { SearchableSelect } from "@/components/SearchableSelect";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Plus, Trash2, Shield } from "lucide-react";

type StaffRole = { id: string; role_id: string; permissions_json: Record<string, boolean> };

const PERM_LABELS: Record<string, string> = {
  view: "View Tickets", close: "Close Tickets", claim: "Claim Tickets",
  reopen: "Reopen Tickets", manage: "Manage (All Ticket Actions)",
  blacklist: "Blacklist Users", delete: "Delete Tickets",
};

export default function Staff({ guildId }: { guildId: string }) {
  const [addOpen, setAddOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<StaffRole | null>(null);
  const utils = trpc.useUtils();
  const { data: staffRoles, isLoading } = trpc.staff.list.useQuery({ guildId });
  const { data: discordRoles } = trpc.guilds.getRoles.useQuery({ guildId });
  const removeMut = trpc.staff.remove.useMutation({
    onSuccess: () => { utils.staff.list.invalidate(); toast.success("Role removed"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.staff.update.useMutation({
    onSuccess: () => { utils.staff.list.invalidate(); toast.success("Permissions updated"); setEditRole(null); },
    onError: (e) => toast.error(e.message),
  });

  const roleMap = new Map((discordRoles ?? []).map((r: { id: string; name: string; color: number }) => [r.id, r]));
  const existingRoleIds = new Set((staffRoles ?? []).map((s: StaffRole) => s.role_id));
  const availableRoles = (discordRoles ?? [])
    .filter((r: { id: string }) => !existingRoleIds.has(r.id))
    .map((r: { id: string; name: string; color: number }) => ({
      value: r.id, label: r.name,
      color: r.color ? "#" + r.color.toString(16).padStart(6, "0") : undefined,
    }));

  return (
    <div className="p-6">
      <PageHeader
        title="Staff Roles"
        description="Assign Discord roles as staff and configure their ticket permissions."
        action={
          <Button className="bg-[hsl(var(--primary))]" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Role
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : staffRoles?.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[hsl(var(--border))] rounded-xl">
          <Shield className="w-10 h-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No staff roles</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Add Discord roles that can manage tickets in this server.</p>
          <Button className="bg-[hsl(var(--primary))]" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1" /> Add Role</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(staffRoles ?? []).map((s: StaffRole) => {
            const role = roleMap.get(s.role_id) as { id: string; name: string; color: number } | undefined;
            const perms = s.permissions_json ?? {};
            return (
              <div key={s.id} className="border border-[hsl(var(--border))] rounded-xl p-4 bg-[hsl(var(--card))]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {role?.color ? (
                      <div className="w-3 h-3 rounded-full" style={{ background: "#" + role.color.toString(16).padStart(6, "0") }} />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-[hsl(var(--muted-foreground))]" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{role?.name ?? s.role_id}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {Object.entries(perms).filter(([, v]) => v).map(([k]) => PERM_LABELS[k] ?? k).join(", ") || "No permissions"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setEditRole(s)}>Edit Perms</Button>
                    <Button size="sm" variant="outline" className="text-[hsl(var(--destructive))]" onClick={() => setRemoveId(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddStaffRoleDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        guildId={guildId}
        availableRoles={availableRoles}
        onSuccess={() => utils.staff.list.invalidate()}
      />

      {editRole && (
        <EditPermsDialog
          open={!!editRole}
          onClose={() => setEditRole(null)}
          role={editRole}
          roleName={roleMap.get(editRole.role_id) as { name: string } | undefined}
          onSave={(perms) => updateMut.mutate({ id: editRole.id, guildId, permissions: perms })}
          isSaving={updateMut.isPending}
        />
      )}

      <ConfirmDialog
        open={!!removeId}
        onOpenChange={(o) => !o && setRemoveId(null)}
        title="Remove Staff Role"
        description="This role will no longer have access to manage tickets."
        confirmLabel="Remove" variant="destructive"
        onConfirm={() => { if (removeId) removeMut.mutate({ id: removeId, guildId }); setRemoveId(null); }}
      />
    </div>
  );
}

function AddStaffRoleDialog({ open, onClose, guildId, availableRoles, onSuccess }: {
  open: boolean; onClose: () => void; guildId: string;
  availableRoles: { value: string; label: string; color?: string }[];
  onSuccess: () => void;
}) {
  const [roleId, setRoleId] = useState<string | null>(null);
  const [perms, setPerms] = useState({ view: true, close: true, claim: true, reopen: false, manage: false, blacklist: false, delete: false });
  const addMut = trpc.staff.add.useMutation({
    onSuccess: () => { toast.success("Staff role added"); onSuccess(); onClose(); setRoleId(null); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <DialogHeader><DialogTitle>Add Staff Role</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-[hsl(var(--muted-foreground))]">Discord Role</Label>
            <SearchableSelect options={availableRoles} value={roleId} onChange={setRoleId} placeholder="Select a role..." className="mt-1" />
          </div>
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Permissions</Label>
            {Object.entries(PERM_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-sm cursor-pointer" htmlFor={`perm-${key}`}>{label}</Label>
                <Switch id={`perm-${key}`} checked={!!perms[key as keyof typeof perms]} onCheckedChange={(v) => setPerms({ ...perms, [key]: v })} />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[hsl(var(--primary))]" disabled={!roleId || addMut.isPending}
            onClick={() => roleId && addMut.mutate({ guildId, roleId, permissions: perms })}>
            {addMut.isPending ? "Adding..." : "Add Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditPermsDialog({ open, onClose, role, roleName, onSave, isSaving }: {
  open: boolean; onClose: () => void; role: StaffRole;
  roleName?: { name: string }; onSave: (perms: Record<string, boolean>) => void; isSaving: boolean;
}) {
  const [perms, setPerms] = useState({ view: true, close: true, claim: true, reopen: false, manage: false, blacklist: false, delete: false, ...role.permissions_json });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <DialogHeader><DialogTitle>Edit Permissions — {roleName?.name ?? role.role_id}</DialogTitle></DialogHeader>
        <div className="space-y-2.5">
          {Object.entries(PERM_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="text-sm cursor-pointer" htmlFor={`edit-perm-${key}`}>{label}</Label>
              <Switch id={`edit-perm-${key}`} checked={!!perms[key as keyof typeof perms]} onCheckedChange={(v) => setPerms({ ...perms, [key]: v })} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[hsl(var(--primary))]" disabled={isSaving} onClick={() => onSave(perms)}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
