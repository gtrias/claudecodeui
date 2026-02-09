import React, { useMemo } from 'react';

/**
 * Diff line type
 */
export type DiffLineType = 'added' | 'removed' | 'context';

/**
 * Diff line with content and metadata
 */
export interface DiffLine {
  type: DiffLineType;
  content: string;
  lineNum: number;
}

/**
 * Props for DiffDisplay component
 */
export interface DiffDisplayProps {
  /** Old string (before changes) */
  oldStr: string;
  /** New string (after changes) */
  newStr: string;
  /** File path (optional, for display) */
  filePath?: string;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Calculate diff between two strings
 * Simple line-by-line diff algorithm
 */
export function calculateDiff(oldStr: string, newStr: string): DiffLine[] {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  
  const diffLines: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex];
    const newLine = newLines[newIndex];
    
    if (oldIndex >= oldLines.length) {
      // Only new lines remaining
      diffLines.push({ type: 'added', content: newLine, lineNum: newIndex + 1 });
      newIndex++;
    } else if (newIndex >= newLines.length) {
      // Only old lines remaining
      diffLines.push({ type: 'removed', content: oldLine, lineNum: oldIndex + 1 });
      oldIndex++;
    } else if (oldLine === newLine) {
      // Lines are the same - skip in diff view (or show as context)
      oldIndex++;
      newIndex++;
    } else {
      // Lines are different
      diffLines.push({ type: 'removed', content: oldLine, lineNum: oldIndex + 1 });
      diffLines.push({ type: 'added', content: newLine, lineNum: newIndex + 1 });
      oldIndex++;
      newIndex++;
    }
  }
  
  return diffLines;
}

/**
 * Create memoized diff function with caching
 */
export function useDiffCalculator() {
  return useMemo(() => {
    const cache = new Map<string, DiffLine[]>();
    
    return (oldStr: string, newStr: string): DiffLine[] => {
      const key = `${oldStr.length}-${newStr.length}-${oldStr.slice(0, 50)}`;
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      const result = calculateDiff(oldStr, newStr);
      cache.set(key, result);
      
      // Limit cache size
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey!);
      }
      
      return result;
    };
  }, []);
}

/**
 * DiffDisplay - Render diff between two strings with syntax highlighting
 * 
 * Features:
 * - Line-by-line diff calculation
 * - Added/removed line highlighting
 * - Optional line numbers
 * - Optional file path display
 * - Efficient caching with useDiffCalculator
 */
export const DiffDisplay: React.FC<DiffDisplayProps> = ({
  oldStr,
  newStr,
  filePath,
  showLineNumbers = true,
  className = ''
}) => {
  const createDiff = useDiffCalculator();
  const diffLines = useMemo(() => createDiff(oldStr, newStr), [oldStr, newStr, createDiff]);

  return (
    <div className={`diff-display ${className}`}>
      {/* File path header */}
      {filePath && (
        <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
          {filePath}
        </div>
      )}

      {/* Diff content */}
      <div className="font-mono text-sm overflow-x-auto">
        {diffLines.map((diffLine, i) => (
          <div
            key={i}
            className={`flex ${
              diffLine.type === 'removed' 
                ? 'bg-red-50 dark:bg-red-900/20' 
                : 'bg-green-50 dark:bg-green-900/20'
            }`}
          >
            {/* Line indicator */}
            <div className={`flex-shrink-0 w-12 text-center select-none ${
              diffLine.type === 'removed'
                ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                : 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
            }`}>
              {diffLine.type === 'removed' ? '-' : '+'}
            </div>

            {/* Line number */}
            {showLineNumbers && (
              <div className={`flex-shrink-0 w-16 px-2 text-right select-none ${
                diffLine.type === 'removed'
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-green-500 dark:text-green-400'
              }`}>
                {diffLine.lineNum}
              </div>
            )}

            {/* Line content */}
            <div className={`flex-1 px-3 py-0.5 whitespace-pre-wrap break-all ${
              diffLine.type === 'removed'
                ? 'text-red-800 dark:text-red-200'
                : 'text-green-800 dark:text-green-200'
            }`}>
              {diffLine.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiffDisplay;
