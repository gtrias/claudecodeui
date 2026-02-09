import React, { useState } from 'react';

/**
 * Error Testing Component
 * Use this to test error boundaries in development
 */
const ErrorTester: React.FC = () => {
  const [showTester, setShowTester] = useState(false);

  const throwError = () => {
    throw new Error('Test Error: This is a simulated error for testing the error boundary!');
  };

  const throwAsyncError = () => {
    setTimeout(() => {
      throw new Error('Test Async Error: This is a simulated async error!');
    }, 100);
  };

  const throwPromiseRejection = () => {
    Promise.reject(new Error('Test Promise Rejection: This is a simulated promise rejection!'));
  };

  const throwUndefinedError = () => {
    // @ts-ignore - intentional error for testing
    const x = undefined;
    x.someMethod();
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (!showTester) {
    return (
      <button
        onClick={() => setShowTester(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-lg hover:bg-red-700 z-50"
        title="Show error testing controls (dev only)"
      >
        🧪 Error Tester
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4 z-50 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Error Tester</h3>
        <button
          onClick={() => setShowTester(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        <button
          onClick={throwError}
          className="w-full text-left px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-medium transition-colors"
        >
          Throw Render Error
        </button>

        <button
          onClick={throwAsyncError}
          className="w-full text-left px-3 py-2 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs font-medium transition-colors"
        >
          Throw Async Error
        </button>

        <button
          onClick={throwPromiseRejection}
          className="w-full text-left px-3 py-2 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs font-medium transition-colors"
        >
          Promise Rejection
        </button>

        <button
          onClick={throwUndefinedError}
          className="w-full text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs font-medium transition-colors"
        >
          Undefined Error
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Click buttons to test error boundaries. Check console for logs.
        </p>
      </div>
    </div>
  );
};

export default ErrorTester;
