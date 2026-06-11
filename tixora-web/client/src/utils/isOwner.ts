export const OWNER_DISCORD_ID = "1416209242838401064";

export function isOwner(userId: string | null | undefined): boolean {
  return userId === OWNER_DISCORD_ID;
}
