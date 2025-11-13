import React from 'react';
import ViewHeader from './ViewHeader';

interface ViewWrapperProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  canGoBack: boolean;
  children: React.ReactNode;
}

const ViewWrapper: React.FC<ViewWrapperProps> = ({ title, subtitle, onBack, canGoBack, children }) => {
  return (
    <div>
      <ViewHeader title={title} subtitle={subtitle} onBack={onBack} canGoBack={canGoBack} />
      {children}
    </div>
  );
};

export default ViewWrapper;
