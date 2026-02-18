// src/components/SessionsModal/SessionCard.tsx

import React, { useState } from 'react';
import { Trash2, Clock, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import type { UnifiedSession } from '../../types/session';
import ClaudeLogo from '../ClaudeLogo';
import CursorLogo from '../CursorLogo';
import CodexLogo from '../CodexLogo';
import PiLogo from '../PiLogo';

interface SessionCardProps {
  session: UnifiedSession;
  onSelect: () => void;
  onDelete: () => void;
}

const ProviderLogo: React.FC<{ provider: string; className?: string }> = ({ provider, className }) => {
  switch (provider) {
    case 'claude':
      return <ClaudeLogo className={className} />;
    case 'cursor':
      return <CursorLogo className={className} />;
    case 'codex':
      return <CodexLogo className={className} />;
    case 'pi':
      return <PiLogo className={className} />;
    default:
      return null;
  }
};

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onSelect,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-reset after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group p-3 md:p-4 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors",
        "flex items-center gap-3 min-h-[60px]"
      )}
    >
      {/* Provider Logo */}
      <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0">
        <ProviderLogo provider={session.provider} className="w-5 h-5" />
      </div>
      
      {/* Session Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{session.title}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(session.lastActivity)}
          </span>
          {session.messageCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {session.messageCount}
            </span>
          )}
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {session.projectName}
          </Badge>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant={showDeleteConfirm ? "destructive" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={handleDelete}
          title={showDeleteConfirm ? t('common.confirmDelete', 'Click to confirm') : t('common.delete', 'Delete')}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default SessionCard;
