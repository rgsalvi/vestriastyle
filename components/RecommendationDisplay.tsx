import React, { useState, useEffect, useRef } from 'react';
import type { AiResponse, Outfit, AnalysisItem } from '../types';
import { editOutfitImage } from '../services/geminiService';
import { PremiumUpsellModal } from './PremiumUpsellModal';

interface RecommendationDisplayProps {
  recommendation: AiResponse | null;
  isLoading: boolean;
  unsavedItems: AnalysisItem[];
  onSaveUnsavedItems: () => void;
}

const VestriaSymbol: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 100"
        className={className}
        aria-hidden="true"
    >
        <g fill="currentColor" stroke="currentColor" strokeWidth="8" strokeLinecap="round">
            <circle cx="20" cy="20" r="8" stroke="none"/>
            <circle cx="50" cy="20" r="8" stroke="none"/>
            <circle cx="80" cy="20" r="8" stroke="none"/>
            <circle cx="20" cy="50" r="8" stroke="none"/>
            <circle cx="50" cy="50" r="8" stroke="none"/>
            <circle cx="80" cy="50" r="8" stroke="none"/>
            <circle cx="20" cy="80" r="8" stroke="none"/>
            <circle cx="50" cy="80" r="8" stroke="none"/>
            <circle cx="80" cy="80" r="8" stroke="none"/>
            <line x1="80" y1="20" x2="20" y2="80"/>
            <line x1="20" y1="20" x2="42" y2="42"/>
            <line x1="58" y1="58" x2="80" y2="80"/>
        </g>
    </svg>
);


const InitialState: React.FC = () => (
    <div className="text-center p-8">
        <VestriaSymbol className="mx-auto h-20 w-20 text-platinum/20" />
        <h3 className="mt-4 text-xl font-medium text-platinum">Your Personal Stylist Awaits</h3>
        <p className="mt-2 text-base text-platinum/60">Upload your items and let our AI provide expert style advice and create perfect outfits for you.</p>
    </div>
);

