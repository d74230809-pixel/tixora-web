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

export const staffRouter = router({
  list: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data } = await db.from("staff_roles").select("*").eq("guild_id", input.guildId);
      return data ?? [];
    }),

  add: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      roleId: z.string(),
      permissions: z.object({
        view: z.boolean().default(true),
        close: z.boolean().default(true),
        claim: z.boolean().default(true),
        reopen: z.boolean().default(false),
        manage: z.boolean().default(false),
        blacklist: z.boolean().default(false),
        delete: z.boolean().default(false),
      }).default({}),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data, error } = await db
        .from("staff_roles")
        .upsert({
          guild_id: input.guildId,
          role_id: input.roleId,
          permissions_json: input.permissions,
        }, { onConflict: "guild_id,role_id" })
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      guildId: z.string(),
      permissions: z.record(z.boolean()),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data, error } = await db
        .from("staff_roles")
        .update({ permissions_json: input.permissions })
        .eq("id", input.id)
        .eq("guild_id", input.guildId)
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string(), guildId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { error } = await db.from("staff_roles").delete().eq("id", input.id).eq("guild_id", input.guildId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),
});
