import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, XCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class StudioErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console and optionally send to error tracking service
    console.error('Uncaught error in Studio extension:', error, errorInfo);

    // In production, you might want to send this to an error tracking service
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Send error to monitoring service
      // const errorData = {
      //   error: error.message,
      //   stack: error.stack,
      //   componentStack: errorInfo.componentStack,
      //   timestamp: new Date().toISOString()
      // };

      // Example: send to monitoring service
      // fetch('/api/error-log', { method: 'POST', body: JSON.stringify(errorData) })
      //   .catch(() => {}); // Silent fail in production
    }

    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-studio-bg">
          <div className="w-20 h-20 rounded-full bg-red-900/20 flex items-center justify-center mb-4 border border-red-900/30 animate-pulse">
            <XCircle size={40} className="text-red-500" />
          </div>

          <h2 className="text-xl font-bold text-white mb-3">
            Something Went Wrong
          </h2>

          <p className="text-studio-text-dim text-sm max-w-md mb-6">
            {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>

          {/* Error details (visible in development) */}
          {typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="w-full max-w-md mb-6 text-left">
              <summary className="text-xs text-studio-text-dim cursor-pointer hover:text-white mb-2">
                Technical Details (Development Mode)
              </summary>
              <pre className="text-[10px] text-red-400 font-mono overflow-auto max-h-40 bg-black/20 p-3 rounded">
                {this.state.error?.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-studio-accent text-white rounded-lg font-bold text-sm hover:bg-studio-accent/80 transition-all shadow-lg shadow-studio-accent/20"
            >
              <RefreshCw size={16} />
              <span>RELOAD PAGE</span>
            </button>

            {typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-lg font-bold text-sm hover:bg-white/20 transition-all"
              >
                <XCircle size={16} />
                <span>DISMISS</span>
              </button>
            )}
          </div>

          <div className="mt-6 text-xs text-studio-text-dim">
            If the problem persists, please check the server logs or contact support.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error boundary for non-component errors
export class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-studio-bg">
          <div className="w-20 h-20 rounded-full bg-red-900/20 flex items-center justify-center mb-4 border border-red-900/30">
            <XCircle size={40} className="text-red-500" />
          </div>

          <h2 className="text-xl font-bold text-white mb-3">
            Application Error
          </h2>

          <p className="text-studio-text-dim text-sm max-w-md mb-6">
            {this.state.error?.message || 'An unexpected error occurred in the application.'}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 bg-studio-accent text-white rounded-lg font-bold text-sm hover:bg-studio-accent/80 transition-all"
          >
            <RefreshCw size={16} />
            <span>RESTART APPLICATION</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
