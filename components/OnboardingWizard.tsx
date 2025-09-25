import React, { useState } from 'react';
import { signOut } from '../services/firebase';
import { trackEvent } from '../services/geminiService';
import type { User, StyleProfile, BodyType } from '../types';
import { BodyTypeSelector } from './BodyTypeSelector';
import { resizeImageToDataUrl } from '../utils/imageProcessor';

interface OnboardingWizardProps {
    user: User;
    onComplete: (profile: StyleProfile) => Promise<void> | void;
}

const steps = ['Profile Photo', 'Style Vibe', 'Color Palette', 'Favorite Colors', 'Favorite Brands', 'Body Type'];

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
            <div key={step} className="flex-1 h-1.5 rounded-full transition-colors duration-300" style={{ backgroundColor: index <= currentStep ? '#C2BEBA' : 'rgba(194, 190, 186, 0.3)' }}></div>
        ))}
    </div>
);

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [profile, setProfile] = useState<Partial<StyleProfile>>({
        styleArchetypes: [],
        colorPalettes: [],
        favoriteColors: '',
        favoriteBrands: '',
        bodyType: 'None',
        avatarDataUrl: user.picture || undefined,
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>(user.picture || '');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const handleArchetypeToggle = (name: string) => {
        setProfile(prev => {
            const current = prev.styleArchetypes || [];
            const isSelected = current.includes(name);
            const newSelection = isSelected ? current.filter(item => item !== name) : [...current, name];
            return { ...prev, styleArchetypes: newSelection.slice(0, 3) };
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
        if (currentStep === 1 && (profile.styleArchetypes?.length || 0) === 0) return true;
        if (currentStep === 2 && (profile.colorPalettes?.length || 0) === 0) return true;
        if (currentStep === 5 && profile.bodyType === 'None') return true;
        return false;
    };
    
    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-platinum">Add a profile photo (optional)</h2>
                        <p className="mt-2 text-platinum/60">This helps your stylist recognize you. You can change it later.</p>
                        <div className="mt-6 flex items-center gap-6">
                            <img src={avatarPreview || user.picture} alt={user.name} className="h-28 w-28 rounded-full border-2 border-platinum/30 object-cover" />
                            <div>
                                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-full bg-platinum text-dark-blue font-semibold hover:opacity-90">Upload Photo</button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                        const dataUrl = await resizeImageToDataUrl(f, 512, 0.85);
                                        setAvatarPreview(dataUrl);
                                        setProfile(p => ({ ...p, avatarDataUrl: dataUrl }));
                                    }
                                }} />
                                <p className="mt-2 text-xs text-platinum/60">PNG/JPG, up to ~2MB</p>
                            </div>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-platinum">What's your style vibe?</h2>
                        <p className="mt-2 text-platinum/60">Choose up to three that best describe you. This helps us understand your core aesthetic.</p>
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {styleArchetypes.map(({ name, description }) => {
                                const isSelected = profile.styleArchetypes?.includes(name);
                                return (
                                <button key={name} onClick={() => handleArchetypeToggle(name)} className={`p-4 rounded-2xl text-left transition-all duration-200 ${isSelected ? 'bg-platinum/10 ring-2 ring-platinum' : 'bg-black/20 ring-1 ring-platinum/20 hover:ring-platinum/40'}`}>
                                    <h3 className={`font-semibold ${isSelected ? 'text-platinum' : 'text-platinum/80'}`}>{name}</h3>
                                    <p className={`text-sm mt-1 ${isSelected ? 'text-platinum/80' : 'text-platinum/60'}`}>{description}</p>
                                </button>
                                )
                            })}
                        </div>
                    </div>
                );
            case 2:
                return (
                     <div>
                        <h2 className="text-2xl font-bold text-platinum">Which colors are you drawn to?</h2>
                        <p className="mt-2 text-platinum/60">Select one or two palettes you love to wear.</p>
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                           {colorPalettes.map(({ name, colors }) => {
                               const isSelected = profile.colorPalettes?.includes(name);
                               return (
                                   <button key={name} onClick={() => handlePaletteToggle(name)} className={`p-4 rounded-2xl text-left transition-all duration-200 ${isSelected ? 'bg-platinum/10 ring-2 ring-platinum' : 'bg-black/20 ring-1 ring-platinum/20 hover:ring-platinum/40'}`}>
                                       <div className="flex space-x-1.5">
                                           {colors.map(color => <div key={color} className="w-6 h-6 rounded-full border border-black/20" style={{ backgroundColor: color }} />)}
                                       </div>
                                       <h3 className={`font-semibold mt-3 ${isSelected ? 'text-platinum' : 'text-platinum/80'}`}>{name}</h3>
                                   </button>
                               )
                           })}
                        </div>
                    </div>
                );
            case 3:
                return (
                     <div>
                        <h2 className="text-2xl font-bold text-platinum">Any favorite colors? (Optional)</h2>
                        <p className="mt-2 text-platinum/60">Tell us about specific colors or palettes you love. This adds another layer of personalization.</p>
                        <div className="mt-6">
                            <input
                                type="text"
                                value={profile.favoriteColors}
                                onChange={(e) => setProfile(p => ({...p, favoriteColors: e.target.value}))}
                                placeholder="e.g., forest green, lavender, terracotta"
                                className="block w-full shadow-sm sm:text-lg bg-dark-blue border-platinum/30 rounded-full focus:ring-platinum focus:border-platinum transition-colors text-platinum placeholder-platinum/50 px-6 py-3"
                            />
                        </div>
                    </div>
                );
            case 4:
                 return (
                     <div>
                        <h2 className="text-2xl font-bold text-platinum">Any favorite brands? (Optional)</h2>
                        <p className="mt-2 text-platinum/60">Listing brands you admire helps us nail down your style. Separate them with commas.</p>
                        <div className="mt-6">
                            <input
                                type="text"
                                value={profile.favoriteBrands}
                                onChange={(e) => setProfile(p => ({...p, favoriteBrands: e.target.value}))}
                                placeholder="e.g., Everlane, Zara, Patagonia"
                                className="block w-full shadow-sm sm:text-lg bg-dark-blue border-platinum/30 rounded-full focus:ring-platinum focus:border-platinum transition-colors text-platinum placeholder-platinum/50 px-6 py-3"
                            />
                        </div>
                    </div>
                );
            case 5:
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
        <div className="min-h-screen bg-dark-blue flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-4xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-platinum tracking-tight">Welcome, {user.name.split(' ')[0]}!</h1>
                    <p className="mt-1 text-lg text-platinum/60">Let's set up your Style Profile.</p>
                </div>
                
                <div className="mt-8 bg-dark-blue/80 backdrop-blur-lg rounded-2xl shadow-lg border border-platinum/20">
                    <div className="p-6 md:p-8 border-b border-platinum/20">
                        <ProgressBar currentStep={currentStep} />
                    </div>
                    <div className="p-6 md:p-8 min-h-[400px]">
                        {renderStepContent()}
                    </div>
                    <div className="bg-dark-blue px-6 py-4 flex justify-between items-center rounded-b-2xl border-t border-platinum/20">
                        <button 
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className="px-6 py-2 bg-dark-blue border border-platinum/30 rounded-full shadow-sm text-sm font-medium text-platinum/80 hover:bg-black/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Back
                        </button>
                        {currentStep < steps.length - 1 ? (
                            <button 
                                onClick={nextStep}
                                disabled={isNextDisabled()}
                                className="px-6 py-2 bg-platinum text-dark-blue border border-transparent rounded-full shadow-sm text-sm font-medium hover:scale-105 disabled:bg-platinum/50 disabled:cursor-not-allowed transition-transform"
                            >
                                Next
                            </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={async () => {
                                                                 if (isNextDisabled() || submitting) return;
                                                                 setSubmitting(true);
                                                                 setSubmitError(null);
                                                                 const started = Date.now();
                                                                 try {
                                                                     const finalProfile: StyleProfile = {
                                                                         styleArchetypes: profile.styleArchetypes || [],
                                                                         colorPalettes: profile.colorPalettes || [],
                                                                         favoriteColors: profile.favoriteColors || '',
                                                                         favoriteBrands: profile.favoriteBrands || '',
                                                                         bodyType: (profile.bodyType || 'None') as BodyType,
                                                                         avatarDataUrl: profile.avatarDataUrl,
                                                                     };
                                                                     if (finalProfile.bodyType === 'None' || finalProfile.styleArchetypes.length === 0) {
                                                                         setSubmitError('Please complete required fields.');
                                                                         setSubmitting(false);
                                                                         return;
                                                                     }
                                                                     console.log('[onboarding-finish-click]', finalProfile);
                                                                     const maybePromise = onComplete(finalProfile);
                                                                     if (maybePromise && typeof (maybePromise as any).then === 'function') {
                                                                         await maybePromise;
                                                                     }
                                                                     console.log('[onboarding-finish-complete] elapsedMs=', Date.now() - started);
                                                                 } catch (e: any) {
                                                                     console.error('[onboarding-finish-error]', e);
                                                                     setSubmitError(e?.message || 'Failed to finish onboarding.');
                                                                 } finally {
                                                                     setSubmitting(false);
                                                                 }
                                                            }}
                                                            disabled={isNextDisabled() || submitting}
                                                            className="px-6 py-2 bg-platinum text-dark-blue border border-transparent rounded-full shadow-sm text-sm font-medium hover:scale-105 disabled:bg-platinum/50 disabled:cursor-not-allowed transition-transform"
                                                        >
                                                            {submitting ? 'Finishing…' : 'Finish'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={async () => { try { trackEvent('onboarding_abort'); } catch {} await signOut(); }}
                                                            className="ml-4 text-xs text-platinum/60 hover:text-white underline decoration-platinum/30 underline-offset-4"
                                                        >Sign out</button>
                                                    </>
                        )}
                    </div>
                    {submitError && (
                        <div className="px-6 pb-4 -mt-2 text-sm text-red-400">{submitError}</div>
                    )}
                </div>
            </div>
        </div>
    );
};