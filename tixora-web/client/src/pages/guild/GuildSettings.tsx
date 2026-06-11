import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { SearchableSelect } from "@/components/SearchableSelect";

export default function GuildSettings({ guildId }: { guildId: string }) {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.settings.get.useQuery({ guildId });
  const { data: channels } = trpc.guilds.getChannels.useQuery({ guildId });

  const textChannels = (channels ?? []).filter((c: { type: number }) => c.type === 0).map((c: { id: string; name: string }) => ({ value: c.id, label: `#${c.name}` }));

  const updateMut = trpc.settings.update.useMutation({
    onSuccess: () => { utils.settings.get.invalidate(); toast.success("Settings saved"); },
    onError: (e) => toast.error(e.message),
  });

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      log_channel_id: settings?.log_channel_id ?? null,
      transcript_channel_id: settings?.transcript_channel_id ?? null,
      prefix: settings?.prefix ?? "!",
    },
  });

  useEffect(() => {
    if (settings) reset({
      log_channel_id: settings.log_channel_id ?? null,
      transcript_channel_id: settings.transcript_channel_id ?? null,
      prefix: settings.prefix ?? "!",
    });
  }, [settings]);

  function onSubmit(vals: { log_channel_id: string | null; transcript_channel_id: string | null; prefix: string }) {
    updateMut.mutate({ guildId, ...vals });
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-7 w-28 mb-6" />
        <div className="space-y-4 max-w-lg">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader title="Settings" description="Configure global settings for this server." />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        <div className="border border-[hsl(var(--border))] rounded-xl p-5 space-y-4 bg-[hsl(var(--card))]">
          <h3 className="text-sm font-semibold">Channels</h3>
          <div>
            <Label className="text-xs text-[hsl(var(--muted-foreground))]">Log Channel</Label>
            <Controller
              control={control} name="log_channel_id"
              render={({ field }) => (
                <SearchableSelect options={textChannels} value={field.value} onChange={field.onChange} nullable placeholder="Select channel..." className="mt-1" />
              )}
            />
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Ticket events are logged here (open, close, claim, etc.)</p>
          </div>
          <div>
            <Label className="text-xs text-[hsl(var(--muted-foreground))]">Transcript Channel</Label>
            <Controller
              control={control} name="transcript_channel_id"
              render={({ field }) => (
                <SearchableSelect options={textChannels} value={field.value} onChange={field.onChange} nullable placeholder="Select channel..." className="mt-1" />
              )}
            />
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Ticket transcripts are sent here when tickets are closed.</p>
          </div>
        </div>

        <div className="border border-[hsl(var(--border))] rounded-xl p-5 space-y-4 bg-[hsl(var(--card))]">
          <h3 className="text-sm font-semibold">Bot</h3>
          <div>
            <Label className="text-xs text-[hsl(var(--muted-foreground))]">Command Prefix</Label>
            <Input {...register("prefix")} className="mt-1 max-w-24 font-mono" placeholder="!" />
          </div>
        </div>

        <Button type="submit" className="bg-[hsl(var(--primary))]" disabled={updateMut.isPending}>
          {updateMut.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
