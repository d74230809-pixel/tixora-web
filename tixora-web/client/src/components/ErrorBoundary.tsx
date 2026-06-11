import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-bold mb-2 text-[hsl(var(--destructive))]">Something went wrong</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">{this.state.error?.message}</p>
            <button
              className="text-sm text-[hsl(var(--primary))] hover:underline"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
