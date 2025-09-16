import React, { useState } from 'react';
import type { User, StyleProfile, BodyType } from '../types';
import { BodyTypeSelector } from './BodyTypeSelector';

interface OnboardingWizardProps {
  user: User;
  onComplete: (profile: StyleProfile) => void;
}

const steps = ['Style Vibe', 'Color Palette', 'Favorite Brands', 'Body Type'];

const styleArchetypes = [
    { name: 'Minimalist', description: 'Clean lines, neutral colors, and simple silhouettes.' },
    { name: 'Streetwear', description: 'Comfortable, casual, with a touch of urban edge.' },
    { name: 'Classic', description: 'Timeless pieces, tailored cuts, and elegant fabrics.' },
    { name: 'Bohemian', description: 'Free-spirited, earthy tones, and flowing fabrics.' },
    { name: 'Edgy', description: 'Bold, dark colors, leather, and statement pieces.' },
    { name: 'Vibrant', description: 'Playful, colorful patterns, and maximalist energy.' },
];

const colorPalettes = [
    { name: 'Earthy Neutrals', colors: ['#BDB7AB', '#8A7B66', '#4A4031', '#F1ECE2'] },
    // Fix: Corrected a typo in the object property key.
    { name: 'Bold & Bright', colors: ['#E63946', '#F4A261', '#2A9D8F', '#264653'] },
    { name: 'Monochrome', colors: ['#000000', '#555555', '#AAAAAA', '#FFFFFF'] },
    { name: 'Pastels', colors: ['#A8DADC', '#F1FAEE', '#FFDDC1', '#E0BBE4'] },
    { name: 'Deep Tones', colors: ['#800020', '#000080', '#006400', '#4B0082'] },
];

const ProgressBar: React.FC<{ currentStep: number }> = ({ currentStep }) => (
    <div className="flex items-center space-x-2">
        {steps.map((step, index) => (
            <div key={step} className="flex-1 h-2 rounded-full transition-colors duration-300" style={{ backgroundColor: index <= currentStep ? '#8B5CF6' : '#E5E7EB' }}></div>
        ))}
    </div>
);

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [profile, setProfile] = useState<Partial<StyleProfile>>({
        styleArchetypes: [],
        colorPalettes: [],
        favoriteBrands: '',
        bodyType: 'None',
    });

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const handleArchetypeToggle = (name: string) => {
        setProfile(prev => {
            const current = prev.styleArchetypes || [];
            const isSelected = current.includes(name);
            const newSelection = isSelected ? current.filter(item => item !== name) : [...current, name];
            return { ...prev, styleArchetypes: newSelection.slice(0, 2) };
        });
    };
    
    const handlePaletteToggle = (name: string) => {
        setProfile(prev => {
            const current = prev.colorPalettes || [];
            const isSelected = current.includes(name);
            const newSelection = isSelected ? current.filter(item => item !== name) : [...current, name];
            return { ...prev, colorPalettes: newSelection.slice(0, 2) };
        });
    };

    const isNextDisabled = () => {
        if (currentStep === 0 && (profile.styleArchetypes?.length || 0) === 0) return true;
        if (currentStep === 1 && (profile.colorPalettes?.length || 0) === 0) return true;
        if (currentStep === 3 && profile.bodyType === 'None') return true;
        return false;
    };
    
    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">What's your style vibe?</h2>
                        <p className="mt-2 text-slate-500">Choose one or two that best describe you. This helps us understand your core aesthetic.</p>
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {styleArchetypes.map(({ name, description }) => {
                                const isSelected = profile.styleArchetypes?.includes(name);
                                return (
                                <button key={name} onClick={() => handleArchetypeToggle(name)} className={`p-4 rounded-2xl text-left transition-all duration-200 ${isSelected ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-slate-50/50 ring-1 ring-slate-200 hover:ring-purple-300'}`}>
                                    <h3 className={`font-semibold ${isSelected ? 'text-purple-700' : 'text-slate-800'}`}>{name}</h3>
                                    <p className={`text-sm mt-1 ${isSelected ? 'text-purple-600' : 'text-slate-500'}`}>{description}</p>
                                </button>
                                )
                            })}
                        </div>
                    </div>
                );
            case 1:
                return (
                     <div>
                        <h2 className="text-2xl font-bold text-slate-900">Which colors are you drawn to?</h2>
                        <p className="mt-2 text-slate-500">Select one or two palettes you love to wear.</p>
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                           {colorPalettes.map(({ name, colors }) => {
                               const isSelected = profile.colorPalettes?.includes(name);
                               return (
                                   <button key={name} onClick={() => handlePaletteToggle(name)} className={`p-4 rounded-2xl text-left transition-all duration-200 ${isSelected ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-slate-50/50 ring-1 ring-slate-200 hover:ring-purple-300'}`}>
                                       <div className="flex space-x-1.5">
                                           {colors.map(color => <div key={color} className="w-6 h-6 rounded-full" style={{ backgroundColor: color }} />)}
                                       </div>
                                       <h3 className={`font-semibold mt-3 ${isSelected ? 'text-purple-700' : 'text-slate-800'}`}>{name}</h3>
                                   </button>
                               )
                           })}
                        </div>
                    </div>
                );
            case 2:
                 return (
                     <div>
                        <h2 className="text-2xl font-bold text-slate-900">Any favorite brands? (Optional)</h2>
                        <p className="mt-2 text-slate-500">Listing brands you admire helps us nail down your style. Separate them with commas.</p>
                        <div className="mt-6">
                            <input
                                type="text"
                                value={profile.favoriteBrands}
                                onChange={(e) => setProfile(p => ({...p, favoriteBrands: e.target.value}))}
                                placeholder="e.g., Everlane, Zara, Patagonia"
                                className="block w-full shadow-sm sm:text-lg border-slate-300 rounded-full focus:ring-purple-500 focus:border-purple-500 transition-colors px-6 py-3"
                            />
                        </div>
                    </div>
                );
            case 3:
                return (
                    <BodyTypeSelector 
                        selectedBodyType={profile.bodyType || 'None'} 
                        onBodyTypeChange={(bt) => setProfile(p => ({...p, bodyType: bt}))}
                    />
                );
            default: return null;
        }
    }


    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-4xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome, {user.name.split(' ')[0]}!</h1>
                    <p className="mt-1 text-lg text-slate-500">Let's set up your Style Profile.</p>
                </div>
                
                <div className="mt-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50">
                    <div className="p-6 md:p-8 border-b border-slate-200">
                        <ProgressBar currentStep={currentStep} />
                    </div>
                    <div className="p-6 md:p-8 min-h-[400px]">
                        {renderStepContent()}
                    </div>
                    <div className="bg-slate-50 px-6 py-4 flex justify-between items-center rounded-b-2xl border-t border-slate-200">
                        <button 
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className="px-6 py-2 bg-white border border-slate-300 rounded-full shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Back
                        </button>
                        {currentStep < steps.length - 1 ? (
                            <button 
                                onClick={nextStep}
                                disabled={isNextDisabled()}
                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-500 border border-transparent rounded-full shadow-sm text-sm font-medium text-white hover:scale-105 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-transform"
                            >
                                Next
                            </button>
                        ) : (
                             <button 
                                onClick={() => onComplete(profile as StyleProfile)}
                                disabled={isNextDisabled()}
                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-500 border border-transparent rounded-full shadow-sm text-sm font-medium text-white hover:scale-105 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-transform"
                            >
                                Finish
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};