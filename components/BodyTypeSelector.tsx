import React from 'react';
import type { BodyType } from '../types';

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
  return (
    <div className="bg-white/60 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/50">
      <h3 className="text-xl font-semibold text-slate-900">3. Select Your Body Type</h3>
      <p className="text-sm text-slate-500 mt-1">This helps us give you more personalized advice.</p>
      
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {bodyTypesData.map(({ name, description, icon: Icon }) => {
            const isSelected = selectedBodyType === name;
            
            return (
                <button
                    key={name}
                    onClick={() => onBodyTypeChange(name)}
                    className={`flex flex-col items-center justify-start text-center p-3 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-500/50 ${
                      isSelected 
                        ? 'bg-purple-100 ring-2 ring-purple-500' 
                        : 'bg-slate-50/50 ring-1 ring-slate-200 hover:ring-purple-300'
                    }`}
                    aria-pressed={isSelected}
                >
                    <div className="w-12 h-12 text-slate-500">
                        <Icon />
                    </div>
                    <span className={`mt-2 block text-sm font-semibold ${isSelected ? 'text-purple-700' : 'text-slate-800'}`}>{name}</span>
                    <span className={`mt-1 hidden sm:block text-xs ${isSelected ? 'text-purple-600' : 'text-slate-500'}`}>{description}</span>
                </button>
            )
        })}
      </div>
    </div>
  );
};