import React, { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
              <p className="text-gray-400 mb-6">The game encountered an error. Please refresh the page.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-cyan-500 text-black font-bold rounded hover:bg-cyan-400 transition"
              >
                Reload Game
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
