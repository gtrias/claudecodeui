// src/components/Inbox.tsx

import React from 'react';
import { ChevronDown, ChevronRight, Inbox as InboxIcon, AlertCircle, Loader2, MessageCircle, CheckCircle, Pin } from 'lucide-react';
import { cn } from '../lib/utils';
import { InboxItem } from './InboxItem';
import { useTranslation } from 'react-i18next';
import type { InboxItem as InboxItemType, InboxSection, InboxState } from '../types/inbox';

interface InboxProps {
  sections: InboxSection[];
  totalCount: number;
  isCollapsed: boolean;
  onToggleInbox: () => void;
  onToggleSection: (state: InboxState) => void;
  onSelectItem: (item: InboxItemType) => void;
  onDismissItem: (sessionId: string) => void;
  onPinSession: (sessionId: string) => void;
  onUnpinSession: (sessionId: string) => void;
  isPinned: (sessionId: string) => boolean;
  isMobile?: boolean;
}

const STATE_ICONS: Record<InboxState, React.ElementType> = {
  'needs-input': AlertCircle,
  'processing': Loader2,
  'new-messages': MessageCircle,
  'completed': CheckCircle,
  'pinned': Pin,
};

const STATE_COLORS: Record<InboxState, string> = {
  'needs-input': 'text-[#a3c400] dark:text-[#d4ff00]',
  'processing': 'text-green-600 dark:text-green-400',
  'new-messages': 'text-blue-600 dark:text-blue-400',
  'completed': 'text-muted-foreground',
  'pinned': 'text-yellow-600 dark:text-yellow-400',
};

export function Inbox({
  sections,
  totalCount,
  isCollapsed,
  onToggleInbox,
  onToggleSection,
  onSelectItem,
  onDismissItem,
  onPinSession,
  onUnpinSession,
  isPinned,
  isMobile = false,
}: InboxProps): JSX.Element {
  const { t } = useTranslation('sidebar');

  // Empty state - show "All clear"
  if (totalCount === 0) {
    return (
      <div className="px-3 md:px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <InboxIcon className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wide">
            {t('inbox.title', 'Inbox')}
          </span>
          <span className="text-xs">·</span>
          <span className="text-xs">{t('inbox.allClear', 'All clear')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border">
      {/* Header */}
      <button
        onClick={onToggleInbox}
        className={cn(
          "w-full px-3 md:px-4 py-2 flex items-center justify-between",
          "hover:bg-accent/50 transition-colors"
        )}
      >
        <div className="flex items-center gap-2">
          <InboxIcon className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
            {t('inbox.title', 'Inbox')}
          </span>
          <span className={cn(
            "px-1.5 py-0.5 text-xs font-medium rounded-[2px]",
            "bg-primary/10 text-primary"
          )}>
            {totalCount}
          </span>
        </div>
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-2 md:px-3 pb-2 space-y-2">
          {sections.map((section) => {
            const SectionIcon = STATE_ICONS[section.state];
            
            return (
              <div key={section.state}>
                {/* Section Header */}
                <button
                  onClick={() => onToggleSection(section.state)}
                  className={cn(
                    "w-full px-2 py-1 flex items-center gap-2",
                    "hover:bg-accent/30 rounded-[2px] transition-colors"
                  )}
                >
                  <SectionIcon className={cn("w-3 h-3", STATE_COLORS[section.state])} />
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {section.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({section.items.length})
                  </span>
                  <div className="flex-1" />
                  {section.collapsed ? (
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>

                {/* Section Items */}
                {!section.collapsed && (
                  <div className="mt-1 space-y-1">
                    {section.items.map((item) => (
                      <InboxItem
                        key={item.sessionId}
                        item={item}
                        onSelect={onSelectItem}
                        onDismiss={onDismissItem}
                        onPin={onPinSession}
                        onUnpin={onUnpinSession}
                        isPinned={isPinned(item.sessionId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Inbox;
