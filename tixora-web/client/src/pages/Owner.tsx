import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { isOwner } from "@/utils/isOwner";
import OwnerDashboard from "@/components/owner/OwnerDashboard";
import { ShieldAlert } from "lucide-react";

export default function Owner() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0a0a0f" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#7c3aed transparent transparent transparent" }}
          />
          <span className="text-sm font-medium" style={{ color: "#a78bfa" }}>
            Authenticating…
          </span>
        </div>
      </div>
    );
  }

  if (!user || !isOwner(user.discordId)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0a0a0f" }}
      >
        <div className="text-center space-y-3">
          <ShieldAlert className="w-14 h-14 mx-auto" style={{ color: "#ef4444" }} />
          <h1 className="text-xl font-bold text-white">Access Denied</h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            This area is reserved for the site owner only.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-4 py-2 text-sm rounded-lg font-medium text-white transition-opacity hover:opacity-80"
            style={{ background: "#7c3aed" }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <OwnerDashboard user={user} />;
}
