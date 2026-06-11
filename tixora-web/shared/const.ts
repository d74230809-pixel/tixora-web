export const COOKIE_NAME = "tixora_session";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const TIXORA_COLOR = 0x7c3aed;
export const TIXORA_INVITE_URL = `https://discord.com/api/oauth2/authorize?client_id=${typeof process !== "undefined" ? process.env.DISCORD_CLIENT_ID ?? "" : ""}&permissions=8&scope=bot%20applications.commands`;
