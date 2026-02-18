// src/components/SessionsModal/EmptySessionsState.tsx

import React from 'react';
import { MessageSquare, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmptySessionsStateProps {
  hasFilters: boolean;
}

export const EmptySessionsState: React.FC<EmptySessionsStateProps> = ({ hasFilters }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        {hasFilters ? (
          <Search className="w-6 h-6 text-muted-foreground" />
        ) : (
          <MessageSquare className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <h3 className="font-medium mb-1">
        {hasFilters 
          ? t('sessionsModal.noMatchingSessions', 'No matching sessions')
          : t('sessionsModal.noSessions', 'No sessions yet')
        }
      </h3>
      <p className="text-sm text-muted-foreground">
        {hasFilters
          ? t('sessionsModal.tryAdjustingFilters', 'Try adjusting your filters')
          : t('sessionsModal.startNewSession', 'Start a new session to see it here')
        }
      </p>
    </div>
  );
};

export default EmptySessionsState;
