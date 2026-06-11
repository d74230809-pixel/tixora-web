import { z } from "zod";
import { TRPCError, router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";

// Internal API key for bot authentication
const BOT_API_KEY = process.env.BOT_API_KEY || "tixora_internal_key_2026";

const botProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const apiKey = ctx.req.headers["x-bot-key"];
  if (apiKey !== BOT_API_KEY) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Bot API Key" });
  }
  return next();
});

export const internalRouter = router({
  query: botProcedure
    .input(z.object({
      table: z.string(),
      action: z.enum(["select", "insert", "update", "delete"]),
      data: z.any().optional(),
      filter: z.record(z.any()).optional(),
      single: z.boolean().default(false),
      order: z.object({ column: z.string(), ascending: z.boolean() }).optional(),
      limit: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      let q = db.from(input.table);

      if (input.action === "select") {
        let select = q.select("*");
        if (input.filter) {
          for (const [k, v] of Object.entries(input.filter)) select = select.eq(k, v);
        }
        if (input.order) select = select.order(input.order.column, { ascending: input.order.ascending });
        if (input.limit) select = select.limit(input.limit);
        const { data, error } = input.single ? await select.single() : await select;
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return data;
      }

      if (input.action === "insert") {
        const { data, error } = await q.insert(input.data).select().single();
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return data;
      }

      if (input.action === "update") {
        let update = q.update(input.data);
        if (input.filter) {
          for (const [k, v] of Object.entries(input.filter)) update = update.eq(k, v);
        }
        const { data, error } = await update.select();
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return data;
      }

      if (input.action === "delete") {
        let del = q.delete();
        if (input.filter) {
          for (const [k, v] of Object.entries(input.filter)) del = del.eq(k, v);
        }
        const { error } = await del;
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return { success: true };
      }
    }),
});