const Stardust: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
            <div
                key={i}
                className="absolute bg-platinum/70 rounded-full"
                style={{
                    width: `${Math.random() * 2 + 1}px`,
                    height: `${Math.random() * 2 + 1}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animation: `stardust-float ${Math.random() * 3 + 4}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 4}s`,
                }}
            />
        ))}
    </div>
);

const LoadingState: React.FC = () => (
    <div className="text-center p-8 relative">
        <Stardust />
        <VestriaSymbol className="mx-auto h-20 w-20 text-platinum animate-pulse-gentle" />
        <h3 className="mt-6 text-xl font-medium text-platinum">Curating Your Look...</h3>
        <p className="mt-2 text-base text-platinum/60">Our AI stylist is analyzing your items and visualizing the perfect outfits. This might take a moment.</p>
    </div>
);

const WandIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11.956 2.025a.5.5 0 00-.58.02l-2.45 2.45a.5.5 0 000 .707l4.9 4.9a.5.5 0 00.707 0l2.45-2.45a.5.5 0 00.02-.58l-1.04-3.48A.5.5 0 0015.5 6h-2.207a.5.5 0 00-.354.146L11.2 7.883l-2.12-2.12.33-.33a.5.5 0 000-.707l-.33-.33 1.05-1.05a.5.5 0 00.02-.58L11.956 2.025zM8.5 7.5a.5.5 0 000-1H7.883L6.146 4.757A.5.5 0 005.5 4h-2a.5.5 0 00-.354.146L2.146 5.146A.5.5 0 002 5.5v2a.5.5 0 00.146.354L3.146 8.854A.5.5 0 003.5 9h2.207a.5.5 0 00.354-.146L7.883 7.117l2.12 2.12-.33.33a.5.5 0 000 .707l.33.33-1.05 1.05a.5.5 0 00-.02.58l.8 2.65A.5.5 0 0011 14h2.207a.5.5 0 00.354-.146l1.043-1.043a.5.5 0 000-.707l-4.9-4.9a.5.5 0 00-.707 0L8.5 7.5z" />
    </svg>
);

const ChatIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
    </svg>
);


interface OutfitCarouselProps {
    outfits: Outfit[];
    images: string[];
    onImageUpdate: (index: number, newImage: string) => void;
}

const OutfitCarousel: React.FC<OutfitCarouselProps> = ({ outfits, images, onImageUpdate }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);

    const goToPrevious = () => {
        setActiveIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setActiveIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    };
    
    const handleRefineClick = () => {
        setEditingIndex(activeIndex);
        setError(null);
        setEditText('');
    };
    
    const handleCancelEdit = () => {
        setEditingIndex(null);
    };

    const handleGenerateEdit = async () => {
        if (!editText || editingIndex === null) return;

        setIsGenerating(true);
        setError(null);
        try {
            const originalImageBase64 = images[editingIndex];
            // The image editing model usually returns PNGs.
            const mimeType = 'image/png'; 
            const newImage = await editOutfitImage(originalImageBase64, mimeType, editText);
            onImageUpdate(editingIndex, newImage);
            setEditingIndex(null);
        } catch(err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const currentOutfit = outfits[activeIndex];

    return (
      <>
      <div className="space-y-4">
          <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-platinum/20 aspect-square">
                  <img
                      src={`data:image/png;base64,${images[activeIndex]}`}
                      alt={`AI-generated visualization for ${currentOutfit.title}`}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      key={activeIndex}
                  />
              </div>
              {images.length > 1 && (
                  <>
                      <button onClick={goToPrevious} className="absolute left-3 top-1/2 -translate-y-1/2 bg-dark-blue/70 backdrop-blur-sm rounded-full p-2 hover:bg-dark-blue transition-all shadow-md hover:scale-110">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-platinum" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button onClick={goToNext} className="absolute right-3 top-1/2 -translate-y-1/2 bg-dark-blue/70 backdrop-blur-sm rounded-full p-2 hover:bg-dark-blue transition-all shadow-md hover:scale-110">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-platinum" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                  </>
              )}
          </div>
          
          <div className="p-4 bg-black/20 rounded-2xl border border-platinum/20">
              <p className="font-semibold text-platinum">{currentOutfit.title}</p>
              <ul className="mt-2 list-disc list-inside text-platinum/70 space-y-1 text-sm">
                  {currentOutfit.items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <div className="mt-3 pt-3 border-t border-platinum/20">
                {editingIndex === activeIndex ? (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            placeholder="e.g., 'Change the shoes to sneakers'"
                            className="block w-full shadow-sm sm:text-sm bg-dark-blue border-platinum/30 rounded-full focus:ring-platinum focus:border-platinum transition-colors text-platinum placeholder-platinum/50"
                            aria-label="Edit outfit prompt"
                        />
                        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                        <div className="flex justify-end space-x-2">
                            <button onClick={handleCancelEdit} className="px-3 py-1 bg-dark-blue border border-platinum/30 rounded-full text-xs font-medium text-platinum/80 hover:bg-black/20">Cancel</button>
                            <button 
                                onClick={handleGenerateEdit} 
                                disabled={isGenerating || !editText}
                                className="px-3 py-1 bg-platinum border border-transparent rounded-full text-xs font-medium text-dark-blue hover:bg-platinum/90 disabled:bg-platinum/50 disabled:cursor-not-allowed flex items-center"
                            >
                                {isGenerating && <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-dark-blue mr-1.5"></div>}
                                {isGenerating ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={handleRefineClick}
                            className="w-full flex items-center justify-center text-sm font-semibold py-2 px-4 rounded-full bg-platinum/10 hover:bg-platinum/20 hover:shadow-glow text-platinum transition-all duration-200 ring-1 ring-platinum/20"
                        >
                            <WandIcon />
                            Refine Outfit
                        </button>
                        <button
                            onClick={() => setIsUpsellModalOpen(true)}
                            className="w-full flex items-center justify-center text-sm font-semibold py-2 px-4 rounded-full bg-platinum hover:bg-platinum/90 hover:shadow-glow text-dark-blue transition-all duration-200"
                        >
                            <ChatIcon />
                            Chat with a Stylist
                            <span className="ml-1.5 inline-block bg-dark-blue text-platinum text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">PRO</span>
                        </button>
                    </div>
                )}
            </div>
          </div>

          {images.length > 1 && (
              <div className="flex justify-center space-x-2 pt-2">
                  {images.map((_, index) => (
                      <button key={index} onClick={() => setActiveIndex(index)} className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${activeIndex === index ? 'bg-platinum scale-125' : 'bg-platinum/40 hover:bg-platinum/60'}`}></button>
                  ))}
              </div>
          )}
      </div>
      {isUpsellModalOpen && <PremiumUpsellModal onClose={() => setIsUpsellModalOpen(false)} />}
      </>
    );
}

