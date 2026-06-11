import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { Search, Ticket, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

export default function TicketsPage({ guildId }: { guildId: string }) {
  const [status, setStatus] = useState<"all" | "open" | "closed">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = trpc.tickets.list.useQuery({
    guildId,
    status,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const tickets = data?.tickets ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6">
      <PageHeader
        title="Tickets"
        description={`${total} total ticket${total !== 1 ? "s" : ""}`}
      />

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            className="pl-9"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(0); }}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-[hsl(var(--border))] rounded-xl overflow-hidden bg-[hsl(var(--card))]">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2.5 border-b border-[hsl(var(--border))] text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
          <span>Ticket</span>
          <span>Category</span>
          <span>Status</span>
          <span>Opened</span>
        </div>
        {isLoading ? (
          <div className="divide-y divide-[hsl(var(--border))]">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-14">
            <Ticket className="w-8 h-8 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No tickets found.</p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {tickets.map((t: Record<string, unknown>) => (
              <div key={t.id as string} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 items-center hover:bg-[hsl(var(--accent))]/20 transition-colors text-sm">
                <div>
                  <span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">#{(t.id as string).slice(0, 8)}</span>
                  <span className="ml-2 text-xs text-[hsl(var(--muted-foreground))]">{t.opener_id as string}</span>
                </div>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {(t.categories as Record<string, unknown>)?.name as string ?? "General"}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-xs ${t.status === "open" ? "bg-green-500/10 text-green-400 border-green-500/20" : ""}`}
                >
                  {t.status as string}
                </Badge>
                <span className="text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                  {new Date(t.opened_at as string).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-[hsl(var(--muted-foreground))]">
          <span>Page {page + 1} of {pageCount}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
