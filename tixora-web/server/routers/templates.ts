import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError, router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { getDiscordUserGuilds } from "../discord";

export const templatesRouter = router({
  listPublic: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().default(24),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      let query = db
        .from("ticket_templates")
        .select("*", { count: "exact" })
        .eq("is_public", true)
        .order("uses", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);
      if (input.search) query = query.ilike("name", `%${input.search}%`);
      const { data, count } = await query;
      return { templates: data ?? [], total: count ?? 0 };
    }),

  getPublic: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const { data } = await db.from("ticket_templates").select("*").eq("id", input.id).eq("is_public", true).single();
      return data;
    }),

  getPublicPanels: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().default(24),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      let query = db
        .from("panels")
        .select("id, template_name, template_desc, template_uses, embed_json, buttons_json, guild_id, created_at", { count: "exact" })
        .eq("is_template", true)
        .order("template_uses", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);
      if (input.search) query = query.ilike("template_name", `%${input.search}%`);
      const { data, count } = await query;
      return { panels: data ?? [], total: count ?? 0 };
    }),

  importPanel: protectedProcedure
    .input(z.object({ panelId: z.string(), guildId: z.string(), name: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const guilds = await getDiscordUserGuilds(ctx.user.accessToken);
      const MANAGE = BigInt(0x20);
      const g = guilds.find((g) => g.id === input.guildId);
      if (!g || (!g.owner && (BigInt(g.permissions) & MANAGE) !== MANAGE))
        throw new TRPCError({ code: "FORBIDDEN" });

      const db = getDb();
      const { data: source } = await db.from("panels").select("*").eq("id", input.panelId).eq("is_template", true).single();
      if (!source) throw new TRPCError({ code: "NOT_FOUND" });

      // Increment uses
      await db.from("panels").update({ template_uses: (source.template_uses ?? 0) + 1 }).eq("id", input.panelId);

      const { data: newPanel, error } = await db.from("panels").insert({
        guild_id: input.guildId,
        name: input.name ?? source.template_name ?? "Imported Panel",
        embed_json: source.embed_json,
        buttons_json: source.buttons_json,
        is_template: false,
      }).select().single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return newPanel;
    }),
});
