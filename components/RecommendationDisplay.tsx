import React, { useState, useEffect } from 'react';
import type { AiResponse, Outfit, AnalysisItem } from '../types';

interface RecommendationDisplayProps {
  recommendation: AiResponse | null;
  isLoading: boolean;
  unsavedItems: AnalysisItem[];
  onSaveUnsavedItems: () => void;
}

const Spinner: React.FC = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

const InitialState: React.FC = () => (
    <div className="text-center p-8">
        <svg className="mx-auto h-20 w-20 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        <h3 className="mt-4 text-xl font-medium text-slate-800">Your Personal Stylist Awaits</h3>
        <p className="mt-2 text-base text-slate-500">Upload your items and let our AI provide expert style advice and create perfect outfits for you.</p>
    </div>
);

const LoadingState: React.FC = () => (
    <div className="text-center p-8">
        <Spinner/>
        <h3 className="mt-6 text-xl font-medium text-slate-800">Curating Your Look...</h3>
        <p className="mt-2 text-base text-slate-500">Our AI stylist is analyzing your items and visualizing the perfect outfits. This might take a moment.</p>
    </div>
);

const OutfitCarousel: React.FC<{ outfits: Outfit[], images: string[] }> = ({ outfits, images }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const goToPrevious = () => {
        setActiveIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setActiveIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    };
    
    const currentOutfit = outfits[activeIndex];

    return (
      <div className="space-y-4">
          <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-square">
                  <img
                      src={`data:image/jpeg;base64,${images[activeIndex]}`}
                      alt={`AI-generated visualization for ${currentOutfit.title}`}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      key={activeIndex}
                  />
              </div>
              {images.length > 1 && (
                  <>
                      <button onClick={goToPrevious} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all shadow-md hover:scale-110">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button onClick={goToNext} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all shadow-md hover:scale-110">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                  </>
              )}
          </div>
          
          <div className="p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
              <p className="font-semibold text-purple-700">{currentOutfit.title}</p>
              <ul className="mt-2 list-disc list-inside text-slate-600 space-y-1 text-sm">
                  {currentOutfit.items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
          </div>

          {images.length > 1 && (
              <div className="flex justify-center space-x-2 pt-2">
                  {images.map((_, index) => (
                      <button key={index} onClick={() => setActiveIndex(index)} className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${activeIndex === index ? 'bg-purple-500 scale-125' : 'bg-slate-300 hover:bg-slate-400'}`}></button>
                  ))}
              </div>
          )}
      </div>
    );
}

const UnsavedItems: React.FC<{ items: AnalysisItem[], onSave: () => void }> = ({ items, onSave }) => {
    if (items.length === 0) return null;

    return (
        <div className="mt-6 p-4 bg-purple-50 border-t-2 border-b-2 border-purple-200">
            <h4 className="text-lg font-semibold text-slate-900 text-center">Save New Items</h4>
            <p className="text-sm text-slate-500 mt-1 text-center">Add the items from this session to your permanent wardrobe.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
                {items.map((item, index) => (
                    <img key={index} src={item.preview} alt={`unsaved item ${index}`} className="h-16 w-16 object-cover rounded-lg shadow-md border-2 border-white" />
                ))}
            </div>
            <button
                onClick={onSave}
                className="mt-4 w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold py-2 px-4 rounded-full shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
                Save to My Wardrobe
            </button>
        </div>
    );
};

export const RecommendationDisplay: React.FC<RecommendationDisplayProps> = ({ recommendation, isLoading, unsavedItems, onSaveUnsavedItems }) => {
  const [internalRecommendation, setInternalRecommendation] = useState<AiResponse | null>(null);

  useEffect(() => {
    if (recommendation) {
      setInternalRecommendation(recommendation);
    }
  }, [recommendation]);
  
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }
    if (!internalRecommendation) {
      return <InitialState />;
    }
    
    const { verdict, compatibility, advice, outfits, generatedOutfitImages } = internalRecommendation;

    const verdictClasses = verdict.includes('go for it')
      ? "bg-purple-100 text-purple-800 border-purple-300"
      : "bg-slate-200 text-slate-800 border-slate-300";

    const hasVisuals = generatedOutfitImages && generatedOutfitImages.length > 0;

    return (
      <div className="space-y-6">
        <div className={`p-4 rounded-2xl border-2 ${verdictClasses}`}>
          <p className="text-lg font-semibold text-center">{verdict}</p>
        </div>
        
        {hasVisuals && (
          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Outfit Visualizations</h4>
            <OutfitCarousel outfits={outfits} images={generatedOutfitImages!} />
          </div>
        )}
        
        <div>
          <h4 className="text-lg font-semibold text-slate-900">Compatibility Analysis</h4>
          <p className="mt-2 text-slate-600">{compatibility}</p>
        </div>

        {!hasVisuals && (
           <div>
              <h4 className="text-lg font-semibold text-slate-900">Outfit Ideas</h4>
              <div className="mt-2 space-y-4">
                {outfits.map((outfit, index) => (
                  <div key={index} className="p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
                    <p className="font-semibold text-purple-700">{outfit.title}</p>
                    <ul className="mt-2 list-disc list-inside text-slate-600 space-y-1">
                      {outfit.items.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
        )}

        <div>
          <h4 className="text-lg font-semibold text-slate-900">Stylist's Advice</h4>
          <p className="mt-2 text-slate-600">{advice}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50 overflow-hidden">
      <div className="p-6 min-h-[400px] flex flex-col justify-center">
        {renderContent()}
      </div>
      <UnsavedItems items={unsavedItems} onSave={onSaveUnsavedItems} />
    </div>
  );
};