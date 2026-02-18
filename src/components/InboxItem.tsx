// src/components/InboxItem.tsx

import React, { useState, useRef } from 'react';
import { X, Pin, AlertCircle, Loader2, MessageCircle, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import ClaudeLogo from './ClaudeLogo';
import CursorLogo from './CursorLogo';
import CodexLogo from './CodexLogo';
import PiLogo from './PiLogo';
import type { InboxItem as InboxItemType, InboxState } from '../types/inbox';

interface InboxItemProps {
  item: InboxItemType;
  onSelect: (item: InboxItemType) => void;
  onDismiss?: (sessionId: string) => void;
  onPin?: (sessionId: string) => void;
  onUnpin?: (sessionId: string) => void;
  isPinned: boolean;
}

const STATE_ICONS: Record<InboxState, React.ElementType> = {
  'needs-input': AlertCircle,
  'processing': Loader2,
  'new-messages': MessageCircle,
  'completed': CheckCircle,
  'pinned': Pin,
};

const PROVIDER_LOGOS: Record<string, React.ElementType> = {
  claude: ClaudeLogo,
  cursor: CursorLogo,
  codex: CodexLogo,
  pi: PiLogo,
};

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export function InboxItem({
  item,
  onSelect,
  onDismiss,
  onPin,
  onUnpin,
  isPinned,
}: InboxItemProps): JSX.Element {
  const StateIcon = STATE_ICONS[item.state];
  const ProviderLogo = PROVIDER_LOGOS[item.provider] || ClaudeLogo;
  
  const canDismiss = item.state === 'new-messages' || item.state === 'completed' || item.state === 'pinned';
  const isProcessing = item.state === 'processing';
  const needsInput = item.state === 'needs-input';

  // Mobile swipe-to-dismiss
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(0);
  const SWIPE_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canDismiss) return;
    const diff = touchStartX.current - e.touches[0].clientX;
    if (diff > 0) {
      setSwipeX(Math.min(diff, SWIPE_THRESHOLD));
    }
  };

  const handleTouchEnd = () => {
    if (swipeX >= SWIPE_THRESHOLD && onDismiss) {
      onDismiss(item.sessionId);
    }
    setSwipeX(0);
  };

  return (
    <div
      className={cn(
        "group relative p-2 rounded-[2px] border transition-all duration-100 cursor-pointer",
        "session-card-tactile hover:border-border",
        needsInput && "border-l-2 border-l-[#d4ff00] dark:border-l-[#d4ff00] bg-[#fefce8]/30 dark:bg-[#1a1f00]/30",
        isProcessing && "bg-green-50/30 dark:bg-green-900/10"
      )}
      style={{ transform: `translateX(-${swipeX}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => onSelect(item)}
    >
      <div className="flex items-start gap-2">
        {/* State indicator */}
        <div className={cn(
          "w-5 h-5 rounded-[2px] flex items-center justify-center flex-shrink-0 mt-0.5",
          needsInput && "bg-[#d4ff00]/20 dark:bg-[#d4ff00]/10",
          isProcessing && "bg-green-100 dark:bg-green-900/30",
          item.state === 'new-messages' && "bg-blue-100 dark:bg-blue-900/30",
          item.state === 'completed' && "bg-muted",
          item.state === 'pinned' && "bg-yellow-100 dark:bg-yellow-900/30"
        )}>
          <StateIcon 
            className={cn(
              "w-3 h-3",
              needsInput && "text-[#a3c400] dark:text-[#d4ff00]",
              isProcessing && "text-green-600 dark:text-green-400 animate-spin",
              item.state === 'new-messages' && "text-blue-600 dark:text-blue-400",
              item.state === 'completed' && "text-muted-foreground",
              item.state === 'pinned' && "text-yellow-600 dark:text-yellow-400"
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground truncate">
              {item.projectDisplayName}
            </span>
            <ProviderLogo className="w-3 h-3 flex-shrink-0 opacity-60" />
          </div>
          <div className="text-sm font-medium text-foreground truncate mt-0.5">
            {item.permissionPrompt || item.sessionTitle}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {formatTimeAgo(item.timestamp)}
          </div>
        </div>

        {/* Action buttons (show on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Pin/Unpin button */}
          {item.state !== 'pinned' && onPin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPin(item.sessionId);
              }}
              className="w-6 h-6 rounded-[2px] bg-secondary hover:bg-secondary/80 flex items-center justify-center"
              title="Pin session"
            >
              <Pin className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
          {item.state === 'pinned' && onUnpin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnpin(item.sessionId);
              }}
              className="w-6 h-6 rounded-[2px] bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 flex items-center justify-center"
              title="Unpin session"
            >
              <Pin className="w-3 h-3 text-yellow-600 dark:text-yellow-400 fill-current" />
            </button>
          )}
          
          {/* Dismiss button */}
          {canDismiss && onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(item.sessionId);
              }}
              className="w-6 h-6 rounded-[2px] bg-secondary hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center"
              title="Dismiss"
            >
              <X className="w-3 h-3 text-muted-foreground hover:text-red-600 dark:hover:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      )}

      {/* Swipe indicator background */}
      {swipeX > 0 && (
        <div 
          className="absolute right-0 top-0 bottom-0 bg-red-500/20 flex items-center justify-center"
          style={{ width: `${swipeX}px` }}
        >
          <X className="w-4 h-4 text-red-500" />
        </div>
      )}
    </div>
  );
}

export default InboxItem;
