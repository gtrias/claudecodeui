import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useAuth } from '../contexts/AuthContext';
import SetupForm from './SetupForm';
import LoginForm from './LoginForm';
import Onboarding from './Onboarding';
import { MessageSquare } from 'lucide-react';
import { IS_PLATFORM } from '../constants/config';
const LoadingScreen = () => (_jsx("div", { className: "min-h-screen bg-background flex items-center justify-center p-4", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx("div", { className: "w-16 h-16 bg-primary rounded-lg flex items-center justify-center shadow-sm", children: _jsx(MessageSquare, { className: "w-8 h-8 text-primary-foreground" }) }) }), _jsx("h1", { className: "text-2xl font-bold text-foreground mb-2", children: "Claude Code UI" }), _jsxs("div", { className: "flex items-center justify-center space-x-2", children: [_jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Loading..." })] }) }));
const ProtectedRoute = ({ children }) => {
    const { user, isLoading, needsSetup, hasCompletedOnboarding, refreshOnboardingStatus } = useAuth();
    if (IS_PLATFORM) {
        if (isLoading) {
            return _jsx(LoadingScreen, {});
        }
        if (!hasCompletedOnboarding) {
            return _jsx(Onboarding, { onComplete: refreshOnboardingStatus });
        }
        return _jsx(_Fragment, { children: children });
    }
    if (isLoading) {
        return _jsx(LoadingScreen, {});
    }
    if (needsSetup) {
        return _jsx(SetupForm, {});
    }
    if (!user) {
        return _jsx(LoginForm, {});
    }
    if (!hasCompletedOnboarding) {
        return _jsx(Onboarding, { onComplete: refreshOnboardingStatus });
    }
    return _jsx(_Fragment, { children: children });
};
export default ProtectedRoute;
