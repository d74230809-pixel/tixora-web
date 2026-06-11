import { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Megaphone, MessageSquare, Send, AlertTriangle, Power, X } from "lucide-react";
import { toast } from "sonner";

export default function Broadcast() {
  const [selectedGuildId, setSelectedGuildId] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [message, setMessage] = useState("");
  const [dmUserId, setDmUserId] = useState("");
  const [dmMessage, setDmMessage] = useState("");
  const [maintenanceConfirm, setMaintenanceConfirm] = useState(false);

  const { data: guildData } = trpc.admin.getGuilds.useQuery({ limit: 100 });
  const { data: channels, isLoading: chLoading } = trpc.admin.getGuildChannelsForBroadcast.useQuery(
    { guildId: selectedGuildId },
    { enabled: !!selectedGuildId },
  );
  const { data: maintenance, refetch: refetchMaint } = trpc.admin.getMaintenanceMode.useQuery();

  const sendAnn = trpc.admin.sendAnnouncement.useMutation({
    onSuccess: () => {
      toast.success("Announcement sent!");
      setMessage("");
    },
    onError: (e) => toast.error(e.message),
  });

  const setMaint = trpc.admin.setMaintenanceMode.useMutation({
    onSuccess: () => { toast.success("Maintenance mode updated"); refetchMaint(); setMaintenanceConfirm(false); },
  });

  const guilds = (guildData?.guilds ?? []) as any[];

  return (
    <div className="space-y-6">
      {/* Discord Announcement */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="owner-card p-5"
      >
        <div className="flex items-center gap-2 mb-5">
          <Megaphone className="w-4 h-4" style={{ color: "#a78bfa" }} />
          <h3 className="text-sm font-semibold" style={{ color: "#f5f3ff" }}>
            Discord Announcement
          </h3>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#6b7280" }}>
                Server
              </label>
              <select
                value={selectedGuildId}
                onChange={(e) => { setSelectedGuildId(e.target.value); setSelectedChannelId(""); }}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "#0f0f1a", border: "1px solid rgba(124,58,237,0.25)", color: "#f5f3ff" }}
              >
                <option value="">Select server…</option>
                {guilds.map((g) => (
                  <option key={g.guild_id} value={g.guild_id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#6b7280" }}>
                Channel
              </label>
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                disabled={!selectedGuildId || chLoading}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-40"
                style={{ background: "#0f0f1a", border: "1px solid rgba(124,58,237,0.25)", color: "#f5f3ff" }}
              >
                <option value="">
                  {chLoading ? "Loading…" : "Select channel…"}
                </option>
                {(channels ?? []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Write your announcement…"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{ background: "#0f0f1a", border: "1px solid rgba(124,58,237,0.25)", color: "#f5f3ff" }}
          />
          <button
            type="button"
            disabled={!selectedChannelId || !message.trim() || sendAnn.isPending}
            onClick={() =>
              sendAnn.mutate({ channelId: selectedChannelId, message: message.trim() })
            }
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40 hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff" }}
          >
            <Send className="w-3.5 h-3.5" />
            {sendAnn.isPending ? "Sending…" : "Send Announcement"}
          </button>
        </div>
      </motion.div>

      {/* DM Blast */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="owner-card p-5"
      >
        <div className="flex items-center gap-2 mb-5">
          <MessageSquare className="w-4 h-4" style={{ color: "#a78bfa" }} />
          <h3 className="text-sm font-semibold" style={{ color: "#f5f3ff" }}>
            DM a User
          </h3>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            value={dmUserId}
            onChange={(e) => setDmUserId(e.target.value)}
            placeholder="Discord User ID"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "#0f0f1a", border: "1px solid rgba(124,58,237,0.25)", color: "#f5f3ff" }}
          />
          <textarea
            value={dmMessage}
            onChange={(e) => setDmMessage(e.target.value)}
            rows={3}
            placeholder="Message to send…"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{ background: "#0f0f1a", border: "1px solid rgba(124,58,237,0.25)", color: "#f5f3ff" }}
          />
          <button
            type="button"
            disabled={!dmUserId.trim() || !dmMessage.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40 hover:opacity-90"
            style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "#a78bfa" }}
            onClick={() => {
              // TODO: wire to bot API /api/bot/dm
              toast.info("DM endpoint not yet wired to bot API");
            }}
          >
            <Send className="w-3.5 h-3.5" />
            Send DM
          </button>
          <p className="text-[10px]" style={{ color: "#4b5563" }}>
            {/* TODO: wire to bot /api/bot/dm */}
            TODO: wire to bot DM endpoint
          </p>
        </div>
      </motion.div>

      {/* Maintenance Mode */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="owner-card p-5"
        style={{ border: maintenance?.active ? "1px solid rgba(239,68,68,0.4)" : undefined }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4" style={{ color: maintenance?.active ? "#ef4444" : "#6b7280" }} />
            <h3 className="text-sm font-semibold" style={{ color: "#f5f3ff" }}>
              Maintenance Mode
            </h3>
            {maintenance?.active && (
              <span className="owner-live text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                ACTIVE
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!maintenance?.active) setMaintenanceConfirm(true);
              else setMaint.mutate({ active: false, message: "" });
            }}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ background: maintenance?.active ? "#ef4444" : "#374151" }}
          >
            <span
              className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
              style={{ transform: maintenance?.active ? "translateX(24px)" : "translateX(4px)" }}
            />
          </button>
        </div>
        <p className="text-xs" style={{ color: "#6b7280" }}>
          {maintenance?.active
            ? `Maintenance mode is ON — message: "${maintenance.message || "Under maintenance"}"`
            : "When active, all non-owner users are shown a maintenance page."}
        </p>

        {/* Confirm modal */}
        {maintenanceConfirm && (
          <div className="mt-4 p-4 rounded-lg space-y-3" style={{ background: "#0f0f1a", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
              <p className="text-xs font-semibold text-yellow-400">This will lock out all regular users.</p>
              <button type="button" onClick={() => setMaintenanceConfirm(false)} className="ml-auto">
                <X className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Maintenance message (optional)"
              className="w-full px-3 py-1.5 rounded text-xs outline-none"
              style={{ background: "#13131f", border: "1px solid rgba(124,58,237,0.2)", color: "#f5f3ff" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value;
                  setMaint.mutate({ active: true, message: val });
                }
              }}
              id="maint-msg"
            />
            <button
              type="button"
              onClick={() => {
                const val = (document.getElementById("maint-msg") as HTMLInputElement)?.value ?? "";
                setMaint.mutate({ active: true, message: val });
              }}
              className="w-full py-1.5 rounded text-xs font-bold text-white"
              style={{ background: "#ef4444" }}
            >
              Enable Maintenance Mode
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
