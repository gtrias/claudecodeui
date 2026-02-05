import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Settings, Server, FileText, Sparkles, ExternalLink, Copy } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../utils/api';

export interface SetupData {
  projectRoot: string;
  initGit: boolean;
  storeTasksInGit: boolean;
  addAliases: boolean;
  skipInstall: boolean;
  rules: string[];
  mcpConfigured: boolean;
  prdContent: string;
}

export interface TaskMasterSetupWizardProps {
  isOpen?: boolean;
  onClose: () => void;
  onComplete?: () => void;
  currentProject?: { name?: string; path?: string };
  className?: string;
}

const TaskMasterSetupWizard: React.FC<TaskMasterSetupWizardProps> = ({ 
  isOpen = true, 
  onClose, 
  onComplete,
  currentProject,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<SetupData>({
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

  const handleNext = async (): Promise<void> => {
    setError(null);

    try {
      if (currentStep === 1) {
        // Validate project configuration
        if (!setupData.projectRoot) {
          setError('Project root path is required');
          return;
        }
        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Check MCP server status
        setLoading(true);
        try {
          const mcpStatus = await api.get('/mcp-utils/taskmaster-server');
          setSetupData(prev => ({
            ...prev,
            mcpConfigured: mcpStatus.hasMCPServer && mcpStatus.isConfigured
          }));
          setCurrentStep(3);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to check MCP server status. You can continue but some features may not work.');
          setCurrentStep(3);
        }
      } else if (currentStep === 3) {
        // Validate PRD step
        if (!setupData.prdContent.trim()) {
          setError('Please create or import a PRD to continue');
          return;
        }
        setCurrentStep(4);
      } else if (currentStep === 4) {
        // Complete setup
        await completeSetup();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const completeSetup = async (): Promise<void> => {
    if (!setupData.projectRoot) return;

    setLoading(true);
    try {
      // Initialize TaskMaster
      const response = await api.taskmaster.init(setupData.projectRoot);
      
      if (response.ok) {
        onComplete?.();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to initialize TaskMaster');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = (): React.ReactNode => {
    return (
      <div className="flex items-center justify-between mb-6">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isFuture = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex-1 flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  isCompleted ? 'bg-green-500 text-white' :
                  isCurrent ? 'bg-blue-500 text-white' :
                  'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                )}
              >
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : stepNumber}
              </div>
              {stepNumber < totalSteps && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2 rounded transition-colors',
                    stepNumber < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">TaskMaster Setup</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStepIndicator()}

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {steps[0].title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {steps[0].description}
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Root Path
                    </label>
                    <input
                      type="text"
                      value={setupData.projectRoot}
                      onChange={(e) => setSetupData(prev => ({ ...prev, projectRoot: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setupData.initGit}
                        onChange={(e) => setSetupData(prev => ({ ...prev, initGit: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Initialize git repository
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setupData.storeTasksInGit}
                        onChange={(e) => setSetupData(prev => ({ ...prev, storeTasksInGit: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Store tasks in git
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setupData.addAliases}
                        onChange={(e) => setSetupData(prev => ({ ...prev, addAliases: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Add shell aliases
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {steps[1].title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {steps[1].description}
                </p>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Server className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                        Make sure your TaskMaster MCP server is properly configured in your
                        <code className="bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded">claude_desktop_config.json</code>
                        or
                        <code className="bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded">claude.json</code>
                        file.
                      </p>
                      <a
                        href="https://github.com/eyaltoledano/claude-task-master"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View TaskMaster documentation
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="mcpConfigured"
                    checked={setupData.mcpConfigured}
                    onChange={(e) => setSetupData(prev => ({ ...prev, mcpConfigured: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="mcpConfigured" className="text-sm text-gray-700 dark:text-gray-300">
                    MCP server is configured
                  </label>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {steps[2].title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {steps[2].description}
                </p>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Requirements Document
                  </label>
                  <textarea
                    value={setupData.prdContent}
                    onChange={(e) => setSetupData(prev => ({ ...prev, prdContent: e.target.value }))}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Enter your PRD here..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSetupData(prev => ({ ...prev, prdContent: 'Enter your PRD here...' }))}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      const samplePRD = `# Product Requirements Document\n\n## Overview\n\n## Features\n\n## Technical Requirements\n\n## Timeline\n`;
                      setSetupData(prev => ({ ...prev, prdContent: samplePRD }));
                    }}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Use Sample
                  </button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {steps[3].title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {steps[3].description}
                </p>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                        Ready to initialize TaskMaster with the following settings:
                      </p>
                      <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <li>Project: {setupData.projectRoot}</li>
                        <li>Git: {setupData.initGit ? 'Yes' : 'No'}</li>
                        <li>Store in Git: {setupData.storeTasksInGit ? 'Yes' : 'No'}</li>
                        <li>Add Aliases: {setupData.addAliases ? 'Yes' : 'No'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1 inline" />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={currentStep === totalSteps || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {currentStep === totalSteps ? 'Complete' : 'Next'}
            {currentStep !== totalSteps && <ChevronRight className="w-4 h-4 ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskMasterSetupWizard;