import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Settings, Server, FileText, Sparkles, ExternalLink, Copy } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../utils/api';
const TaskMasterSetupWizard = ({ isOpen = true, onClose, onComplete, currentProject, className = '' }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [setupData, setSetupData] = useState({
        projectRoot: '',
        initGit: true,
        storeTasksInGit: true,
        addAliases: true,
        skipInstall: false,
        rules: ['claude'],
        mcpConfigured: false,
        prdContent: ''
    });
    const totalSteps = 4;
    useEffect(() => {
        if (currentProject) {
            setSetupData(prev => ({
                ...prev,
                projectRoot: currentProject.path || ''
            }));
        }
    }, [currentProject]);
    const steps = [
        {
            id: 1,
            title: 'Project Configuration',
            description: 'Configure basic TaskMaster settings for your project'
        },
        {
            id: 2,
            title: 'MCP Server Setup',
            description: 'Ensure TaskMaster MCP server is properly configured'
        },
        {
            id: 3,
            title: 'PRD Creation',
            description: 'Create or import a Product Requirements Document'
        },
        {
            id: 4,
            title: 'Complete Setup',
            description: 'Initialize TaskMaster and generate initial tasks'
        }
    ];
    const handleNext = async () => {
        setError(null);
        try {
            if (currentStep === 1) {
                // Validate project configuration
                if (!setupData.projectRoot) {
                    setError('Project root path is required');
                    return;
                }
                setCurrentStep(2);
            }
            else if (currentStep === 2) {
                // Check MCP server status
                setLoading(true);
                try {
                    const mcpStatus = await api.get('/mcp-utils/taskmaster-server');
                    setSetupData(prev => ({
                        ...prev,
                        mcpConfigured: mcpStatus.hasMCPServer && mcpStatus.isConfigured
                    }));
                    setCurrentStep(3);
                }
                catch (err) {
                    setError('Failed to check MCP server status. You can continue but some features may not work.');
                    setCurrentStep(3);
                }
            }
            else if (currentStep === 3) {
                // Validate PRD step
                if (!setupData.prdContent.trim()) {
                    setError('Please create or import a PRD to continue');
                    return;
                }
                setCurrentStep(4);
            }
            else if (currentStep === 4) {
                // Complete setup
                await completeSetup();
            }
        }
        catch (err) {
            setError(err.message || 'An error occurred');
        }
        finally {
            setLoading(false);
        }
    };
    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setError(null);
        }
    };
    const completeSetup = async () => {
        setLoading(true);
        try {
            // Initialize TaskMaster project
            const initResponse = await api.post('/taskmaster/initialize', {
                projectRoot: setupData.projectRoot,
                initGit: setupData.initGit,
                storeTasksInGit: setupData.storeTasksInGit,
                addAliases: setupData.addAliases,
                skipInstall: setupData.skipInstall,
                rules: setupData.rules,
                yes: true
            });
            if (!initResponse.ok) {
                throw new Error('Failed to initialize TaskMaster project');
            }
            // Save PRD content if provided
            if (setupData.prdContent.trim()) {
                const prdResponse = await api.post('/taskmaster/save-prd', {
                    projectRoot: setupData.projectRoot,
                    content: setupData.prdContent
                });
                if (!prdResponse.ok) {
                    console.warn('Failed to save PRD content');
                }
            }
            // Parse PRD to generate initial tasks
            if (setupData.prdContent.trim()) {
                const parseResponse = await api.post('/taskmaster/parse-prd', {
                    projectRoot: setupData.projectRoot,
                    input: '.taskmaster/docs/prd.txt',
                    numTasks: '10',
                    research: false,
                    force: false
                });
                if (!parseResponse.ok) {
                    console.warn('Failed to parse PRD and generate tasks');
                }
            }
            onComplete?.();
            onClose?.();
        }
        catch (err) {
            setError(err.message || 'Failed to complete TaskMaster setup');
        }
        finally {
            setLoading(false);
        }
    };
    const copyMCPConfig = () => {
        const mcpConfig = `{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "your_anthropic_key_here",
        "PERPLEXITY_API_KEY": "your_perplexity_key_here"
      }
    }
  }
}`;
        navigator.clipboard.writeText(mcpConfig);
    };
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx(Settings, { className: "w-12 h-12 text-blue-600 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: "Project Configuration" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Configure TaskMaster settings for your project" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Project Root Path" }), _jsx("input", { type: "text", value: setupData.projectRoot, onChange: (e) => setSetupData(prev => ({ ...prev, projectRoot: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white", placeholder: "/path/to/your/project" })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white", children: "Options" }), _jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", checked: setupData.initGit, onChange: (e) => setSetupData(prev => ({ ...prev, initGit: e.target.checked })), className: "w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: "Initialize Git repository" })] }), _jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", checked: setupData.storeTasksInGit, onChange: (e) => setSetupData(prev => ({ ...prev, storeTasksInGit: e.target.checked })), className: "w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: "Store tasks in Git" })] }), _jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", checked: setupData.addAliases, onChange: (e) => setSetupData(prev => ({ ...prev, addAliases: e.target.checked })), className: "w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: "Add shell aliases (tm, taskmaster)" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Rule Profiles" }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: ['claude', 'cursor', 'vscode', 'roo', 'cline', 'windsurf'].map(rule => (_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: setupData.rules.includes(rule), onChange: (e) => {
                                                            if (e.target.checked) {
                                                                setSetupData(prev => ({ ...prev, rules: [...prev.rules, rule] }));
                                                            }
                                                            else {
                                                                setSetupData(prev => ({ ...prev, rules: prev.rules.filter(r => r !== rule) }));
                                                            }
                                                        }, className: "w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300 capitalize", children: rule })] }, rule))) })] })] })] }));
            case 2:
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx(Server, { className: "w-12 h-12 text-purple-600 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: "MCP Server Setup" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "TaskMaster works best with the MCP server configured" })] }), _jsx("div", { className: "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-blue-900 dark:text-blue-100 mb-1", children: "MCP Server Configuration" }), _jsx("p", { className: "text-sm text-blue-800 dark:text-blue-200 mb-3", children: "To enable full TaskMaster integration, add the MCP server configuration to your Claude settings." }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded border p-3 mb-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-mono text-gray-600 dark:text-gray-400", children: ".mcp.json" }), _jsxs("button", { onClick: copyMCPConfig, className: "flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors", children: [_jsx(Copy, { className: "w-3 h-3" }), "Copy"] })] }), _jsx("pre", { className: "text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap", children: `{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "your_anthropic_key_here",
        "PERPLEXITY_API_KEY": "your_perplexity_key_here"
      }
    }
  }
}` })] }), _jsx("div", { className: "flex items-center gap-2 text-sm", children: _jsxs("a", { href: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use/mcp-servers", target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1", children: ["Learn about MCP setup", _jsx(ExternalLink, { className: "w-3 h-3" })] }) })] })] }) }), _jsxs("div", { className: "bg-gray-50 dark:bg-gray-800 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-2", children: "Current Status" }), _jsx("div", { className: "flex items-center gap-2", children: setupData.mcpConfigured ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }), _jsx("span", { className: "text-sm text-green-700 dark:text-green-300", children: "MCP server is configured" })] })) : (_jsxs(_Fragment, { children: [_jsx(AlertCircle, { className: "w-4 h-4 text-amber-500" }), _jsx("span", { className: "text-sm text-amber-700 dark:text-amber-300", children: "MCP server not detected (optional)" })] })) })] })] }));
            case 3:
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx(FileText, { className: "w-12 h-12 text-green-600 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: "Product Requirements Document" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Create or import a PRD to generate initial tasks" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "PRD Content" }), _jsx("textarea", { value: setupData.prdContent, onChange: (e) => setSetupData(prev => ({ ...prev, prdContent: e.target.value })), rows: 12, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm", placeholder: `# Product Requirements Document

## 1. Overview
Describe your project or feature...

## 2. Objectives
- Primary goal
- Success metrics

## 3. User Stories
- As a user, I want...

## 4. Requirements
- Feature requirements
- Technical requirements

## 5. Implementation Plan
- Phase 1: Core features
- Phase 2: Enhancements` })] }), _jsx("div", { className: "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Sparkles, { className: "w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-blue-900 dark:text-blue-100 mb-1", children: "AI Task Generation" }), _jsx("p", { className: "text-sm text-blue-800 dark:text-blue-200", children: "TaskMaster will analyze your PRD and automatically generate a structured task list with dependencies, priorities, and implementation details." })] })] }) })] })] }));
            case 4:
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx(CheckCircle, { className: "w-12 h-12 text-green-600 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: "Complete Setup" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Ready to initialize TaskMaster for your project" })] }), _jsxs("div", { className: "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-green-900 dark:text-green-100 mb-3", children: "Setup Summary" }), _jsxs("ul", { className: "space-y-2 text-sm text-green-800 dark:text-green-200", children: [_jsxs("li", { className: "flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), "Project: ", setupData.projectRoot] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), "Rules: ", setupData.rules.join(', ')] }), setupData.mcpConfigured && (_jsxs("li", { className: "flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), "MCP server configured"] })), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), "PRD content ready (", setupData.prdContent.length, " characters)"] })] })] }), _jsxs("div", { className: "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-blue-900 dark:text-blue-100 mb-2", children: "What happens next?" }), _jsxs("ol", { className: "list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200", children: [_jsx("li", { children: "Initialize TaskMaster project structure" }), _jsxs("li", { children: ["Save your PRD to ", _jsx("code", { children: ".taskmaster/docs/prd.txt" })] }), _jsx("li", { children: "Generate initial tasks from your PRD" }), _jsx("li", { children: "Set up project configuration and rules" })] })] })] }));
            default:
                return null;
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "modal-backdrop fixed inset-0 flex items-center justify-center z-[100] md:p-4 bg-black/50", children: _jsxs("div", { className: cn('bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 md:rounded-lg shadow-xl', 'w-full md:max-w-4xl h-full md:h-[90vh] flex flex-col', className), children: [_jsxs("div", { className: "flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Sparkles, { className: "w-6 h-6 text-blue-600" }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "TaskMaster Setup Wizard" }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: ["Step ", currentStep, " of ", totalSteps, ": ", steps[currentStep - 1]?.description] })] })] }), _jsx("button", { onClick: onClose, className: "p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors", title: "Close", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700", children: [_jsx("div", { className: "flex items-center justify-between mb-2", children: steps.map((step, index) => (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors', currentStep > step.id
                                            ? 'bg-green-500 text-white'
                                            : currentStep === step.id
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'), children: currentStep > step.id ? (_jsx(CheckCircle, { className: "w-4 h-4" })) : (step.id) }), index < steps.length - 1 && (_jsx("div", { className: cn('w-16 h-1 mx-2 rounded', currentStep > step.id
                                            ? 'bg-green-500'
                                            : 'bg-gray-200 dark:bg-gray-700') }))] }, step.id))) }), _jsx("div", { className: "flex justify-between text-xs text-gray-600 dark:text-gray-400", children: steps.map(step => (_jsx("span", { className: "text-center", children: step.title }, step.id))) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 md:p-6", children: [renderStepContent(), error && (_jsx("div", { className: "mt-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-red-900 dark:text-red-100 mb-1", children: "Error" }), _jsx("p", { className: "text-sm text-red-800 dark:text-red-200", children: error })] })] }) }))] }), _jsxs("div", { className: "flex items-center justify-between p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0", children: [_jsxs("button", { onClick: handlePrevious, disabled: currentStep === 1, className: "flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(ChevronLeft, { className: "w-4 h-4" }), "Previous"] }), _jsxs("div", { className: "text-sm text-gray-500 dark:text-gray-400", children: [currentStep, " of ", totalSteps] }), _jsx("button", { onClick: handleNext, disabled: loading, className: "flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }), currentStep === totalSteps ? 'Setting up...' : 'Processing...'] })) : (_jsxs(_Fragment, { children: [currentStep === totalSteps ? 'Complete Setup' : 'Next', _jsx(ChevronRight, { className: "w-4 h-4" })] })) })] })] }) }));
};
export default TaskMasterSetupWizard;
