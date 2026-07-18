import React, { Component, ErrorInfo, ReactNode, useState, useCallback } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnError?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      resetCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Call error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (import.meta.env?.MODE === 'development' || (typeof window !== 'undefined' && (window as any).__DEV__)) {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    // Auto reset if enabled
    if (this.props.resetOnError) {
      this.scheduleReset();
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Reset state if resetKeys have changed
    if (
      this.props.resetKeys &&
      prevProps.resetKeys &&
      !this.arraysEqual(this.props.resetKeys, prevProps.resetKeys)
    ) {
      this.reset();
    }
  }

  private arraysEqual(a: Array<string | number>, b: Array<string | number>): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }

  private scheduleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.reset();
    }, 5000) as unknown as number; // Cast for compatibility with different environments
  };

  private reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      resetCount: this.state.resetCount + 1
    });

    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-studio-background/50 p-4">
          <div className="max-w-lg w-full bg-white dark:bg-studio-card rounded-lg shadow-lg border border-studio-border p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-studio-text">
                Something went wrong
              </h3>
              
              <p className="mt-2 text-sm text-gray-500 dark:text-studio-muted">
                We're sorry, but something unexpected happened. Our team has been notified and we're working to fix it.
              </p>
              
              {(import.meta.env?.MODE === 'development' || (typeof window !== 'undefined' && (window as any).__DEV__)) && this.state.error && (
                <div className="mt-4 text-left">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-700 dark:text-studio-muted hover:text-gray-900 dark:hover:text-studio-text">
                      Error details (Development)
                    </summary>
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-studio-card rounded text-xs overflow-auto max-h-40">
                      <div className="font-mono text-red-600 dark:text-red-400">
                        <div className="font-bold">Error:</div>
                        <div>{this.state.error.message}</div>
                        <div className="font-bold mt-2">Stack:</div>
                        <div>{this.state.error.stack}</div>
                      </div>
                    </div>
                  </details>
                </div>
              )}
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.reset}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Refresh Page
                </button>
                
                {this.props.resetKeys && (
                  <button
                    onClick={() => this.setState({ resetCount: this.state.resetCount + 1 })}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Reset Components
                  </button>
                )}
              </div>
              
              {this.state.resetCount > 0 && (
                <p className="mt-4 text-xs text-gray-500 dark:text-studio-muted">
                  Reset attempts: {this.state.resetCount}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component to wrap any component with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.ComponentType<P> {
  return function ErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for manual error triggering (useful for testing)
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  const triggerError = useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    setError(errorObj);
    throw errorObj;
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return { error, triggerError, resetError };
}