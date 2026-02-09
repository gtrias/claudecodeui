import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  showReload?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * Enhanced Root Error Boundary
 * Catches all errors and displays comprehensive error information
 */
class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 ROOT ERROR BOUNDARY CAUGHT ERROR:');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  copyErrorToClipboard = () => {
    const { error, errorInfo } = this.state;
    const errorText = `
APPLICATION ERROR REPORT
========================
Time: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}

ERROR MESSAGE:
${error?.message || 'Unknown error'}

ERROR STACK:
${error?.stack || 'No stack trace'}

COMPONENT STACK:
${errorInfo?.componentStack || 'No component stack'}

LOCATION:
${window.location.href}
`;

    navigator.clipboard.writeText(errorText.trim()).then(() => {
      alert('Error details copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      alert('Failed to copy. Please copy from console.');
    });
  };

  reloadApp = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo, showDetails } = this.state;
    const { children, fallbackTitle = 'Application Error', showReload = true } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-red-200 dark:border-red-800">
            {/* Header */}
            <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h1 className="text-2xl font-bold text-red-800 dark:text-red-400">
                    {fallbackTitle}
                  </h1>
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                    The application encountered an unexpected error and could not continue.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Details */}
            <div className="p-6 space-y-4">
              {/* Error Message */}
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                      Error Message:
                    </h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300 font-mono">
                      {error?.message || 'Unknown error'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={this.copyErrorToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Error Details
                </button>

                {showReload && (
                  <button
                    onClick={this.reloadApp}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reload Application
                  </button>
                )}

                <button
                  onClick={() => this.setState({ showDetails: !showDetails })}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
                >
                  <svg className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {showDetails ? 'Hide' : 'Show'} Details
                </button>
              </div>

              {/* Detailed Stack Trace */}
              {showDetails && (
                <div className="space-y-4">
                  {/* Error Stack */}
                  {error?.stack && (
                    <div className="bg-gray-900 dark:bg-black rounded-lg p-4 overflow-x-auto">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Error Stack Trace:</h4>
                      <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap break-words">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {/* Component Stack */}
                  {errorInfo?.componentStack && (
                    <div className="bg-gray-900 dark:bg-black rounded-lg p-4 overflow-x-auto">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Component Stack:</h4>
                      <pre className="text-xs text-yellow-400 font-mono whitespace-pre-wrap break-words">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}

                  {/* Browser Info */}
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">System Information:</h4>
                    <div className="text-xs text-gray-700 dark:text-gray-300 font-mono space-y-1">
                      <div><span className="text-gray-500">Time:</span> {new Date().toISOString()}</div>
                      <div><span className="text-gray-500">URL:</span> {window.location.href}</div>
                      <div><span className="text-gray-500">User Agent:</span> {navigator.userAgent}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Help Text */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">What to do:</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Click "Copy Error Details" and report the issue</li>
                  <li>Try clicking "Reload Application" to restart</li>
                  <li>Check the browser console (F12) for more information</li>
                  <li>If the issue persists, clear your browser cache</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default RootErrorBoundary;
