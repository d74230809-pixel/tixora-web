import { z } from "zod";
import { TRPCError, router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { getBotGuilds, getGuildInfo } from "../discord";

export const adminRouter = router({
  getOverview: adminProcedure.query(async () => {
    const db = getDb();
    const [guilds, tickets, openTickets, ratings] = await Promise.all([
      db.from("guilds").select("guild_id", { count: "exact", head: true }),
      db.from("tickets").select("id", { count: "exact", head: true }),
      db.from("tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
      db.from("ticket_ratings").select("rating"),
    ]);
    const ratingData = (ratings.data ?? []) as { rating: number }[];
    const avgRating = ratingData.length > 0 ? ratingData.reduce((s, r) => s + r.rating, 0) / ratingData.length : null;
    return {
      totalGuilds: guilds.count ?? 0,
      totalTickets: tickets.count ?? 0,
      openTickets: openTickets.count ?? 0,
      avgRating,
    };
  }),

  getGuilds: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = getDb();
      const [dbGuilds, botGuilds] = await Promise.all([
        db.from("guilds").select("*", { count: "exact" }).range(input.offset, input.offset + input.limit - 1).order("created_at", { ascending: false }),
        getBotGuilds(),
      ]);
      const botGuildMap = new Map(botGuilds.map((g) => [g.id, g]));
      return {
        guilds: (dbGuilds.data ?? []).map((g: Record<string, any>) => ({
          ...g,
          discordInfo: botGuildMap.get(g.guild_id as string) ?? null,
        })),
        total: dbGuilds.count ?? 0,
      };
    }),

  getGuildDetail: adminProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [dbGuild, discordInfo, ticketStats, panels, categories] = await Promise.all([
        db.from("guilds").select("*").eq("guild_id", input.guildId).single(),
        getGuildInfo(input.guildId),
        db.from("tickets").select("status").eq("guild_id", input.guildId),
        db.from("panels").select("id", { count: "exact", head: true }).eq("guild_id", input.guildId),
        db.from("categories").select("id", { count: "exact", head: true }).eq("guild_id", input.guildId),
      ]);
      const tickets = ticketStats.data ?? [];
      return {
        config: dbGuild.data,
        discord: discordInfo,
        stats: {
          totalTickets: tickets.length,
          openTickets: tickets.filter((t: { status: string }) => t.status === "open").length,
          panels: panels.count ?? 0,
          categories: categories.count ?? 0,
        },
      };
    }),

  getChangelogs: adminProcedure.query(async () => {
    const db = getDb();
    const { data } = await db.from("changelogs").select("*").order("published_at", { ascending: false }).limit(20);
    return data ?? [];
  }),

  createChangelog: adminProcedure
    .input(z.object({
      version: z.string(),
      title: z.string(),
      body_md: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { data, error } = await db.from("changelogs").insert({ ...input, published_at: new Date().toISOString() }).select().single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  getRecentTickets: adminProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = getDb();
      const { data } = await db.from("tickets").select("*").order("opened_at", { ascending: false }).limit(input.limit);
      return data ?? [];
    }),

  getBlacklist: adminProcedure.query(async () => {
    const db = getDb();
    const { data } = await db.from("blacklist").select("*").order("created_at", { ascending: false });
    return data ?? [];
  }),

  addToBlacklist: adminProcedure
    .input(z.object({ guildId: z.string(), userId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { data, error } = await db.from("blacklist").insert({
        guild_id: input.guildId,
        user_id: input.userId,
        reason: input.reason,
        created_by: ctx.user.id,
      }).select().single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  removeFromBlacklist: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { error } = await db.from("blacklist").delete().eq("id", input.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  getStats: adminProcedure.query(async () => {
    const db = getDb();
    const [tickets, guilds, ratings] = await Promise.all([
      db.from("tickets").select("opened_at, status"),
      db.from("guilds").select("created_at"),
      db.from("ticket_ratings").select("created_at, rating"),
    ]);

    // Daily ticket grouping
    const ticketStats = (tickets.data ?? []).reduce((acc: any, t: any) => {
      const date = new Date(t.opened_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Daily guild grouping
    const guildStats = (guilds.data ?? []).reduce((acc: any, g: any) => {
      const date = new Date(g.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Average rating over time
    const ratingStats = (ratings.data ?? []).reduce((acc: any, r: any) => {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { sum: 0, count: 0 };
      acc[date].sum += r.rating;
      acc[date].count += 1;
      return acc;
    }, {});

    return {
      dailyTickets: Object.entries(ticketStats).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
      dailyGuilds: Object.entries(guildStats).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
      dailyRatings: Object.entries(ratingStats).map(([date, val]: [string, any]) => ({ date, rating: val.sum / val.count })).sort((a, b) => a.date.localeCompare(b.date)),
      totalTickets: tickets.data?.length ?? 0,
      totalGuilds: guilds.data?.length ?? 0,
      avgRating: (ratings.data ?? []).length > 0 ? (ratings.data ?? []).reduce((s, r) => s + r.rating, 0) / (ratings.data ?? []).length : 0,
    };
  }),
});
