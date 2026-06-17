import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class StudioErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Studio extension:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-studio-bg">
          <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mb-4 border border-red-900/30">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Extension Runtime Error</h2>
          <p className="text-studio-text-dim text-sm max-w-md mb-6 font-mono">
            {this.state.error?.message || 'An unexpected error occurred in the extension rendering loop.'}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-4 py-2 bg-studio-accent text-white rounded-lg font-bold text-xs hover:bg-studio-accent/80 transition-all shadow-lg shadow-studio-accent/20"
          >
            <RefreshCw size={14} />
            <span>RELOAD COMPONENT</span>
          </button>
        </div>
      );
    }

    return this.children;
  }
}
