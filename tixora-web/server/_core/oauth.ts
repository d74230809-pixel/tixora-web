import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { parse as parseCookies } from "cookie";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { exchangeCode, getDiscordUser } from "../discord";
import { createSession } from "../auth";

const DISCORD_SCOPES = ["identify", "email", "guilds"].join(" ");

function getRedirectUri(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.get("host") ?? "localhost";
  return `${proto}://${host}/api/auth/discord/callback`;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/discord", (req: Request, res: Response) => {
    const state = crypto.randomBytes(16).toString("hex");
    res.cookie("oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
      secure: ENV.isProduction,
    });
    const redirectUri = getRedirectUri(req);
    const params = new URLSearchParams({
      client_id: ENV.discordClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: DISCORD_SCOPES,
      state,
    });
    res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
  });

  app.get("/api/auth/discord/callback", async (req: Request, res: Response) => {
    const { code, state, error } = req.query as Record<string, string>;
    if (error) return res.redirect("/?error=access_denied");
    if (!code || !state) return res.redirect("/?error=missing_params");

    const cookies = parseCookies(req.headers.cookie ?? "");
    const savedState = cookies.oauth_state;
    if (!savedState || savedState !== state) return res.redirect("/?error=state_mismatch");
    res.clearCookie("oauth_state");

    try {
      const redirectUri = getRedirectUri(req);
      const tokens = await exchangeCode(code, redirectUri);
      const discordUser = await getDiscordUser(tokens.access_token);

      const sessionToken = await createSession({
        discordId: discordUser.id,
        username: discordUser.username,
        globalName: discordUser.global_name,
        avatar: discordUser.avatar,
        email: discordUser.email,
        accessToken: tokens.access_token,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect("/dashboard");
    } catch (err) {
      console.error("[OAuth] Discord callback error:", err);
      res.redirect("/?error=auth_failed");
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}
