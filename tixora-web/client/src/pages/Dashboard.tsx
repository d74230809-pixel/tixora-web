import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, getLoginUrl, getAvatarUrl } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ticket, Plus, Settings, ChevronRight, Bot, ExternalLink } from "lucide-react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  const { data: guilds, isLoading } = trpc.guilds.getMine.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: inviteUrl } = trpc.guilds.getInviteUrl.useQuery(undefined, { enabled: !!user });

  if (authLoading) return <LoadingState />;
  if (!user) return null;

  const botGuilds = guilds?.filter((g) => g.hasBot) ?? [];
  const noBot = guilds?.filter((g) => !g.hasBot) ?? [];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Top bar */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Tixora</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/templates">
              <Button variant="ghost" size="sm">Templates</Button>
            </Link>
            <div className="flex items-center gap-2 text-sm">
              <Avatar className="w-7 h-7">
                <AvatarImage src={getAvatarUrl(user)} />
                <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className={`${user.discordId === "1416209242838401064" ? "text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400 font-bold" : "text-[hsl(var(--muted-foreground))]"}`}>{user.globalName ?? user.username}</span>
              {user.discordId === "1416209242838401064" && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-purple-500/50 text-purple-400 bg-purple-500/10 font-black tracking-widest uppercase">GOD</Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Your Servers</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">Select a server to manage its ticket system.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <GuildSkeleton key={i} />)}
          </div>
        ) : (
          <>
            {botGuilds.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
                  Active Servers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {botGuilds.map((g) => (
                    <Link key={g.id} href={`/dashboard/${g.id}`}>
                      <div className={`border rounded-xl p-4 bg-[hsl(var(--card))] transition-all cursor-pointer group ${user.discordId === "1416209242838401064" ? "border-purple-500/30 hover:border-purple-500/60 shadow-[0_0_15px_-5px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_-2px_rgba(168,85,247,0.3)] bg-gradient-to-br from-[hsl(var(--card))] to-purple-500/[0.03]" : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50 hover:bg-[hsl(var(--accent))]/10"}`}>
                        <div className="flex items-center gap-3 mb-3">
                          {g.iconUrl ? (
                            <img src={g.iconUrl} alt={g.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-sm font-bold">
                              {g.name[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{g.name}</p>
                            <Badge variant="secondary" className="text-xs mt-0.5">Bot Active</Badge>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors" />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                          <Settings className="w-3 h-3" />
                          <span>Manage</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {noBot.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
                  Add Bot to Server
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {noBot.map((g) => (
                    <div key={g.id} className="border border-[hsl(var(--border))]/50 rounded-xl p-4 bg-[hsl(var(--card))]/50 opacity-70">
                      <div className="flex items-center gap-3 mb-3">
                        {g.iconUrl ? (
                          <img src={g.iconUrl} alt={g.name} className="w-10 h-10 rounded-full grayscale" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-sm font-bold">
                            {g.name[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-[hsl(var(--muted-foreground))]">{g.name}</p>
                        </div>
                      </div>
                      <a
                        href={inviteUrl ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[hsl(var(--primary))] hover:underline"
                      >
                        <Plus className="w-3 h-3" /> Add Tixora
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {guilds?.length === 0 && (
              <div className="text-center py-16">
                <Bot className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No servers found</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Add Tixora to a server to get started.</p>
                <a href={inviteUrl ?? "#"} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[hsl(var(--primary))]">
                    <Plus className="w-4 h-4 mr-1" /> Add to Server <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </a>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function GuildSkeleton() {
  return (
    <div className="border border-[hsl(var(--border))] rounded-xl p-4 bg-[hsl(var(--card))]">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-28 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
