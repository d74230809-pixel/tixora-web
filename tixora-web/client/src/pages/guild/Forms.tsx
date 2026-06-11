import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Plus, Pencil, Trash2, FileText, GripVertical } from "lucide-react";

type Question = {
  id: string; label: string; type: "short" | "paragraph";
  placeholder?: string | null; required: boolean;
};
type Form = { id: string; name: string; questions_json: Question[]; created_at: string };

function nanoid8() { return Math.random().toString(36).slice(2, 10); }

export default function Forms({ guildId }: { guildId: string }) {
  const [editForm, setEditForm] = useState<Form | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const { data: forms, isLoading } = trpc.forms.list.useQuery({ guildId });
  const deleteMut = trpc.forms.delete.useMutation({
    onSuccess: () => { utils.forms.list.invalidate(); toast.success("Form deleted"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Forms"
        description="Create forms that appear as Discord modals when a ticket is opened."
        action={
          <Button className="bg-[hsl(var(--primary))]" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Form
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : forms?.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[hsl(var(--border))] rounded-xl">
          <FileText className="w-10 h-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No forms yet</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Forms collect info from users before their ticket is created.</p>
          <Button className="bg-[hsl(var(--primary))]" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" /> Create Form</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {forms?.map((f: Form) => (
            <div key={f.id} className="border border-[hsl(var(--border))] rounded-xl p-4 bg-[hsl(var(--card))]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{f.name}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {f.questions_json?.map((q: Question) => (
                      <Badge key={q.id} variant="secondary" className="text-xs">
                        {q.label} {q.required && <span className="text-[hsl(var(--destructive))] ml-0.5">*</span>}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{f.questions_json?.length ?? 0} question{f.questions_json?.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setEditForm(f)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="outline" className="text-[hsl(var(--destructive))]" onClick={() => setDeleteId(f.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormSheet
        open={showCreate || !!editForm}
        onClose={() => { setShowCreate(false); setEditForm(null); }}
        guildId={guildId}
        form={editForm}
        onSuccess={() => utils.forms.list.invalidate()}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Form"
        description="This form will be deleted. Any panel or category using it will need to be updated."
        confirmLabel="Delete" variant="destructive"
        onConfirm={() => { if (deleteId) deleteMut.mutate({ id: deleteId, guildId }); setDeleteId(null); }}
      />
    </div>
  );
}

function FormSheet({ open, onClose, guildId, form, onSuccess }: {
  open: boolean; onClose: () => void; guildId: string; form: Form | null; onSuccess: () => void;
}) {
  const isEdit = !!form;
  const createMut = trpc.forms.create.useMutation({
    onSuccess: () => { toast.success("Form created"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.forms.update.useMutation({
    onSuccess: () => { toast.success("Form updated"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const { register, control, handleSubmit, watch } = useForm({
    defaultValues: {
      name: form?.name ?? "",
      questions: form?.questions_json ?? [{ id: nanoid8(), label: "", type: "short" as const, placeholder: "", required: false }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "questions" });

  function onSubmit(vals: { name: string; questions: Question[] }) {
    const questions = vals.questions.map((q) => ({ ...q, id: q.id || nanoid8() }));
    if (isEdit && form) updateMut.mutate({ id: form.id, guildId, name: vals.name, questions });
    else createMut.mutate({ guildId, name: vals.name, questions });
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full max-w-lg overflow-y-auto bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <SheetHeader><SheetTitle>{isEdit ? "Edit Form" : "New Form"}</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <div>
            <Label className="text-xs text-[hsl(var(--muted-foreground))]">Form Name</Label>
            <Input {...register("name", { required: true })} placeholder="e.g. Bug Report" className="mt-1" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Questions ({fields.length}/5)</p>
              {fields.length < 5 && (
                <Button type="button" size="sm" variant="outline" onClick={() => append({ id: nanoid8(), label: "", type: "short", placeholder: "", required: false })}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              )}
            </div>
            {fields.map((field, idx) => (
              <div key={field.id} className="border border-[hsl(var(--border))]/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Question {idx + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(idx)} className="text-[hsl(var(--destructive))] hover:opacity-80">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-[hsl(var(--muted-foreground))]">Label <span className="text-[hsl(var(--destructive))]">*</span></Label>
                  <Input {...register(`questions.${idx}.label`, { required: true })} placeholder="Describe your issue" className="mt-1 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-[hsl(var(--muted-foreground))]">Type</Label>
                    <select {...register(`questions.${idx}.type`)} className="mt-1 w-full text-sm border border-[hsl(var(--input))] rounded-md px-2 py-1.5 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
                      <option value="short">Short Text</option>
                      <option value="paragraph">Paragraph</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2 pb-0.5">
                    <Label className="text-xs text-[hsl(var(--muted-foreground))]">Required</Label>
                    <input type="checkbox" {...register(`questions.${idx}.required`)} className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-[hsl(var(--muted-foreground))]">Placeholder (optional)</Label>
                  <Input {...register(`questions.${idx}.placeholder`)} placeholder="e.g. Describe the issue in detail..." className="mt-1 text-sm" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-[hsl(var(--primary))]" disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Form"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
