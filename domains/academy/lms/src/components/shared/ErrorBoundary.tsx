import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold font-heading text-slate-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              An unexpected error occurred while rendering this view. Please try
              refreshing the page.
            </p>
            <Button
              onClick={this.handleReset}
              className="gap-2 font-bold rounded-full px-6"
            >
              <RotateCcw className="w-4 h-4" /> Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
