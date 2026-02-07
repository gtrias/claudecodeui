import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { X, Save, Download, Maximize2, Minimize2, Eye, FileText, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { api, authenticatedFetch } from '../utils/api';

export interface Project {
  name?: string;
  path?: string;
  fullPath?: string;
}

export interface PRD {
  id?: string;
  title?: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PRDEditorProps {
  file?: { name?: string; path?: string; content?: string };
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
  project,
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