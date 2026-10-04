import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel rounded-3xl p-6 border border-red-500/30 bg-red-950/20 text-center my-4">
          <div className="inline-flex p-3 rounded-2xl bg-red-500/10 text-red-400 mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">
            {this.props.fallbackTitle || 'Component Encountered a Problem'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            {this.state.error?.message || 'A transient rendering error occurred in this module.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Module</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
