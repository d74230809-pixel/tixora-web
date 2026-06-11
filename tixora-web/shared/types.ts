export type { SessionUser } from "../server/auth";

export type SafeUser = {
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  email: string | null;
};

export type GuildWithBot = {
  id: string;
  name: string;
  icon: string | null;
  iconUrl: string | null;
  owner: boolean;
  permissions: string;
  hasBot: boolean;
};

export type TicketStats = {
  total: number;
  open: number;
  closed: number;
  avgRating: number | null;
};
