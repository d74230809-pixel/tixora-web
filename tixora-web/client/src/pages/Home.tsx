import { Link } from "wouter";
import { useAuth, getLoginUrl } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Shield, Zap, Globe, BarChart3, MessageSquare, ArrowRight, Star, Bot, ChevronRight } from "lucide-react";

const FEATURES = [
  { icon: Ticket, title: "Smart Ticket Panels", desc: "Create beautiful embeds with custom buttons. Post to any channel in one click from the dashboard." },
  { icon: MessageSquare, title: "Custom Forms", desc: "Collect info before opening a ticket. Up to 5 questions with short or paragraph input — all through Discord modals." },
  { icon: Shield, title: "Staff Role Control", desc: "Assign multiple staff roles with granular permissions. Configure exactly who can close, claim, or manage tickets." },
  { icon: BarChart3, title: "Analytics & Transcripts", desc: "Full ticket transcripts, AI-powered summaries, ratings, and per-server stats in a clean dashboard." },
  { icon: Globe, title: "Template Library", desc: "Browse and import community panels with one click. Share your setups for others to use." },
  { icon: Zap, title: "Blazing Fast", desc: "Built on Discord.js v14 with Supabase. Responses in milliseconds, zero downtime deployments." },
];

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Tixora</span>
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/templates">
              <Button variant="ghost" size="sm">Templates</Button>
            </Link>
            {loading ? null : user ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
                  Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
                  Login with Discord
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] rounded-full px-4 py-1.5 mb-6">
            <Star className="w-3.5 h-3.5 text-yellow-500" />
            Professional Discord Ticket Management
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-br from-[hsl(var(--foreground))] to-[hsl(var(--muted-foreground))] bg-clip-text text-transparent">
            Support Tickets,<br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">Done Right.</span>
          </h1>
          <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-10">
            Tixora gives your Discord server a professional ticket system — beautiful panels, smart forms, staff management, and full analytics. All from one clean dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`https://discord.com/api/oauth2/authorize?permissions=8&scope=bot%20applications.commands`}>
              <Button size="lg" className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-base px-8">
                <Bot className="w-5 h-5 mr-2" /> Add to Discord
              </Button>
            </a>
            {!user && (
              <a href={getLoginUrl()}>
                <Button size="lg" variant="outline" className="text-base px-8">
                  Open Dashboard <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Everything you need</h2>
          <p className="text-center text-[hsl(var(--muted-foreground))] mb-12">Built to compete with — and beat — the big ticket bots.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="border border-[hsl(var(--border))] rounded-xl p-5 bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))]/40 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--accent))] flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[hsl(var(--primary))]" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center border border-[hsl(var(--primary))]/30 rounded-2xl p-10 bg-[hsl(var(--accent))]/20">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">Add Tixora to your server and set it up in minutes.</p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
              Login with Discord <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </section>

      <footer className="border-t border-[hsl(var(--border))] py-8 px-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <p>© 2025 Tixora. All rights reserved.</p>
      </footer>
    </div>
  );
}
