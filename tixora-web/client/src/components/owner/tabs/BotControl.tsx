import { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import {
  Bot,
  Power,
  RotateCcw,
  AlertTriangle,
  MessageSquare,
  Server,
  CheckCircle,
  XCircle,
  Info,
  X,
} from "lucide-react";
import { toast } from "sonner";

const FAKE_LOGS = [
  { level: "INFO",  time: "12:04:51", msg: "Guild event: member joined CosmicGaming" },
  { level: "INFO",  time: "12:04:43", msg: "/ticket executed by @StormRider in ArcaneHub" },
  { level: "WARN",  time: "12:03:28", msg: "Rate limit hit on channel 1184... retrying in 2s" },
  { level: "INFO",  time: "12:03:11", msg: "Panel updated: Support Panel in QuantumRP" },
  { level: "INFO",  time: "12:02:55", msg: "/close executed by @CipherDawn — ticket resolved" },
  { level: "ERROR", time: "12:01:44", msg: "Failed to fetch guild 1042... permission denied" },
  { level: "INFO",  time: "12:01:22", msg: "Heartbeat acknowledged — latency 72ms" },
  { level: "INFO",  time: "12:00:58", msg: "Category 'Tech Support' created in VoidCraft" },
  { level: "WARN",  time: "12:00:30", msg: "Missing VIEW_CHANNEL permission in #logs (1091…)" },
  { level: "INFO",  time: "11:59:47", msg: "Bot ready — 847 guilds, 14 shards" },
];

const LEVEL_COLOR: Record<string, string> = {
  INFO:  "#3b82f6",
  WARN:  "#f59e0b",
  ERROR: "#ef4444",
};

function ConfirmModal({ title, body, onConfirm, onCancel }: {
  title: string;
  body: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="owner-card p-6 max-w-sm w-full mx-4"
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-yellow-400" />
          <div>
            <h3 className="font-bold text-sm" style={{ color: "#f5f3ff" }}>{title}</h3>
            <p className="text-xs mt-1" style={{ color: "#6b7280" }}>{body}</p>
          </div>
          <button type="button" onClick={onCancel} className="ml-auto text-gray-600 hover:text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded-lg font-medium"
            style={{ background: "#1a1a2e", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs rounded-lg font-bold text-white"
            style={{ background: "#ef4444" }}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function BotControl() {
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [activity, setActivity] = useState("Watching over your tickets");
  const [activitySaved, setActivitySaved] = useState(false);

  const { data: botStatus, isLoading } = trpc.admin.getBotStatus.useQuery(undefined, {
    refetchInterval: 15_000,
  });
  const { data: guildData, isLoading: guildsLoading } = trpc.admin.getGuilds.useQuery({ limit: 50 });

  const handleRestartConfirm = () => {
    setShowRestartModal(false);
    // TODO: wire to /api/bot/restart
    toast.info("Restart signal sent to bot. Check logs in ~10s.");
  };

  const handleSaveActivity = () => {
    // TODO: wire to bot API to update activity
    setActivitySaved(true);
    toast.success("Activity updated (TODO: wire to bot API)");
    setTimeout(() => setActivitySaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {showRestartModal && (
        <ConfirmModal
          title="Restart the Bot?"
          body="This will briefly disconnect the bot from all servers. It should come back online within 10 seconds."
          onConfirm={handleRestartConfirm}
          onCancel={() => setShowRestartModal(false)}
        />
      )}

      {/* Status + Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bot status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="owner-card p-5"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#6b7280" }}>
            Bot Status
          </h3>
          {isLoading ? (
            <div className="h-16 animate-pulse rounded" style={{ background: "#1a1a2e" }} />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2.5 rounded-xl"
                    style={{ background: botStatus?.online ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)" }}
                  >
                    <Bot className="w-5 h-5" style={{ color: botStatus?.online ? "#10b981" : "#ef4444" }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#f5f3ff" }}>
                      {botStatus?.username ?? "Tixora Bot"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="owner-pulse-dot w-2 h-2 rounded-full inline-block"
                        style={{ background: botStatus?.online ? "#10b981" : "#ef4444" }}
                      />
                      <span
                        className="text-xs font-medium"
                        style={{ color: botStatus?.online ? "#10b981" : "#ef4444" }}
                      >
                        {botStatus?.online ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black" style={{ color: "#f5f3ff" }}>
                    {botStatus?.guildsCount ?? 0}
                  </p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>servers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRestartModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
              >
                <RotateCcw className="w-4 h-4" />
                Restart Bot
              </button>
            </div>
          )}
        </motion.div>

        {/* Change activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="owner-card p-5"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#6b7280" }}>
            Bot Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4" style={{ color: "#a78bfa" }} />
              <span className="text-xs" style={{ color: "#a78bfa" }}>Currently showing:</span>
            </div>
            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1"
              style={{
                background: "#0f0f1a",
                border: "1px solid rgba(124,58,237,0.3)",
                color: "#f5f3ff",
                caretColor: "#a78bfa",
                // @ts-ignore
                "--tw-ring-color": "#7c3aed",
              }}
              placeholder="Watching over your tickets"
            />
            <button
              type="button"
              onClick={handleSaveActivity}
              className="w-full py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
              style={{
                background: activitySaved
                  ? "rgba(16,185,129,0.2)"
                  : "rgba(124,58,237,0.2)",
                border: `1px solid ${activitySaved ? "rgba(16,185,129,0.4)" : "rgba(124,58,237,0.4)"}`,
                color: activitySaved ? "#10b981" : "#a78bfa",
              }}
            >
              {activitySaved ? "✓ Saved" : "Save Activity"}
            </button>
            <p className="text-[10px]" style={{ color: "#4b5563" }}>
              {/* TODO: wire to bot /api/bot/activity */}
              TODO: wire to bot API endpoint
            </p>
          </div>
        </motion.div>
      </div>

      {/* Guild list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="owner-card overflow-hidden"
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "#f5f3ff" }}>
            Servers with Bot
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>
            {guildData?.total ?? 0} total
          </span>
        </div>
        <div className="divide-y" style={{ "--tw-divide-opacity": 1, borderColor: "rgba(124,58,237,0.1)" } as any}>
          {guildsLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded" style={{ background: "#1a1a2e" }} />
              ))}
            </div>
          ) : (
            (guildData?.guilds ?? []).slice(0, 15).map((g: any) => (
              <div
                key={g.guild_id}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#1a1a2e]/50"
              >
                {g.icon ? (
                  <img
                    src={`https://cdn.discordapp.com/icons/${g.guild_id}/${g.icon}.png`}
                    alt={g.name}
                    className="w-8 h-8 rounded-lg shrink-0"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
                  >
                    {(g.name as string)?.[0] ?? "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#f5f3ff" }}>
                    {g.name ?? "Unknown"}
                  </p>
                  <p className="text-xs font-mono" style={{ color: "#4b5563" }}>{g.guild_id}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {g.premium && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>
                      PREMIUM
                    </span>
                  )}
                  <span className="text-xs" style={{ color: "#6b7280" }}>
                    {new Date(g.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Logs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="owner-card overflow-hidden"
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "#f5f3ff" }}>Recent Bot Logs</h3>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
            {/* TODO: wire to /api/bot/logs — showing mock data */}
            MOCK DATA
          </span>
        </div>
        <div className="p-4 font-mono text-xs space-y-1.5 max-h-64 overflow-y-auto">
          {FAKE_LOGS.map((log, i) => (
            <div key={i} className="flex items-start gap-2">
              <span style={{ color: "#4b5563" }}>{log.time}</span>
              <span
                className="shrink-0 font-bold w-10"
                style={{ color: LEVEL_COLOR[log.level] ?? "#9ca3af" }}
              >
                {log.level}
              </span>
              <span style={{ color: "#d1d5db" }}>{log.msg}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
