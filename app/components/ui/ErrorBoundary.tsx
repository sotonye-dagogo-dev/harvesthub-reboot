"use client";

import { Component, ReactNode, ErrorInfo } from "react";
import { Result, Button } from "antd";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Catches React errors in child component tree and displays a fallback UI.
 * Follows React 19 error boundary patterns.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example Custom fallback
 * ```tsx
 * <ErrorBoundary fallback={(error, reset) => (
 *   <div>
 *     <h1>Something went wrong!</h1>
 *     <p>{error.message}</p>
 *     <button onClick={reset}>Try again</button>
 *   </div>
 * )}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console (in production, log to error tracking service like Sentry)
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // In production, you would send this to an error tracking service:
    // logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Custom fallback provided by parent
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI using Ant Design Result component
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full">
            <Result
              status="error"
              title="Something Went Wrong"
              subTitle={
                <div className="space-y-2">
                  <p className="text-gray-600 dark:text-gray-400">
                    We encountered an unexpected error. Please try again.
                  </p>
                  {process.env.NODE_ENV === "development" && (
                    <details className="mt-4 text-left">
                      <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        Error Details (Development Only)
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-48">
                        {this.state.error.message}
                        {this.state.error.stack && `\n\n${this.state.error.stack}`}
                      </pre>
                    </details>
                  )}
                </div>
              }
              extra={[
                <Button
                  key="reset"
                  type="primary"
                  onClick={this.handleReset}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Try Again
                </Button>,
                <Button key="home" onClick={() => (window.location.href = "/")}>
                  Go Home
                </Button>,
              ]}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for ErrorBoundary
 * Useful for route-level error boundaries in Next.js App Router
 */
export default ErrorBoundary;
