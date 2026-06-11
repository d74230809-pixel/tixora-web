import { TRPCError, initTRPC } from "@trpc/server";
import type { TrpcContext } from "./context";
import superjson from "superjson";
import { ENV } from "./env";

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Please log in" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Please log in" });
  if (ctx.user.discordId !== ENV.ownerDiscordId)
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export { TRPCError };
