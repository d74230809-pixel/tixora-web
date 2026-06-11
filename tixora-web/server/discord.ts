import { ENV } from "./_core/env";

const DISCORD_API = "https://discord.com/api/v10";

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  discriminator: string;
  avatar: string | null;
  email: string | null;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  position: number;
  parent_id: string | null;
  topic?: string | null;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
  mentionable: boolean;
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    client_id: ENV.discordClientId,
    client_secret: ENV.discordClientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Discord token exchange failed: ${err}`);
  }
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

export async function getDiscordUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to get Discord user");
  return res.json() as Promise<DiscordUser>;
}

export async function getDiscordUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  return res.json() as Promise<DiscordGuild[]>;
}

export async function getBotGuilds(): Promise<DiscordGuild[]> {
  if (!ENV.discordBotToken) return [];
  const res = await fetch(`${DISCORD_API}/users/@me/guilds?limit=200`, {
    headers: { Authorization: `Bot ${ENV.discordBotToken}` },
  });
  if (!res.ok) return [];
  return res.json() as Promise<DiscordGuild[]>;
}

export async function getGuildChannels(guildId: string): Promise<DiscordChannel[]> {
  if (!ENV.discordBotToken) return [];
  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${ENV.discordBotToken}` },
  });
  if (!res.ok) return [];
  return res.json() as Promise<DiscordChannel[]>;
}

export async function getGuildRoles(guildId: string): Promise<DiscordRole[]> {
  if (!ENV.discordBotToken) return [];
  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${ENV.discordBotToken}` },
  });
  if (!res.ok) return [];
  const roles = await res.json() as DiscordRole[];
  return roles.sort((a, b) => b.position - a.position);
}

export async function getGuildInfo(guildId: string): Promise<Record<string, unknown> | null> {
  if (!ENV.discordBotToken) return null;
  const res = await fetch(`${DISCORD_API}/guilds/${guildId}?with_counts=true`, {
    headers: { Authorization: `Bot ${ENV.discordBotToken}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<Record<string, unknown>>;
}

export async function postToChannel(
  channelId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${ENV.discordBotToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to post to channel: ${err}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export async function editMessage(
  channelId: string,
  messageId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages/${messageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bot ${ENV.discordBotToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to edit message: ${err}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export async function deleteMessage(channelId: string, messageId: string): Promise<void> {
  await fetch(`${DISCORD_API}/channels/${channelId}/messages/${messageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bot ${ENV.discordBotToken}` },
  });
}

export function getAvatarUrl(userId: string, avatarHash: string | null): string {
  if (!avatarHash) {
    const defaultIndex = (parseInt(userId) >> 22) % 6;
    return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
  }
  const ext = avatarHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}`;
}

export function getGuildIconUrl(guildId: string, iconHash: string | null): string | null {
  if (!iconHash) return null;
  const ext = iconHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.${ext}`;
}
