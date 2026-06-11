import { useState } from "react";
import "../../styles/owner-theme.css";
import type { AuthUser } from "@/_core/hooks/useAuth";
import OwnerHeader from "./OwnerHeader";
import OwnerNav from "./OwnerNav";
import Overview from "./tabs/Overview";
import BotControl from "./tabs/BotControl";
import UserManager from "./tabs/UserManager";
import Analytics from "./tabs/Analytics";
import Broadcast from "./tabs/Broadcast";
import SystemTab from "./tabs/SystemTab";
import StreamMode from "./tabs/StreamMode";

type Tab =
  | "overview"
  | "bot-control"
  | "user-manager"
  | "analytics"
  | "broadcast"
  | "system"
  | "stream-mode";

interface Props {
  user: AuthUser;
}

export default function OwnerDashboard({ user }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [streamMode, setStreamMode] = useState(false);

  return (
    <div className={`owner-theme owner-bg ${streamMode ? "stream-active" : ""}`}>
      <div className="owner-content">
        <OwnerHeader user={user} streamMode={streamMode} />
        <OwnerNav
          activeTab={activeTab}
          setActiveTab={setActiveTab as (t: string) => void}
          streamMode={streamMode}
        />

        <main className="max-w-7xl mx-auto px-4 py-6">
          {activeTab === "overview" && <Overview />}
          {activeTab === "bot-control" && <BotControl />}
          {activeTab === "user-manager" && <UserManager />}
          {activeTab === "analytics" && <Analytics />}
          {activeTab === "broadcast" && <Broadcast />}
          {activeTab === "system" && <SystemTab />}
          {activeTab === "stream-mode" && (
            <StreamMode
              streamMode={streamMode}
              onToggle={() => setStreamMode((v) => !v)}
            />
          )}
        </main>

        {/* Stream mode: bottom ticker */}
        {streamMode && <StreamTicker />}

        {/* Stream mode: corner watermark */}
        {streamMode && (
          <div className="fixed bottom-8 right-6 z-50 pointer-events-none select-none">
            <span
              className="text-xs font-black tracking-widest uppercase opacity-20"
              style={{ color: "#7c3aed" }}
            >
              TIXORA
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const TICKER_EVENTS = [
  "✓ User @ShadowByte joined Tixora",
  "⚡ /ticket command executed in #support",
  "🌐 New server CosmicGaming added the bot",
  "🎫 Ticket #1042 opened in ArcaneHub",
  "✓ User @NeonWolf joined Tixora",
  "🔧 Bot command /panel used by @StormRider",
  "🌐 New server QuantumRP added the bot",
  "⚡ /close command executed in #tickets",
  "✓ User @CipherDawn joined Tixora",
  "🎫 Ticket #1043 resolved — rated ⭐⭐⭐⭐⭐",
  "🌐 New server VoidCraft added the bot",
  "✓ User @NightCore joined Tixora",
];

function StreamTicker() {
  const text = TICKER_EVENTS.join("   •   ");
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 owner-ticker-wrap py-2"
      style={{
        background: "rgba(10,10,15,0.95)",
        borderTop: "1px solid rgba(124,58,237,0.3)",
      }}
    >
      <div className="owner-ticker-inner text-xs font-medium" style={{ color: "#a78bfa" }}>
        {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
      </div>
    </div>
  );
}
