import React, { useState, useEffect } from 'react';
import { ImageUploader } from './ImageUploader';
import type { PersistentWardrobeItem, WardrobeItem, AnalysisItem, User, Occasion } from '../types';

interface WardrobeInputProps {
    user: User | null;
    managedWardrobe: PersistentWardrobeItem[];
    onAnalysisItemsChange: (items: AnalysisItem[]) => void;
    maxFiles: number;
    onOccasionChange: (occasion: Occasion) => void;
    selectedOccasion: Occasion;
}

type Tab = 'upload' | 'select';

const occasionData: { name: Exclude<Occasion, 'None'>; icon: React.FC }[] = [
    { name: 'Everyday', icon: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg> },
    { name: 'Casual', icon: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg> },
    { name: 'Work', icon: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0h.75A.75.75 0 015.25 6v.75m0 0v-.75A.75.75 0 014.5 4.5h.75M6 13.5V12m0 1.5V12m0 1.5v-1.5m0 0H5.625c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125H9.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H7.5m-1.5 0v3.75m.75-3.75H21a.75.75 0 00.75-.75V8.25a.75.75 0 00-.75-.75H5.25a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75h.75m-1.5 0H6v1.5m0 0v1.5m0 0v1.5m0 0H6m6.375-3.75v1.5m0 1.5v-1.5m0 0v-1.5m0 0h1.5m-1.5 0h-1.5m1.5 0H18m-3.375 3.75h1.5m1.5 0h-1.5m-1.5 0H18m-3.375-3.75h1.5m-1.5 0h-1.5m1.5 0H18" /></svg> },
    { name: 'Date Night', icon: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg> },
    { name: 'Weekend', icon: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M9 12.75h6" /></svg> },
    { name: 'Special Event', icon: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg> }
];

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const CheckIcon: React.FC = () => (
    <svg className="h-6 w-6 text-dark-blue" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);


export const WardrobeInput: React.FC<WardrobeInputProps> = ({ user, managedWardrobe, onAnalysisItemsChange, maxFiles, onOccasionChange, selectedOccasion }) => {
    const [activeTab, setActiveTab] = useState<Tab>('upload');
    const [uploadedItems, setUploadedItems] = useState<WardrobeItem[]>([]);
    const [selectedWardrobeIds, setSelectedWardrobeIds] = useState<Set<string>>(new Set());
    const isGuest = !user;

    useEffect(() => {
        const convertAndCombine = async () => {
            // Convert uploaded files to AnalysisItems
            const uploadedAnalysisItemsPromises = uploadedItems.map(async (item) => {
                const dataUrl = await fileToDataUrl(item.file);
                const [header, base64] = dataUrl.split(',');
                const mimeType = header.match(/:(.*?);/)![1];
                return { preview: item.preview, dataUrl, base64, mimeType };
            });
            const uploadedAnalysisItems = await Promise.all(uploadedAnalysisItemsPromises);
            
            // Convert selected wardrobe items to AnalysisItems
            const selectedWardrobeAnalysisItems = managedWardrobe
                .filter(item => selectedWardrobeIds.has(item.id))
                .map(item => {
                    const [header, base64] = item.dataUrl.split(',');
                    const mimeType = header.match(/:(.*?);/)![1];
                    return { preview: item.dataUrl, dataUrl: item.dataUrl, base64, mimeType };
                });

            // Combine, respecting the maxFiles limit
            const combined = [...uploadedAnalysisItems, ...selectedWardrobeAnalysisItems].slice(0, maxFiles);
            onAnalysisItemsChange(combined);
        };

        convertAndCombine();
    }, [uploadedItems, selectedWardrobeIds, managedWardrobe, onAnalysisItemsChange, maxFiles]);
    
    const toggleWardrobeSelection = (itemId: string) => {
        setSelectedWardrobeIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                if (newSet.size < maxFiles - uploadedItems.length) {
                    newSet.add(itemId);
                }
            }
            return newSet;
        });
    };

    const remainingSlots = maxFiles - uploadedItems.length - selectedWardrobeIds.size;

    return (
        <div className="bg-dark-blue/80 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-platinum/20">
            <div>
                <h3 className="text-xl font-semibold text-platinum uppercase tracking-wider">2. Choose Your Wardrobe & Occasion</h3>
                <p className="text-sm text-platinum/60 mt-1">Select up to {maxFiles} items and the occasion for your style advice.</p>
            </div>

            <div className="mt-6">
                 <h4 className="text-sm font-semibold text-platinum/60 uppercase tracking-wider mb-3">What's the Occasion?</h4>
                 <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                     {occasionData.map(({ name, icon: Icon }) => {
                         const isSelected = selectedOccasion === name;
                         return (
                            <button
                                key={name}
                                onClick={() => onOccasionChange(name)}
                                className={`flex flex-col items-center justify-center text-center p-3 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-platinum/50 ${
                                    isSelected 
                                    ? 'bg-platinum/10 ring-2 ring-platinum' 
                                    : 'bg-black/20 ring-1 ring-platinum/20 hover:ring-platinum/40'
                                }`}
                                aria-pressed={isSelected}
                            >
                                <div className={`transition-colors ${isSelected ? 'text-platinum' : 'text-platinum/60'}`}>
                                    <Icon />
                                </div>
                                <span className={`mt-2 block text-xs font-semibold transition-colors ${isSelected ? 'text-platinum' : 'text-platinum/80'}`}>{name}</span>
                            </button>
                         )
                     })}
                 </div>
            </div>

            <div className="mt-6 border-b border-platinum/20">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'upload' ? 'border-platinum text-platinum' : 'border-transparent text-platinum/60 hover:text-platinum/80 hover:border-platinum/40'}`}
                    >
                        Upload Photos
                    </button>
                    <button
                        onClick={() => setActiveTab('select')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'select' ? 'border-platinum text-platinum' : 'border-transparent text-platinum/60 hover:text-platinum/80 hover:border-platinum/40 disabled:text-platinum/40 disabled:hover:border-transparent'}`}
                        disabled={isGuest}
                    >
                        Select from My Wardrobe
                        {isGuest && <span className="text-xs ml-1">(Sign in to use)</span>}
                    </button>
                </nav>
            </div>
            
            <div className="mt-4">
                {activeTab === 'upload' && (
                     <ImageUploader
                        title=""
                        description={`For best results, use clear photos of just the clothing. You can upload up to ${maxFiles - selectedWardrobeIds.size} more photos.`}
                        onFilesSelect={setUploadedItems}
                        multiple={true}
                        maxFiles={maxFiles - selectedWardrobeIds.size}
                    />
                )}
                 {activeTab === 'select' && (
                    <div>
                        <p className="text-sm text-platinum/60 mb-4">You can select {remainingSlots} more item{remainingSlots !== 1 && 's'}.</p>
                        {managedWardrobe.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {managedWardrobe.map(item => {
                                    const isSelected = selectedWardrobeIds.has(item.id);
                                    return (
                                        <button 
                                            key={item.id}
                                            onClick={() => toggleWardrobeSelection(item.id)}
                                            className="relative aspect-square focus:outline-none group rounded-2xl focus:ring-4 focus:ring-platinum/50"
                                            aria-pressed={isSelected}
                                        >
                                            <img src={item.dataUrl} alt={item.description || 'wardrobe item'} className={`h-full w-full object-cover rounded-2xl shadow-md transition-all duration-200 ${isSelected ? 'ring-4 ring-platinum' : 'ring-1 ring-platinum/20 group-hover:ring-2 group-hover:ring-platinum/40'}`} />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-platinum/80 rounded-2xl flex items-center justify-center">
                                                    <div className="bg-platinum rounded-full p-1.5 shadow-lg">
                                                        <CheckIcon />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-center text-platinum/60 py-8">Your wardrobe is empty. Add items in the "My Wardrobe" section below.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};