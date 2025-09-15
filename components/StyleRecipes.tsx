import React from 'react';
import type { StyleRecipe } from '../types';

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
    <svg className="h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);


export const StyleRecipes: React.FC = () => {
    return (
        <section className="mt-12 py-16 bg-slate-50 border-t border-slate-200">
            <div className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Style Recipes & Cheat Sheets</h2>
                    <p className="mt-2 text-lg text-slate-500 max-w-2xl mx-auto">Your go-to formulas for effortless, stylish outfits for any occasion.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {recipes.map((recipe) => (
                        <div key={recipe.title} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <h3 className="text-xl font-semibold text-slate-900">{recipe.title}</h3>
                            <p className="text-sm text-slate-500 mt-1 flex-grow">{recipe.description}</p>
                            <ul className="mt-4 space-y-3">
                                {recipe.items.map((item) => (
                                    <li key={item} className="flex items-start">
                                        <div className="flex-shrink-0 pt-0.5">
                                            <CheckIcon />
                                        </div>
                                        <span className="ml-3 text-sm text-slate-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};