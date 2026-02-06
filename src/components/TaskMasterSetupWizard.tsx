import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Settings, Server, FileText, Sparkles, ExternalLink, Copy } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../utils/api';

export interface ProjectConfig {
  projectRoot?: string;
  initGit?: boolean;
  storeTasksInGit?: boolean;
  addAliases?: boolean;
  skipInstall?: boolean;
  rules?: string[];
  mcpConfigured?: boolean;
  prdContent?: string;
}

export interface TaskMasterSetupWizardProps {
  isOpen?: boolean;
  onClose?: () => void;
  onComplete?: () => void;
  currentProject?: { path?: string };
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
  const [setupData, setSetupData] = useState<ProjectConfig>({
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
          const response = await api.get('/mcp-utils/taskmaster-server');
          const data = await response.json();
          setSetupData(prev => ({
            ...prev,
            mcpConfigured: data.hasMCPServer && data.isConfigured
          }));