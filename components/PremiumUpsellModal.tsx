import React, { useEffect } from 'react';

interface PremiumUpsellModalProps {
    onClose: () => void;
}

const CheckIcon: React.FC = () => (
    <svg className="h-6 w-6 text-dark-blue" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


export const PremiumUpsellModal: React.FC<PremiumUpsellModalProps> = ({ onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const premiumFeatures = [
        "Live 1-on-1 Chat with a Stylist",
        "Unlimited Wardrobe Items",
        "Advanced Style Analytics",
        "Exclusive Style Recipes"
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="fixed inset-0" onClick={onClose} aria-hidden="true"></div>
            <div className="bg-[#1F2937] rounded-2xl shadow-xl w-full max-w-md z-10 transform transition-all opacity-100 scale-100 border border-platinum/20 relative">
                 <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-platinum/60 hover:text-white transition-colors"
                    aria-label="Close modal"
                >
                    <CloseIcon />
                 </button>
                <div className="p-8 text-center">
                    <h3 className="text-2xl font-bold text-platinum tracking-tight">Unlock Vestria Premium</h3>
                    <p className="mt-2 text-platinum/60">Elevate your style journey with exclusive features and personalized support.</p>
                </div>
                <div className="px-8 pb-8 space-y-4">
                    {premiumFeatures.map(feature => (
                        <div key={feature} className="flex items-center">
                            <div className="flex-shrink-0 bg-platinum rounded-full p-1">
                                <CheckIcon />
                            </div>
                            <span className="ml-3 text-base text-platinum/80">{feature}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-dark-blue px-6 py-5 rounded-b-2xl border-t border-platinum/20">
                    <button
                        type="button"
                        onClick={onClose} // In a real app, this would lead to a checkout flow
                        className="w-full bg-platinum text-dark-blue font-bold py-3 px-4 rounded-full shadow-lg shadow-platinum/10 hover:scale-105 hover:shadow-xl hover:shadow-platinum/20 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum/50"
                    >
                        Upgrade Now
                    </button>
                    <p className="text-center text-xs text-platinum/50 mt-3">Cancel anytime. Terms and conditions apply.</p>
                </div>
            </div>
        </div>
    );
};