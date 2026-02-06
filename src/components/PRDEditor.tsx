import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { X, Save, Download, Maximize2, Minimize2, Eye, FileText, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { api, authenticatedFetch } from '../utils/api';

export interface PRD {
  id?: string;
  title?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  name?: string;
  path?: string;
  fullPath?: string;
}

export interface PRDEditorProps {
  file?: { path?: string };
  onClose?: () => void;
  projectPath?: string;
  project?: Project;
  initialContent?: string;
  isNewFile?: boolean;
  onSave?: (content: string) => void;
}

const PRDEditor: React.FC<PRDEditorProps> = ({ 
  file, 
  onClose, 
  projectPath,
  project, // Add project object
  initialContent = '',
  isNewFile = false,
  onSave
}) => {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(!isNewFile);
  const [saving, setSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [wordWrap, setWordWrap] = useState(true); // Default to true for markdown
  const [fileName, setFileName] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [existingPRDs, setExistingPRDs] = useState<PRD[]>([]);
  
  const editorRef = useRef<HTMLDivElement>(null);

  const PRD_TEMPLATE = `# Product Requirements Document - Example Project

## 1. Overview
**Product Name:** AI-Powered Task Manager
**Version:** 1.0
**Date:** 2024-12-27
**Author:** Development Team

This document outlines the requirements for building an AI-powered task management application that integrates with development workflows and provides intelligent task breakdown and prioritization.

## 2. Objectives
- Create an intuitive task management system that works seamlessly with developer tools
- Provide AI-powered task generation from high-level requirements
- Enable real-time collaboration and progress tracking
- Integrate with popular development environments (VS Code, Cursor, etc.)

### Success Metrics
- User adoption rate > 80% within development teams
- Task completion rate improvement of 25%
- Time-to-delivery reduction of 15%

## 3. User Stories

### Core Functionality
- As a project manager, I want to create PRDs that automatically generate detailed tasks so I can save time on project planning
- As a developer, I want to see my next task clearly highlighted so I can maintain focus
- As a team lead, I want to track progress across multiple projects so I can provide accurate status updates
- As a developer, I want tasks to be broken down into implementable subtasks so I can work more efficiently

### AI Integration
- As a user, I want to describe a feature in natural language and get detailed implementation tasks so I can start working immediately
- As a project manager, I want the AI to analyze task complexity and suggest appropriate time estimates
- As a developer, I want intelligent task prioritization based on dependencies and deadlines

### Collaboration
- As a team member, I want to see real-time updates when tasks are completed so I can coordinate my work
- As a stakeholder, I want to view project progress through intuitive dashboards
- As a developer, I want to add implementation notes to tasks for future reference

## 4. Functional Requirements

### Task Management
- Create, edit, and delete tasks with rich metadata (priority, status, dependencies, estimates)
- Hierarchical task structure with subtasks and sub-subtasks
- Real-time status updates and progress tracking
- Dependency management with circular dependency detection
- Bulk operations (move, update status, assign)

### AI Features
- Natural language PRD parsing to generate structured tasks
- Intelligent task breakdown with complexity analysis
- Automated subtask generation with implementation details
- Smart dependency suggestion
- Progress prediction based on historical data

### Integration Features
- VS Code/Cursor extension for in-editor task management
- Git integration for linking commits to tasks
- API for third-party tool integration
- Webhook support for external notifications
- CLI tool for command-line task management

### User Interface
- Responsive web application (desktop and mobile)
- Multiple view modes (Kanban, list, calendar)
- Dark/light theme support
- Drag-and-drop task organization
`;