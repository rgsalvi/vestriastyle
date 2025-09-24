import React, { useState } from 'react';
import type { StyleRecipe } from '../types';
import { PremiumUpsellModal } from './PremiumUpsellModal';

const recipes: StyleRecipe[] = [
    {
        title: 'Date Night Basics',
        description: 'A classic, can\'t-fail formula for a romantic and stylish evening.',
        items: [
            'Elegant Top (e.g., silk blouse, lace cami)',
            'Flattering Bottoms (e.g., tailored trousers, A-line skirt)',
            'Statement Heels or Dressy Flats',
            'Clutch or Small Handbag',
            'Delicate Jewelry',
        ],
    },
    {
        title: 'Perfect Casual Friday',
        description: 'Look polished yet relaxed to bridge the gap between work and the weekend.',
        items: [
            'Smart Blazer or Cardigan',
            'Quality T-shirt or Simple Blouse',
            'Dark Wash Jeans or Chinos',
            'Stylish Loafers or Clean Sneakers',
            'Minimalist Watch or Bracelet',
        ],
    },
    {
        title: 'Weekend Brunch Look',
        description: 'Effortlessly chic and comfortable for a relaxed social gathering.',
        items: [
            'Flowy Sundress or Jumpsuit',
            'Denim or Leather Jacket',
            'Comfortable Sandals or Espadrilles',
            'Woven Tote Bag',
            'Sunglasses',
        ],
    },
];

const CheckIcon: React.FC = () => (
    <svg className="h-5 w-5 text-platinum/80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const ChatIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
    </svg>
);


export const StyleRecipes: React.FC<{ isLoggedIn?: boolean; onRequireLogin?: () => void }> = ({ isLoggedIn = false, onRequireLogin }) => {
    const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);

    return (
        <>
            <section className="mt-12 py-16 bg-black/20 border-t border-platinum/20">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-semibold text-platinum tracking-[0.2em] uppercase">Style Recipes</h2>
                        <p className="mt-3 text-lg text-platinum/60 max-w-2xl mx-auto">Your go-to formulas for effortless, stylish outfits for any occasion.</p>
                    </div>

                    <div className="my-10 max-w-2xl mx-auto p-6 bg-dark-blue/80 rounded-2xl border border-platinum/20 text-center shadow-lg">
                        <h3 className="text-xl font-semibold text-platinum">Ready to bring these recipes to life?</h3>
                        <p className="mt-2 text-platinum/60">Chat live with a professional stylist to see how you can adapt these to your unique wardrobe and body type.</p>
                        <button
                            onClick={() => {
                                if (!isLoggedIn) {
                                    onRequireLogin?.();
                                    return;
                                }
                                setIsUpsellModalOpen(true);
                            }}
                            className="mt-4 inline-flex items-center justify-center text-sm font-semibold py-2 px-5 rounded-full bg-platinum hover:bg-platinum/90 text-dark-blue transition-colors duration-200"
                        >
                            <ChatIcon />
                            Chat with a Stylist
                            <span className="ml-1.5 inline-block bg-dark-blue text-platinum text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">PRO</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {recipes.map((recipe) => (
                            <div key={recipe.title} className="bg-dark-blue/80 p-6 rounded-2xl shadow-lg border border-platinum/20 flex flex-col hover:shadow-platinum/10 hover:-translate-y-1 transition-all duration-300">
                                <h3 className="text-xl font-semibold text-platinum">{recipe.title}</h3>
                                <p className="text-sm text-platinum/60 mt-1 flex-grow">{recipe.description}</p>
                                <ul className="mt-4 space-y-3">
                                    {recipe.items.map((item) => (
                                        <li key={item} className="flex items-start">
                                            <div className="flex-shrink-0 pt-0.5">
                                                <CheckIcon />
                                            </div>
                                            <span className="ml-3 text-sm text-platinum/80">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {isUpsellModalOpen && <PremiumUpsellModal onClose={() => setIsUpsellModalOpen(false)} />}
        </>
    );
};