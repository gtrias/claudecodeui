import React, { useState, useEffect, useRef, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, showPanel, ViewPlugin } from '@codemirror/view';
import { unifiedMergeView, getChunks } from '@codemirror/merge';
import { showMinimap } from '@replit/codemirror-minimap';
import { X, Save, Download, Maximize2, Minimize2 } from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from 'react-i18next';

export interface CodeEditorProps {
  file?: { path?: string; diffInfo?: any };
  onClose?: () => void;
  projectPath?: string;
  isSidebar?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export interface Chunk {
  fromA: number;
  toA: number;
  fromB: number;
  toB: number;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file, onClose, projectPath, isSidebar = false, isExpanded = false, onToggleExpand = null }) => {
  const { t } = useTranslation('codeEditor');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('codeEditorTheme');
    return savedTheme ? savedTheme === 'dark' : true;
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDiff, setShowDiff] = useState(!!file?.diffInfo);
  const [wordWrap, setWordWrap] = useState(() => {
    return localStorage.getItem('codeEditorWordWrap') === 'true';
  });
  const [minimapEnabled, setMinimapEnabled] = useState(() => {
    return localStorage.getItem('codeEditorShowMinimap') !== 'false';
  });
  const [showLineNumbers, setShowLineNumbers] = useState(() => {
    return localStorage.getItem('codeEditorLineNumbers') !== 'false';
  });
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('codeEditorFontSize') || '14';
  });
  const editorRef = useRef<HTMLDivElement>(null);

  // Create minimap extension with chunk-based gutters
  const minimapExtension = useMemo(() => {
    if (!file?.diffInfo || !showDiff || !minimapEnabled) return [];

    const gutters: Record<number, string> = {};

    return [
      showMinimap.compute(['doc'], (state) => {
        // Get actual chunks from merge view
        const chunksData = getChunks(state);
        const chunks = chunksData?.chunks || [];

        // Clear previous gutters
        Object.keys(gutters).forEach(key => delete gutters[key]);

        // Mark lines that are part of chunks
        chunks.forEach(chunk => {
          // Mark the lines in the B side (current document)
          const fromLine = state.doc.lineAt(chunk.fromB).number;
          const toLine = state.doc.lineAt(Math.min(chunk.toB, state.doc.length)).number;

          for (let lineNum = fromLine; lineNum <= toLine; lineNum++) {
            gutters[lineNum] = isDarkMode ? 'rgba(34, 197, 94, 0.8)' : 'rgba(34, 197, 94, 1)';
          }
        });

        return {
          create: () => ({ dom: document.createElement('div') }),
          displayText: 'blocks',
          showOverlay: 'always',
          gutters: [gutters]
        };
      })
    ];
  }, [file?.diffInfo, showDiff, minimapEnabled, isDarkMode]);

  // Create extension to scroll to first chunk on mount
  const scrollToFirstChunkExtension = useMemo(() => {
    if (!file?.diffInfo || !showDiff) return [];

    return [
      ViewPlugin.fromClass(class {
        constructor(view: EditorView) {
          // Delay to ensure merge view is fully initialized
          setTimeout(() => {
            const chunksData = getChunks(view.state);
            const chunks = chunksData?.chunks || [];

            if (chunks.length > 0) {
              const firstChunk = chunks[0];

              // Scroll to the first chunk
              view.dispatch({
                effects: EditorView.scrollIntoView(firstChunk.fromB, { y: 'center' })
              });
            }
          }, 100);
        }
      })
    ];
  }, [file?.diffInfo, showDiff]);