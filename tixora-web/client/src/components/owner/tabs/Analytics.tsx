import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const chartTooltipStyle = {
  backgroundColor: "#13131f",
  border: "1px solid rgba(124,58,237,0.3)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#f5f3ff",
};

function ChartCard({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="owner-card p-5"
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#f5f3ff" }}>
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

export default function Analytics() {
  const { data: stats, isLoading } = trpc.admin.getStats.useQuery();

  const ticketData = (stats?.dailyTickets ?? []).slice(-30).map((d: any) => ({
    ...d,
    date: (d.date as string).split("-").slice(1).join("/"),
  }));

  const guildData = (stats?.dailyGuilds ?? []).slice(-14).map((d: any) => ({
    ...d,
    date: (d.date as string).split("-").slice(1).join("/"),
  }));

  const ratingData = (stats?.dailyRatings ?? []).slice(-30).map((d: any) => ({
    ...d,
    date: (d.date as string).split("-").slice(1).join("/"),
    rating: typeof d.rating === "number" ? +d.rating.toFixed(2) : 0,
  }));

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="owner-card p-5 h-64 animate-pulse"
            style={{ background: "#13131f" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: "Total Tickets", value: stats?.totalTickets ?? 0, color: "#a855f7" },
          { label: "Total Servers",  value: stats?.totalGuilds ?? 0,   color: "#3b82f6" },
          { label: "Avg Rating",     value: (stats?.avgRating ?? 0).toFixed(2) + " ★", color: "#f59e0b" },
        ].map(({ label, value, color }) => (
          <div key={label} className="owner-card p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#6b7280" }}>
              {label}
            </p>
            <p className="text-2xl font-black" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Daily Tickets (last 30 days)" delay={0.1}>
          <div className="h-56">
            {ticketData.length === 0 ? (
              <p className="text-sm text-center pt-16" style={{ color: "#4b5563" }}>No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ticketData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(124,58,237,0.1)" />
                  <XAxis dataKey="date" fontSize={9} tick={{ fill: "#4b5563" }} axisLine={false} tickLine={false} />
                  <YAxis fontSize={9} tick={{ fill: "#4b5563" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#a855f7" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="New Servers per Day (last 14 days)" delay={0.15}>
          <div className="h-56">
            {guildData.length === 0 ? (
              <p className="text-sm text-center pt-16" style={{ color: "#4b5563" }}>No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={guildData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(124,58,237,0.1)" />
                  <XAxis dataKey="date" fontSize={9} tick={{ fill: "#4b5563" }} axisLine={false} tickLine={false} />
                  <YAxis fontSize={9} tick={{ fill: "#4b5563" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Avg Ticket Rating (daily)" delay={0.2}>
          <div className="h-56">
            {ratingData.length === 0 ? (
              <p className="text-sm text-center pt-16" style={{ color: "#4b5563" }}>No ratings yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(124,58,237,0.1)" />
                  <XAxis dataKey="date" fontSize={9} tick={{ fill: "#4b5563" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} fontSize={9} tick={{ fill: "#4b5563" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#f59e0b" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Ticket Volume vs Server Growth" delay={0.25}>
          <div className="h-56">
            {ticketData.length === 0 && guildData.length === 0 ? (
              <p className="text-sm text-center pt-16" style={{ color: "#4b5563" }}>No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ticketData.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(124,58,237,0.1)" />
                  <XAxis dataKey="date" fontSize={9} tick={{ fill: "#4b5563" }} axisLine={false} tickLine={false} />
                  <YAxis fontSize={9} tick={{ fill: "#4b5563" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line type="monotone" dataKey="count" name="Tickets" stroke="#a855f7" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
