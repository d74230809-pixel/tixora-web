import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { SearchableSelect } from "@/components/SearchableSelect";
import { MultiSelect } from "@/components/MultiSelect";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Plus, Pencil, Trash2, Tag, Hash, Bell } from "lucide-react";

type Category = {
  id: string; name: string; target_channel_id?: string | null;
  form_id?: string | null; staff_roles_json: string[];
  welcome_message?: string | null; naming_scheme: string;
  max_open_per_user: number; created_at: string;
  ping_roles_json?: string[]; ping_opener?: boolean;
  delete_ping?: boolean;
};

export default function Categories({ guildId }: { guildId: string }) {
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.categories.list.useQuery({ guildId });
  const { data: channels } = trpc.guilds.getChannels.useQuery({ guildId });
  const { data: roles } = trpc.guilds.getRoles.useQuery({ guildId });
  const { data: forms } = trpc.forms.list.useQuery({ guildId });

  const deleteMut = trpc.categories.delete.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); toast.success("Category deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const textChannels = (channels ?? []).filter((c: { type: number }) => c.type === 0).map((c: { id: string; name: string }) => ({ value: c.id, label: `#${c.name}` }));
  const roleOptions = (roles ?? []).map((r: { id: string; name: string; color: number }) => ({
    value: r.id, label: r.name,
    color: r.color ? "#" + r.color.toString(16).padStart(6, "0") : undefined,
  }));
  const formOptions = [
    { value: "__none__", label: "No form" },
    ...(forms ?? []).map((f: { id: string; name: string }) => ({ value: f.id, label: f.name })),
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Ticket Categories"
        description="Define how tickets are handled, who manages them, and what information is collected."
        action={
          <Button onClick={() => setShowCreate(true)} className="bg-[hsl(var(--primary))]">
            <Plus className="w-4 h-4 mr-2" /> New Category
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {(categories ?? []).map((cat: Category) => (
            <div key={cat.id} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5 flex flex-col group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[hsl(var(--primary)/0.1)] rounded-lg text-[hsl(var(--primary))]">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))]">{cat.name}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-0.5">
                      <Hash className="w-3 h-3" /> {cat.target_channel_id ? "Specific Channel" : "Auto-create"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditCat(cat)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(cat.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {cat.staff_roles_json.slice(0, 3).map((rid) => {
                  const r = roles?.find(x => x.id === rid);
                  return (
                    <span key={rid} className="px-2 py-0.5 rounded bg-[hsl(var(--muted))] text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
                      {r?.name ?? rid}
                    </span>
                  );
                })}
                {cat.staff_roles_json.length > 3 && (
                  <span className="px-2 py-0.5 rounded bg-[hsl(var(--muted))] text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
                    +{cat.staff_roles_json.length - 3} more
                  </span>
                )}
              </div>

              <div className="mt-auto pt-4 flex items-center justify-between border-t border-[hsl(var(--border))] mt-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                    <Bell className="w-3 h-3" />
                    {cat.ping_roles_json?.length || cat.ping_opener ? "Pings enabled" : "No pings"}
                  </div>
                </div>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  Max: {cat.max_open_per_user}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategorySheet
        open={showCreate || !!editCat}
        onClose={() => { setShowCreate(false); setEditCat(null); }}
        guildId={guildId}
        category={editCat}
        channelOptions={textChannels}
        roleOptions={roleOptions}
        formOptions={formOptions}
        onSuccess={() => utils.categories.list.invalidate()}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteMut.mutate({ id: deleteId, guildId }); setDeleteId(null); }}
        title="Delete Category"
        description="Are you sure? This will not delete existing tickets, but new ones cannot be opened in this category."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}

function CategorySheet({
  open, onClose, guildId, category,
  channelOptions, roleOptions, formOptions, onSuccess
}: {
  open: boolean; onClose: () => void; guildId: string; category: Category | null;
  channelOptions: any[]; roleOptions: any[]; formOptions: any[]; onSuccess: () => void;
}) {
  const isEdit = !!category;
  const createMut = trpc.categories.create.useMutation({
    onSuccess: () => { toast.success("Category created"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.categories.update.useMutation({
    onSuccess: () => { toast.success("Category updated"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      name: category?.name ?? "",
      target_channel_id: category?.target_channel_id ?? null,
      form_id: category?.form_id ?? null,
      staff_roles_json: category?.staff_roles_json ?? [],
      welcome_message: category?.welcome_message ?? "",
      naming_scheme: category?.naming_scheme ?? "ticket-{username}",
      max_open_per_user: category?.max_open_per_user ?? 1,
      ping_roles_json: category?.ping_roles_json ?? [],
      ping_opener: category?.ping_opener ?? true,
      delete_ping: category?.delete_ping ?? false,
    },
  });

  function onSubmit(vals: any) {
    const payload = {
      guildId,
      name: vals.name,
      target_channel_id: vals.target_channel_id ?? null,
      form_id: vals.form_id === "__none__" ? null : (vals.form_id ?? null),
      staff_roles_json: vals.staff_roles_json,
      welcome_message: vals.welcome_message || null,
      naming_scheme: vals.naming_scheme,
      max_open_per_user: Number(vals.max_open_per_user),
      ping_roles_json: vals.ping_roles_json,
      ping_opener: vals.ping_opener,
      delete_ping: vals.delete_ping,
    };

    if (isEdit && category) updateMut.mutate({ id: category.id, ...payload });
    else createMut.mutate(payload);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full max-w-lg overflow-y-auto bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <SheetHeader><SheetTitle>{isEdit ? "Edit Category" : "New Category"}</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div>
            <Label className="text-xs text-[hsl(var(--muted-foreground))]">Category Name</Label>
            <Input {...register("name", { required: true })} placeholder="e.g. Bug Reports" className="mt-1" />
          </div>

          <div>
            <Label className="text-xs text-[hsl(var(--muted-foreground))]">Target Channel</Label>
            <Controller
              control={control} name="target_channel_id"
              render={({ field }) => (
                <SearchableSelect options={channelOptions} value={field.value} onChange={field.onChange} nullable placeholder="Select text channel..." className="mt-1" />
              )}
            />
          </div>

          <div>
            <Label className="text-xs text-[hsl(var(--muted-foreground))]">Staff Roles</Label>
            <Controller
              control={control} name="staff_roles_json"
              render={({ field }) => (
                <MultiSelect options={roleOptions} value={field.value} onChange={field.onChange} placeholder="Select staff roles..." className="mt-1" />
              )}
            />
          </div>

          <div className="space-y-3 p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
            <Label className="text-xs font-semibold flex items-center gap-2">
              <Bell className="w-3 h-3" /> Pings & Notifications
            </Label>
            
            <div>
              <Label className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Roles to Ping</Label>
              <Controller
                control={control} name="ping_roles_json"
                render={({ field }) => (
                  <MultiSelect options={roleOptions} value={field.value} onChange={field.onChange} placeholder="Select roles to ping..." className="mt-1" />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Ping Opener</Label>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Mention the user who opened the ticket</p>
              </div>
              <Controller
                control={control} name="ping_opener"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Delete Ping</Label>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Automatically remove mentions after 5 seconds</p>
              </div>
              <Controller
                control={control} name="delete_ping"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-[hsl(var(--muted-foreground))]">Form (optional)</Label>
            <Controller
              control={control} name="form_id"
              render={({ field }) => (
                <SearchableSelect options={formOptions} value={field.value ?? "__none__"} onChange={(v) => field.onChange(v === "__none__" ? null : v)} nullable className="mt-1" />
              )}
            />
          </div>

          <div>
            <Label className="text-xs text-[hsl(var(--muted-foreground))]">Welcome Message (optional)</Label>
            <Textarea {...register("welcome_message")} rows={2} className="mt-1 resize-none" placeholder="Welcome to your ticket! Staff will be with you shortly." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[hsl(var(--muted-foreground))]">Naming Scheme</Label>
              <Input {...register("naming_scheme")} placeholder="ticket-{username}" className="mt-1 text-sm font-mono" />
            </div>
            <div>
              <Label className="text-xs text-[hsl(var(--muted-foreground))]">Max Open per User</Label>
              <Input type="number" min={1} max={50} {...register("max_open_per_user")} className="mt-1 text-sm" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-[hsl(var(--primary))]" disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
