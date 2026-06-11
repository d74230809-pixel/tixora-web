import { router, publicProcedure } from "./_core/trpc";
import { guildsRouter } from "./routers/guilds";
import { panelsRouter } from "./routers/panels";
import { formsRouter } from "./routers/forms";
import { categoriesRouter } from "./routers/categories";
import { ticketsRouter } from "./routers/tickets";
import { templatesRouter } from "./routers/templates";
import { staffRouter } from "./routers/staff";
import { settingsRouter } from "./routers/settings";
import { adminRouter } from "./routers/admin";
import { internalRouter } from "./routers/internal";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) return null;
      const { accessToken: _at, ...safe } = ctx.user;
      return safe;
    }),
  }),
  guilds: guildsRouter,
  panels: panelsRouter,
  forms: formsRouter,
  categories: categoriesRouter,
  tickets: ticketsRouter,
  templates: templatesRouter,
  staff: staffRouter,
  settings: settingsRouter,
  admin: adminRouter,
  internal: internalRouter,
});
export type AppRouter = typeof appRouter;
