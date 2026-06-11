import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useAuth, getAvatarUrl } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard, MessageSquarePlus, FileText, Tag,
  Ticket, Users, Settings, ChevronLeft, Bot, Shield,
  Crown, Menu, X,
} from "lucide-react";
import Overview from "./Overview";
import Panels from "./Panels";
import Forms from "./Forms";
import Categories from "./Categories";
import TicketsPage from "./Tickets";
import Staff from "./Staff";
import GuildSettings from "./GuildSettings";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "panels", label: "Panels", icon: MessageSquarePlus },
  { id: "forms", label: "Forms", icon: FileText },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "staff", label: "Staff", icon: Shield },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function GuildLayout() {
  const params = useParams<{ guildId: string; tab?: string }>();
  const { guildId, tab = "overview" } = params;
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  const { data: guildData, isLoading: guildLoading } = trpc.guilds.getOne.useQuery(
    { guildId },
    { enabled: !!user && !!guildId },
  );

  if (authLoading) return <LoadingState />;
  if (!user) return null;

  const guildName = (guildData?.discord as Record<string, unknown>)?.name as string ?? "Server";
  const guildIcon = (guildData?.discord as Record<string, unknown>)?.icon as string | null ?? null;
  const guildIconUrl = guildIcon
    ? `https://cdn.discordapp.com/icons/${guildId}/${guildIcon}.${guildIcon.startsWith("a_") ? "gif" : "png"}`
    : null;

  return (
    <div className="min-h-screen flex bg-[hsl(var(--background))]">
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? "fixed" : "hidden md:flex"
      } w-60 flex-shrink-0 bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] flex flex-col z-40 h-full md:h-auto`}>
        {/* Guild header */}
        <div className="p-4 border-b border-[hsl(var(--sidebar-border))]">
          <Link href="/dashboard">
            <button className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-3 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> All Servers
            </button>
          </Link>
          <div className="flex items-center gap-3">
            {guildLoading ? (
              <>
                <Skeleton className="w-9 h-9 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </>
            ) : (
              <>
                {guildIconUrl ? (
                  <img src={guildIconUrl} alt={guildName} className="w-9 h-9 rounded-full" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-sm font-bold">
                    {guildName[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{guildName}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Dashboard</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = tab === item.id;
            return (
              <Link key={item.id} href={`/dashboard/${guildId}/${item.id}`}>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"
                      : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-2.5">
            <Avatar className="w-7 h-7">
              <AvatarImage src={getAvatarUrl(user)} />
              <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.globalName ?? user.username}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">@{user.username}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto w-full md:w-auto pt-16 md:pt-0">
        {tab === "overview" && <Overview guildId={guildId} userId={user?.id} />}
        {tab === "panels" && <Panels guildId={guildId} />}
        {tab === "forms" && <Forms guildId={guildId} />}
        {tab === "categories" && <Categories guildId={guildId} />}
        {tab === "tickets" && <TicketsPage guildId={guildId} />}
        {tab === "staff" && <Staff guildId={guildId} />}
        {tab === "settings" && <GuildSettings guildId={guildId} />}
      </main>
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
