import React, { useCallback, useState, useEffect } from 'react';
import type { WardrobeItem } from '../types';

interface ImageUploaderProps {
  title: string;
  description: string;
  onFilesSelect: (items: WardrobeItem[]) => void;
  multiple: boolean;
  maxFiles?: number;
}

const UploadIcon: React.FC = () => (
    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
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

  useEffect(() => {
    onFilesSelect(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const newItems: WardrobeItem[] = newFiles.map((file: File) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      if (multiple) {
        setItems(prev => [...prev, ...newItems].slice(0, maxFiles));
      } else {
        setItems(newItems.slice(0, 1));
      }
    }
    event.target.value = '';
  }, [multiple, maxFiles]);

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };
  
  const fileInputId = `file-upload-${title.replace(/\s+/g, '-')}`;


  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200">
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
      
      <div className="mt-4">
        <label htmlFor={fileInputId} className="relative cursor-pointer bg-white rounded-xl font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
          <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl">
            <div className="space-y-1 text-center">
              <UploadIcon/>
              <div className="flex text-sm text-slate-600">
                <span className="p-1">Upload files</span>
                <input id={fileInputId} name={fileInputId} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" multiple={multiple} />
              </div>
              <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </label>
      </div>

      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {items.map((item, index) => (
            <div key={index} className="relative aspect-square">
              <img src={item.preview} alt={`preview ${index}`} className="h-full w-full object-cover rounded-xl shadow-md" />
                <button
                  onClick={() => removeItem(index)}
                  className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1 backdrop-blur-sm hover:bg-black/75 hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
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