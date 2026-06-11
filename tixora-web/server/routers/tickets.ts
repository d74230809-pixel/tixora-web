import { z } from "zod";
import { TRPCError, router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { getDiscordUserGuilds } from "../discord";

async function assertAccess(accessToken: string, guildId: string) {
  const guilds = await getDiscordUserGuilds(accessToken);
  const g = guilds.find((g) => g.id === guildId);
  if (!g) throw new TRPCError({ code: "FORBIDDEN" });
  const MANAGE = BigInt(0x20);
  if (!g.owner && (BigInt(g.permissions) & MANAGE) !== MANAGE) throw new TRPCError({ code: "FORBIDDEN" });
}

export const ticketsRouter = router({
  list: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      status: z.enum(["open", "closed", "all"]).default("all"),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      let query = db
        .from("tickets")
        .select("*, categories(name)", { count: "exact" })
        .eq("guild_id", input.guildId)
        .order("opened_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status !== "all") query = query.eq("status", input.status);
      const { data, count, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { tickets: data ?? [], total: count ?? 0 };
    }),

  getOne: protectedProcedure
    .input(z.object({ ticketId: z.string(), guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data } = await db
        .from("tickets")
        .select("*, categories(name), ticket_actions(*), ticket_ratings(rating, feedback_text), ai_summaries(summary_text)")
        .eq("id", input.ticketId)
        .eq("guild_id", input.guildId)
        .single();
      return data;
    }),

  getTranscript: protectedProcedure
    .input(z.object({ ticketId: z.string(), guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data } = await db.from("transcripts").select("*").eq("ticket_id", input.ticketId).single();
      return data;
    }),

  getRecentActivity: protectedProcedure
    .input(z.object({ guildId: z.string(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data } = await db
        .from("tickets")
        .select("id, opener_id, status, opened_at, closed_at, categories(name)")
        .eq("guild_id", input.guildId)
        .order("opened_at", { ascending: false })
        .limit(input.limit);
      return data ?? [];
    }),

  getDailyStats: protectedProcedure
    .input(z.object({ guildId: z.string(), days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const since = new Date(Date.now() - input.days * 86400000).toISOString();
      const { data } = await db
        .from("tickets")
        .select("opened_at, closed_at, status")
        .eq("guild_id", input.guildId)
        .gte("opened_at", since)
        .order("opened_at");
      return data ?? [];
    }),
});
