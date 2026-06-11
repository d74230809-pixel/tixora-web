import { z } from "zod";
import { TRPCError, router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  getDiscordUserGuilds, getBotGuilds, getGuildChannels,
  getGuildRoles, getGuildInfo, getGuildIconUrl,
} from "../discord";
import { ENV } from "../_core/env";

async function assertGuildAccess(accessToken: string, guildId: string) {
  const userGuilds = await getDiscordUserGuilds(accessToken);
  const MANAGE_GUILD = BigInt(0x20);
  const guild = userGuilds.find((g) => g.id === guildId);
  if (!guild) throw new TRPCError({ code: "FORBIDDEN", message: "No access to this server" });
  const hasPerms = guild.owner || (BigInt(guild.permissions) & MANAGE_GUILD) === MANAGE_GUILD;
  if (!hasPerms) throw new TRPCError({ code: "FORBIDDEN", message: "You need Manage Server permission" });
  return guild;
}

export const guildsRouter = router({
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const [userGuilds, botGuilds] = await Promise.all([
      getDiscordUserGuilds(ctx.user.accessToken),
      getBotGuilds(),
    ]);
    const botGuildIds = new Set(botGuilds.map((g) => g.id));
    const MANAGE_GUILD = BigInt(0x20);
    return userGuilds
      .filter((g) => g.owner || (BigInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD)
      .map((g) => ({
        ...g,
        hasBot: botGuildIds.has(g.id),
        iconUrl: getGuildIconUrl(g.id, g.icon),
      }));
  }),

  getOne: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertGuildAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const [discordInfo, dbResult] = await Promise.all([
        getGuildInfo(input.guildId),
        db.from("guilds").select("*").eq("guild_id", input.guildId).single(),
      ]);
      return { discord: discordInfo, config: dbResult.data };
    }),

  getChannels: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertGuildAccess(ctx.user.accessToken, input.guildId);
      const channels = await getGuildChannels(input.guildId);
      // type 0 = text, 4 = category, 5 = announcement
      return channels
        .filter((c) => [0, 4, 5].includes(c.type))
        .sort((a, b) => a.position - b.position);
    }),

  getRoles: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertGuildAccess(ctx.user.accessToken, input.guildId);
      const roles = await getGuildRoles(input.guildId);
      return roles.filter((r) => r.id !== input.guildId); // exclude @everyone
    }),

  getStats: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertGuildAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const [total, open, closed, ratings, panels, categories] = await Promise.all([
        db.from("tickets").select("id", { count: "exact", head: true }).eq("guild_id", input.guildId),
        db.from("tickets").select("id", { count: "exact", head: true }).eq("guild_id", input.guildId).eq("status", "open"),
        db.from("tickets").select("id", { count: "exact", head: true }).eq("guild_id", input.guildId).eq("status", "closed"),
        db.from("ticket_ratings").select("rating").eq("guild_id", input.guildId),
        db.from("panels").select("id", { count: "exact", head: true }).eq("guild_id", input.guildId),
        db.from("categories").select("id", { count: "exact", head: true }).eq("guild_id", input.guildId),
      ]);
      const ratingVals = (ratings.data ?? []) as { rating: number }[];
      const avgRating = ratingVals.length > 0
        ? ratingVals.reduce((s, r) => s + r.rating, 0) / ratingVals.length
        : null;
      return {
        totalTickets: total.count ?? 0,
        openTickets: open.count ?? 0,
        closedTickets: closed.count ?? 0,
        avgRating,
        totalPanels: panels.count ?? 0,
        totalCategories: categories.count ?? 0,
      };
    }),

  getInviteUrl: protectedProcedure.query(() => {
    return `https://discord.com/api/oauth2/authorize?client_id=${ENV.discordClientId}&permissions=8&scope=bot%20applications.commands`;
  }),
});
