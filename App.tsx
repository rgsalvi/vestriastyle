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
import { LoginPage } from './components/LoginPage';
import { OnboardingWizard } from './components/OnboardingWizard';
import { getStyleAdvice } from './services/geminiService';
import type { AiResponse, WardrobeItem, BodyType, PersistentWardrobeItem, AnalysisItem, User, StyleProfile } from './types';
import { jwtDecode } from 'jwt-decode';

interface HeaderProps {
  user: User | null;
  onSignOut: () => void;
  onSignIn: () => void;
}

const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 400 280"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Vestria Style Logo"
    >
        <g fill="#C2BEBA">
            {/* Symbol */}
            <g transform="translate(150 0) scale(1)">
                <g stroke="#C2BEBA" strokeWidth="8" strokeLinecap="round">
                    <circle cx="20" cy="20" r="8" stroke="none"/>
                    <circle cx="50" cy="20" r="8" stroke="none"/>
                    <circle cx="80" cy="20" r="8" stroke="none"/>
                    <circle cx="20" cy="50" r="8" stroke="none"/>
                    <circle cx="50" cy="50" r="8" stroke="none"/>
                    <circle cx="80" cy="50" r="8" stroke="none"/>
                    <circle cx="20" cy="80" r="8" stroke="none"/>
                    <circle cx="50" cy="80" r="8" stroke="none"/>
                    <circle cx="80" cy="80" r="8" stroke="none"/>
                    <line x1="80" y1="20" x2="20" y2="80"/>
                    <line x1="20" y1="20" x2="42" y2="42"/>
                    <line x1="58" y1="58" x2="80" y2="80"/>
                </g>
            </g>
            {/* VESTRIA */}
            <text
                x="50%"
                y="185"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="#C2BEBA"
                fontSize="80"
                fontFamily="Inter, sans-serif"
                fontWeight="600"
                letterSpacing="0.1em"
                stroke="none"
            >
                VESTRIA
            </text>
            {/* STYLE */}
            <text
                x="50%"
                y="245"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="#C2BEBA"
                fontSize="36"
                fontFamily="Space Grotesk, monospace"
                letterSpacing="0.2em"
                stroke="none"
            >
                STYLE
            </text>
        </g>
    </svg>
);


const Header: React.FC<HeaderProps> = ({ user, onSignOut, onSignIn }) => (
  <header className="p-4 md:p-6 bg-dark-blue/80 backdrop-blur-lg sticky top-0 z-20 border-b border-platinum/20 flex justify-between items-center">
    <Logo className="h-24 w-auto" />
    <div className="flex items-center space-x-4">
      {user ? (
        <div className="relative group">
          <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full cursor-pointer border-2 border-platinum/30" />
          <div className="absolute top-full right-0 mt-2 w-48 bg-[#1F2937] rounded-xl shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto border border-platinum/20">
            <p className="font-semibold text-sm px-3 py-1 text-platinum truncate">{user.name}</p>
            <p className="text-xs px-3 text-platinum/60 truncate mb-1">{user.email}</p>
            <div className="h-px bg-platinum/20 my-1"></div>
            <button onClick={onSignOut} className="w-full text-left text-sm text-red-400 px-3 py-1 hover:bg-platinum/10 rounded-md">
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onSignIn}
          className="px-5 py-2 bg-dark-blue text-platinum font-semibold rounded-full shadow-md hover:bg-[#1F2937] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum ring-1 ring-platinum/50"
        >
          Sign In
        </button>
      )}
    </div>
  </header>
);

const WARDROBE_STORAGE_KEY = 'ai-wardrobe-items';
const USER_STORAGE_KEY = 'ai-wardrobe-user';
const STYLE_PROFILE_KEY = 'ai-wardrobe-style-profile';

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

type Page = 'main' | 'privacy' | 'terms';

