import React from 'react';

type ErrorBoundaryState = { hasError: boolean; error?: any };

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    try {
      // eslint-disable-next-line no-console
      console.error('App crashed with error:', error, info);
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-blue text-platinum flex items-center justify-center p-6">
          <div className="max-w-xl w-full rounded-2xl border border-platinum/20 bg-white/5 backdrop-blur-md p-6 shadow">
            <h1 className="text-2xl font-extrabold tracking-tight">Something went wrong</h1>
            <p className="mt-2 text-platinum/80">The page encountered an unexpected error. You can try reloading.</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-full bg-platinum text-dark-blue font-semibold hover:opacity-90">Reload</button>
            </div>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <pre className="mt-4 text-xs whitespace-pre-wrap text-platinum/60">{String(this.state.error?.stack || this.state.error)}</pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
