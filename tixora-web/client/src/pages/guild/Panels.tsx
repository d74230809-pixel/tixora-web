import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { SearchableSelect } from "@/components/SearchableSelect";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Plus, Pencil, Trash2, Send, Share2, EyeOff, MessageSquarePlus,
  ExternalLink, Hash, ChevronDown, Smile
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PanelButton = {
  id: string; label: string; emoji?: string; style: number;
  category_id?: string | null; form_id?: string | null;
};
type PanelEmbed = {
  title: string; description: string; color: number;
  footer?: string | null; thumbnail_url?: string | null; image_url?: string | null;
};
type Panel = {
  id: string; name: string; channel_id?: string | null; message_id?: string | null;
  embed_json: PanelEmbed; buttons_json: PanelButton[];
  is_template?: boolean; template_name?: string | null; template_desc?: string | null;
  created_at: string;
};

const BUTTON_STYLES = [
  { value: "1", label: "Blurple" }, { value: "2", label: "Grey" },
  { value: "3", label: "Green" }, { value: "4", label: "Red" },
];

function hexToInt(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}
function intToHex(n: number): string {
  return "#" + n.toString(16).padStart(6, "0");
}
function nanoid8() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Panels({ guildId }: { guildId: string }) {
  const [editPanel, setEditPanel] = useState<Panel | null>(null);
  const [postPanel, setPostPanel] = useState<Panel | null>(null);
  const [sharePanel, setSharePanel] = useState<Panel | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const utils = trpc.useUtils();
  const { data: panels, isLoading } = trpc.panels.list.useQuery({ guildId });
  const { data: channels } = trpc.guilds.getChannels.useQuery({ guildId });
  const { data: categories } = trpc.categories.list.useQuery({ guildId });
  const { data: forms } = trpc.forms.list.useQuery({ guildId });

  const deleteMut = trpc.panels.delete.useMutation({
    onSuccess: () => { utils.panels.list.invalidate(); toast.success("Panel deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const withdrawMut = trpc.panels.withdraw.useMutation({
    onSuccess: () => { utils.panels.list.invalidate(); toast.success("Panel withdrawn from public"); },
    onError: (e) => toast.error(e.message),
  });

  const textChannels = (channels ?? []).filter((c: { type: number }) => c.type === 0).map((c: { id: string; name: string }) => ({
    value: c.id, label: `#${c.name}`,
  }));
  const categoryOptions = [
    { value: "__none__", label: "No category" },
    ...(categories ?? []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })),
  ];
  const formOptions = [
    { value: "__none__", label: "No form" },
    ...(forms ?? []).map((f: { id: string; name: string }) => ({ value: f.id, label: f.name })),
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Panels"
        description="Create ticket panels and post them to Discord channels."
        action={
          <Button className="bg-[hsl(var(--primary))]" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Panel
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : panels?.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[hsl(var(--border))] rounded-xl">
          <MessageSquarePlus className="w-10 h-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No panels yet</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Create your first panel to start accepting tickets.</p>
          <Button className="bg-[hsl(var(--primary))]" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create Panel
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {panels?.map((panel: Panel) => (
            <div key={panel.id} className="border border-[hsl(var(--border))] rounded-xl p-4 bg-[hsl(var(--card))]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: intToHex(panel.embed_json?.color ?? 0x7c3aed) }}
                    />
                    <h3 className="font-semibold truncate">{panel.name}</h3>
                    {panel.is_template && (
                      <Badge variant="secondary" className="text-xs">Public</Badge>
                    )}
                    {panel.channel_id && (
                      <Badge variant="outline" className="text-xs">
                        <Hash className="w-2.5 h-2.5 mr-0.5" /> Posted
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{panel.embed_json?.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {(panel.buttons_json ?? []).map((btn: PanelButton) => (
                      <span key={btn.id} className="text-xs border border-[hsl(var(--border))] rounded px-2 py-0.5">
                        {btn.emoji && <span className="mr-1">{btn.emoji}</span>}{btn.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setPostPanel(panel)}>
                    <Send className="w-3.5 h-3.5 mr-1" /> Post
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditPanel(panel)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {panel.is_template ? (
                    <Button size="sm" variant="outline" onClick={() => setWithdrawId(panel.id)}>
                      <EyeOff className="w-3.5 h-3.5 mr-1" /> Withdraw
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setSharePanel(panel)}>
                      <Share2 className="w-3.5 h-3.5 mr-1" /> Share
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]" onClick={() => setDeleteId(panel.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Sheet */}
      <PanelSheet
        open={showCreate || !!editPanel}
        onClose={() => { setShowCreate(false); setEditPanel(null); }}
        guildId={guildId}
        panel={editPanel}
        categoryOptions={categoryOptions}
        formOptions={formOptions}
        onSuccess={() => utils.panels.list.invalidate()}
      />

      {/* Post to Channel */}
      <PostPanelDialog
        open={!!postPanel}
        onClose={() => setPostPanel(null)}
        guildId={guildId}
        panel={postPanel}
        channelOptions={textChannels}
        onSuccess={() => utils.panels.list.invalidate()}
      />

      {/* Share Dialog */}
      <SharePanelDialog
        open={!!sharePanel}
        onClose={() => setSharePanel(null)}
        guildId={guildId}
        panel={sharePanel}
        onSuccess={() => utils.panels.list.invalidate()}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Panel"
        description="This will permanently delete the panel and remove the Discord message if one was posted. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteId) deleteMut.mutate({ id: deleteId, guildId }); setDeleteId(null); }}
      />

      {/* Withdraw Confirm */}
      <ConfirmDialog
        open={!!withdrawId}
        onOpenChange={(o) => !o && setWithdrawId(null)}
        title="Withdraw from Public"
        description="This panel will no longer appear in the public templates gallery. Servers that already imported it keep their copy."
        confirmLabel="Withdraw"
        onConfirm={() => { if (withdrawId) withdrawMut.mutate({ id: withdrawId, guildId }); setWithdrawId(null); }}
      />
    </div>
  );
}

// ─── Panel Create/Edit Sheet ──────────────────────────────────────────────────

function PanelSheet({ open, onClose, guildId, panel, categoryOptions, formOptions, onSuccess }: {
  open: boolean; onClose: () => void; guildId: string; panel: Panel | null;
  categoryOptions: { value: string; label: string }[];
  formOptions: { value: string; label: string }[];
  onSuccess: () => void;
}) {
  const isEdit = !!panel;
  const createMut = trpc.panels.create.useMutation({
    onSuccess: () => { toast.success("Panel created"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.panels.update.useMutation({
    onSuccess: () => { toast.success("Panel updated"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const defaultBtn = () => ({ id: nanoid8(), label: "Open Ticket", emoji: "🎫", style: 1, category_id: null, form_id: null });

  const form = useForm({
    defaultValues: {
      name: panel?.name ?? "",
      title: panel?.embed_json?.title ?? "Support Ticket",
      description: panel?.embed_json?.description ?? "Click a button below to open a ticket.",
      color: intToHex(panel?.embed_json?.color ?? 0x7c3aed),
      footer: panel?.embed_json?.footer ?? "",
      buttons: (panel?.buttons_json ?? [defaultBtn()]) as PanelButton[],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "buttons" });

  // Reset when panel changes
  useState(() => {
    if (panel) {
      form.reset({
        name: panel.name,
        title: panel.embed_json?.title,
        description: panel.embed_json?.description,
        color: intToHex(panel.embed_json?.color ?? 0x7c3aed),
        footer: panel.embed_json?.footer ?? "",
        buttons: panel.buttons_json,
      });
    }
  });

  function onSubmit(values: {
    name: string; title: string; description: string;
    color: string; footer: string; buttons: PanelButton[];
  }) {
    const payload = {
      guildId,
      name: values.name,
      embed: {
        title: values.title,
        description: values.description,
        color: hexToInt(values.color),
        footer: values.footer || null,
      },
      buttons: values.buttons.map((b) => ({
        ...b,
        category_id: b.category_id === "__none__" ? null : (b.category_id ?? null),
        form_id: b.form_id === "__none__" ? null : (b.form_id ?? null),
      })),
    };
    if (isEdit && panel) updateMut.mutate({ id: panel.id, ...payload });
    else createMut.mutate(payload);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full max-w-xl overflow-y-auto bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <SheetHeader className="mb-4">
          <SheetTitle>{isEdit ? "Edit Panel" : "New Panel"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <Label className="text-xs text-[hsl(var(--muted-foreground))]">Panel Name</Label>
            <Input {...form.register("name", { required: true })} placeholder="e.g. Support Panel" className="mt-1" />
          </div>
          <div className="border border-[hsl(var(--border))] rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Embed</p>
            <div>
              <Label className="text-xs text-[hsl(var(--muted-foreground))]">Title</Label>
              <Input {...form.register("title")} placeholder="Support Ticket" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-[hsl(var(--muted-foreground))]">Description</Label>
              <Textarea {...form.register("description")} rows={3} placeholder="Click a button to open a ticket." className="mt-1 resize-none" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-xs text-[hsl(var(--muted-foreground))]">Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" {...form.register("color")} className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent" />
                  <Input {...form.register("color")} className="flex-1 font-mono text-sm" placeholder="#7C3AED" />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs text-[hsl(var(--muted-foreground))]">Footer (optional)</Label>
              <Input {...form.register("footer")} placeholder="Tixora — Support System" className="mt-1" />
            </div>
          </div>

          {/* Buttons */}
          <div className="border border-[hsl(var(--border))] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Buttons ({fields.length}/5)</p>
              {fields.length < 5 && (
                <Button type="button" size="sm" variant="outline" onClick={() => append(defaultBtn())}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              )}
            </div>
            {fields.map((field, idx) => (
              <div key={field.id} className="border border-[hsl(var(--border))]/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Button {idx + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(idx)} className="text-[hsl(var(--destructive))] hover:opacity-80">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-[hsl(var(--muted-foreground))]">Label</Label>
                    <Input {...form.register(`buttons.${idx}.label`)} placeholder="Open Ticket" className="mt-1 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-[hsl(var(--muted-foreground))]">Emoji</Label>
                    <Input {...form.register(`buttons.${idx}.emoji`)} placeholder="🎫" className="mt-1 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-[hsl(var(--muted-foreground))]">Style</Label>
                  <Controller
                    control={form.control}
                    name={`buttons.${idx}.style`}
                    render={({ field: f }) => (
                      <Select value={String(f.value)} onValueChange={(v) => f.onChange(parseInt(v))}>
                        <SelectTrigger className="mt-1 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUTTON_STYLES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs text-[hsl(var(--muted-foreground))]">Category (optional)</Label>
                  <Controller
                    control={form.control}
                    name={`buttons.${idx}.category_id`}
                    render={({ field: f }) => (
                      <SearchableSelect
                        options={categoryOptions}
                        value={f.value ?? "__none__"}
                        onChange={(v) => f.onChange(v === "__none__" ? null : v)}
                        nullable
                        className="mt-1 text-sm"
                      />
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs text-[hsl(var(--muted-foreground))]">Form (optional)</Label>
                  <Controller
                    control={form.control}
                    name={`buttons.${idx}.form_id`}
                    render={({ field: f }) => (
                      <SearchableSelect
                        options={formOptions}
                        value={f.value ?? "__none__"}
                        onChange={(v) => f.onChange(v === "__none__" ? null : v)}
                        nullable
                        className="mt-1 text-sm"
                      />
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-[hsl(var(--primary))]" disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Panel"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Post Panel Dialog ────────────────────────────────────────────────────────

function PostPanelDialog({ open, onClose, guildId, panel, channelOptions, onSuccess }: {
  open: boolean; onClose: () => void; guildId: string; panel: Panel | null;
  channelOptions: { value: string; label: string }[]; onSuccess: () => void;
}) {
  const [channelId, setChannelId] = useState<string | null>(panel?.channel_id ?? null);
  const postMut = trpc.panels.post.useMutation({
    onSuccess: () => { toast.success("Panel posted to channel!"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <DialogHeader>
          <DialogTitle>Post Panel to Discord</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Select a text channel to send <strong>{panel?.name}</strong> to. If already posted, the existing message will be updated.
          </p>
          <div>
            <Label className="text-xs text-[hsl(var(--muted-foreground))]">Channel</Label>
            <SearchableSelect
              options={channelOptions}
              value={channelId}
              onChange={setChannelId}
              placeholder="Select a text channel..."
              className="mt-1"
            />
          </div>
          {panel?.channel_id && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
              <Hash className="w-3 h-3" /> Currently posted in channel {panel.channel_id}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-[hsl(var(--primary))]"
            disabled={!channelId || postMut.isPending}
            onClick={() => panel && channelId && postMut.mutate({ panelId: panel.id, guildId, channelId })}
          >
            {postMut.isPending ? "Posting..." : <><Send className="w-4 h-4 mr-1.5" /> Post Panel</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Share Panel Dialog ───────────────────────────────────────────────────────

function SharePanelDialog({ open, onClose, guildId, panel, onSuccess }: {
  open: boolean; onClose: () => void; guildId: string; panel: Panel | null; onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [confirm, setConfirm] = useState(false);
  const shareMut = trpc.panels.share.useMutation({
    onSuccess: () => { toast.success("Panel shared to public templates!"); onSuccess(); onClose(); setConfirm(false); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <Dialog open={open && !confirm} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <DialogHeader>
            <DialogTitle>Share Panel to Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
            <p>Sharing this panel makes it visible in the public templates gallery. Anyone can import a copy of it.</p>
            <div>
              <Label className="text-xs">Template Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={panel?.name ?? "My Panel"} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Description (optional)</Label>
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="A brief description of this panel..." rows={2} className="mt-1 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="bg-[hsl(var(--primary))]" disabled={!name.trim()} onClick={() => setConfirm(true)}>
              Next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirm}
        onOpenChange={(o) => !o && setConfirm(false)}
        title="Confirm Share"
        description={`"${name}" will be visible publicly in the Tixora templates gallery. Anyone will be able to view and import it. You can withdraw it at any time.`}
        confirmLabel="Share Publicly"
        onConfirm={() => panel && shareMut.mutate({ id: panel.id, guildId, templateName: name, templateDesc: desc })}
      />
    </>
  );
}
