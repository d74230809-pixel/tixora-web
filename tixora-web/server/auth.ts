import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import { parse as parseCookies } from "cookie";
import { ENV } from "./_core/env";
import { COOKIE_NAME } from "../shared/const";

export type SessionUser = {
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  email: string | null;
  accessToken: string;
};

const getKey = () => new TextEncoder().encode(ENV.jwtSecret || "dev-secret");

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getKey());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getKey());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: Request): Promise<SessionUser | null> {
  const cookieHeader = req.headers.cookie ?? "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySession(token);
}
