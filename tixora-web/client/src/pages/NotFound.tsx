import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="text-center">
        <h1 className="text-6xl font-black mb-4 text-[hsl(var(--muted-foreground))]">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">The page you are looking for does not exist.</p>
        <Link href="/">
          <Button className="bg-[hsl(var(--primary))]">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
