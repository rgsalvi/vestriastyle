import React, { useState, useEffect } from 'react';
import type { PersistentWardrobeItem } from '../types';
import { generateWardrobeImage } from '../services/geminiService';

interface EditItemModalProps {
  item: PersistentWardrobeItem | null; // Null for create mode
  onSave: (itemData: Omit<PersistentWardrobeItem, 'id'>, existingId?: string) => void;
  onClose: () => void;
}

const CATEGORIES = [
  'Uncategorized', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'Jumpsuits & Rompers',
];

const FABRIC_SUGGESTIONS = [
  'Cotton', 'Linen', 'Polyester', 'Wool', 'Silk', 'Denim', 'Leather', 'Knit',
];

const SEASONS = [
  'All-Season', 'Spring', 'Summer', 'Fall', 'Winter',
];

const WandIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v1.046l.092.023c.314.075.613.18 1.02.342.314.124.6.28.857.467l.01.007.006.004a1 1 0 01.353 1.396l-.004.006-.007.01a7.002 7.002 0 00-.467.857c-.162.407-.267.706-.342 1.02L14.954 8l-2.908 2.908a1 1 0 01-1.414 0l-2.908-2.908.023-.092c.075-.314.18-.613.342-1.02.124-.314.28-.6.467-.857l.007-.01.006-.004a1 1 0 011.396-.353l.004.006.01.007c.257.177.543.343.857.467.407.162.706.267 1.02.342L12 5.046V6a1 1 0 01-2 0V5.046l-.092-.023c-.314-.075-.613-.18-1.02-.342a7.002 7.002 0 00-.857-.467l-.01-.007-.006-.004a1 1 0 01-.353-1.396l.004-.006.007-.01c.177-.257.343-.543.467-.857.162-.407.267-.706.342-1.02L8 1.046V2a1 1 0 112 0v-.954zM10 12a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);


const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
);

export const EditItemModal: React.FC<EditItemModalProps> = ({ item, onSave, onClose }) => {
  const [formData, setFormData] = useState({
      dataUrl: item?.dataUrl || '',
      description: item?.description || '',
      category: item?.category || 'Uncategorized',
      color: item?.color || '',
      fabric: item?.fabric || '',
      season: item?.season || '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mode = item ? 'edit' : 'create';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateImage = async () => {
    if (!formData.description) {
        setError("Please provide a description to generate an image.");
        return;
    }
    const prompt = `${formData.description}, ${formData.color}, ${formData.fabric}, ${formData.category}`;
    setIsGenerating(true);
    setError(null);
    try {
        const base64Image = await generateWardrobeImage(prompt);
        setFormData(prev => ({ ...prev, dataUrl: `data:image/jpeg;base64,${base64Image}`}));
    } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate image.");
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const {dataUrl, ...rest} = formData;
    if (!dataUrl) {
      setError("Please generate or upload an image before saving.");
      return;
    }
    onSave({ dataUrl, ...rest }, item?.id);
  };
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true"></div>
      <div className="bg-white rounded-2xl shadow-xl m-4 max-w-lg w-full z-10 transform transition-all opacity-100 scale-100">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-slate-900">{mode === 'edit' ? 'Edit Item Details' : 'Create New Item'}</h3>
        </div>
        <form onSubmit={handleSave}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="w-full aspect-square bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
                 {formData.dataUrl ? (
                    <img src={formData.dataUrl} alt="Wardrobe item" className="max-h-full max-w-full object-contain" />
                 ) : (
                    <div className="text-center text-slate-500">
                         <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="1" /></svg>
                        <p className="mt-2 text-sm">Image will be generated here</p>
                    </div>
                 )}
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., A red, short-sleeve cotton t-shirt with a crew neck."
                required
              />
               <p className="mt-1 text-xs text-slate-500">Provide a clear description for the AI to generate an image.</p>
            </div>
             <button
              type="button"
              onClick={handleGenerateImage}
              disabled={isGenerating || !formData.description}
              className="w-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold py-2 px-4 rounded-full shadow-lg hover:scale-105 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {isGenerating ? <><Spinner/> Generating...</> : <><WandIcon/>{formData.dataUrl ? 'Regenerate Image' : 'Generate Image'}</>}
            </button>
            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

            <div className="space-y-4 pt-2">
                <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">Core Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-slate-700">Category</label>
                            <select id="category" name="category" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-lg" value={formData.category} onChange={handleInputChange}>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="color" className="block text-sm font-medium text-slate-700">Color</label>
                            <input type="text" id="color" name="color" className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" value={formData.color} onChange={handleInputChange} placeholder="e.g., Navy Blue, Floral" />
                        </div>
                    </div>
                </div>
                <div className="border-t border-slate-200 pt-4">
                    <h4 className="text-sm font-medium text-slate-500 mb-2">Additional Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="fabric" className="block text-sm font-medium text-slate-700">Fabric Type</label>
                            <input type="text" id="fabric" name="fabric" list="fabric-suggestions" className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" value={formData.fabric} onChange={handleInputChange} placeholder="e.g., Cotton, Wool" />
                            <datalist id="fabric-suggestions">
                            {FABRIC_SUGGESTIONS.map(fab => <option key={fab} value={fab} />)}
                            </datalist>
                        </div>
                        <div>
                            <label htmlFor="season" className="block text-sm font-medium text-slate-700">Season</label>
                            <select id="season" name="season" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-lg" value={formData.season} onChange={handleInputChange}>
                            <option value="">Select a season</option>
                            {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-full shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              Cancel
            </button>
            <button type="submit" disabled={!formData.dataUrl || isGenerating} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 border border-transparent rounded-full shadow-sm text-sm font-medium text-white hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed disabled:scale-100">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};