import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("Uncaught error in component tree:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
          <p className="font-display text-xl text-ink">Something went wrong</p>
          <p className="max-w-sm text-sm text-ink-muted">
            This page hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-primary-hover"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}