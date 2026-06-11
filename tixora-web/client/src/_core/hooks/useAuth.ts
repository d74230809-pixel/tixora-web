import { trpc } from "@/lib/trpc";

export type AuthUser = {
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  email: string | null;
};

export function useAuth() {
  const query = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: query.data as AuthUser | null | undefined,
    loading: query.isPending,
    error: query.error,
    isAuthenticated: !!query.data,
    refetch: query.refetch,
  };
}

export function getLoginUrl() {
  return "/api/auth/discord";
}

export function getAvatarUrl(user: AuthUser | null | undefined): string {
  if (!user) return "https://cdn.discordapp.com/embed/avatars/0.png";
  if (!user.avatar) return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 6}.png`;
  const ext = user.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.${ext}`;
}
