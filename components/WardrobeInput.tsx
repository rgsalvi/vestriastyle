import React, { useState, useEffect } from 'react';
import { ImageUploader } from './ImageUploader';
import type { PersistentWardrobeItem, WardrobeItem, AnalysisItem } from '../types';

interface WardrobeInputProps {
    managedWardrobe: PersistentWardrobeItem[];
    onAnalysisItemsChange: (items: AnalysisItem[]) => void;
    maxFiles: number;
}

type Tab = 'upload' | 'select';

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const CheckIcon: React.FC = () => (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);


export const WardrobeInput: React.FC<WardrobeInputProps> = ({ managedWardrobe, onAnalysisItemsChange, maxFiles }) => {
    const [activeTab, setActiveTab] = useState<Tab>('upload');
    const [uploadedItems, setUploadedItems] = useState<WardrobeItem[]>([]);
    const [selectedWardrobeIds, setSelectedWardrobeIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const convertAndCombine = async () => {
            // Convert uploaded files to AnalysisItems
            const uploadedAnalysisItemsPromises = uploadedItems.map(async (item) => {
                const dataUrl = await fileToDataUrl(item.file);
                const [header, base64] = dataUrl.split(',');
                const mimeType = header.match(/:(.*?);/)![1];
                return { preview: item.preview, base64, mimeType };
            });
            const uploadedAnalysisItems = await Promise.all(uploadedAnalysisItemsPromises);
            
            // Convert selected wardrobe items to AnalysisItems
            const selectedWardrobeAnalysisItems = managedWardrobe
                .filter(item => selectedWardrobeIds.has(item.id))
                .map(item => {
                    const [header, base64] = item.dataUrl.split(',');
                    const mimeType = header.match(/:(.*?);/)![1];
                    return { preview: item.dataUrl, base64, mimeType };
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
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900">2. Choose Your Wardrobe Items</h3>
            <p className="text-sm text-slate-500 mt-1">Select up to {maxFiles} items to compare with your new piece.</p>

            <div className="mt-4 border-b border-slate-200">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'upload' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        Upload Photos
                    </button>
                    <button
                        onClick={() => setActiveTab('select')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'select' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        disabled={managedWardrobe.length === 0}
                    >
                        Select from My Wardrobe
                         {managedWardrobe.length === 0 && <span className="text-xs ml-1">(Empty)</span>}
                    </button>
                </nav>
            </div>
            
            <div className="mt-4">
                {activeTab === 'upload' && (
                     <ImageUploader
                        title=""
                        description={`You can upload up to ${maxFiles - selectedWardrobeIds.size} more photos.`}
                        onFilesSelect={setUploadedItems}
                        multiple={true}
                        maxFiles={maxFiles - selectedWardrobeIds.size}
                    />
                )}
                 {activeTab === 'select' && (
                    <div>
                        <p className="text-sm text-slate-500 mb-4">You can select {remainingSlots} more item{remainingSlots !== 1 && 's'}.</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                             {managedWardrobe.map(item => {
                                const isSelected = selectedWardrobeIds.has(item.id);
                                return (
                                    <button 
                                        key={item.id}
                                        onClick={() => toggleWardrobeSelection(item.id)}
                                        className="relative aspect-square focus:outline-none group"
                                        aria-pressed={isSelected}
                                    >
                                        <img src={item.dataUrl} alt={item.description || 'wardrobe item'} className={`h-full w-full object-cover rounded-xl shadow-md transition-all duration-200 ${isSelected ? 'ring-4 ring-purple-500' : 'ring-1 ring-slate-200 group-hover:ring-2 group-hover:ring-purple-300'}`} />
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                                <div className="bg-purple-600 rounded-full p-1.5">
                                                    <CheckIcon />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                             })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
