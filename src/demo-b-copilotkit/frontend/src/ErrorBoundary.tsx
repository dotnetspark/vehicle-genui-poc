import React from "react";

type State = { error: Error | null };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info);
  }

  private retry = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
          <div className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="mb-2 text-lg font-bold text-red-700">App crashed</h1>
            <p className="mb-4 text-sm text-slate-600">{this.state.error.message}</p>
            <button
              onClick={this.retry}
              className="mb-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Retry
            </button>
            <details>
              <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600">
                Stack trace
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
                {this.state.error.stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

