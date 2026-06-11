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

const QuestionSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(45),
  type: z.enum(["short", "paragraph"]),
  placeholder: z.string().max(100).optional().nullable(),
  required: z.boolean().default(false),
  min_length: z.number().min(0).max(4000).optional().nullable(),
  max_length: z.number().min(1).max(4000).optional().nullable(),
});

export const formsRouter = router({
  list: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data } = await db
        .from("forms")
        .select("*")
        .eq("guild_id", input.guildId)
        .order("created_at", { ascending: false });
      return data ?? [];
    }),

  getOne: protectedProcedure
    .input(z.object({ formId: z.string(), guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data } = await db.from("forms").select("*").eq("id", input.formId).eq("guild_id", input.guildId).single();
      return data;
    }),

  create: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      name: z.string().min(1).max(80),
      questions: z.array(QuestionSchema).min(1).max(5),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data, error } = await db.from("forms").insert({
        guild_id: input.guildId,
        name: input.name,
        questions_json: input.questions,
      }).select().single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      guildId: z.string(),
      name: z.string().min(1).max(80).optional(),
      questions: z.array(QuestionSchema).min(1).max(5).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.questions !== undefined) updates.questions_json = input.questions;
      const { data, error } = await db.from("forms").update(updates).eq("id", input.id).eq("guild_id", input.guildId).select().single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), guildId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { error } = await db.from("forms").delete().eq("id", input.id).eq("guild_id", input.guildId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),
});
