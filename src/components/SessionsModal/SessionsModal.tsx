// src/components/SessionsModal/SessionsModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { UnifiedSession, SessionProvider, SessionFilters } from '../../types/session';
import { filterSessions } from '../../utils/sessionAdapters';
import SessionCard from './SessionCard';
import EmptySessionsState from './EmptySessionsState';

interface SessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: UnifiedSession[];
  projects: { name: string; fullPath: string }[];
  initialProjectPath?: string;
  onSessionSelect: (session: UnifiedSession) => void;
  onSessionDelete: (session: UnifiedSession) => void;
}

const PROVIDERS: { value: SessionProvider | 'all'; label: string }[] = [
  { value: 'all', label: 'All Providers' },
  { value: 'claude', label: 'Claude' },
  { value: 'pi', label: 'Pi' },
  { value: 'codex', label: 'Codex' },
  { value: 'cursor', label: 'Cursor' },
];

const SORT_OPTIONS = [
  { value: 'lastActivity-desc', label: 'Newest First' },
  { value: 'lastActivity-asc', label: 'Oldest First' },
  { value: 'title-asc', label: 'Name A-Z' },
  { value: 'title-desc', label: 'Name Z-A' },
];

export const SessionsModal: React.FC<SessionsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  projects,
  initialProjectPath,
  onSessionSelect,
  onSessionDelete,
}) => {
  const { t } = useTranslation();
  
  const [filters, setFilters] = useState<SessionFilters>({
    searchQuery: '',
    provider: 'all',
    projectPath: initialProjectPath || 'all',
    sortBy: 'lastActivity',
    sortOrder: 'desc',
  });

  // Reset project filter when modal opens with new initialProjectPath
  useEffect(() => {
    if (isOpen && initialProjectPath) {
      setFilters(prev => ({ ...prev, projectPath: initialProjectPath }));
    }
  }, [isOpen, initialProjectPath]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredSessions = useMemo(() => {
    return filterSessions(sessions, filters);
  }, [sessions, filters]);

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as ['lastActivity' | 'title', 'asc' | 'desc'];
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold">{t('sessionsModal.title', 'All Sessions')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Filter Bar */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('sessionsModal.searchPlaceholder', 'Search sessions...')}
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="pl-9"
              />
            </div>
            
            {/* Filters row */}
            <div className="flex flex-wrap gap-2">
              {/* Provider Filter */}
              <select
                value={filters.provider}
                onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value as SessionProvider | 'all' }))}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {PROVIDERS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              
              {/* Project Filter */}
              <select
                value={filters.projectPath}
                onChange={(e) => setFilters(prev => ({ ...prev, projectPath: e.target.value }))}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">{t('sessionsModal.allProjects', 'All Projects')}</option>
                {projects.map(p => (
                  <option key={p.fullPath} value={p.fullPath}>{p.name}</option>
                ))}
              </select>
              
              {/* Sort */}
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => handleSortChange(e.target.value)}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredSessions.length === 0 ? (
            <EmptySessionsState 
              hasFilters={filters.searchQuery !== '' || filters.provider !== 'all' || filters.projectPath !== 'all'}
            />
          ) : (
            <div className="space-y-2">
              {filteredSessions.map(session => (
                <SessionCard
                  key={`${session.provider}-${session.id}`}
                  session={session}
                  onSelect={() => {
                    onSessionSelect(session);
                    onClose();
                  }}
                  onDelete={() => onSessionDelete(session)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionsModal;
