import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Check, GitBranch, User, Mail, LogIn, Loader2 } from 'lucide-react';
import ClaudeLogo from './ClaudeLogo';
import CursorLogo from './CursorLogo';
import CodexLogo from './CodexLogo';
import PiLogo from './PiLogo';
import LoginModal from './LoginModal';
import { authenticatedFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { IS_PLATFORM } from '../constants/config';
const Onboarding = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [gitName, setGitName] = useState('');
    const [gitEmail, setGitEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [activeLoginProvider, setActiveLoginProvider] = useState(null);
    const [selectedProject] = useState({ name: 'default', fullPath: IS_PLATFORM ? '/workspace' : '' });
    const [claudeAuthStatus, setClaudeAuthStatus] = useState({
        authenticated: false,
        email: null,
        loading: true,
        error: null
    });
    const [cursorAuthStatus, setCursorAuthStatus] = useState({
        authenticated: false,
        email: null,
        loading: true,
        error: null
    });
    const [codexAuthStatus, setCodexAuthStatus] = useState({
        authenticated: false,
        email: null,
        loading: true,
        error: null
    });
    const [piAuthStatus, setPiAuthStatus] = useState({
        authenticated: false,
        email: null,
        loading: true,
        error: null
    });
    const { user } = useAuth();
    const prevActiveLoginProviderRef = useRef(undefined);
    useEffect(() => {
        loadGitConfig();
    }, []);
    const loadGitConfig = async () => {
        try {
            const response = await authenticatedFetch('/api/user/git-config');
            if (response.ok) {
                const data = await response.json();
                if (data.gitName)
                    setGitName(data.gitName);
                if (data.gitEmail)
                    setGitEmail(data.gitEmail);
            }
        }
        catch (error) {
            console.error('Error loading git config:', error);
        }
    };
    useEffect(() => {
        const prevProvider = prevActiveLoginProviderRef.current;
        prevActiveLoginProviderRef.current = activeLoginProvider;
        const isInitialMount = prevProvider === undefined;
        const isModalClosing = prevProvider !== null && activeLoginProvider === null;
        if (isInitialMount || isModalClosing) {
            checkClaudeAuthStatus();
            checkCursorAuthStatus();
            checkCodexAuthStatus();
            checkPiAuthStatus();
        }
    }, [activeLoginProvider]);
    const checkClaudeAuthStatus = async () => {
        try {
            const response = await authenticatedFetch('/api/cli/claude/status');
            if (response.ok) {
                const data = await response.json();
                setClaudeAuthStatus({
                    authenticated: data.authenticated,
                    email: data.email,
                    loading: false,
                    error: data.error || null
                });
            }
            else {
                setClaudeAuthStatus({
                    authenticated: false,
                    email: null,
                    loading: false,
                    error: 'Failed to check authentication status'
                });
            }
        }
        catch (error) {
            console.error('Error checking Claude auth status:', error);
            setClaudeAuthStatus({
                authenticated: false,
                email: null,
                loading: false,
                error: error.message
            });
        }
    };
    const checkCursorAuthStatus = async () => {
        try {
            const response = await authenticatedFetch('/api/cli/cursor/status');
            if (response.ok) {
                const data = await response.json();
                setCursorAuthStatus({
                    authenticated: data.authenticated,
                    email: data.email,
                    loading: false,
                    error: data.error || null
                });
            }
            else {
                setCursorAuthStatus({
                    authenticated: false,
                    email: null,
                    loading: false,
                    error: 'Failed to check authentication status'
                });
            }
        }
        catch (error) {
            console.error('Error checking Cursor auth status:', error);
            setCursorAuthStatus({
                authenticated: false,
                email: null,
                loading: false,
                error: error.message
            });
        }
    };
    const checkCodexAuthStatus = async () => {
        try {
            const response = await authenticatedFetch('/api/cli/codex/status');
            if (response.ok) {
                const data = await response.json();
                setCodexAuthStatus({
                    authenticated: data.authenticated,
                    email: data.email,
                    loading: false,
                    error: data.error || null
                });
            }
            else {
                setCodexAuthStatus({
                    authenticated: false,
                    email: null,
                    loading: false,
                    error: 'Failed to check authentication status'
                });
            }
        }
        catch (error) {
            console.error('Error checking Codex auth status:', error);
            setCodexAuthStatus({
                authenticated: false,
                email: null,
                loading: false,
                error: error.message
            });
        }
    };
    const checkPiAuthStatus = async () => {
        try {
            const response = await authenticatedFetch('/api/cli/pi/status');
            if (response.ok) {
                const data = await response.json();
                setPiAuthStatus({
                    authenticated: data.authenticated,
                    email: data.email,
                    loading: false,
                    error: data.error || null
                });
            }
            else {
                setPiAuthStatus({
                    authenticated: false,
                    email: null,
                    loading: false,
                    error: 'Failed to check authentication status'
                });
            }
        }
        catch (error) {
            console.error('Error checking Pi auth status:', error);
            setPiAuthStatus({
                authenticated: false,
                email: null,
                loading: false,
                error: error.message
            });
        }
    };
    const handleClaudeLogin = () => setActiveLoginProvider('claude');
    const handleCursorLogin = () => setActiveLoginProvider('cursor');
    const handleCodexLogin = () => setActiveLoginProvider('codex');
    const handlePiLogin = () => setActiveLoginProvider('pi');
    const handleLoginComplete = (exitCode) => {
        if (exitCode === 0) {
            if (activeLoginProvider === 'claude') {
                checkClaudeAuthStatus();
            }
            else if (activeLoginProvider === 'cursor') {
                checkCursorAuthStatus();
            }
            else if (activeLoginProvider === 'codex') {
                checkCodexAuthStatus();
            }
            else if (activeLoginProvider === 'pi') {
                checkPiAuthStatus();
            }
        }
    };
    const handleNextStep = async () => {
        setError('');
        // Step 0: Git config validation and submission
        if (currentStep === 0) {
            if (!gitName.trim() || !gitEmail.trim()) {
                setError('Both git name and email are required');
                return;
            }
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(gitEmail)) {
                setError('Please enter a valid email address');
                return;
            }
            setIsSubmitting(true);
            try {
                // Save git config to backend (which will also apply git config --global)
                const response = await authenticatedFetch('/api/user/git-config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gitName, gitEmail })
                });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to save git configuration');
                }
                setCurrentStep(currentStep + 1);
            }
            catch (err) {
                setError(err.message);
            }
            finally {
                setIsSubmitting(false);
            }
            return;
        }
        setCurrentStep(currentStep + 1);
    };
    const handlePrevStep = () => {
        setError('');
        setCurrentStep(currentStep - 1);
    };
    const handleFinish = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            const response = await authenticatedFetch('/api/user/complete-onboarding', {
                method: 'POST'
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to complete onboarding');
            }
            if (onComplete) {
                onComplete();
            }
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const steps = [
        {
            title: 'Git Configuration',
            description: 'Set up your git identity for commits',
            icon: GitBranch,
            required: true
        },
        {
            title: 'Connect Agents',
            description: 'Connect your AI coding assistants',
            icon: LogIn,
            required: false
        }
    ];
    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(GitBranch, { className: "w-8 h-8 text-blue-600 dark:text-blue-400" }) }), _jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: "Git Configuration" }), _jsx("p", { className: "text-muted-foreground", children: "Configure your git identity to ensure proper attribution for your commits" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "gitName", className: "flex items-center gap-2 text-sm font-medium text-foreground mb-2", children: [_jsx(User, { className: "w-4 h-4" }), "Git Name ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", id: "gitName", value: gitName, onChange: (e) => setGitName(e.target.value), className: "w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "John Doe", required: true, disabled: isSubmitting }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "This will be used as: git config --global user.name" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "gitEmail", className: "flex items-center gap-2 text-sm font-medium text-foreground mb-2", children: [_jsx(Mail, { className: "w-4 h-4" }), "Git Email ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "email", id: "gitEmail", value: gitEmail, onChange: (e) => setGitEmail(e.target.value), className: "w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "john@example.com", required: true, disabled: isSubmitting }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "This will be used as: git config --global user.email" })] })] })] }));
            case 1:
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-foreground mb-2", children: "Connect Your AI Agents" }), _jsx("p", { className: "text-muted-foreground", children: "Login to one or more AI coding assistants. All are optional." })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: `border rounded-lg p-4 transition-colors ${claudeAuthStatus.authenticated
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                        : 'border-border bg-card'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center", children: _jsx(ClaudeLogo, { size: 20 }) }), _jsxs("div", { children: [_jsxs("div", { className: "font-medium text-foreground flex items-center gap-2", children: ["Claude Code", claudeAuthStatus.authenticated && _jsx(Check, { className: "w-4 h-4 text-green-500" })] }), _jsx("div", { className: "text-xs text-muted-foreground", children: claudeAuthStatus.loading ? 'Checking...' :
                                                                    claudeAuthStatus.authenticated ? claudeAuthStatus.email || 'Connected' : 'Not connected' })] })] }), !claudeAuthStatus.authenticated && !claudeAuthStatus.loading && (_jsx("button", { onClick: handleClaudeLogin, className: "bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors", children: "Login" }))] }) }), _jsx("div", { className: `border rounded-lg p-4 transition-colors ${cursorAuthStatus.authenticated
                                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                                        : 'border-border bg-card'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center", children: _jsx(CursorLogo, { size: 20 }) }), _jsxs("div", { children: [_jsxs("div", { className: "font-medium text-foreground flex items-center gap-2", children: ["Cursor", cursorAuthStatus.authenticated && _jsx(Check, { className: "w-4 h-4 text-green-500" })] }), _jsx("div", { className: "text-xs text-muted-foreground", children: cursorAuthStatus.loading ? 'Checking...' :
                                                                    cursorAuthStatus.authenticated ? cursorAuthStatus.email || 'Connected' : 'Not connected' })] })] }), !cursorAuthStatus.authenticated && !cursorAuthStatus.loading && (_jsx("button", { onClick: handleCursorLogin, className: "bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors", children: "Login" }))] }) }), _jsx("div", { className: `border rounded-lg p-4 transition-colors ${codexAuthStatus.authenticated
                                        ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600'
                                        : 'border-border bg-card'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center", children: _jsx(CodexLogo, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsxs("div", { className: "font-medium text-foreground flex items-center gap-2", children: ["OpenAI Codex", codexAuthStatus.authenticated && _jsx(Check, { className: "w-4 h-4 text-green-500" })] }), _jsx("div", { className: "text-xs text-muted-foreground", children: codexAuthStatus.loading ? 'Checking...' :
                                                                    codexAuthStatus.authenticated ? codexAuthStatus.email || 'Connected' : 'Not connected' })] })] }), !codexAuthStatus.authenticated && !codexAuthStatus.loading && (_jsx("button", { onClick: handleCodexLogin, className: "bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors", children: "Login" }))] }) }), _jsx("div", { className: `border rounded-lg p-4 transition-colors ${piAuthStatus.authenticated
                                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                        : 'border-border bg-card'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center", children: _jsx(PiLogo, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsxs("div", { className: "font-medium text-foreground flex items-center gap-2", children: ["Pi", piAuthStatus.authenticated && _jsx(Check, { className: "w-4 h-4 text-green-500" })] }), _jsx("div", { className: "text-xs text-muted-foreground", children: piAuthStatus.loading ? 'Checking...' :
                                                                    piAuthStatus.authenticated ? piAuthStatus.email || 'Connected' : 'Not connected' })] })] }), !piAuthStatus.authenticated && !piAuthStatus.loading && (_jsx("button", { onClick: handlePiLogin, className: "bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors", children: "Login" }))] }) })] }), _jsx("div", { className: "text-center text-sm text-muted-foreground pt-2", children: _jsx("p", { children: "You can configure these later in Settings." }) })] }));
            default:
                return null;
        }
    };
    const isStepValid = () => {
        switch (currentStep) {
            case 0:
                return !!(gitName.trim() && gitEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gitEmail));
            case 1:
                return true;
            default:
                return false;
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "min-h-screen bg-background flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-2xl", children: [_jsx("div", { className: "mb-8", children: _jsx("div", { className: "flex items-center justify-between", children: steps.map((step, index) => (_jsxs(React.Fragment, { children: [_jsxs("div", { className: "flex flex-col items-center flex-1", children: [_jsx("div", { className: `w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-200 ${index < currentStep ? 'bg-green-500 border-green-500 text-white' :
                                                        index === currentStep ? 'bg-blue-600 border-blue-600 text-white' :
                                                            'bg-background border-border text-muted-foreground'}`, children: index < currentStep ? (_jsx(Check, { className: "w-6 h-6" })) : (_jsx(step.icon, { className: "w-6 h-6" })) }), _jsxs("div", { className: "mt-2 text-center", children: [_jsx("p", { className: `text-sm font-medium ${index === currentStep ? 'text-foreground' : 'text-muted-foreground'}`, children: step.title }), step.required && (_jsx("span", { className: "text-xs text-red-500", children: "Required" }))] })] }), index < steps.length - 1 && (_jsx("div", { className: `flex-1 h-0.5 mx-2 transition-colors duration-200 ${index < currentStep ? 'bg-green-500' : 'bg-border'}` }))] }, index))) }) }), _jsxs("div", { className: "bg-card rounded-lg shadow-lg border border-border p-8", children: [renderStepContent(), error && (_jsx("div", { className: "mt-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg", children: _jsx("p", { className: "text-sm text-red-700 dark:text-red-400", children: error }) })), _jsxs("div", { className: "flex items-center justify-between mt-8 pt-6 border-t border-border", children: [_jsxs("button", { onClick: handlePrevStep, disabled: currentStep === 0 || isSubmitting, className: "flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200", children: [_jsx(ChevronLeft, { className: "w-4 h-4" }), "Previous"] }), _jsx("div", { className: "flex items-center gap-3", children: currentStep < steps.length - 1 ? (_jsx("button", { onClick: handleNextStep, disabled: !isStepValid() || isSubmitting, className: "flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200", children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), "Saving..."] })) : (_jsxs(_Fragment, { children: ["Next", _jsx(ChevronRight, { className: "w-4 h-4" })] })) })) : (_jsx("button", { onClick: handleFinish, disabled: isSubmitting, className: "flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200", children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), "Completing..."] })) : (_jsxs(_Fragment, { children: [_jsx(Check, { className: "w-4 h-4" }), "Complete Setup"] })) })) })] })] })] }) }), activeLoginProvider && (_jsx(LoginModal, { isOpen: !!activeLoginProvider, onClose: () => setActiveLoginProvider(null), provider: activeLoginProvider, project: selectedProject, onComplete: handleLoginComplete }))] }));
};
export default Onboarding;
