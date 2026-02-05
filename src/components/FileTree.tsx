import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/ui/button';
import { Input } from './ui/input';
import { Folder, FolderOpen, File, FileText, FileCode, List, TableProperties, Eye, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';
import CodeEditor from './CodeEditor';
import ImageViewer from './ImageViewer';
import { api } from '../utils/api';

export interface FileTreeProps {
  selectedProject?: string;
}

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileItem[];
}

const FileTree: React.FC<FileTreeProps> = ({ selectedProject }) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed' | 'compact'>('detailed');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    if (selectedProject) {
      fetchFiles();
    }
  }, [selectedProject]);

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('file-tree-view-mode');
    if (savedViewMode && ['simple', 'detailed', 'compact'].includes(savedViewMode)) {
      setViewMode(savedViewMode as 'simple' | 'detailed' | 'compact');
    }
  }, []);

  // Filter files based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFiles(files);
    } else {
      const filtered = filterFiles(files, searchQuery.toLowerCase());
      setFilteredFiles(filtered);

      // Auto-expand directories that contain matches
      const expandMatches = (items: FileItem[]): void => {
        items.forEach(item => {
          if (item.type === 'directory' && item.children && item.children.length > 0) {
            setExpandedDirs(prev => new Set(prev.add(item.path)));
            expandMatches(item.children);
          }
        });
      };
      expandMatches(filtered);
    }
  }, [files, searchQuery]);

  // Recursively filter files and directories based on search query
  const filterFiles = (items: FileItem[], query: string): FileItem[] => {
    return items.reduce((filtered, item) => {
      const matchesName = item.name.toLowerCase().includes(query);
      let filteredChildren: FileItem[] = [];

      if (item.type === 'directory' && item.children) {
        filteredChildren = filterFiles(item.children, query);
      }

      // Include item if:
      // 1. It matches the search query, or
      // 2. It's a directory with matching children
      if (matchesName || filteredChildren.length > 0) {
        filtered.push({
          ...item,
          children: filteredChildren
        });
      }

      return filtered;
    }, [] as FileItem[]);
  };

  const fetchFiles = async (): Promise<void> => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/api/projects/${selectedProject}/files`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleDirectory = (path: string): void => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderFileItem = (item: FileItem, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedDirs.has(item.path);
    
    return (
      <div key={item.path} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer',
            depth === 0 ? 'font-medium' : ''
          )}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => {
            if (item.type === 'directory') {
              toggleDirectory(item.path);
            } else {
              setSelectedFile(item);
            }
          }}
        >
          {item.type === 'directory' && (
            <FolderOpen className="w-4 h-4 text-blue-500" />
          )}
          {item.type === 'file' && (
            item.name.endsWith('.md') ? (
              <FileText className="w-4 h-4 text-green-500" />
            ) : item.name.endsWith('.tsx') || item.name.endsWith('.ts') || item.name.endsWith('.jsx') || item.name.endsWith('.js') ? (
              <FileCode className="w-4 h-4 text-blue-400" />
            ) : (
              <File className="w-4 h-4 text-gray-400" />
            )
          )}
          <span className="text-sm">{item.name}</span>
        </div>
        
        {item.type === 'directory' && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderFileItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <Input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading files...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No files found
            </div>
          ) : (
            filteredFiles.map(item => renderFileItem(item))
          )}
        </div>
      </ScrollArea>

      {/* File Preview */}
      {selectedFile && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {selectedFile.name}
            </h3>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {selectedFile.name.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
            <ImageViewer src={selectedFile.path} />
          ) : (
            <CodeEditor language="text" value={selectedFile.path} />
          )}
        </div>
      )}
    </div>
  );
};

export default FileTree;