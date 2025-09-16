import React, { useCallback, useState, useEffect } from 'react';
import type { WardrobeItem } from '../types';
import { anonymizeImage } from '../utils/imageProcessor';

interface ImageUploaderProps {
  title: string;
  description: string;
  onFilesSelect: (items: WardrobeItem[]) => void;
  multiple: boolean;
  maxFiles?: number;
}

const UploadIcon: React.FC = () => (
    <svg className="mx-auto h-12 w-12 text-platinum/40" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const XIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, description, onFilesSelect, multiple, maxFiles = 5 }) => {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    onFilesSelect(items);
    // This effect should not depend on onFilesSelect to avoid re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
  
  // Effect for cleaning up Object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach(item => URL.revokeObjectURL(item.preview));
    };
  }, [items]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setIsProcessing(true);
      const newFiles = Array.from(files);
      
      const anonymizedFilesPromises = newFiles.map(file => anonymizeImage(file));
      const anonymizedFiles = await Promise.all(anonymizedFilesPromises);

      const newItems: WardrobeItem[] = anonymizedFiles.map((file: File) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      if (multiple) {
        setItems(prev => {
          const combined = [...prev, ...newItems];
          const toKeep = combined.slice(0, maxFiles);
          // Clean up URLs for items that are sliced off
          const toRemove = combined.slice(maxFiles);
          toRemove.forEach(item => URL.revokeObjectURL(item.preview));
          return toKeep;
        });
      } else {
        setItems(prev => {
          // Clean up old object URLs before setting the new one
          prev.forEach(item => URL.revokeObjectURL(item.preview));
          return newItems.slice(0, 1);
        });
      }
      setIsProcessing(false);
    }
    event.target.value = '';
  }, [multiple, maxFiles]);

  const removeItem = (index: number) => {
    setItems(prev => {
      const itemToRemove = prev[index];
      if (itemToRemove) {
        URL.revokeObjectURL(itemToRemove.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };
  
  const fileInputId = `file-upload-${title.replace(/\s+/g, '-')}`;


  return (
    <div className="bg-dark-blue/80 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-platinum/20">
      {title && <h3 className="text-xl font-semibold text-platinum uppercase tracking-wider">{title}</h3>}
      {description && <p className="text-sm text-platinum/60 mt-1">{description}</p>}
      
      <div className="mt-4">
        <label htmlFor={fileInputId} className={`relative rounded-xl font-medium text-platinum transition-colors duration-200 ${isProcessing ? 'cursor-wait opacity-70' : 'cursor-pointer bg-black/20 hover:text-white focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-dark-blue focus-within:ring-platinum'}`}>
          <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-platinum/30 border-dashed rounded-xl hover:border-platinum/50">
             {isProcessing ? (
              <div className="space-y-1 text-center">
                 <svg className="mx-auto h-12 w-12 text-platinum/40 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 <p className="text-sm text-platinum/80">Processing for privacy...</p>
                 <p className="text-xs text-platinum/50">Faces will be automatically blurred.</p>
              </div>
            ) : (
            <div className="space-y-1 text-center">
              <UploadIcon/>
              <div className="flex text-sm text-platinum/80">
                <span className="p-1">Upload files</span>
                <input id={fileInputId} name={fileInputId} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" multiple={multiple} disabled={isProcessing} />
              </div>
              <p className="text-xs text-platinum/50">PNG, JPG, up to 10MB</p>
            </div>
            )}
          </div>
        </label>
      </div>

      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {items.map((item, index) => (
            <div key={item.preview} className="relative aspect-square group">
              <img src={item.preview} alt={`preview ${index}`} className="h-full w-full object-cover rounded-xl shadow-md" />
                <button
                  onClick={() => removeItem(index)}
                  className="absolute top-1.5 right-1.5 bg-dark-blue/70 text-platinum rounded-full p-1 backdrop-blur-sm hover:bg-dark-blue hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  aria-label="Remove item"
                >
                  <XIcon />
                </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};