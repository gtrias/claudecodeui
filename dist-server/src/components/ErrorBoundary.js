import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        // Log the error details
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        // You can also log the error to an error reporting service here
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }
    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (_jsx("div", { className: "flex flex-col items-center justify-center p-8 text-center", children: _jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-6 max-w-md", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("svg", { className: "h-5 w-5 text-red-400", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }) }), _jsx("h3", { className: "ml-3 text-sm font-medium text-red-800", children: "Something went wrong" })] }), _jsxs("div", { className: "text-sm text-red-700", children: [_jsx("p", { className: "mb-2", children: "An error occurred while loading the chat interface." }), this.props.showDetails && this.state.error && (_jsxs("details", { className: "mt-4", children: [_jsx("summary", { className: "cursor-pointer text-xs font-mono", children: "Error Details" }), _jsxs("pre", { className: "mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40", children: [this.state.error.toString(), this.state.errorInfo && this.state.errorInfo.componentStack] })] }))] }), _jsx("div", { className: "mt-4", children: _jsx("button", { onClick: () => {
                                    this.setState({ hasError: false, error: null, errorInfo: null });
                                    if (this.props.onRetry)
                                        this.props.onRetry();
                                }, className: "bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500", children: "Try Again" }) })] }) }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
