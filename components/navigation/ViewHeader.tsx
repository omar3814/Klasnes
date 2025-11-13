import React from 'react';
import { ArrowLeftIcon } from '../icons/Icons.tsx';

interface ViewHeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  canGoBack: boolean;
}

const ViewHeader: React.FC<ViewHeaderProps> = ({ title, subtitle, onBack, canGoBack }) => {
  return (
    <header className="flex items-center gap-4 mb-8">
      {canGoBack && (
        <button
          onClick={onBack}
          className="p-3 bg-card rounded-full shadow-md border border-border text-foreground-muted hover:bg-muted hover:scale-105 active:scale-95 transition-all"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
      )}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </header>
  );
};

export default ViewHeader;
