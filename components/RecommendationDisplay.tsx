

import React, { useState, useEffect, useRef } from 'react';
import type { AiResponse, Outfit, AnalysisItem, User } from '../types';
import { editOutfitImage } from '../services/geminiService';

interface RecommendationDisplayProps {
  recommendation: AiResponse | null;
  isLoading: boolean;
  unsavedItems: AnalysisItem[];
  onSaveUnsavedItems: () => void;
  user: User | null;
  onOpenChat: (context: AiResponse) => void;
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
        {Array.from({ length: 50 }).map((_, i) => (
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
    <div className="text-center p-8 relative overflow-hidden">
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
    user: User | null;
    onOpenChat: () => void;
}

const OutfitCarousel: React.FC<OutfitCarouselProps> = ({ outfits, images, onImageUpdate, user, onOpenChat }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
    
    const handleChatClick = () => {
        onOpenChat();
    };
    
    const currentOutfit = outfits[activeIndex];

    return (
      <>
      <div className="space-y-4">
          <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-platinum/20 aspect-square bg-dark-blue/80">
                  <img
                      src={`data:image/png;base64,${images[activeIndex]}`}
                      alt={`AI-generated visualization for ${currentOutfit.title}`}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      key={activeIndex}
                  />
              </div>
              {images.length > 1 && (
                  <>
                      <button onClick={goToPrevious} className="absolute left-3 top-1/2 -translate-y-1/2 bg-dark-blue/70 backdrop-blur-sm rounded-full p-2 hover:bg-dark-blue transition-all shadow-md hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-platinum" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button onClick={goToNext} className="absolute right-3 top-1/2 -translate-y-1/2 bg-dark-blue/70 backdrop-blur-sm rounded-full p-2 hover:bg-dark-blue transition-all shadow-md hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-platinum" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                      </button>
                  </>
              )}
          </div>
          
          <div className="text-center">
            <h4 className="font-semibold text-lg text-platinum">{currentOutfit.title}</h4>
            <p className="text-sm text-platinum/60 mt-1">Items: {currentOutfit.items.join(', ')}</p>
          </div>

          {editingIndex === activeIndex ? (
              <div className="p-3 bg-black/20 rounded-xl space-y-2">
                 <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="e.g., 'Change the shoes to white sneakers'"
                    className="block w-full text-sm bg-dark-blue border-platinum/30 rounded-full focus:ring-platinum focus:border-platinum transition-colors text-platinum placeholder-platinum/50 px-4 py-2"
                 />
                 {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                 <div className="flex justify-end space-x-2">
                    <button onClick={handleCancelEdit} className="text-xs font-semibold text-platinum/70 hover:text-white px-3 py-1">Cancel</button>
                    <button onClick={handleGenerateEdit} disabled={isGenerating} className="text-xs font-semibold text-dark-blue bg-platinum rounded-full px-3 py-1 disabled:bg-platinum/50 transition-colors">
                        {isGenerating ? 'Generating...' : 'Generate'}
                    </button>
                 </div>
              </div>
          ) : (
             <div className="grid grid-cols-2 gap-3">
                 <button onClick={handleRefineClick} className="flex items-center justify-center text-sm font-semibold py-2 px-4 rounded-full bg-platinum/10 hover:bg-platinum/20 text-platinum ring-1 ring-inset ring-platinum/30 transition-colors duration-200">
                    <WandIcon />
                    Refine This Look
                 </button>
                 <button onClick={handleChatClick} className="flex items-center justify-center text-sm font-semibold py-2 px-4 rounded-full bg-platinum/10 hover:bg-platinum/20 text-platinum ring-1 ring-inset ring-platinum/30 transition-colors duration-200">
                    <ChatIcon />
                    Chat with a Stylist
                    {!user && <span className="ml-1.5 inline-block bg-dark-blue text-platinum text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">PRO</span>}
                 </button>
             </div>
          )}
      </div>
      </>
    );
};

export const RecommendationDisplay: React.FC<RecommendationDisplayProps> = ({ recommendation, isLoading, unsavedItems, onSaveUnsavedItems, user, onOpenChat }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [updatedImages, setUpdatedImages] = useState<string[]>([]);
    
    useEffect(() => {
        if (recommendation?.generatedOutfitImages) {
            setUpdatedImages(recommendation.generatedOutfitImages);
        }
    }, [recommendation]);
    
    useEffect(() => {
        if (isLoading || recommendation) {
            containerRef.current?.classList.remove('animate-fade-in');
            // This is a trick to re-trigger the animation
            void containerRef.current?.offsetWidth;
            containerRef.current?.classList.add('animate-fade-in');
        }
    }, [isLoading, recommendation]);
    
    const handleImageUpdate = (index: number, newImage: string) => {
        setUpdatedImages(prev => {
            const newImages = [...prev];
            newImages[index] = newImage;
            return newImages;
        });
    };
    
    const hasGeneratedImages = updatedImages && updatedImages.length > 0;
    
    return (
        <div ref={containerRef} className="bg-dark-blue/80 backdrop-blur-lg rounded-2xl shadow-lg border border-platinum/20 min-h-[400px] flex flex-col justify-center transition-all duration-300">
            {isLoading && <LoadingState />}

            {!isLoading && !recommendation && <InitialState />}

            {!isLoading && recommendation && (
                <div className="p-4 md:p-6 space-y-4">
                    <div className={`p-4 rounded-xl text-center ${recommendation.verdict.includes('great') ? 'bg-platinum/10 text-platinum ring-1 ring-platinum/40' : 'bg-black/20 text-platinum/70 ring-1 ring-platinum/20'}`}>
                        <p className="font-semibold text-lg uppercase tracking-wider">{recommendation.verdict.replace('Verdict: ', '')}</p>
                    </div>

                    <p className="text-base text-platinum/80">{recommendation.compatibility}</p>

                    {hasGeneratedImages && (
                        <OutfitCarousel
                            outfits={recommendation.outfits}
                            images={updatedImages}
                            onImageUpdate={handleImageUpdate}
                            user={user}
                            onOpenChat={() => onOpenChat(recommendation)}
                        />
                    )}

                    <div className="p-4 bg-black/20 rounded-xl space-y-2">
                        <h4 className="font-semibold text-platinum">Styling Tip:</h4>
                        <p className="text-sm text-platinum/80">{recommendation.advice}</p>
                    </div>

                    {unsavedItems.length > 0 && (
                        <div className="p-4 bg-blue-900/40 rounded-xl text-center ring-1 ring-blue-300/30">
                            <p className="text-sm text-blue-200">You used {unsavedItems.length} item{unsavedItems.length > 1 ? 's' : ''} not in your wardrobe.</p>
                            <button onClick={onSaveUnsavedItems} className="mt-2 text-sm font-semibold text-dark-blue bg-blue-300 rounded-full px-3 py-1 hover:bg-blue-200 transition-colors">
                                Save to Wardrobe
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};