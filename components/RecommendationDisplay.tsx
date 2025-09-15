import React from 'react';
import type { AiResponse } from '../types';

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
        <p className="mt-2 text-base text-slate-500">Our AI stylist is analyzing your items and visualizing the perfect outfit. This might take a moment.</p>
    </div>
);


export const RecommendationDisplay: React.FC<RecommendationDisplayProps> = ({ recommendation, isLoading }) => {
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }
    if (!recommendation) {
      return <InitialState />;
    }
    
    const verdictClasses = recommendation.verdict.includes('go for it')
      ? "bg-teal-100 text-teal-800 border-teal-300"
      : "bg-orange-100 text-orange-800 border-orange-300";

    return (
      <div className="space-y-6">
        {recommendation.generatedOutfitImage && (
            <div className="rounded-xl overflow-hidden shadow-lg border border-slate-200">
                <img
                    src={`data:image/jpeg;base64,${recommendation.generatedOutfitImage}`}
                    alt="AI-generated outfit visualization"
                    className="w-full h-auto object-cover"
                />
            </div>
        )}
        <div className={`p-4 rounded-xl border-2 ${verdictClasses}`}>
          <p className="text-lg font-semibold text-center">{recommendation.verdict}</p>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold text-slate-900">Compatibility Analysis</h4>
          <p className="mt-2 text-slate-600">{recommendation.compatibility}</p>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold text-slate-900">Outfit Ideas</h4>
          <div className="mt-2 space-y-4">
            {recommendation.outfits.map((outfit, index) => (
              <div key={index} className="p-4 bg-slate-100/50 rounded-xl border border-slate-200">
                <p className="font-semibold text-purple-700">{outfit.title}</p>
                <ul className="mt-2 list-disc list-inside text-slate-600 space-y-1">
                  {outfit.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-slate-900">Stylist's Advice</h4>
          <p className="mt-2 text-slate-600">{recommendation.advice}</p>
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