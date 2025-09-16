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
        <path d="M11.956 2.025a.5.5 0 00-.58.02l-2.45 2.45a.5.5 0 000 .707l4.9 4.9a.5.5 0 00.707 0l2.45-2.45a.5.5 0 00.02-.58l-1.04-3.48A.5.5 0 0015.5 6h-2.207a.5.5 0 00-.354.146L11.2 7.883l-2.12-2.12.33-.33a.5.5 0 000-.707l-.33-.33 1.05-1.05a.5.5 0 00.02-.58L11.956 2.025zM8.5 7.5a.5.5 0 000-1H7.883L6.146 4.757A.5.5 0 005.5 4h-2a.5.5 0 00-.354.146L2.146 5.146A.5.5 0 002 5.5v2a.5.5 0 00.146.354L3.146 8.854A.5.5 0 003.5 9h2.207a.5.5 0 00.354-.146L7.883 7.117l2.12 2.12-.33.33a.5.5 0 000 .707l.33.33-1.05 1.05a.5.5 0 00-.02.58l.8 2.65A.5.5 0 0011 14h2.207a.5.5 0 00.354-.146l1.043-1.043a.5.5 0 000-.707l-4.9-4.9a.5.5 0 00-.707 0L8.5 7.5z" />
    </svg>
);


const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-dark-blue mr-2"></div>
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true"></div>
      <div className="bg-[#1F2937] rounded-2xl shadow-xl w-full max-w-lg z-10 transform transition-all opacity-100 scale-100 border border-platinum/20">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-platinum">{mode === 'edit' ? 'Edit Item Details' : 'Create New Item'}</h3>
        </div>
        <form onSubmit={handleSave}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="w-full aspect-square bg-dark-blue rounded-2xl overflow-hidden flex items-center justify-center border border-platinum/20">
                 {formData.dataUrl ? (
                    <img src={formData.dataUrl} alt="Wardrobe item" className="max-h-full max-w-full object-contain" />
                 ) : (
                    <div className="text-center text-platinum/50 p-4">
                         <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="1" /></svg>
                        <p className="mt-2 text-sm">Image will be generated here</p>
                    </div>
                 )}
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-platinum/80">Description</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 block w-full shadow-sm sm:text-sm bg-dark-blue border-platinum/30 rounded-lg focus:ring-platinum focus:border-platinum transition-colors text-platinum placeholder-platinum/50"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., A red, short-sleeve cotton t-shirt with a crew neck."
                required
              />
               <p className="mt-1 text-xs text-platinum/50">Provide a clear description for the AI to generate an image.</p>
            </div>
             <button
              type="button"
              onClick={handleGenerateImage}
              disabled={isGenerating || !formData.description}
              className="w-full flex items-center justify-center bg-platinum text-dark-blue font-bold py-3 px-4 rounded-full shadow-lg shadow-platinum/10 hover:scale-105 disabled:bg-platinum/50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum/50"
            >
              {isGenerating ? <><Spinner/> Generating...</> : <><WandIcon/>{formData.dataUrl ? 'Regenerate Image' : 'Generate Image'}</>}
            </button>
            {error && <p className="text-red-400 text-sm text-center font-medium">{error}</p>}

            <div className="space-y-4 pt-2">
                <div>
                    <h4 className="text-sm font-semibold text-platinum/60 uppercase tracking-wider mb-2">Core Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-platinum/80">Category</label>
                            <select id="category" name="category" className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-dark-blue border-platinum/30 focus:outline-none focus:ring-platinum focus:border-platinum sm:text-sm rounded-lg transition-colors" value={formData.category} onChange={handleInputChange}>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="color" className="block text-sm font-medium text-platinum/80">Color</label>
                            <input type="text" id="color" name="color" className="mt-1 block w-full shadow-sm sm:text-sm bg-dark-blue border-platinum/30 rounded-lg focus:ring-platinum focus:border-platinum transition-colors text-platinum placeholder-platinum/50" value={formData.color} onChange={handleInputChange} placeholder="e.g., Navy Blue, Floral" />
                        </div>
                    </div>
                </div>
                <div className="border-t border-platinum/20 pt-4">
                    <h4 className="text-sm font-semibold text-platinum/60 uppercase tracking-wider mb-2">Additional Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="fabric" className="block text-sm font-medium text-platinum/80">Fabric Type</label>
                            <input type="text" id="fabric" name="fabric" list="fabric-suggestions" className="mt-1 block w-full shadow-sm sm:text-sm bg-dark-blue border-platinum/30 rounded-lg focus:ring-platinum focus:border-platinum transition-colors text-platinum placeholder-platinum/50" value={formData.fabric} onChange={handleInputChange} placeholder="e.g., Cotton, Wool" />
                            <datalist id="fabric-suggestions">
                            {FABRIC_SUGGESTIONS.map(fab => <option key={fab} value={fab} />)}
                            </datalist>
                        </div>
                        <div>
                            <label htmlFor="season" className="block text-sm font-medium text-platinum/80">Season</label>
                            <select id="season" name="season" className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-dark-blue border-platinum/30 focus:outline-none focus:ring-platinum focus:border-platinum sm:text-sm rounded-lg transition-colors" value={formData.season} onChange={handleInputChange}>
                            <option value="">Select a season</option>
                            {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
          </div>
          <div className="bg-dark-blue px-6 py-4 flex justify-end space-x-3 rounded-b-2xl border-t border-platinum/20">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-[#1F2937] border border-platinum/30 rounded-full shadow-sm text-sm font-medium text-platinum/80 hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!formData.dataUrl || isGenerating} className="px-4 py-2 bg-platinum border border-transparent rounded-full shadow-sm text-sm font-medium text-dark-blue hover:bg-platinum/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum disabled:bg-platinum/50 disabled:cursor-not-allowed transition-transform">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};