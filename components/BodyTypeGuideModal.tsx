import React, { useEffect } from 'react';
import type { BodyType } from '../types';

type BodyTypeGuide = {
    name: Exclude<BodyType, 'None'>;
    characteristics: string[];
};

const guideData: BodyTypeGuide[] = [
    {
        name: 'Apple',
        characteristics: [
            'Shoulders and bust are wider than your hips.',
            'Waist is less defined.',
            'You likely have great legs!',
        ],
    },
    {
        name: 'Pear',
        characteristics: [
            'Hips are the widest part of your body.',
            'Shoulders and bust are narrower than your hips.',
            'You have a well-defined waist.',
        ],
    },
    {
        name: 'Rectangle',
        characteristics: [
            'Shoulders, bust, and hips are a similar width.',
            'A straight silhouette with little waist definition.',
            'Also known as the "athletic" build.',
        ],
    },
    {
        name: 'Inverted Triangle',
        characteristics: [
            'Shoulders are the widest part of your body.',
            'Hips are narrower than your shoulders.',
            'Waist may not be very defined.',
        ],
    },
    {
        name: 'Hourglass',
        characteristics: [
            'Shoulders and hips are about the same width.',
            'You have a clearly defined, narrow waist.',
            'A classic curvy figure.',
        ],
    },
];


interface BodyTypeGuideModalProps {
    onClose: () => void;
    icons: { [key in Exclude<BodyType, 'None'>]: React.FC };
}

export const BodyTypeGuideModal: React.FC<BodyTypeGuideModalProps> = ({ onClose, icons }) => {
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
          if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="fixed inset-0" onClick={onClose} aria-hidden="true"></div>
            <div className="bg-[#1F2937] rounded-2xl shadow-xl w-full max-w-2xl z-10 transform transition-all opacity-100 scale-100 border border-platinum/20">
                <div className="p-6 text-center border-b border-platinum/20">
                    <h3 className="text-2xl font-semibold text-platinum">What's My Body Type?</h3>
                    <p className="mt-2 text-platinum/60 max-w-lg mx-auto">
                        Your body type is about your proportions, not your size. Find the description that sounds most like you.
                    </p>
                </div>
                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {guideData.map(({ name, characteristics }) => {
                        const Icon = icons[name];
                        return (
                            <div key={name} className="flex items-start sm:items-center space-x-4">
                                <div className="flex-shrink-0 w-16 h-16 p-2 rounded-2xl bg-dark-blue ring-1 ring-platinum/20 flex items-center justify-center text-platinum/70">
                                    <Icon />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg text-platinum">{name}</h4>
                                    <ul className="mt-1 list-disc list-inside text-platinum/70 space-y-0.5">
                                        {characteristics.map((char, index) => (
                                            <li key={index} className="text-sm">{char}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="bg-dark-blue px-6 py-4 flex justify-center rounded-b-2xl border-t border-platinum/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-platinum text-dark-blue border border-transparent rounded-full shadow-sm text-sm font-medium hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum transition-transform"
                    >
                        Got It!
                    </button>
                </div>
            </div>
        </div>
    );
};