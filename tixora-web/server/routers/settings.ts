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

export const settingsRouter = router({
  get: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data } = await db.from("guilds").select("*").eq("guild_id", input.guildId).single();
      return data;
    }),

  update: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      log_channel_id: z.string().nullable().optional(),
      transcript_channel_id: z.string().nullable().optional(),
      prefix: z.string().max(5).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { guildId, ...updates } = input;
      const { data, error } = await db
        .from("guilds")
        .upsert({ guild_id: guildId, ...updates }, { onConflict: "guild_id" })
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  getPriorities: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data } = await db.from("priority_levels").select("*").eq("guild_id", input.guildId).order("sort_order");
      return data ?? [];
    }),

  createPriority: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      name: z.string().min(1).max(50),
      color_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      sort_order: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data, error } = await db.from("priority_levels").insert({
        guild_id: input.guildId,
        name: input.name,
        color_hex: input.color_hex,
        sort_order: input.sort_order,
      }).select().single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  deletePriority: protectedProcedure
    .input(z.object({ id: z.string(), guildId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      await db.from("priority_levels").delete().eq("id", input.id).eq("guild_id", input.guildId);
      return { success: true };
    }),

  getBlacklist: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data } = await db.from("blacklist").select("*").eq("guild_id", input.guildId).order("created_at", { ascending: false });
      return data ?? [];
    }),

  removeBlacklist: protectedProcedure
    .input(z.object({ guildId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      await db.from("blacklist").delete().eq("guild_id", input.guildId).eq("user_id", input.userId);
      return { success: true };
    }),
});
