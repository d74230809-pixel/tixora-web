import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Search, Crown, Ban, Trash2, ChevronRight, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { OWNER_DISCORD_ID } from "@/utils/isOwner";

export default function UserManager() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [banId, setBanId] = useState("");
  const [banReason, setBanReason] = useState("");

  const { data: guildData, isLoading } = trpc.admin.getGuilds.useQuery({ limit: 100 });
  const { data: blacklist, refetch: refetchBl } = trpc.admin.getBlacklist.useQuery();
  const removeBan = trpc.admin.removeFromBlacklist.useMutation({
    onSuccess: () => { toast.success("Removed from blacklist"); refetchBl(); },
  });
  const addBan = trpc.admin.addToBlacklist.useMutation({
    onSuccess: () => { toast.success("Added to blacklist"); refetchBl(); setBanId(""); setBanReason(""); },
    onError: (e) => toast.error(e.message),
  });

  const guilds = (guildData?.guilds ?? []) as any[];
  const filtered = guilds.filter(
    (g) =>
      (g.name as string)?.toLowerCase().includes(search.toLowerCase()) ||
      (g.guild_id as string).includes(search),
  );

  return (
    <div className="space-y-6">
      {/* Guild / Server Manager table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="owner-card overflow-hidden"
      >
        <div
          className="px-5 py-4 flex items-center justify-between gap-4"
          style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}
        >
          <h3 className="text-sm font-semibold shrink-0" style={{ color: "#f5f3ff" }}>
            Registered Servers
          </h3>
          <div className="relative max-w-xs w-full">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              style={{ color: "#6b7280" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID…"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm outline-none"
              style={{
                background: "#0f0f1a",
                border: "1px solid rgba(124,58,237,0.25)",
                color: "#f5f3ff",
              }}
            />
          </div>
        </div>

        {/* Header row */}
        <div
          className="grid grid-cols-12 gap-3 px-5 py-2 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: "#0f0f1a", color: "#4b5563" }}
        >
          <div className="col-span-5">Server</div>
          <div className="col-span-3 text-center">Plan</div>
          <div className="col-span-2 text-center">Added</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded" style={{ background: "#1a1a2e" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm" style={{ color: "#4b5563" }}>No results</p>
          ) : (
            filtered.slice(0, 50).map((g) => (
              <div
                key={g.guild_id}
                className="grid grid-cols-12 gap-3 px-5 py-3 items-center transition-colors cursor-pointer"
                style={{ color: "#f5f3ff" }}
                onClick={() => setSelected(g)}
              >
                <div className="col-span-5 flex items-center gap-3 min-w-0">
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
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{g.name ?? "Unknown"}</p>
                    <p className="text-[10px] font-mono" style={{ color: "#4b5563" }}>{g.guild_id}</p>
                  </div>
                </div>
                <div className="col-span-3 text-center">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={
                      g.premium
                        ? { background: "rgba(245,158,11,0.2)", color: "#f59e0b" }
                        : { background: "rgba(75,85,99,0.3)", color: "#6b7280" }
                    }
                  >
                    {g.premium ? "PREMIUM" : "FREE"}
                  </span>
                </div>
                <div className="col-span-2 text-center text-xs" style={{ color: "#6b7280" }}>
                  {new Date(g.created_at).toLocaleDateString()}
                </div>
                <div className="col-span-2 flex justify-end">
                  <ChevronRight className="w-4 h-4" style={{ color: "#6b7280" }} />
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Blacklist */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="owner-card overflow-hidden"
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}
        >
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#f5f3ff" }}>
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Global Blacklist
          </h3>
          <span className="text-xs" style={{ color: "#6b7280" }}>
            {(blacklist ?? []).length} entries
          </span>
        </div>

        {/* Add ban form */}
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ borderBottom: "1px solid rgba(124,58,237,0.08)", background: "#0f0f1a" }}
        >
          <input
            type="text"
            value={banId}
            onChange={(e) => setBanId(e.target.value)}
            placeholder="Discord User ID"
            className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: "#13131f", border: "1px solid rgba(124,58,237,0.25)", color: "#f5f3ff" }}
          />
          <input
            type="text"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: "#13131f", border: "1px solid rgba(124,58,237,0.25)", color: "#f5f3ff" }}
          />
          <button
            type="button"
            disabled={!banId.trim()}
            onClick={() =>
              addBan.mutate({ guildId: "global", userId: banId.trim(), reason: banReason || undefined })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40"
            style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
          >
            <Ban className="w-3.5 h-3.5" />
            Ban
          </button>
        </div>

        <div className="divide-y max-h-64 overflow-y-auto" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
          {(blacklist ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm" style={{ color: "#4b5563" }}>Blacklist is empty.</p>
          ) : (
            (blacklist ?? []).map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(239,68,68,0.15)" }}
                >
                  <Ban className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-medium" style={{ color: "#f5f3ff" }}>{b.user_id}</p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>{b.reason ?? "No reason"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeBan.mutate({ id: b.id })}
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                  style={{ color: "#6b7280" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Side detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-80 z-50 overflow-y-auto"
            style={{
              background: "#0f0f1a",
              borderLeft: "1px solid rgba(124,58,237,0.3)",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
            }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-sm" style={{ color: "#f5f3ff" }}>Server Detail</h3>
                <button type="button" onClick={() => setSelected(null)}>
                  <X className="w-4 h-4" style={{ color: "#6b7280" }} />
                </button>
              </div>

              <div className="flex flex-col items-center gap-3 py-6 mb-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
                {selected.icon ? (
                  <img
                    src={`https://cdn.discordapp.com/icons/${selected.guild_id}/${selected.icon}.png`}
                    alt={selected.name}
                    className="w-20 h-20 rounded-2xl"
                    style={{ border: "2px solid rgba(124,58,237,0.4)" }}
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black"
                    style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
                  >
                    {(selected.name as string)?.[0] ?? "?"}
                  </div>
                )}
                <div className="text-center">
                  <p className="font-bold" style={{ color: "#f5f3ff" }}>{selected.name}</p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: "#4b5563" }}>{selected.guild_id}</p>
                </div>
                {selected.premium && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>
                    PREMIUM
                  </span>
                )}
              </div>

              <div className="space-y-3 text-sm">
                {[
                  { label: "Added", value: new Date(selected.created_at).toLocaleDateString() },
                  { label: "Guild ID", value: selected.guild_id },
                  { label: "Plan", value: selected.premium ? "Premium" : "Free" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span style={{ color: "#6b7280" }}>{label}</span>
                    <span className="font-mono" style={{ color: "#f5f3ff" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
