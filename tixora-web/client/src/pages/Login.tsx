import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, getLoginUrl } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [user, loading]);

  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="w-full max-w-sm p-8 border border-[hsl(var(--border))] rounded-2xl bg-[hsl(var(--card))] text-center">
        <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--primary))] flex items-center justify-center mx-auto mb-5">
          <Ticket className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Welcome to Tixora</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
          Sign in with Discord to manage your ticket bot.
        </p>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/30 text-sm text-[hsl(var(--destructive))]">
            {error === "access_denied" ? "Access was denied." :
             error === "auth_failed" ? "Authentication failed. Please try again." :
             "Something went wrong. Please try again."}
          </div>
        )}
        <a href={getLoginUrl()} className="block">
          <Button className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-base py-5">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.022.01.043.025.056a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Login with Discord
          </Button>
        </a>
      </div>
    </div>
  );
}
