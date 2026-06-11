import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, TrendingUp, CheckCircle, Star, MessageSquarePlus, Tag } from "lucide-react";

export default function Overview({ guildId, userId }: { guildId: string; userId?: string }) {
  const { data: stats, isLoading } = trpc.guilds.getStats.useQuery({ guildId });
  const { data: recentTickets } = trpc.tickets.getRecentActivity.useQuery({ guildId, limit: 8 });
  const { data: guildData } = trpc.guilds.getOne.useQuery({ guildId });
  
  const isOwner = userId && String((guildData?.discord as Record<string, unknown>)?.owner_id) === userId;

  const cards = [
    { label: "Total Tickets", value: stats?.totalTickets ?? 0, icon: Ticket, color: "text-violet-400" },
    { label: "Open Tickets", value: stats?.openTickets ?? 0, icon: TrendingUp, color: "text-yellow-400" },
    { label: "Closed Tickets", value: stats?.closedTickets ?? 0, icon: CheckCircle, color: "text-green-400" },
    { label: "Avg Rating", value: stats?.avgRating != null ? stats.avgRating.toFixed(1) + " ★" : "N/A", icon: Star, color: "text-amber-400" },
    { label: "Panels", value: stats?.totalPanels ?? 0, icon: MessageSquarePlus, color: "text-blue-400" },
    { label: "Categories", value: stats?.totalCategories ?? 0, icon: Tag, color: "text-pink-400" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold">Overview</h1>
        {isOwner && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">Owner</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => {
          const isHighlight = isOwner && (c.label === "Open Tickets" || c.label === "Avg Rating");
          return (
            <div
              key={c.label}
              className={`border rounded-xl p-4 transition-all ${
                isHighlight
                  ? "border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-orange-500/5 shadow-lg shadow-amber-500/20"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{c.label}</span>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <p className={`text-2xl font-bold ${isHighlight ? "text-amber-300" : ""}`}>{c.value}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className={`border rounded-xl ${
        isOwner
          ? "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5"
          : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
      }`}>
        <div className={`px-4 py-3 border-b ${
          isOwner ? "border-amber-500/20" : "border-[hsl(var(--border))]"
        }`}>
          <h2 className="font-semibold text-sm">Recent Tickets</h2>
        </div>
        <div className={`divide-y ${
          isOwner ? "divide-amber-500/20" : "divide-[hsl(var(--border))]"
        }`}>
          {recentTickets?.length === 0 && (
            <p className="text-center text-sm text-[hsl(var(--muted-foreground))] py-8">No tickets yet.</p>
          )}
          {recentTickets?.map((t: Record<string, unknown>) => (
            <div key={t.id as string} className="px-4 py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${t.status === "open" ? "bg-green-500" : "bg-[hsl(var(--muted-foreground))]"}`} />
                <span className="text-[hsl(var(--muted-foreground))]">
                  {(t.categories as Record<string, unknown>)?.name as string ?? "General"}
                </span>
                <span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">#{(t.id as string).slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  t.status === "open"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))]"
                }`}>
                  {t.status as string}
                </span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {new Date(t.opened_at as string).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