// Fix: Augment the Window interface to declare the 'google' property for Google Sign-In, preventing redeclaration errors.
declare global {
  interface Window {
    google: any;
  }
}

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
  
  const [user, setUser] = useState<User | null>(null);
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Auth and User Data Logic
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      const userProfile = localStorage.getItem(`${STYLE_PROFILE_KEY}-${userData.id}`);
      if (userProfile) {
        const profileData = JSON.parse(userProfile);
        setStyleProfile(profileData);
        setBodyType(profileData.bodyType || 'None');
      } else {
        setShowOnboarding(true);
      }
    }
    setIsAuthLoading(false);
  }, []);
  
  const handleGoogleSignIn = (res: any) => {
    const decoded: { name: string; email: string; sub: string; picture: string } = jwtDecode(res.credential);
    const userData: User = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
    setShowLogin(false);

    const userProfile = localStorage.getItem(`${STYLE_PROFILE_KEY}-${userData.id}`);
    if (!userProfile) {
        setShowOnboarding(true);
    } else {
        setStyleProfile(JSON.parse(userProfile));
    }
  };
  
  const handleSignOut = () => {
    setUser(null);
    setStyleProfile(null);
    setManagedWardrobe([]);
    setBodyType('None');
    localStorage.removeItem(USER_STORAGE_KEY);
    // Note: We keep style profiles and wardrobe in local storage in case the user logs back in
    if (window.google) {
        // Fix: Use window.google to access the globally declared google object.
        window.google.accounts.id.disableAutoSelect();
    }
  };

  const handleOnboardingComplete = (profile: StyleProfile) => {
    if (user) {
        localStorage.setItem(`${STYLE_PROFILE_KEY}-${user.id}`, JSON.stringify(profile));
        setStyleProfile(profile);
        setBodyType(profile.bodyType || 'None');
        setShowOnboarding(false);
    }
  };

  // Wardrobe Logic
  useEffect(() => {
    if (user) {
      try {
        const savedWardrobe = localStorage.getItem(`${WARDROBE_STORAGE_KEY}-${user.id}`);
        if (savedWardrobe) setManagedWardrobe(JSON.parse(savedWardrobe));
      } catch (e) {
        console.error("Failed to load wardrobe", e);
      }
    } else {
        setManagedWardrobe([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(`${WARDROBE_STORAGE_KEY}-${user.id}`, JSON.stringify(managedWardrobe));
      } catch (e) {
        console.error("Failed to save wardrobe", e);
      }
    }
  }, [managedWardrobe, user]);


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
    if (!user) {
        setShowLogin(true);
        return;
    }
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
      setManagedWardrobe(prev => prev.map(item =>
        item.id === existingId ? { ...item, ...itemData, id: existingId } : item
      ));
    } else {
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
    if (!user) {
        setShowLogin(true);
        return;
    }
    const newManagedItems: PersistentWardrobeItem[] = unsavedItemsFromAnalysis.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      dataUrl: item.dataUrl,
      description: '',
      category: 'Uncategorized',
      color: '',
      fabric: '',
      season: '',
    }));
    setManagedWardrobe(prev => [...prev, ...newManagedItems]);
    setUnsavedItemsFromAnalysis([]);
  };


  const handleGetAdvice = useCallback(async () => {
    if (!newItem) { setError('Please upload a new item to analyze.'); return; }
    if (wardrobeItems.length === 0) { setError('Please upload or select at least one item from your existing wardrobe.'); return; }
    if (bodyType === 'None') { setError('Please select your body type for personalized advice.'); return; }

    setIsLoading(true);
    setError(null);
    setRecommendation(null);
    setUnsavedItemsFromAnalysis([]);

    try {
      const currentProfile = user ? styleProfile : null;
      const response = await getStyleAdvice(newItem, wardrobeItems, bodyType, currentProfile);
      setRecommendation(response);

      if (user) {
        const allAnalysisItems = [newItem, ...wardrobeItems];
        const savedDataUrls = new Set(managedWardrobe.map(item => item.dataUrl));
        const unsaved = allAnalysisItems.filter(item => !savedDataUrls.has(item.dataUrl));
        setUnsavedItemsFromAnalysis(unsaved);
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [newItem, wardrobeItems, bodyType, managedWardrobe, styleProfile, user]);
  
  const renderPage = () => {
    if (isAuthLoading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-platinum"></div></div>;
    }
    if (showLogin) {
        return <LoginPage onGoogleSignIn={handleGoogleSignIn} onBack={() => setShowLogin(false)} />;
    }
    if (user && showOnboarding) {
        return <OnboardingWizard user={user} onComplete={handleOnboardingComplete} />;
    }

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
                  <h2 className="text-3xl font-semibold text-platinum tracking-[0.2em] uppercase">Style Analysis</h2>
                  <p className="mt-3 text-lg text-platinum/60">Every wardrobe hides a world. Open yours with Vestria Style.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <div className="space-y-8">
                    <ImageUploader
                      title="1. Upload New Item"
                      description="Select a single image of an item you're thinking of buying. For best results, use clear photos of just the clothing."
                      onFilesSelect={handleNewItemSelect}
                      multiple={false}
                    />
                    <WardrobeInput 
                      user={user}
                      managedWardrobe={managedWardrobe}
                      onAnalysisItemsChange={setWardrobeItems}
                      maxFiles={5}
                    />
                    <BodyTypeSelector selectedBodyType={bodyType} onBodyTypeChange={setBodyType} />
                    <div className="p-4 bg-dark-blue/80 backdrop-blur-lg rounded-2xl shadow-lg border border-platinum/20">
                      {error && <p className="text-red-400 text-center mb-4 font-medium">{error}</p>}
                      <button
                        onClick={handleGetAdvice}
                        disabled={isLoading || !newItem || wardrobeItems.length === 0 || bodyType === 'None'}
                        className="w-full bg-platinum text-dark-blue font-bold py-4 px-4 rounded-full shadow-lg shadow-platinum/10 hover:scale-105 hover:shadow-xl hover:shadow-platinum/20 disabled:bg-platinum/50 disabled:text-dark-blue/50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum/50"
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
              user={user}
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
    <div className="min-h-screen bg-dark-blue flex flex-col">
      <div className="flex-grow">
        <Header user={user} onSignOut={handleSignOut} onSignIn={() => setShowLogin(true)} />
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