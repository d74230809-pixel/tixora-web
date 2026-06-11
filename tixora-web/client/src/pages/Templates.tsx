import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/SearchableSelect";
import { toast } from "sonner";
import { Search, Globe, Download, Ticket, ChevronLeft } from "lucide-react";

export default function Templates() {
  const [search, setSearch] = useState("");
  const [importPanel, setImportPanel] = useState<Record<string, unknown> | null>(null);

  const { data: results, isLoading } = trpc.templates.getPublicPanels.useQuery({ search, limit: 24 });

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                <ChevronLeft className="w-4 h-4" /> Home
              </button>
            </Link>
            <span className="text-[hsl(var(--border))]">/</span>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[hsl(var(--primary))]" />
              <span className="font-semibold">Templates</span>
            </div>
          </div>
          <Link href="/dashboard">
            <Button size="sm" className="bg-[hsl(var(--primary))]">Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-7">
          <h1 className="text-2xl font-bold mb-1">Panel Templates</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Browse community-shared panels and import them to your server in one click.</p>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            className="pl-9"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : results?.panels?.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="w-10 h-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No templates yet</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Be the first to share a panel template from your dashboard!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results?.panels?.map((t: Record<string, unknown>) => {
              const embed = t.embed_json as Record<string, unknown>;
              const buttons = (t.buttons_json as unknown[]) ?? [];
              return (
                <div key={t.id as string} className="border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))] overflow-hidden hover:border-[hsl(var(--primary))]/40 transition-colors">
                  <div
                    className="h-1.5"
                    style={{ background: embed?.color ? `#${(embed.color as number).toString(16).padStart(6, "0")}` : "#7c3aed" }}
                  />
                  <div className="p-4">
                    <h3 className="font-semibold truncate mb-1">{t.template_name as string}</h3>
                    {t.template_desc && <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 line-clamp-2">{t.template_desc as string}</p>}
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 line-clamp-2">{embed?.description as string}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {buttons.slice(0, 3).map((b, i) => {
                        const btn = b as Record<string, unknown>;
                        return (
                          <span key={i} className="text-xs border border-[hsl(var(--border))] rounded px-1.5 py-0.5 truncate max-w-24">
                            {btn.emoji as string} {btn.label as string}
                          </span>
                        );
                      })}
                      {buttons.length > 3 && <span className="text-xs text-[hsl(var(--muted-foreground))]">+{buttons.length - 3}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {(t.template_uses as number ?? 0).toLocaleString()} imports
                      </span>
                      <Button size="sm" variant="outline" onClick={() => setImportPanel(t)}>
                        <Download className="w-3.5 h-3.5 mr-1" /> Import
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ImportDialog
        open={!!importPanel}
        onClose={() => setImportPanel(null)}
        panel={importPanel}
      />
    </div>
  );
}

function ImportDialog({ open, onClose, panel }: {
  open: boolean; onClose: () => void; panel: Record<string, unknown> | null;
}) {
  const { user } = useAuth();
  const [guildId, setGuildId] = useState<string | null>(null);
  const { data: guilds } = trpc.guilds.getMine.useQuery(undefined, { enabled: !!user });
  const importMut = trpc.templates.importPanel.useMutation({
    onSuccess: () => { toast.success("Panel imported to your server!"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const guildOptions = (guilds ?? []).filter((g) => g.hasBot).map((g) => ({ value: g.id, label: g.name }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <DialogHeader>
          <DialogTitle>Import "{panel?.template_name as string}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!user ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              <a href="/api/auth/discord" className="text-[hsl(var(--primary))] hover:underline">Login with Discord</a> to import templates.
            </p>
          ) : (
            <>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Select a server to import this panel to. A copy will be added to your panels.</p>
              <SearchableSelect
                options={guildOptions}
                value={guildId}
                onChange={setGuildId}
                placeholder="Select server..."
              />
              {guildOptions.length === 0 && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">No servers with Tixora found. <a href="/dashboard" className="text-[hsl(var(--primary))]">Add the bot first.</a></p>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {user && (
            <Button
              className="bg-[hsl(var(--primary))]"
              disabled={!guildId || importMut.isPending}
              onClick={() => panel && guildId && importMut.mutate({ panelId: panel.id as string, guildId })}
            >
              {importMut.isPending ? "Importing..." : "Import Panel"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
