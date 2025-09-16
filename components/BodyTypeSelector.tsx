import React, { useState } from 'react';
import type { BodyType } from '../types';
import { BodyTypeGuideModal } from './BodyTypeGuideModal';

interface BodyTypeSelectorProps {
  selectedBodyType: BodyType;
  onBodyTypeChange: (bodyType: BodyType) => void;
}

const bodyTypeIcons = {
  Apple: () => <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="32" cy="32" r="18" /></svg>,
  Pear: () => <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3"><path d="M32 12 L12 52 L52 52 Z" /></svg>,
  Rectangle: () => <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3"><rect x="18" y="10" width="28" height="44" /></svg>,
  'Inverted Triangle': () => <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 12 L52 12 L32 52 Z" /></svg>,
  Hourglass: () => <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 12 L50 12 L32 32 L50 52 L14 52 L32 32 Z" /></svg>,
};

const bodyTypesData: { name: BodyType; description: string; icon: React.FC }[] = [
    { name: 'Apple', description: 'Broader torso, fuller midsection.', icon: bodyTypeIcons.Apple },
    { name: 'Pear', description: 'Wider hips, narrower shoulders.', icon: bodyTypeIcons.Pear },
    { name: 'Rectangle', description: 'Similar width for shoulders, waist, and hips.', icon: bodyTypeIcons.Rectangle },
    { name: 'Inverted Triangle', description: 'Broader shoulders, narrower hips.', icon: bodyTypeIcons['Inverted Triangle'] },
    { name: 'Hourglass', description: 'Similar shoulder and hip width with a defined waist.', icon: bodyTypeIcons.Hourglass },
];

export const BodyTypeSelector: React.FC<BodyTypeSelectorProps> = ({ selectedBodyType, onBodyTypeChange }) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <>
      <div className="bg-dark-blue/80 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-platinum/20">
        <div>
          <h3 className="text-xl font-semibold text-platinum uppercase tracking-wider">3. Select Your Body Type</h3>
          <p className="text-sm text-platinum/60 mt-1">This helps us give you more personalized advice.
            <button
              onClick={() => setIsGuideOpen(true)}
              className="ml-2 text-platinum/80 hover:text-white font-medium text-sm underline focus:outline-none focus:ring-2 focus:ring-platinum rounded"
            >
              Help me choose
            </button>
          </p>
        </div>
        
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {bodyTypesData.map(({ name, description, icon: Icon }) => {
              const isSelected = selectedBodyType === name;
              
              return (
                  <button
                      key={name}
                      onClick={() => onBodyTypeChange(name)}
                      className={`flex flex-col items-center justify-start text-center p-3 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-platinum/50 ${
                        isSelected 
                          ? 'bg-platinum/10 ring-2 ring-platinum' 
                          : 'bg-black/20 ring-1 ring-platinum/20 hover:ring-platinum/40'
                      }`}
                      aria-pressed={isSelected}
                  >
                      <div className={`w-12 h-12 transition-colors ${isSelected ? 'text-platinum' : 'text-platinum/60'}`}>
                          <Icon />
                      </div>
                      <span className={`mt-2 block text-sm font-semibold transition-colors ${isSelected ? 'text-platinum' : 'text-platinum/80'}`}>{name}</span>
                      <span className={`mt-1 hidden sm:block text-xs transition-colors ${isSelected ? 'text-platinum/90' : 'text-platinum/60'}`}>{description}</span>
                  </button>
              )
          })}
        </div>
      </div>
      {isGuideOpen && <BodyTypeGuideModal onClose={() => setIsGuideOpen(false)} icons={bodyTypeIcons} />}
    </>
  );
};