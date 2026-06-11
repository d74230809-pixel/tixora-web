import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, Server, Star, TrendingUp, ShieldAlert, Search, Trash2, Ban, History, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Admin() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading]);

  const { data: overview, isLoading: overviewLoading, error } = trpc.admin.getOverview.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const { data: guildData, isLoading: guildsLoading } = trpc.admin.getGuilds.useQuery({ limit: 50 }, {
    enabled: !!user,
    retry: false,
  });

  const { data: blacklist, refetch: refetchBlacklist } = trpc.admin.getBlacklist.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: stats } = trpc.admin.getStats.useQuery(undefined, {
    enabled: !!user,
  });

  const removeBlacklist = trpc.admin.removeFromBlacklist.useMutation({
    onSuccess: () => {
      toast.success("Removed from blacklist");
      refetchBlacklist();
    }
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]"><div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" /></div>;

  if (user?.discordId !== "1416209242838401064" || error?.data?.code === "UNAUTHORIZED" || error?.data?.code === "FORBIDDEN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-center">
          <ShieldAlert className="w-12 h-12 text-[hsl(var(--destructive))] mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">This page is for Tixora admins only.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Servers", value: overview?.totalGuilds ?? 0, icon: Server, color: "text-blue-500" },
    { label: "Total Tickets", value: overview?.totalTickets ?? 0, icon: Ticket, color: "text-purple-500" },
    { label: "Open Tickets", value: overview?.openTickets ?? 0, icon: TrendingUp, color: "text-green-500" },
    { label: "Avg Rating", value: overview?.avgRating != null ? overview.avgRating.toFixed(1) + " ★" : "N/A", icon: Star, color: "text-yellow-500" },
  ];

  const filteredGuilds = (guildData?.guilds ?? []).filter(g => 
    (g.name as string)?.toLowerCase().includes(search.toLowerCase()) || 
    (g.guild_id as string).includes(search)
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Command Center</h1>
              <p className="text-sm text-muted-foreground">Manage the global Tixora ecosystem</p>
            </div>
          </div>
          <Badge variant="outline" className="px-3 py-1 border-primary/50 text-primary bg-primary/5">Owner Only</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <Card key={s.label} className="border-border/50 shadow-sm overflow-hidden relative">
              <div className={`absolute top-0 left-0 w-1 h-full ${s.color.replace('text', 'bg')}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                {overviewLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{s.value}</div>}
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="servers" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 border border-border/50">
            <TabsTrigger value="servers" className="gap-2"><Server className="w-4 h-4" /> Servers</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2"><Activity className="w-4 h-4" /> Analytics</TabsTrigger>
            <TabsTrigger value="blacklist" className="gap-2"><Ban className="w-4 h-4" /> Blacklist</TabsTrigger>
            <TabsTrigger value="changelogs" className="gap-2"><History className="w-4 h-4" /> Changelogs</TabsTrigger>
          </TabsList>

          <TabsContent value="servers">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">Registered Servers</CardTitle>
                  <p className="text-sm text-muted-foreground">View and manage all servers using Tixora</p>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by ID or Name..." 
                    className="pl-9 bg-muted/30"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-t border-border/50">
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-5">Server</div>
                    <div className="col-span-3 text-center">Status</div>
                    <div className="col-span-2 text-center">Joined At</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                  <div className="divide-y divide-border/50">
                    {guildsLoading ? (
                      [1, 2, 3].map(i => <div key={i} className="px-6 py-4"><Skeleton className="h-10 w-full" /></div>)
                    ) : filteredGuilds.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground">No servers found matching your search.</p>
                      </div>
                    ) : filteredGuilds.map((g: any) => (
                      <div key={g.guild_id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/5 transition-colors">
                        <div className="col-span-5 flex items-center gap-3">
                          {g.icon ? (
                            <img src={`https://cdn.discordapp.com/icons/${g.guild_id}/${g.icon}.png`} className="w-9 h-9 rounded-lg shadow-sm" alt="" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {g.name?.[0] || "?"}
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <p className="font-semibold truncate">{g.name || "Unknown Server"}</p>
                            <p className="text-xs text-muted-foreground font-mono">{g.guild_id}</p>
                          </div>
                        </div>
                        <div className="col-span-3 text-center">
                          <Badge variant={g.premium ? "default" : "secondary"} className={g.premium ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" : ""}>
                            {g.premium ? "Premium" : "Free"}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-center text-sm text-muted-foreground">
                          {new Date(g.created_at).toLocaleDateString()}
                        </div>
                        <div className="col-span-2 text-right">
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                            <TrendingUp className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-base">Ticket Growth (Daily)</CardTitle></CardHeader>
                <CardContent className="h-[300px] border-t border-border/50 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.dailyTickets ?? []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" fontSize={10} tickFormatter={(str) => str.split('-').slice(1).join('/')} />
                      <YAxis fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '12px' }}
                        itemStyle={{ color: 'hsl(var(--primary))' }}
                      />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-base">Server Growth (Daily)</CardTitle></CardHeader>
                <CardContent className="h-[300px] border-t border-border/50 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.dailyGuilds ?? []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" fontSize={10} tickFormatter={(str) => str.split('-').slice(1).join('/')} />
                      <YAxis fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '12px' }}
                        itemStyle={{ color: 'hsl(var(--primary))' }}
                      />
                      <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="blacklist">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">Global Blacklist</CardTitle>
                  <p className="text-sm text-muted-foreground">Users banned from using Tixora across all servers</p>
                </div>
                <Button size="sm" className="gap-2"><Ban className="w-4 h-4" /> Add Entry</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-t border-border/50">
                  <div className="divide-y divide-border/50">
                    {(blacklist ?? []).length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground">Blacklist is currently empty.</p>
                      </div>
                    ) : (blacklist ?? []).map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{b.user_id}</p>
                            <p className="text-xs text-muted-foreground">{b.reason || "No reason provided"}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeBlacklist.mutate({ id: b.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="changelogs">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">Release History</CardTitle>
                  <p className="text-sm text-muted-foreground">Manage public update logs</p>
                </div>
                <Button size="sm" variant="outline">New Changelog</Button>
              </CardHeader>
              <CardContent className="p-0 border-t border-border/50">
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">Changelog management UI placeholder</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
