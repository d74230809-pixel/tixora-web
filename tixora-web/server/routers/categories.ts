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

export const categoriesRouter = router({
  list: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data } = await db.from("categories").select("*").eq("guild_id", input.guildId).order("created_at");
      return data ?? [];
    }),

  create: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      name: z.string().min(1).max(80),
      target_channel_id: z.string().nullable().optional(),
      form_id: z.string().nullable().optional(),
      default_priority_id: z.string().nullable().optional(),
      staff_roles_json: z.array(z.string()).default([]),
      welcome_message: z.string().max(2000).optional().nullable(),
      naming_scheme: z.string().max(50).default("ticket-{username}"),
      max_open_per_user: z.number().min(1).max(50).default(1),
      private_thread: z.boolean().default(false),
      ping_roles_json: z.array(z.string()).default([]),
      ping_opener: z.boolean().default(true),
      delete_ping: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data, error } = await db.from("categories").insert({
        guild_id: input.guildId,
        name: input.name,
        target_channel_id: input.target_channel_id ?? null,
        form_id: input.form_id ?? null,
        default_priority_id: input.default_priority_id ?? null,
        staff_roles_json: input.staff_roles_json,
        welcome_message: input.welcome_message ?? null,
        naming_scheme: input.naming_scheme,
        max_open_per_user: input.max_open_per_user,
        private_thread: input.private_thread,
        ping_roles_json: input.ping_roles_json,
        ping_opener: input.ping_opener,
        delete_ping: input.delete_ping,
      }).select().single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      guildId: z.string(),
      name: z.string().min(1).max(80).optional(),
      target_channel_id: z.string().nullable().optional(),
      form_id: z.string().nullable().optional(),
      default_priority_id: z.string().nullable().optional(),
      staff_roles_json: z.array(z.string()).optional(),
      welcome_message: z.string().max(2000).optional().nullable(),
      naming_scheme: z.string().max(50).optional(),
      max_open_per_user: z.number().min(1).max(50).optional(),
      private_thread: z.boolean().optional(),
      ping_roles_json: z.array(z.string()).optional(),
      ping_opener: z.boolean().optional(),
      delete_ping: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { id, guildId, ...rest } = input;
      const { data, error } = await db.from("categories").update(rest).eq("id", id).eq("guild_id", guildId).select().single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), guildId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { error } = await db.from("categories").delete().eq("id", input.id).eq("guild_id", input.guildId);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),
});
