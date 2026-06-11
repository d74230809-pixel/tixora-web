import { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import {
  Server,
  Database,
  Cpu,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? "owner-pulse-dot" : ""}`}
      style={{ background: ok ? "#10b981" : "#ef4444" }}
    />
  );
}

function ConfirmModal({ title, body, onConfirm, onCancel }: {
  title: string; body: string; onConfirm: () => void; onCancel: () => void;
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
          <button type="button" onClick={onCancel} className="ml-auto">
            <X className="w-4 h-4 text-gray-600" />
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

export default function SystemTab() {
  const [dangerModal, setDangerModal] = useState<null | "cache" | "redeploy" | "wipe">(null);

  const { data: info, isLoading, refetch } = trpc.admin.getSystemInfo.useQuery(undefined, {
    refetchInterval: 15_000,
  });

  const uptimeStr = (() => {
    const s = info?.uptime ?? 0;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${h}h ${m}m ${sec}s`;
  })();

  const memPct = info
    ? Math.round((info.memUsed / info.memTotal) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {dangerModal && (
        <ConfirmModal
          title={
            dangerModal === "cache" ? "Clear Site Cache?" :
            dangerModal === "redeploy" ? "Trigger Redeploy?" :
            "Wipe Test Data?"
          }
          body={
            dangerModal === "cache" ? "This will clear all server-side caches." :
            dangerModal === "redeploy" ? "This triggers a Railway redeploy webhook. The site will be briefly unavailable." :
            "This permanently deletes all test data. This cannot be undone."
          }
          onConfirm={() => {
            // TODO: wire to Railway/infra API
            toast.info(`${dangerModal} action triggered (TODO: wire to deployment API)`);
            setDangerModal(null);
          }}
          onCancel={() => setDangerModal(null)}
        />
      )}

      {/* Environment + Runtime */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="owner-card p-5"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#6b7280" }}>
            Environment
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-6 animate-pulse rounded" style={{ background: "#1a1a2e" }} />)}
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span style={{ color: "#6b7280" }}>Environment</span>
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold"
                  style={
                    info?.env === "PRODUCTION"
                      ? { background: "rgba(16,185,129,0.2)", color: "#10b981" }
                      : { background: "rgba(245,158,11,0.2)", color: "#f59e0b" }
                  }
                >
                  {info?.env ?? "UNKNOWN"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: "#6b7280" }}>Node.js</span>
                <span className="font-mono text-xs" style={{ color: "#f5f3ff" }}>{info?.nodeVersion ?? "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: "#6b7280" }}>Framework</span>
                <span className="font-mono text-xs" style={{ color: "#f5f3ff" }}>Express 4 + tRPC 11</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: "#6b7280" }}>Uptime</span>
                <span className="font-mono text-xs" style={{ color: "#10b981" }}>{uptimeStr}</span>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="owner-card p-5"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#6b7280" }}>
            Services
          </h3>
          <div className="space-y-3">
            {[
              { label: "Database (Supabase)", ok: info?.dbStatus ?? false },
              { label: "Discord API",         ok: info?.discordStatus ?? false },
              { label: "Bot",                 ok: info?.botStatus ?? false },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span style={{ color: "#9ca3af" }}>{label}</span>
                <div className="flex items-center gap-2">
                  <StatusDot ok={ok} />
                  <span className="text-xs font-medium" style={{ color: ok ? "#10b981" : "#ef4444" }}>
                    {ok ? "Connected" : "Offline"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Memory usage */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="owner-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
            Memory Usage
          </h3>
          <button type="button" onClick={() => refetch()} className="hover:text-violet-400 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" style={{ color: "#6b7280" }} />
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: "#9ca3af" }}>Heap Used</span>
            <span style={{ color: "#f5f3ff" }}>
              {info ? `${info.memUsed.toFixed(1)} MB / ${info.memTotal.toFixed(1)} MB` : "—"}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1a1a2e" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${memPct}%`,
                background:
                  memPct > 80
                    ? "#ef4444"
                    : memPct > 60
                    ? "#f59e0b"
                    : "linear-gradient(90deg, #7c3aed, #a855f7)",
              }}
            />
          </div>
          <p className="text-xs" style={{ color: "#4b5563" }}>
            {memPct}% heap utilization
            {/* TODO: add CPU usage via /api/system/metrics */}
          </p>
        </div>
      </motion.div>

      {/* Env vars (keys only) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="owner-card p-5"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#6b7280" }}>
          Environment Variables
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(info?.envKeys ?? [
            "DISCORD_CLIENT_ID",
            "DISCORD_CLIENT_SECRET",
            "DISCORD_BOT_TOKEN",
            "JWT_SECRET",
            "SUPABASE_URL",
            "SUPABASE_SERVICE_ROLE_KEY",
            "DATABASE_URL",
            "NODE_ENV",
            "PORT",
            "BOT_API_KEY",
          ]).map((key: string) => (
            <div
              key={key}
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: "#0f0f1a", border: "1px solid rgba(124,58,237,0.12)" }}
            >
              <span className="text-xs font-mono" style={{ color: "#a78bfa" }}>{key}</span>
              <span className="text-xs" style={{ color: "#4b5563" }}>••••••</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="owner-card p-5"
        style={{ border: "1px solid rgba(239,68,68,0.35)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-bold text-red-400">Danger Zone</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: "cache" as const, label: "Clear Site Cache", icon: Trash2, desc: "Flush all server-side caches" },
            { id: "redeploy" as const, label: "Trigger Redeploy", icon: RefreshCw, desc: "Railway redeploy webhook" },
            { id: "wipe" as const, label: "Wipe Test Data", icon: Zap, desc: "Delete all test records" },
          ].map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => setDangerModal(id)}
              className="flex flex-col items-start gap-1.5 p-3 rounded-lg text-left transition-all hover:opacity-90"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-bold text-red-400">{label}</span>
              </div>
              <span className="text-[10px]" style={{ color: "#6b7280" }}>{desc}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
