import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Folder, FolderOpen, File, FileText, FileCode, List, TableProperties, Eye, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';
import CodeEditor from './CodeEditor';
import ImageViewer from './ImageViewer';
import { api } from '../utils/api';
function FileTree({ selectedProject }) {
    const { t } = useTranslation();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedDirs, setExpandedDirs] = useState(new Set());
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [viewMode, setViewMode] = useState('detailed');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredFiles, setFilteredFiles] = useState([]);
    useEffect(() => {
        if (selectedProject) {
            fetchFiles();
        }
    }, [selectedProject]);
    // Load view mode preference from localStorage
    useEffect(() => {
        const savedViewMode = localStorage.getItem('file-tree-view-mode');
        if (savedViewMode && ['simple', 'detailed', 'compact'].includes(savedViewMode)) {
            setViewMode(savedViewMode);
        }
    }, []);
    // Filter files based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredFiles(files);
        }
        else {
            const filtered = filterFiles(files, searchQuery.toLowerCase());
            setFilteredFiles(filtered);
            // Auto-expand directories that contain matches
            const expandMatches = (items) => {
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
    const filterFiles = (items, query) => {
        return items.reduce((filtered, item) => {
            const matchesName = item.name.toLowerCase().includes(query);
            let filteredChildren = [];
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
        }, []);
    };
    const fetchFiles = async () => {
        if (!selectedProject)
            return;
        setLoading(true);
        try {
            const response = await api.getFiles(selectedProject.name);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ File fetch failed:', response.status, errorText);
                setFiles([]);
                return;
            }
            const data = await response.json();
            setFiles(data);
        }
        catch (error) {
            console.error('❌ Error fetching files:', error);
            setFiles([]);
        }
        finally {
            setLoading(false);
        }
    };
    const toggleDirectory = (path) => {
        const newExpanded = new Set(expandedDirs);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        }
        else {
            newExpanded.add(path);
        }
        setExpandedDirs(newExpanded);
    };
    // Change view mode and save preference
    const changeViewMode = (mode) => {
        setViewMode(mode);
        localStorage.setItem('file-tree-view-mode', mode);
    };
    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };
    // Format date as relative time
    const formatRelativeTime = (date) => {
        if (!date)
            return '-';
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
        if (diffInSeconds < 60)
            return t('fileTree.justNow');
        if (diffInSeconds < 3600)
            return t('fileTree.minAgo', { count: Math.floor(diffInSeconds / 60) });
        if (diffInSeconds < 86400)
            return t('fileTree.hoursAgo', { count: Math.floor(diffInSeconds / 3600) });
        if (diffInSeconds < 2592000)
            return t('fileTree.daysAgo', { count: Math.floor(diffInSeconds / 86400) });
        return past.toLocaleDateString();
    };
    const isImageFile = (filename) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'];
        return ext ? imageExtensions.includes(ext) : false;
    };
    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'];
        const docExtensions = ['md', 'txt', 'doc', 'pdf'];
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'];
        if (ext && codeExtensions.includes(ext)) {
            return _jsx(FileCode, { className: "w-4 h-4 text-green-500 flex-shrink-0" });
        }
        else if (ext && docExtensions.includes(ext)) {
            return _jsx(FileText, { className: "w-4 h-4 text-blue-500 flex-shrink-0" });
        }
        else if (ext && imageExtensions.includes(ext)) {
            return _jsx(File, { className: "w-4 h-4 text-purple-500 flex-shrink-0" });
        }
        else {
            return _jsx(File, { className: "w-4 h-4 text-muted-foreground flex-shrink-0" });
        }
    };
    const handleItemClick = (item) => {
        if (!selectedProject)
            return;
        if (item.type === 'directory') {
            toggleDirectory(item.path);
        }
        else if (isImageFile(item.name)) {
            setSelectedImage({
                name: item.name,
                path: item.path,
                projectPath: selectedProject.path,
                projectName: selectedProject.name
            });
        }
        else {
            setSelectedFile({
                name: item.name,
                path: item.path,
                projectPath: selectedProject.path,
                projectName: selectedProject.name
            });
        }
    };
    const renderFileTree = (items, level = 0) => {
        return items.map((item) => (_jsxs("div", { className: "select-none", children: [_jsx(Button, { variant: "ghost", className: cn("w-full justify-start p-2 h-auto font-normal text-left hover:bg-accent"), style: { paddingLeft: `${level * 16 + 12}px` }, onClick: () => handleItemClick(item), children: _jsxs("div", { className: "flex items-center gap-2 min-w-0 w-full", children: [item.type === 'directory' ? (expandedDirs.has(item.path) ? (_jsx(FolderOpen, { className: "w-4 h-4 text-blue-500 flex-shrink-0" })) : (_jsx(Folder, { className: "w-4 h-4 text-muted-foreground flex-shrink-0" }))) : (getFileIcon(item.name)), _jsx("span", { className: "text-sm truncate text-foreground", children: item.name })] }) }), item.type === 'directory' &&
                    expandedDirs.has(item.path) &&
                    item.children &&
                    item.children.length > 0 && (_jsx("div", { children: renderFileTree(item.children, level + 1) }))] }, item.path)));
    };
    // Render detailed view with table-like layout
    const renderDetailedView = (items, level = 0) => {
        return items.map((item) => (_jsxs("div", { className: "select-none", children: [_jsxs("div", { className: cn("grid grid-cols-12 gap-2 p-2 hover:bg-accent cursor-pointer items-center"), style: { paddingLeft: `${level * 16 + 12}px` }, onClick: () => handleItemClick(item), children: [_jsxs("div", { className: "col-span-5 flex items-center gap-2 min-w-0", children: [item.type === 'directory' ? (expandedDirs.has(item.path) ? (_jsx(FolderOpen, { className: "w-4 h-4 text-blue-500 flex-shrink-0" })) : (_jsx(Folder, { className: "w-4 h-4 text-muted-foreground flex-shrink-0" }))) : (getFileIcon(item.name)), _jsx("span", { className: "text-sm truncate text-foreground", children: item.name })] }), _jsx("div", { className: "col-span-2 text-sm text-muted-foreground", children: item.type === 'file' ? formatFileSize(item.size) : '-' }), _jsx("div", { className: "col-span-3 text-sm text-muted-foreground", children: formatRelativeTime(item.modified) }), _jsx("div", { className: "col-span-2 text-sm text-muted-foreground font-mono", children: item.permissionsRwx || '-' })] }), item.type === 'directory' &&
                    expandedDirs.has(item.path) &&
                    item.children &&
                    renderDetailedView(item.children, level + 1)] }, item.path)));
    };
    // Render compact view with inline details
    const renderCompactView = (items, level = 0) => {
        return items.map((item) => (_jsxs("div", { className: "select-none", children: [_jsxs("div", { className: cn("flex items-center justify-between p-2 hover:bg-accent cursor-pointer"), style: { paddingLeft: `${level * 16 + 12}px` }, onClick: () => handleItemClick(item), children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [item.type === 'directory' ? (expandedDirs.has(item.path) ? (_jsx(FolderOpen, { className: "w-4 h-4 text-blue-500 flex-shrink-0" })) : (_jsx(Folder, { className: "w-4 h-4 text-muted-foreground flex-shrink-0" }))) : (getFileIcon(item.name)), _jsx("span", { className: "text-sm truncate text-foreground", children: item.name })] }), _jsx("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: item.type === 'file' && (_jsxs(_Fragment, { children: [_jsx("span", { children: formatFileSize(item.size) }), _jsx("span", { className: "font-mono", children: item.permissionsRwx })] })) })] }), item.type === 'directory' &&
                    expandedDirs.has(item.path) &&
                    item.children &&
                    renderCompactView(item.children, level + 1)] }, item.path)));
    };
    if (loading) {
        return (_jsx("div", { className: "h-full flex items-center justify-center", children: _jsx("div", { className: "text-gray-500 dark:text-gray-400", children: t('fileTree.loading') }) }));
    }
    return (_jsxs("div", { className: "h-full flex flex-col bg-card", children: [_jsxs("div", { className: "p-4 border-b border-border space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-medium text-foreground", children: t('fileTree.files') }), _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: viewMode === 'simple' ? 'default' : 'ghost', size: "sm", className: "h-8 w-8 p-0", onClick: () => changeViewMode('simple'), title: t('fileTree.simpleView'), children: _jsx(List, { className: "w-4 h-4" }) }), _jsx(Button, { variant: viewMode === 'compact' ? 'default' : 'ghost', size: "sm", className: "h-8 w-8 p-0", onClick: () => changeViewMode('compact'), title: t('fileTree.compactView'), children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx(Button, { variant: viewMode === 'detailed' ? 'default' : 'ghost', size: "sm", className: "h-8 w-8 p-0", onClick: () => changeViewMode('detailed'), title: t('fileTree.detailedView'), children: _jsx(TableProperties, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" }), _jsx(Input, { type: "text", placeholder: t('fileTree.searchPlaceholder'), value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-8 pr-8 h-8 text-sm" }), searchQuery && (_jsx(Button, { variant: "ghost", size: "sm", className: "absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-accent", onClick: () => setSearchQuery(''), title: t('fileTree.clearSearch'), children: _jsx(X, { className: "w-3 h-3" }) }))] })] }), viewMode === 'detailed' && filteredFiles.length > 0 && (_jsx("div", { className: "px-4 pt-2 pb-1 border-b border-border", children: _jsxs("div", { className: "grid grid-cols-12 gap-2 px-2 text-xs font-medium text-muted-foreground", children: [_jsx("div", { className: "col-span-5", children: t('fileTree.name') }), _jsx("div", { className: "col-span-2", children: t('fileTree.size') }), _jsx("div", { className: "col-span-3", children: t('fileTree.modified') }), _jsx("div", { className: "col-span-2", children: t('fileTree.permissions') })] }) })), _jsx(ScrollArea, { className: "flex-1 p-4", children: files.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3", children: _jsx(Folder, { className: "w-6 h-6 text-muted-foreground" }) }), _jsx("h4", { className: "font-medium text-foreground mb-1", children: t('fileTree.noFilesFound') }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('fileTree.checkProjectPath') })] })) : filteredFiles.length === 0 && searchQuery ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3", children: _jsx(Search, { className: "w-6 h-6 text-muted-foreground" }) }), _jsx("h4", { className: "font-medium text-foreground mb-1", children: t('fileTree.noMatchesFound') }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('fileTree.tryDifferentSearch') })] })) : (_jsxs("div", { className: viewMode === 'detailed' ? '' : 'space-y-1', children: [viewMode === 'simple' && renderFileTree(filteredFiles), viewMode === 'compact' && renderCompactView(filteredFiles), viewMode === 'detailed' && renderDetailedView(filteredFiles)] })) }), selectedFile && (_jsx(CodeEditor, { file: selectedFile, onClose: () => setSelectedFile(null), projectPath: selectedFile.projectPath })), selectedImage && (_jsx(ImageViewer, { file: selectedImage, onClose: () => setSelectedImage(null) }))] }));
}
export default FileTree;
