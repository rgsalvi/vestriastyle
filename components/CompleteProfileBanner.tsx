import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface CompleteProfileBannerProps {
  onOpen: () => void;
}

export const CompleteProfileBanner: React.FC<CompleteProfileBannerProps> = ({ onOpen }) => {
  return (
    <button
      onClick={onOpen}
      className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-platinum/20 border border-platinum/40 text-platinum text-sm font-medium hover:bg-platinum/30 hover:border-platinum/60 transition-all"
      aria-label="Complete your style profile"
    >
      <SparklesIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
      <span>Complete Style Profile</span>
    </button>
  );
};
