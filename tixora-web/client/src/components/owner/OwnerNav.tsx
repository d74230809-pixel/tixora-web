import {
  LayoutDashboard,
  Bot,
  Users,
  BarChart2,
  Megaphone,
  Server,
  Video,
  Zap,
} from "lucide-react";

type Tab =
  | "overview"
  | "bot-control"
  | "user-manager"
  | "analytics"
  | "broadcast"
  | "system"
  | "stream-mode";

interface Props {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  streamMode: boolean;
}

const TABS: { id: Tab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: "overview",      label: "Overview",     Icon: LayoutDashboard },
  { id: "bot-control",   label: "Bot Control",  Icon: Bot },
  { id: "user-manager",  label: "Users",        Icon: Users },
  { id: "analytics",     label: "Analytics",    Icon: BarChart2 },
  { id: "broadcast",     label: "Broadcast",    Icon: Megaphone },
  { id: "system",        label: "System",       Icon: Server },
  { id: "stream-mode",   label: "Stream Mode",  Icon: Video },
];

export default function OwnerNav({ activeTab, setActiveTab, streamMode }: Props) {
  return (
    <div
      className="sticky top-0 z-20 border-b owner-content"
      style={{
        background: "rgba(10,10,15,0.95)",
        borderColor: "rgba(124,58,237,0.2)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? "owner-tab-active"
                    : "border-transparent text-gray-500 hover:text-gray-300 hover:border-violet-800/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-violet-400" : ""}`} />
                {label}
                {id === "stream-mode" && streamMode && (
                  <span className="owner-live inline-block w-2 h-2 rounded-full bg-red-500 ml-0.5" />
                )}
              </button>
            );
          })}

          {/* Stream mode indicator at far right */}
          {streamMode && (
            <div className="ml-auto pr-2 flex items-center gap-2 shrink-0">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400 tracking-wider uppercase">
                Stream Active
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
