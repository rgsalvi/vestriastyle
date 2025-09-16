import React, { useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { EditItemModal } from './EditItemModal';
import type { PersistentWardrobeItem, WardrobeItem, User } from '../types';

interface WardrobeManagerProps {
  user: User | null;
  items: PersistentWardrobeItem[];
  onAddItems: (items: WardrobeItem[]) => void;
  onSaveItem: (itemData: Omit<PersistentWardrobeItem, 'id'>, existingId?: string) => void;
  onDeleteItem: (itemId: string) => void;
}

const EditIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110 2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);


export const WardrobeManager: React.FC<WardrobeManagerProps> = ({ user, items, onAddItems, onSaveItem, onDeleteItem }) => {
    const [editingItem, setEditingItem] = useState<PersistentWardrobeItem | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleSave = (itemData: Omit<PersistentWardrobeItem, 'id'>, existingId?: string) => {
        onSaveItem(itemData, existingId);
        setEditingItem(null);
        setIsCreating(false);
    };

    const handleCloseModal = () => {
        setEditingItem(null);
        setIsCreating(false);
    }
    
    const GuestCTA: React.FC = () => (
        <div className="mt-10 text-center py-10 px-6 bg-dark-blue/80 rounded-2xl border-2 border-dashed border-platinum/20">
            <svg className="mx-auto h-12 w-12 text-platinum/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-platinum">Sign in to save your wardrobe</h3>
             <div className="mt-4 inline-block bg-platinum text-dark-blue font-bold font-mono text-sm uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-platinum/10">
                10 Items Free
            </div>
            <p className="mt-4 text-base text-platinum/60">Create an account to build your digital closet, sync across devices, and get hyper-personalized advice.</p>
        </div>
    );

    return (
        <section id="wardrobe-manager" className="mt-12 py-16 bg-dark-blue border-t border-platinum/20 scroll-mt-28">
            <div className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-semibold text-platinum tracking-[0.2em] uppercase">My Wardrobe</h2>
                    <p className="mt-3 text-lg text-platinum/60 max-w-2xl mx-auto">Manage your digital closet. Add, edit, and remove items.</p>
                </div>

                {user && (
                    <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ImageUploader
                            title="Add From Photos"
                            description="Upload images of your clothes. For best results, use photos of just the item."
                            onFilesSelect={onAddItems}
                            multiple={true}
                        />
                        <div className="bg-dark-blue/80 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-platinum/20 flex flex-col justify-between">
                             <div>
                                <h3 className="text-xl font-semibold text-platinum uppercase tracking-wider">Add From Description</h3>
                                <p className="text-sm text-platinum/60 mt-1">Don't have a photo? Generate an image with AI.</p>
                             </div>
                             <button
                                onClick={() => setIsCreating(true)}
                                className="mt-4 w-full flex items-center justify-center bg-dark-blue text-platinum font-semibold py-3 px-4 rounded-xl hover:bg-[#1F2937] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum ring-1 ring-platinum/50"
                            >
                                <PlusIcon />
                                Add Item with AI
                            </button>
                        </div>
                    </div>
                )}


                {!user ? <GuestCTA /> : items.length > 0 ? (
                    <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {items.map(item => (
                            <div key={item.id} className="relative group aspect-square">
                                <img src={item.dataUrl} alt={item.description || "Wardrobe item"} className="h-full w-full object-cover rounded-2xl shadow-md" />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex flex-col items-center justify-center rounded-2xl p-2">
                                     <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <p className="text-white text-sm font-semibold truncate">{item.category}</p>
                                        <p className="text-platinum/80 text-xs truncate">{item.color || 'No color'}</p>
                                        <div className="text-platinum/70 text-xs mt-1 space-y-0.5">
                                            {item.fabric && <p className="truncate">Fabric: {item.fabric}</p>}
                                            {item.season && <p className="truncate">Season: {item.season}</p>}
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 flex space-x-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                        <button
                                            onClick={() => setEditingItem(item)}
                                            className="p-2 bg-platinum/80 text-dark-blue rounded-full backdrop-blur-sm shadow-md hover:scale-110 hover:bg-platinum transition-all"
                                            aria-label="Edit item"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button
                                            onClick={() => onDeleteItem(item.id)}
                                            className="p-2 bg-platinum/80 text-red-600 rounded-full backdrop-blur-sm shadow-md hover:scale-110 hover:bg-platinum transition-all"
                                            aria-label="Delete item"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-10 text-center py-10 px-6 bg-dark-blue/80 rounded-2xl border-2 border-dashed border-platinum/20">
                        <svg className="mx-auto h-12 w-12 text-platinum/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 6.138h4.5m-4.5 0a3.75 3.75 0 01-3.75 3.75v1.5a.75.75 0 001.5 0v-1.5a2.25 2.25 0 002.25-2.25zM14.25 6.138a3.75 3.75 0 00-3.75 3.75v1.5a.75.75 0 01-1.5 0v-1.5a2.25 2.25 0 012.25-2.25zM9 10.5h6m-6 3h6m-6 3h6m-6 3h6" />
                            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.75 6.138v10.124A2.25 2.25 0 006 18.5h12a2.25 2.25 0 002.25-2.238V6.138M3.75 6.138h16.5" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-platinum">Your wardrobe is empty</h3>
                        <p className="mt-1 text-sm text-platinum/60">Get started by adding your first clothing item.</p>
                    </div>
                )}
            </div>
            {(editingItem || isCreating) && (
                <EditItemModal
                    item={editingItem}
                    onSave={handleSave}
                    onClose={handleCloseModal}
                />
            )}
        </section>
    );
};