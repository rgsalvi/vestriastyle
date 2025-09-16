import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { RecommendationDisplay } from './components/RecommendationDisplay';
import { BodyTypeSelector } from './components/BodyTypeSelector';
import { StyleRecipes } from './components/StyleRecipes';
import { WardrobeManager } from './components/WardrobeManager';
import { WardrobeInput } from './components/WardrobeInput';
import { Footer } from './components/Footer';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { getStyleAdvice } from './services/geminiService';
import type { AiResponse, WardrobeItem, BodyType, PersistentWardrobeItem, AnalysisItem } from './types';

const Header: React.FC = () => (
  <header className="text-center p-6 md:p-8 bg-white/60 backdrop-blur-lg sticky top-0 z-20 border-b border-slate-200">
    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
      AI Wardrobe Curator
    </h1>
    <p className="mt-2 text-lg text-slate-500 max-w-2xl mx-auto">Make smarter wardrobe decisions. See how a new item fits before you buy.</p>
  </header>
);

const WARDROBE_STORAGE_KEY = 'ai-wardrobe-items';

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

type Page = 'main' | 'privacy' | 'terms';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('main');
  const [newItem, setNewItem] = useState<AnalysisItem | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<AnalysisItem[]>([]);
  const [bodyType, setBodyType] = useState<BodyType>('None');
  const [recommendation, setRecommendation] = useState<AiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [managedWardrobe, setManagedWardrobe] = useState<PersistentWardrobeItem[]>([]);
  const [unsavedItemsFromAnalysis, setUnsavedItemsFromAnalysis] = useState<AnalysisItem[]>([]);

  // Load wardrobe from localStorage on initial render
  useEffect(() => {
    try {
      const savedWardrobe = localStorage.getItem(WARDROBE_STORAGE_KEY);
      if (savedWardrobe) {
        setManagedWardrobe(JSON.parse(savedWardrobe));
      }
    } catch (e) {
      console.error("Failed to load wardrobe from localStorage", e);
    }
  }, []);

  // Save wardrobe to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(managedWardrobe));
    } catch (e) {
      console.error("Failed to save wardrobe to localStorage", e);
    }
  }, [managedWardrobe]);


  const handleNewItemSelect = async (items: WardrobeItem[]) => {
    if (items.length === 0) {
      setNewItem(null);
      return;
    }
    const item = items[0];
    const dataUrl = await fileToDataUrl(item.file);
    const [header, base64] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)![1];
    setNewItem({
        preview: item.preview,
        dataUrl,
        base64,
        mimeType,
    });
  };


  const handleAddItemsToWardrobe = async (items: WardrobeItem[]) => {
    const newManagedItemsPromises = items.map(async (item, index) => {
      const dataUrl = await fileToDataUrl(item.file);
      return {
        id: `item-${Date.now()}-${index}`,
        dataUrl,
        description: '',
        category: 'Uncategorized',
        color: '',
        fabric: '',
        season: '',
      };
    });
    const newManagedItems = await Promise.all(newManagedItemsPromises);
    setManagedWardrobe(prev => [...prev, ...newManagedItems]);
  };

  const handleSaveWardrobeItem = (itemData: Omit<PersistentWardrobeItem, 'id'>, existingId?: string) => {
    if (existingId) {
      // Update existing item
      setManagedWardrobe(prev => prev.map(item =>
        item.id === existingId ? { ...item, ...itemData, id: existingId } : item
      ));
    } else {
      // Create new item
      const newItem: PersistentWardrobeItem = {
        id: `item-${Date.now()}`,
        ...itemData
      };
      setManagedWardrobe(prev => [...prev, newItem]);
    }
  };


  const handleDeleteWardrobeItem = (itemId: string) => {
    setManagedWardrobe(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSaveUnsavedItems = () => {
    const newManagedItems: PersistentWardrobeItem[] = unsavedItemsFromAnalysis.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      dataUrl: item.dataUrl,
      description: '', // Can be enhanced later
      category: 'Uncategorized',
      color: '',
      fabric: '',
      season: '',
    }));
    setManagedWardrobe(prev => [...prev, ...newManagedItems]);
    setUnsavedItemsFromAnalysis([]); // Clear after saving
  };


  const handleGetAdvice = useCallback(async () => {
    if (!newItem) {
      setError('Please upload a new item to analyze.');
      return;
    }
    if (wardrobeItems.length === 0) {
      setError('Please upload or select at least one item from your existing wardrobe.');
      return;
    }
    if (bodyType === 'None') {
      setError('Please select your body type for personalized advice.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecommendation(null);
    setUnsavedItemsFromAnalysis([]);

    try {
      const response = await getStyleAdvice(newItem, wardrobeItems, bodyType);
      setRecommendation(response);

      // After successful analysis, determine which items are not already saved.
      const allAnalysisItems = [newItem, ...wardrobeItems];
      const savedDataUrls = new Set(managedWardrobe.map(item => item.dataUrl));
      const unsaved = allAnalysisItems.filter(item => !savedDataUrls.has(item.dataUrl));
      setUnsavedItemsFromAnalysis(unsaved);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [newItem, wardrobeItems, bodyType, managedWardrobe]);
  
  const renderPage = () => {
    switch (currentPage) {
      case 'privacy':
        return <PrivacyPolicy onBack={() => setCurrentPage('main')} />;
      case 'terms':
        return <TermsOfService onBack={() => setCurrentPage('main')} />;
      case 'main':
      default:
        return (
          <>
            <main className="container mx-auto p-4 md:p-8">
              <div className="space-y-12">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Style Analysis</h2>
                  <p className="mt-2 text-lg text-slate-500">Get instant feedback on a new item.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <div className="space-y-8">
                    <ImageUploader
                      title="1. Upload New Item"
                      description="Select a single image of an item you're thinking of buying."
                      onFilesSelect={handleNewItemSelect}
                      multiple={false}
                    />
                    <WardrobeInput 
                      managedWardrobe={managedWardrobe}
                      onAnalysisItemsChange={setWardrobeItems}
                      maxFiles={5}
                    />
                    <BodyTypeSelector selectedBodyType={bodyType} onBodyTypeChange={setBodyType} />
                    <div className="p-4 bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50">
                      {error && <p className="text-red-500 text-center mb-4 font-medium">{error}</p>}
                      <button
                        onClick={handleGetAdvice}
                        disabled={isLoading || !newItem || wardrobeItems.length === 0 || bodyType === 'None'}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-4 px-4 rounded-full shadow-lg shadow-purple-500/20 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-lg disabled:shadow-slate-400/20 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-purple-500/50"
                      >
                        {isLoading ? 'Analyzing Your Style...' : 'Get Style Advice'}
                      </button>
                    </div>
                  </div>
                  <div className="lg:sticky lg:top-28">
                    <RecommendationDisplay
                      recommendation={recommendation}
                      isLoading={isLoading}
                      unsavedItems={unsavedItemsFromAnalysis}
                      onSaveUnsavedItems={handleSaveUnsavedItems}
                    />
                  </div>
                </div>
              </div>
            </main>
            <WardrobeManager 
              items={managedWardrobe}
              onAddItems={handleAddItemsToWardrobe}
              onSaveItem={handleSaveWardrobeItem}
              onDeleteItem={handleDeleteWardrobeItem}
            />
            <StyleRecipes />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="flex-grow">
        <Header />
        {renderPage()}
      </div>
      <Footer 
        onNavigateToPrivacy={() => setCurrentPage('privacy')}
        onNavigateToTerms={() => setCurrentPage('terms')}
      />
    </div>
  );
};

export default App;