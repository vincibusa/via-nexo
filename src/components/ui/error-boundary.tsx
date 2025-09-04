/**
 * ErrorBoundary Component
 * React error boundary with glassmorphism styling
 */

"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import { Glass } from "./glass";
import { Button } from "./button";
import { Alert, AlertDescription } from "./alert";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Glass variant="light" className="mx-auto mt-8 max-w-md rounded-lg p-8">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <h3 className="mb-2 text-lg font-semibold text-neutral-800">
              Something went wrong
            </h3>

            <p className="mb-6 text-sm text-neutral-600">
              We apologize for the inconvenience. Please try refreshing the
              page.
            </p>

            {this.state.error && process.env.NODE_ENV === "development" && (
              <Alert className="mb-4 border-red-200 bg-red-50 text-left">
                <AlertDescription className="font-mono text-xs text-red-700">
                  {this.state.error.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center gap-2">
              <Button onClick={this.handleReset} className="gap-2">
                <RefreshCwIcon className="h-4 w-4" />
                Try Again
              </Button>

              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="bg-white/50"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </Glass>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version for functional components
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}
