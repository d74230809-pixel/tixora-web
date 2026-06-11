import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import {
  Server,
  Ticket,
  Star,
  Bot,
  TrendingUp,
  Clock,
  Users,
  Activity,
} from "lucide-react";

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) { setCount(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);
  return count;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  suffix = "",
  delay = 0,
}: {
  label: string;
  value: number;
  icon: React.FC<{ className?: string }>;
  color: string;
  suffix?: string;
  delay?: number;
}) {
  const display = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="owner-card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
          {label}
        </span>
        <div
          className="p-2 rounded-lg"
          style={{ background: `${color}20` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="owner-stat-num text-3xl font-black" style={{ color: "#f5f3ff" }}>
        {display.toLocaleString()}{suffix}
      </div>
    </motion.div>
  );
}

export default function Overview() {
  const { data: overview, isLoading: overviewLoading } = trpc.admin.getOverview.useQuery();
  const { data: botStatus, isLoading: botLoading } = trpc.admin.getBotStatus.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const { data: guildData } = trpc.admin.getGuilds.useQuery({ limit: 6 });

  const stats = [
    { label: "Total Servers", value: overview?.totalGuilds ?? 0, icon: Server, color: "#3b82f6" },
    { label: "Total Tickets", value: overview?.totalTickets ?? 0, icon: Ticket, color: "#a855f7" },
    { label: "Open Tickets",  value: overview?.openTickets ?? 0,  icon: TrendingUp, color: "#10b981" },
    { label: "Bot Servers",   value: botStatus?.guildsCount ?? 0, icon: Bot, color: "#7c3aed" },
    { label: "Avg Rating",    value: Math.round((overview?.avgRating ?? 0) * 10) / 10, icon: Star, color: "#f59e0b", suffix: " ★" },
    { label: "Uptime",        value: Math.floor((botStatus?.uptimeSeconds ?? 0) / 60), icon: Clock, color: "#06b6d4", suffix: "m" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#6b7280" }}>
          System Stats
        </h2>
        {overviewLoading || botLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="owner-card p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <StatCard key={s.label} {...s} delay={i * 0.08} />
            ))}
          </div>
        )}
      </div>

      {/* Bot status card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="owner-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "#f5f3ff" }}>
            Bot Status
          </h2>
          <div className="flex items-center gap-2">
            <span
              className="owner-pulse-dot w-2.5 h-2.5 rounded-full inline-block"
              style={{ background: botStatus?.online ? "#10b981" : "#ef4444" }}
            />
            <span
              className="text-sm font-bold"
              style={{ color: botStatus?.online ? "#10b981" : "#ef4444" }}
            >
              {botStatus?.online ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        {botStatus?.online && (
          <div className="flex items-center gap-3">
            {botStatus.avatar && (
              <img
                src={`https://cdn.discordapp.com/avatars/${botStatus.id}/${botStatus.avatar}.png`}
                alt="bot"
                className="w-10 h-10 rounded-full"
                style={{ border: "2px solid rgba(124,58,237,0.5)" }}
              />
            )}
            <div>
              <p className="font-semibold text-sm" style={{ color: "#f5f3ff" }}>
                {botStatus.username ?? "Tixora Bot"}
              </p>
              <p className="text-xs" style={{ color: "#6b7280" }}>
                {botStatus.guildsCount} servers · Responding to commands
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Recent servers / "latest signups" */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="owner-card p-5"
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#f5f3ff" }}>
          Latest Servers Added
        </h2>
        <div className="space-y-3">
          {(guildData?.guilds ?? []).slice(0, 6).map((g: any, i: number) => (
            <div key={g.guild_id} className="flex items-center gap-3 py-1">
              {g.icon ? (
                <img
                  src={`https://cdn.discordapp.com/icons/${g.guild_id}/${g.icon}.png`}
                  alt={g.name}
                  className="w-8 h-8 rounded-lg"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
                >
                  {(g.name as string)?.[0] ?? "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "#f5f3ff" }}>
                  {g.name ?? "Unknown"}
                </p>
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  {new Date(g.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Activity className="w-3.5 h-3.5 shrink-0" style={{ color: "#a78bfa" }} />
            </div>
          ))}
          {!guildData && (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 rounded animate-pulse" style={{ background: "#1a1a2e" }} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
