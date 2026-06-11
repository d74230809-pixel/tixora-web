import { motion } from "framer-motion";
import type { AuthUser } from "@/_core/hooks/useAuth";
import { getAvatarUrl } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

interface Props {
  user: AuthUser;
  streamMode: boolean;
}

export default function OwnerHeader({ user, streamMode }: Props) {
  const { data: botStatus } = trpc.admin.getBotStatus.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const avatarUrl = getAvatarUrl(user);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0d0620 0%, #13072e 40%, #1a0a0f 100%)",
        borderBottom: "1px solid rgba(124, 58, 237, 0.3)",
      }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #f59e0b 100%)" }}
      />

      {/* Animated shimmer line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: "linear-gradient(90deg, transparent, #7c3aed, #f59e0b, transparent)" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-6">
        {/* Left: Crown + Title */}
        <div className="flex items-center gap-5">
          <div className="text-5xl owner-crown select-none">👑</div>
          <div>
            <h1
              className="text-2xl font-black tracking-tight leading-none mb-1"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #e9d5ff 50%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              TIXORA CONTROL CENTER
            </h1>
            <p className="text-sm font-medium" style={{ color: "#a78bfa" }}>
              Owner Access — Full System Control
            </p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="owner-pulse-dot inline-block w-2 h-2 rounded-full bg-emerald-400"
                />
                <span className="text-xs text-emerald-400 font-medium">System Online</span>
              </div>
              {botStatus?.online ? (
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
                  <span className="text-xs font-medium" style={{ color: "#a78bfa" }}>
                    Bot Online · {botStatus.guildsCount} servers
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs text-red-400 font-medium">Bot Offline</span>
                </div>
              )}
              {streamMode && (
                <span
                  className="owner-live inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ background: "#ef4444" }}
                >
                  🔴 LIVE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Avatar */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p
              className="text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #f59e0b)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {user.globalName ?? user.username}
            </p>
            <p className="text-xs" style={{ color: "#6b7280" }}>Site Owner</p>
          </div>
          <div
            className="owner-avatar-ring w-12 h-12 rounded-full overflow-hidden shrink-0"
          >
            <img
              src={avatarUrl}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
