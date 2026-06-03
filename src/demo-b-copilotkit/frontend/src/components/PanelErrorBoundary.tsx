import React from "react";

interface Props {
  children: React.ReactNode;
  /** Raw args from the tool call — shown in the "View raw data" pane. */
  rawArgs?: unknown;
  /** Label used in the error header, e.g. "Fuel Breakdown". */
  panelLabel?: string;
}

interface State {
  error: Error | null;
  showRaw: boolean;
}

/**
 * Per-panel error boundary.
 * Provides Retry (resets error state) and View raw data (collapses raw JSON)
 * affordances without taking down the whole dashboard.
 */
export class PanelErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, showRaw: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[PanelErrorBoundary]", error, info);
  }

  private retry = () => {
    this.setState({ error: null, showRaw: false });
  };

  private toggleRaw = () => {
    this.setState((s) => ({ showRaw: !s.showRaw }));
  };

  render() {
    const { error, showRaw } = this.state;
    const { children, rawArgs, panelLabel = "Panel" } = this.props;

    if (!error) return children;

    return (
      <div className="flex h-full flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-red-500" aria-hidden="true">
            ⚠
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {panelLabel} failed to render
            </p>
            <p className="mt-0.5 text-xs text-red-600">{error.message}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={this.retry}
            className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Retry
          </button>
          {rawArgs !== undefined && (
            <button
              onClick={this.toggleRaw}
              className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {showRaw ? "Hide raw data" : "View raw data"}
            </button>
          )}
        </div>

        {showRaw && rawArgs !== undefined && (
          <pre className="max-h-48 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
            {JSON.stringify(rawArgs, null, 2)}
          </pre>
        )}
      </div>
    );
  }
}
