import React, { useState, useEffect } from 'react';
import type { AiResponse, Outfit } from '../types';

interface RecommendationDisplayProps {
  recommendation: AiResponse | null;
  isLoading: boolean;
}

const Spinner: React.FC = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

const InitialState: React.FC = () => (
    <div className="text-center p-8">
        <svg className="mx-auto h-20 w-20 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.197-5.975M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
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
              <div className="rounded-xl overflow-hidden shadow-lg border border-slate-200 aspect-square">
                  <img
                      src={`data:image/jpeg;base64,${images[activeIndex]}`}
                      alt={`AI-generated visualization for ${currentOutfit.title}`}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      key={activeIndex}
                  />
              </div>
              {images.length > 1 && (
                  <>
                      <button onClick={goToPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all shadow-md">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all shadow-md">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                  </>
              )}
          </div>
          
          <div className="p-4 bg-slate-100/50 rounded-xl border border-slate-200">
              <p className="font-semibold text-purple-700">{currentOutfit.title}</p>
              <ul className="mt-2 list-disc list-inside text-slate-600 space-y-1 text-sm">
                  {currentOutfit.items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
          </div>

          {images.length > 1 && (
              <div className="flex justify-center space-x-2">
                  {images.map((_, index) => (
                      <button key={index} onClick={() => setActiveIndex(index)} className={`h-2.5 w-2.5 rounded-full transition-colors ${activeIndex === index ? 'bg-purple-500' : 'bg-slate-300 hover:bg-slate-400'}`}></button>
                  ))}
              </div>
          )}
      </div>
    );
}

export const RecommendationDisplay: React.FC<RecommendationDisplayProps> = ({ recommendation, isLoading }) => {
  const [internalRecommendation, setInternalRecommendation] = useState<AiResponse | null>(null);

  useEffect(() => {
    // Only update the internal state when a *new* recommendation comes in.
    // This prevents the carousel from resetting when the parent component re-renders for other reasons.
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
      ? "bg-teal-100 text-teal-800 border-teal-300"
      : "bg-orange-100 text-orange-800 border-orange-300";

    const hasVisuals = generatedOutfitImages && generatedOutfitImages.length > 0;

    return (
      <div className="space-y-6">
        <div className={`p-4 rounded-xl border-2 ${verdictClasses}`}>
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
                  <div key={index} className="p-4 bg-slate-100/50 rounded-xl border border-slate-200">
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
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200 min-h-[400px] flex flex-col justify-center">
      {renderContent()}
    </div>
  );
};