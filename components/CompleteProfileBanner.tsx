import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface CompleteProfileBannerProps {
  onOpen: () => void;
}

export const CompleteProfileBanner: React.FC<CompleteProfileBannerProps> = ({ onOpen }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed top-6 right-6 z-40 animate-fade-in">
      <button
        onClick={onOpen}
        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-dark-blue/60 backdrop-blur-lg border border-platinum/30 text-platinum text-sm font-medium hover:border-platinum/60 hover:bg-dark-blue/70 transition-all shadow-lg hover:shadow-xl"
        aria-label="Complete your style profile"
      >
        <SparklesIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span>Complete Your Style Profile</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          className="ml-2 text-platinum/50 hover:text-platinum transition-colors"
          aria-label="Dismiss"
        >
          ×
        </button>
      </button>
    </div>
  );
};
