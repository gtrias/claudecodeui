import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { X, Save, Download, Maximize2, Minimize2, Eye, FileText, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { api, authenticatedFetch } from '../utils/api';

export interface PRDEditorProps {
  file?: { path: string; content?: string };
  onClose?: () => void;
  projectPath?: string;
  project?: { id: string; name: string; path: string };
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
  const [existingPRDs, setExistingPRDs] = useState<string[]>([]);
  
  const editorRef = useRef<HTMLDivElement>(null);