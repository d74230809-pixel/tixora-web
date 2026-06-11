import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, getLoginUrl, getAvatarUrl } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ticket, Plus, Settings, ChevronRight, Bot, ExternalLink, Crown, Zap } from "lucide-react";
import { isOwner } from "@/utils/isOwner";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const owner = isOwner(user?.discordId);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  const { data: guilds, isLoading } = trpc.guilds.getMine.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: inviteUrl } = trpc.guilds.getInviteUrl.useQuery(undefined, { enabled: !!user });

  if (authLoading) return <LoadingState owner={owner} />;
  if (!user) return null;

  const botGuilds = guilds?.filter((g) => g.hasBot) ?? [];
  const noBot = guilds?.filter((g) => !g.hasBot) ?? [];

  return (
    <div
      className="min-h-screen"
      style={{ background: owner ? "#0a0a0f" : "hsl(var(--background))" }}
    >
      {/* Owner ambient orbs (background only, no component needed) */}
      {owner && (
        <>
          <div
            className="fixed pointer-events-none"
            style={{
              width: 500,
              height: 500,
              borderRadius: "50%",
              background: "#7c3aed",
              filter: "blur(100px)",
              opacity: 0.07,
              top: -150,
              left: -150,
              animation: "ownerOrb1 20s ease-in-out infinite alternate",
            }}
          />
          <div
            className="fixed pointer-events-none"
            style={{
              width: 350,
              height: 350,
              borderRadius: "50%",
              background: "#f59e0b",
              filter: "blur(100px)",
              opacity: 0.07,
              bottom: -100,
              right: -100,
              animation: "ownerOrb2 15s ease-in-out infinite alternate",
            }}
          />
        </>
      )}

      {/* Top bar */}
      <header
        className="border-b relative z-10"
        style={
          owner
            ? {
                background: "rgba(10,10,15,0.95)",
                borderColor: "rgba(124,58,237,0.3)",
                backdropFilter: "blur(12px)",
              }
            : {
                borderColor: "hsl(var(--border))",
                background: "hsl(var(--card))",
              }
        }
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={
                owner
                  ? { background: "linear-gradient(135deg, #7c3aed, #f59e0b)" }
                  : { background: "hsl(var(--primary))" }
              }
            >
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <span
              className="font-bold"
              style={
                owner
                  ? {
                      background: "linear-gradient(135deg, #a855f7, #f59e0b)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }
                  : {}
              }
            >
              Tixora
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/templates">
              <Button
                variant="ghost"
                size="sm"
                style={owner ? { color: "#a78bfa" } : {}}
              >
                Templates
              </Button>
            </Link>

            {/* God Mode button — owner only */}
            {owner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Link href="/owner">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #f59e0b 100%)",
                      color: "#fff",
                      boxShadow: "0 0 16px rgba(124,58,237,0.45)",
                    }}
                  >
                    <Crown className="w-3 h-3" />
                    God Mode
                  </button>
                </Link>
              </motion.div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Avatar
                className="w-7 h-7"
                style={
                  owner
                    ? { boxShadow: "0 0 0 2px #7c3aed, 0 0 10px 1px rgba(124,58,237,0.4)", borderRadius: "50%" }
                    : {}
                }
              >
                <AvatarImage src={getAvatarUrl(user)} />
                <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span
                className={owner ? "font-bold" : "text-[hsl(var(--muted-foreground))]"}
                style={
                  owner
                    ? {
                        background: "linear-gradient(135deg, #a855f7, #f59e0b)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }
                    : {}
                }
              >
                {user.globalName ?? user.username}
              </span>
              {owner && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 px-1.5 font-black tracking-widest uppercase"
                  style={{
                    borderColor: "rgba(245,158,11,0.5)",
                    color: "#f59e0b",
                    background: "rgba(245,158,11,0.1)",
                  }}
                >
                  👑 GOD
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Owner welcome strip */}
      {owner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 border-b px-4 py-2 text-center text-xs font-medium"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(245,158,11,0.08))",
            borderColor: "rgba(124,58,237,0.2)",
            color: "#a78bfa",
          }}
        >
          <span className="mr-1">👑</span>
          Welcome back, Owner. Your servers are healthy.
          <Link href="/owner">
            <span
              className="ml-2 underline-offset-2 hover:underline font-bold cursor-pointer"
              style={{ color: "#f59e0b" }}
            >
              Open God Mode →
            </span>
          </Link>
        </motion.div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <h1
            className="text-2xl font-bold mb-1"
            style={owner ? { color: "#f5f3ff" } : {}}
          >
            Your Servers
          </h1>
          <p
            className="text-sm"
            style={owner ? { color: "#6b7280" } : { color: "hsl(var(--muted-foreground))" }}
          >
            Select a server to manage its ticket system.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <GuildSkeleton key={i} owner={owner} />)}
          </div>
        ) : (
          <>
            {botGuilds.length > 0 && (
              <div className="mb-8">
                <h2
                  className="text-sm font-semibold uppercase tracking-wider mb-3"
                  style={
                    owner
                      ? { color: "#6b7280" }
                      : { color: "hsl(var(--muted-foreground))" }
                  }
                >
                  Active Servers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {botGuilds.map((g) => (
                    <Link key={g.id} href={`/dashboard/${g.id}`}>
                      <div
                        className="rounded-xl p-4 transition-all cursor-pointer group"
                        style={
                          owner
                            ? {
                                background: "#13131f",
                                border: "1px solid rgba(124,58,237,0.25)",
                                boxShadow: "0 0 0 0 rgba(124,58,237,0)",
                                transition: "all 0.2s",
                              }
                            : {
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                              }
                        }
                        onMouseEnter={(e) => {
                          if (owner) {
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.6)";
                            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px -4px rgba(124,58,237,0.3)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (owner) {
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.25)";
                            (e.currentTarget as HTMLElement).style.boxShadow = "none";
                          }
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {g.iconUrl ? (
                            <img src={g.iconUrl} alt={g.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                              style={
                                owner
                                  ? { background: "rgba(124,58,237,0.2)", color: "#a78bfa" }
                                  : { background: "hsl(var(--muted))" }
                              }
                            >
                              {g.name[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-medium truncate"
                              style={owner ? { color: "#f5f3ff" } : {}}
                            >
                              {g.name}
                            </p>
                            <Badge
                              variant="secondary"
                              className="text-xs mt-0.5"
                              style={
                                owner
                                  ? { background: "rgba(124,58,237,0.2)", color: "#a78bfa", border: "none" }
                                  : {}
                              }
                            >
                              Bot Active
                            </Badge>
                          </div>
                          <ChevronRight
                            className="w-4 h-4 transition-colors"
                            style={owner ? { color: "#6b7280" } : { color: "hsl(var(--muted-foreground))" }}
                          />
                        </div>
                        <div
                          className="flex items-center gap-1 text-xs"
                          style={owner ? { color: "#6b7280" } : { color: "hsl(var(--muted-foreground))" }}
                        >
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
                <h2
                  className="text-sm font-semibold uppercase tracking-wider mb-3"
                  style={
                    owner
                      ? { color: "#6b7280" }
                      : { color: "hsl(var(--muted-foreground))" }
                  }
                >
                  Add Bot to Server
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {noBot.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-xl p-4 opacity-70"
                      style={
                        owner
                          ? { background: "#0f0f1a", border: "1px solid rgba(124,58,237,0.12)" }
                          : { background: "hsl(var(--card))/50", border: "1px solid hsl(var(--border))/50" }
                      }
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {g.iconUrl ? (
                          <img src={g.iconUrl} alt={g.name} className="w-10 h-10 rounded-full grayscale" />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ background: "hsl(var(--muted))" }}
                          >
                            {g.name[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-medium truncate"
                            style={owner ? { color: "#6b7280" } : { color: "hsl(var(--muted-foreground))" }}
                          >
                            {g.name}
                          </p>
                        </div>
                      </div>
                      <a
                        href={inviteUrl ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs hover:underline"
                        style={owner ? { color: "#a78bfa" } : { color: "hsl(var(--primary))" }}
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
                <Bot
                  className="w-12 h-12 mx-auto mb-4"
                  style={owner ? { color: "#6b7280" } : { color: "hsl(var(--muted-foreground))" }}
                />
                <h3 className="font-semibold mb-2" style={owner ? { color: "#f5f3ff" } : {}}>
                  No servers found
                </h3>
                <p
                  className="text-sm mb-4"
                  style={owner ? { color: "#6b7280" } : { color: "hsl(var(--muted-foreground))" }}
                >
                  Add Tixora to a server to get started.
                </p>
                <a href={inviteUrl ?? "#"} target="_blank" rel="noopener noreferrer">
                  <Button
                    style={
                      owner
                        ? { background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", border: "none" }
                        : {}
                    }
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add to Server <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </a>
              </div>
            )}
          </>
        )}
      </main>

      {/* Import owner CSS keyframes for the ambient orbs */}
      {owner && (
        <style>{`
          @keyframes ownerOrb1 { to { transform: translate(120px, 110px); } }
          @keyframes ownerOrb2 { to { transform: translate(-80px, -80px); } }
        `}</style>
      )}
    </div>
  );
}

function GuildSkeleton({ owner }: { owner: boolean }) {
  return (
    <div
      className="rounded-xl p-4"
      style={
        owner
          ? { background: "#13131f", border: "1px solid rgba(124,58,237,0.18)" }
          : { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }
      }
    >
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

function LoadingState({ owner }: { owner: boolean }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: owner ? "#0a0a0f" : "hsl(var(--background))" }}
    >
      <div
        className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={
          owner
            ? { borderColor: "#7c3aed transparent transparent transparent" }
            : { borderColor: "hsl(var(--primary)) transparent transparent transparent" }
        }
      />
    </div>
  );
}