const UnsavedItems: React.FC<{ items: AnalysisItem[], onSave: () => void }> = ({ items, onSave }) => {
    if (items.length === 0) return null;

    return (
        <div className="mt-6 p-4 bg-black/20 border-t-2 border-b-2 border-platinum/20">
            <h4 className="text-lg font-semibold text-platinum text-center">Save New Items</h4>
            <p className="text-sm text-platinum/60 mt-1 text-center">Add the items from this session to your permanent wardrobe.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
                {items.map((item, index) => (
                    <img key={index} src={item.preview} alt={`unsaved item ${index}`} className="h-16 w-16 object-cover rounded-lg shadow-md border-2 border-dark-blue" />
                ))}
            </div>
            <button
                onClick={onSave}
                className="mt-4 w-full bg-platinum text-dark-blue font-semibold py-2 px-4 rounded-full shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum"
            >
                Save to My Wardrobe
            </button>
        </div>
    );
};

export const RecommendationDisplay: React.FC<RecommendationDisplayProps> = ({ recommendation, isLoading, unsavedItems, onSaveUnsavedItems }) => {
  const [internalRecommendation, setInternalRecommendation] = useState<AiResponse | null>(null);
  const [runRevealAnimation, setRunRevealAnimation] = useState(false);
  const prevIsLoading = useRef(isLoading);

  useEffect(() => {
    if (recommendation) {
      setInternalRecommendation(recommendation);
    }
  }, [recommendation]);
  
  useEffect(() => {
    if (prevIsLoading.current && !isLoading && internalRecommendation) {
      setRunRevealAnimation(true);
      const timer = setTimeout(() => {
        setRunRevealAnimation(false);
      }, 1000); // Match animation duration
      return () => clearTimeout(timer);
    }
    prevIsLoading.current = isLoading;
  }, [isLoading, internalRecommendation]);
  
  const handleImageUpdate = (index: number, newImage: string) => {
    if (!internalRecommendation || !internalRecommendation.generatedOutfitImages) return;

    const newImages = [...internalRecommendation.generatedOutfitImages];
    newImages[index] = newImage;
    setInternalRecommendation({
        ...internalRecommendation,
        generatedOutfitImages: newImages,
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }
    if (!internalRecommendation) {
      return <InitialState />;
    }
    
    const { verdict, compatibility, advice, outfits, generatedOutfitImages } = internalRecommendation;

    const verdictClasses = verdict.includes('go for it')
      ? "bg-platinum/10 text-platinum border-platinum/30"
      : "bg-slate-700 text-platinum/80 border-slate-600";

    const hasVisuals = generatedOutfitImages && generatedOutfitImages.length > 0;
    
    const revealClasses = runRevealAnimation ? 'animate-shimmer relative overflow-hidden' : '';

    return (
      <div className={`space-y-6 ${revealClasses}`}>
        <div className={`p-4 rounded-2xl border ${verdictClasses}`}>
          <p className="text-lg font-semibold text-center uppercase tracking-widest">{verdict}</p>
        </div>
        
        {hasVisuals && (
          <div>
            <h4 className="text-lg font-semibold text-platinum mb-2 uppercase tracking-wider">Outfit Visualizations</h4>
            <OutfitCarousel outfits={outfits} images={generatedOutfitImages!} onImageUpdate={handleImageUpdate} />
          </div>
        )}
        
        <div>
          <h4 className="text-lg font-semibold text-platinum uppercase tracking-wider">Compatibility Analysis</h4>
          <p className="mt-2 text-platinum/80">{compatibility}</p>
        </div>

        {!hasVisuals && (
           <div>
              <h4 className="text-lg font-semibold text-platinum uppercase tracking-wider">Outfit Ideas</h4>
              <div className="mt-2 space-y-4">
                {outfits.map((outfit, index) => (
                  <div key={index} className="p-4 bg-black/20 rounded-2xl border border-platinum/20">
                    <p className="font-semibold text-platinum">{outfit.title}</p>
                    <ul className="mt-2 list-disc list-inside text-platinum/70 space-y-1">
                      {outfit.items.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
        )}

        <div>
          <h4 className="text-lg font-semibold text-platinum uppercase tracking-wider">Stylist's Advice</h4>
          <p className="mt-2 text-platinum/80">{advice}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-dark-blue/80 backdrop-blur-lg rounded-2xl shadow-lg border border-platinum/20 overflow-hidden">
      <div className="p-6 min-h-[400px] flex flex-col justify-center">
        {renderContent()}
      </div>
      <UnsavedItems items={unsavedItems} onSave={onSaveUnsavedItems} />
    </div>
  );
};