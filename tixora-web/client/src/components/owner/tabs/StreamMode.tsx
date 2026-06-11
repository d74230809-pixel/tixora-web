import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Zap, Eye, EyeOff, Tv2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const STREAM_EVENTS = [
  "✓  User @ShadowByte just joined Tixora",
  "⚡  /ticket executed in #support · CosmicGaming",
  "🌐  New server QuantumRP added the bot",
  "🎫  Ticket #1044 opened · ArcaneHub",
  "✓  User @NeonWolf just joined Tixora",
  "⭐  Ticket #1041 rated 5★ in VoidCraft",
  "🔧  Panel updated · CosmicGaming",
  "✓  User @StormRider just joined Tixora",
  "⚡  /close executed in #tickets · QuantumRP",
  "🌐  New server NightCore added the bot",
];

function EventFeed() {
  const [events, setEvents] = useState<{ id: number; text: string }[]>([]);
  useEffect(() => {
    let id = 0;
    const add = () => {
      const text = STREAM_EVENTS[Math.floor(Math.random() * STREAM_EVENTS.length)];
      setEvents((prev) => [{ id: id++, text }, ...prev].slice(0, 8));
    };
    add();
    const interval = setInterval(add, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2 max-h-64 overflow-hidden">
      <AnimatePresence initial={false}>
        {events.map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: -16, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="text-sm px-3 py-2 rounded-lg font-medium"
            style={{
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.2)",
              color: "#d1d5db",
            }}
          >
            {e.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface Props {
  streamMode: boolean;
  onToggle: () => void;
}

export default function StreamMode({ streamMode, onToggle }: Props) {
  const { data: overview } = trpc.admin.getOverview.useQuery();
  const { data: botStatus } = trpc.admin.getBotStatus.useQuery();

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="owner-card p-6 text-center"
      >
        <div className="mb-4">
          <Tv2
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: streamMode ? "#ef4444" : "#6b7280" }}
          />
          <h2 className="text-lg font-black" style={{ color: "#f5f3ff" }}>
            Stream Mode
          </h2>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            Hides sensitive data and supercharges the visual effects for your live audience.
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-base transition-all hover:scale-105 active:scale-95"
          style={
            streamMode
              ? { background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)", color: "#ef4444" }
              : { background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", boxShadow: "0 0 24px rgba(124,58,237,0.4)" }
          }
        >
          {streamMode ? (
            <>
              <EyeOff className="w-5 h-5" />
              Exit Stream Mode
            </>
          ) : (
            <>
              <Video className="w-5 h-5" />
              🎥 Go Live
            </>
          )}
        </button>
      </motion.div>

      {streamMode && (
        <>
          {/* STREAM MODE ACTIVE banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="owner-live rounded-xl p-4 text-center font-black text-lg tracking-widest uppercase"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(245,158,11,0.2))",
              border: "1px solid rgba(124,58,237,0.5)",
              color: "#f5f3ff",
              letterSpacing: "0.2em",
            }}
          >
            🔴 STREAM MODE ACTIVE
          </motion.div>

          {/* Big stats for stream */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { label: "SERVERS", value: overview?.totalGuilds ?? 0, color: "#7c3aed" },
              { label: "TICKETS", value: overview?.totalTickets ?? 0, color: "#a855f7" },
              { label: "BOT SERVERS", value: botStatus?.guildsCount ?? 0, color: "#f59e0b" },
              { label: "OPEN TICKETS", value: overview?.openTickets ?? 0, color: "#10b981" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="owner-card p-6 text-center"
                style={{ border: `1px solid ${color}40` }}
              >
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color }}>
                  {label}
                </p>
                <p
                  className="text-5xl font-black owner-stat-num"
                  style={{
                    background: `linear-gradient(135deg, ${color}, #ffffff)`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {value.toLocaleString()}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Live event feed */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="owner-card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold" style={{ color: "#f5f3ff" }}>Live Activity Feed</h3>
              <span className="owner-pulse-dot inline-block w-2 h-2 rounded-full bg-red-500 ml-1" />
            </div>
            <EventFeed />
          </motion.div>
        </>
      )}

      {/* What stream mode does */}
      {!streamMode && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="owner-card p-5"
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#f5f3ff" }}>What Goes Live</h3>
          <ul className="space-y-2">
            {[
              "Hides all sensitive IDs, tokens and personal info",
              "Activates extra CSS animations — pulsing cards, vibrant glows",
              "Shows a live event ticker at the bottom of the screen",
              'Displays a "STREAM MODE ACTIVE" banner',
              "Enlarges key stats for maximum viewer impact",
              "Adds a subtle TIXORA watermark in the corner",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#9ca3af" }}>
                <Eye className="w-3.5 h-3.5 shrink-0" style={{ color: "#7c3aed" }} />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
