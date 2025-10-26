import React, { useState, useCallback, useEffect, useRef } from 'react';
import { lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { foundersMap, foundersArray } from './components/founders';
import type { FounderData } from './components/FounderBioModal';
import type { FounderId } from './components/founders';
import { ImageUploader } from './components/ImageUploader';
import { RecommendationDisplay } from './components/RecommendationDisplay';
import { BodyTypeSelector } from './components/BodyTypeSelector';
import { StyleRecipes } from './components/StyleRecipes';
import { WardrobeManager } from './components/WardrobeManager';
import { WardrobeInput } from './components/WardrobeInput';
import { Footer } from './components/Footer';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { RefundPolicy } from './components/RefundPolicy';
import { LoginPage } from './components/LoginPage';
import { OnboardingWizard } from './components/OnboardingWizard';
import { StylistChatModal } from './components/StylistChatModal';
import AboutUs from './components/AboutUs';
import PartnerPage from './components/PartnerPage';
import ProfilePage from './components/ProfilePage';
const FounderBioModal = React.lazy(() => import('./components/FounderBioModal'));
import { getStyleAdvice, trackEvent, initiateChatSession } from './services/geminiService';
import { PremiumUpsellModal } from './components/PremiumUpsellModal';
import type { AiResponse, WardrobeItem, BodyType, PersistentWardrobeItem, AnalysisItem, User, StyleProfile, Occasion } from './types';
import { observeAuth, signOut as fbSignOut, updateUserProfile, deleteCurrentUser, auth, resendVerification } from './services/firebase';
import { repositoryLoadUserProfile as loadUserProfile, repositorySaveUserProfile as saveUserProfile, repositoryUploadAvatar as uploadAvatar, repositoryListWardrobe as listWardrobe, getSupabaseAvatarPublicUrl, repositoryEnsureUserRow as ensureUserRow, repositoryLoadUserIdentity } from './services/repository';

interface HeaderProps {
  user: User | null;
  onSignOut: () => void;
  onSignIn: () => void; // legacy; use onOpenLogin for explicit mode
  onOpenLogin: (mode: 'signin' | 'signup') => void;
  onChatNav: () => void;
  onNavigateAbout: () => void;
  onNavigateRecipes: () => void;
  onNavigatePartner: () => void;
  showWardrobeButton: boolean;
  onWardrobeClick: () => void;
  onEditProfile: () => void;
  activePage: Page;
  recipesActive: boolean;
}

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 400 280"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Vestria Style Logo"
  >
    <g fill="#C2BEBA">
      <g transform="translate(150 0) scale(1)">
        <g stroke="#C2BEBA" strokeWidth="8" strokeLinecap="round">
          <circle cx="20" cy="20" r="8" stroke="none" />
          <circle cx="50" cy="20" r="8" stroke="none" />
          <circle cx="80" cy="20" r="8" stroke="none" />
          <circle cx="20" cy="50" r="8" stroke="none" />
          <circle cx="50" cy="50" r="8" stroke="none" />
          <circle cx="80" cy="50" r="8" stroke="none" />
          <circle cx="20" cy="80" r="8" stroke="none" />
          <circle cx="50" cy="80" r="8" stroke="none" />
          <circle cx="80" cy="80" r="8" stroke="none" />
          <line x1="80" y1="20" x2="20" y2="80" />
          <line x1="20" y1="20" x2="42" y2="42" />
          <line x1="58" y1="58" x2="80" y2="80" />
        </g>
      </g>
      <text x="50%" y="185" dominantBaseline="middle" textAnchor="middle" fill="#C2BEBA" fontSize="80" fontFamily="Inter, sans-serif" fontWeight="600" stroke="none">VESTRIA</text>
      <text x="50%" y="245" dominantBaseline="middle" textAnchor="middle" fill="#C2BEBA" fontSize="36" fontFamily="Space Grotesk, monospace" letterSpacing="0.2em" stroke="none">STYLE</text>
    </g>
  </svg>
);

const EditProfileModal: React.FC<{
  user: User;
  onClose: () => void;
  onSave: (updated: Partial<User>) => void;
}> = ({ user, onClose, onSave }) => {
  const [name, setName] = React.useState(user.name);
  const [avatar, setAvatar] = React.useState<string>(user.picture);
  const [preview, setPreview] = React.useState<string>(user.picture);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const toDataUrl = (f: File) => new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(f);
    });
    const dataUrl = await toDataUrl(file);
    setAvatar(dataUrl);
    setPreview(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-dark-blue/90 backdrop-blur-lg rounded-2xl border border-platinum/20 shadow-lg p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-platinum">Edit Profile</h3>
          <button onClick={onClose} className="text-platinum/70 hover:text-white">✕</button>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-[140px,1fr] gap-4">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img src={preview} alt={user.name} className="h-28 w-28 rounded-full border-2 border-platinum/30 object-cover" />
              <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-platinum text-dark-blue text-xs font-semibold px-2 py-1 rounded-full shadow hover:opacity-90" type="button" aria-controls="edit-profile-avatar-input" aria-label="Change profile photo">Change</button>
              <input id="edit-profile-avatar-input" ref={fileInputRef} type="file" accept="image/*" className="hidden" title="Upload profile photo" aria-label="Upload profile photo" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
            <p className="text-xs text-platinum/60">PNG/JPG, up to ~2MB</p>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-profile-name" className="block text-sm text-platinum/70 mb-1">Name</label>
              <input id="edit-profile-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum" />
            </div>
            <div>
              <label htmlFor="edit-profile-email" className="block text-sm text-platinum/70 mb-1">Email</label>
              <input id="edit-profile-email" value={user.email} disabled className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum/70" />
              <p className="mt-1 text-xs text-platinum/50">Email changes are not supported. Please contact support to modify your email address.</p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-full border border-platinum/30 text-platinum/80 hover:bg-black/20">Cancel</button>
          <button onClick={() => onSave({ name: name.trim() || user.name, picture: avatar })} className="px-4 py-2 rounded-full bg-platinum text-dark-blue font-semibold hover:opacity-90">Save Changes</button>
        </div>
      </div>
    </div>
  );
};


const Header: React.FC<HeaderProps> = ({ user, onSignOut, onSignIn, onOpenLogin, onChatNav, onNavigateAbout, onNavigateRecipes, onNavigatePartner, showWardrobeButton, onWardrobeClick, onEditProfile, activePage, recipesActive }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [founderModalOpen, setFounderModalOpen] = React.useState(false);
  const [activeFounder, setActiveFounder] = React.useState<null | {
    id: 'tanvi' | 'muskaan' | 'riddhi';
    name: string; title: string; headshot: string; bio?: string; signatureAesthetic?: string; highlights?: string[]; socials?: { [k: string]: string }; galleryPaths?: string[];
  }>(null);

  // foundersMap and foundersArray are imported from components/founders

  const greetingFirstName = React.useMemo(() => {
    if (!user) return null;
    try {
      const raw = localStorage.getItem(`identity-cache-${user.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        const fn = (parsed?.first_name as string | undefined)?.trim();
        if (fn) return fn;
        const dn = (parsed?.display_name as string | undefined)?.trim();
        if (dn) return dn.split(' ').filter(Boolean)[0] || null;
      }
    } catch {}
    const n = (user.name || '').trim();
    if (!n || n.includes('@')) return null;
    return n.split(' ').filter(Boolean)[0] || null;
  }, [user?.id, user?.name]);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const onClickAbout = () => onNavigateAbout();
  const onClickRecipes = () => onNavigateRecipes();
  const onClickPartner = () => onNavigatePartner();
  const onClickChatNav = () => { onChatNav(); };

  const aboutActive = activePage === 'about';
  const partnerActive = activePage === 'partner';
  const navLinkBase = "group relative px-3 py-1.5 rounded-md text-sm tracking-[0.06em] text-platinum/75 hover:text-white transition-colors";
  const navUnderlineBase = "after:pointer-events-none after:absolute after:left-1/2 after:bottom-0 after:h-px after:w-0 after:-translate-x-1/2 after:bg-gradient-to-r after:from-transparent after:via-platinum/60 after:to-transparent after:transition-all after:duration-200 group-hover:after:w-full focus-visible:after:w-full";

  return (
  <>
  <header className="relative p-4 md:p-6 bg-dark-blue/80 backdrop-blur-lg sticky top-0 z-20 border-b border-platinum/20">
    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
      {/* Left: Logo + primary nav */}
      <div className="flex items-center gap-6 min-w-0">
        <Logo className="h-24 w-auto flex-shrink-0" />
        <nav aria-label="Primary" className="hidden md:flex items-center gap-2">
          <button onClick={onClickAbout} className={`${navLinkBase} ${navUnderlineBase} ${aboutActive ? 'after:w-full text-platinum' : ''}`}>
            About Us
          </button>
          <HeaderFoundersEntry founders={foundersArray} onSelect={(f) => {
            const full = foundersMap[f.id as FounderId];
            setActiveFounder(full);
            setFounderModalOpen(true);
          }} />
          <button onClick={onClickRecipes} className={`${navLinkBase} ${navUnderlineBase} ${recipesActive ? 'after:w-full text-platinum' : ''}`}>
            #VestriaStyleRecipes
          </button>
          <button onClick={onClickPartner} className={`${navLinkBase} ${navUnderlineBase} ${partnerActive ? 'after:w-full text-platinum' : ''}`}>
            Partner With Us
          </button>
          <button onClick={onClickChatNav} className="ml-1 inline-flex items-center px-3.5 py-1.5 rounded-full bg-platinum text-dark-blue font-semibold shadow-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum">
            Chat With A Stylist
          </button>
        </nav>
      </div>

      {/* Right: utilities */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            {greetingFirstName && (
              <span className="hidden sm:inline text-sm text-platinum/80">Welcome, <span className="text-platinum font-semibold">{greetingFirstName}</span></span>
            )}
            {showWardrobeButton && (
              <button
                onClick={onWardrobeClick}
                className="hidden md:inline-flex items-center px-4 py-2 bg-platinum/10 text-platinum font-semibold rounded-full shadow-sm hover:bg-platinum/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum ring-1 ring-platinum/30"
              >
                My Wardrobe
              </button>
            )}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                onMouseEnter={() => setMenuOpen(true)}
                className="relative"
                aria-haspopup="menu"
                aria-controls="user-menu"
              >
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full cursor-pointer border-2 border-platinum/30"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.onerror = null;
                    if (!user || !user.name) return;
                    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`;
                    if (target.src !== fallback) target.src = fallback;
                  }}
                />
              </button>
              {menuOpen && (
                <div
                  id="user-menu"
                  className="absolute top-full right-0 mt-2 w-56 bg-[#1F2937] rounded-xl shadow-lg p-2 border border-platinum/20"
                  role="menu"
                  onMouseEnter={() => setMenuOpen(true)}
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <p className="font-semibold text-sm px-3 py-1 text-platinum truncate">{user.name}</p>
                  <p className="text-xs px-3 text-platinum/60 truncate mb-1">{user.email}</p>
                  <div className="h-px bg-platinum/20 my-1"></div>
                  <button onClick={onEditProfile} className="w-full text-left text-sm text-platinum px-3 py-2 rounded-md hover:bg-platinum/10" role="menuitem">Edit Profile</button>
                  <button onClick={onSignOut} className="w-full text-left text-sm text-red-400 px-3 py-2 rounded-md hover:bg-platinum/10" role="menuitem">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenLogin('signup')}
              className="hidden sm:inline-flex px-4 py-2 bg-platinum text-dark-blue font-semibold rounded-full shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum"
            >
              Sign Up
            </button>
            <button
              onClick={() => onOpenLogin('signin')}
              className="px-4 py-2 bg-dark-blue text-platinum font-semibold rounded-full shadow-md hover:bg-[#1F2937] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum ring-1 ring-platinum/50"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  </header>
  {/* Portal modal to body to avoid clipping within sticky header/backdrop filters */}
  {founderModalOpen && createPortal(
    <Suspense fallback={null}>
      <FounderBioModal
        isOpen={founderModalOpen}
        onClose={() => setFounderModalOpen(false)}
        founder={activeFounder}
      />
    </Suspense>,
    document.body
  )}
  </>
  );
};

// Small helper for a compact, always-visible "Meet The Founders" entry with a dropdown of names
const HeaderFoundersEntry: React.FC<{ founders: Array<{ id: 'tanvi'|'muskaan'|'riddhi'; name: string; title: string; headshot: string; galleryPaths?: string[] }>; onSelect: (f: { id: 'tanvi'|'muskaan'|'riddhi'; name: string; title: string; headshot: string; galleryPaths: string[] }) => void }>
  = ({ founders, onSelect }) => {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const hoverTimer = React.useRef<number | null>(null);
  const clearHoverTimer = () => { if (hoverTimer.current !== null) { clearTimeout(hoverTimer.current); hoverTimer.current = null; } };
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div
      className="relative"
      ref={wrapRef}
      onMouseEnter={() => { clearHoverTimer(); setOpen(true); }}
      onMouseLeave={() => { clearHoverTimer(); hoverTimer.current = window.setTimeout(() => setOpen(false), 150); }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        onFocus={() => { clearHoverTimer(); setOpen(true); }}
        className="hidden sm:inline-flex items-center px-2 py-1 rounded-md text-platinum/80 hover:text-white hover:bg-white/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum"
        aria-haspopup="true"
      >
        <span className="text-sm tracking-wide">The Founders</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-[#1F2937] rounded-xl shadow-lg p-2 border border-platinum/20 z-30">
          <p className="text-[11px] uppercase tracking-widest text-platinum/50 px-3 pb-1">Founders</p>
          {founders.map(f => (
            <button
              key={f.id}
              className="w-full text-left text-sm text-platinum px-3 py-2 rounded-md hover:bg-platinum/10"
              onClick={() => {
                onSelect({ id: f.id, name: f.name, title: f.title, headshot: f.headshot, galleryPaths: f.galleryPaths ?? [`/founders/${f.id}/work-01.jpg`, `/founders/${f.id}/work-02.jpg`, `/founders/${f.id}/work-03.jpg`] });
                setOpen(false);
              }}
            >{f.name}</button>
          ))}
        </div>
      )}
    </div>
  );
};

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

type Page = 'main' | 'privacy' | 'terms' | 'refund' | 'profile' | 'about' | 'partner';

// No global Google object required with Firebase Email/Password

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('main');
  const [newItem, setNewItem] = useState<AnalysisItem | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<AnalysisItem[]>([]);
  const [bodyType, setBodyType] = useState<BodyType>('None');
  const [occasion, setOccasion] = useState<Occasion>('None');
  const [recommendation, setRecommendation] = useState<AiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [managedWardrobe, setManagedWardrobe] = useState<PersistentWardrobeItem[]>([]);
  const [unsavedItemsFromAnalysis, setUnsavedItemsFromAnalysis] = useState<AnalysisItem[]>([]);
  
  const [user, setUser] = useState<User | null>(null);
  // No more guest chat users; chat is premium-only
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [onboardingSuccessToast, setOnboardingSuccessToast] = useState(false);
  
  // Pending-action flow: capture user's intended action when login is required and resume post-sign-in
  type PendingAction =
    | { type: 'open-chat'; context: AiResponse; newItem: AnalysisItem | null }
    | { type: 'add-wardrobe-items'; items: WardrobeItem[] }
    | { type: 'save-unsaved-items' };
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<AiResponse | null>(null);
  const [chatNewItem, setChatNewItem] = useState<AnalysisItem | null>(null);
  const [loginInitialMode, setLoginInitialMode] = useState<'signin' | 'signup'>('signin');
  // Profile page controlled via currentPage === 'profile'
  const [profileSavedBanner, setProfileSavedBanner] = useState<string | null>(null);
  const [onboardingGateBanner, setOnboardingGateBanner] = useState(false);
  const [showVerifyEmailBanner, setShowVerifyEmailBanner] = useState(false);
  const [pendingChatRetry, setPendingChatRetry] = useState<{ context: AiResponse; newItem: AnalysisItem | null } | null>(null);
  // Track if we already triggered immediate onboarding to prevent duplicate flicker
  const immediateOnboardingRef = useRef(false);
  const [recipesInView, setRecipesInView] = useState(false);

  // Scroll to top when navigating to content pages like About or Partner
  useEffect(() => {
    if (currentPage === 'partner' || currentPage === 'about') {
      try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {}
    }
  }, [currentPage]);

  // Track when Style Recipes section is in view on the main page
  useEffect(() => {
    if (currentPage !== 'main') {
      setRecipesInView(false);
      return;
    }
    const el = document.getElementById('style-recipes');
    if (!el) { setRecipesInView(false); return; }
    const observer = new IntersectionObserver(([entry]) => {
      setRecipesInView(entry.isIntersecting);
    }, { root: null, rootMargin: '-30% 0px -60% 0px', threshold: 0.01 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [currentPage]);

  // Utility: prevent indefinite hangs by timing out slow promises
  const withTimeout = useCallback(async <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
    return await new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
      p.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
    });
  }, []);

  // Completion now determined solely by explicit flag
  const isProfileComplete = (p: any | null) => !!(p && p.isOnboarded === true);

  // Auth and User Data Logic
  useEffect(() => {
    const unsub = observeAuth((fbUser) => {
      if (fbUser) {
        // Read cached Supabase identity to avoid name flicker
        let cachedName: string | null = null;
        try {
          const raw = localStorage.getItem(`identity-cache-${fbUser.uid}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.display_name === 'string' && parsed.display_name.trim()) {
              cachedName = parsed.display_name;
            }
          }
        } catch {}
        const mapped: User = {
          id: fbUser.uid,
          name: cachedName || fbUser.displayName || fbUser.email || 'User',
          email: fbUser.email || '',
          picture: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent((cachedName || fbUser.displayName || fbUser.email || 'User'))}`,
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mapped));
        setUser(mapped);
        ensureUserRow(mapped.id, mapped.email, mapped.name).catch(e => console.warn('ensureUserRow failed', e));
        (async () => {
          try {
            // Prefer Supabase identity for display name
            try {
              const identity = await repositoryLoadUserIdentity(mapped.id);
              if (identity?.display_name) {
                const updated = { ...mapped, name: identity.display_name } as User;
                setUser(updated);
                try { localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)); } catch {}
                try { localStorage.setItem(`identity-cache-${mapped.id}`, JSON.stringify({ display_name: identity.display_name, date_of_birth: identity.date_of_birth ?? null, first_name: identity.first_name ?? null, last_name: identity.last_name ?? null })); } catch {}
              }
            } catch (e) { /* non-fatal */ }
            // Try cloud profile first (do NOT pre-create an empty doc; we want absence to trigger onboarding)
            const cloudProfile = await loadUserProfile(mapped.id);
            if (cloudProfile) {
              console.log('[profile-load] source=cloud hasFlag=', !!cloudProfile.onboardingComplete);
              if (fbUser.emailVerified && !cloudProfile.isPremium) {
                try { await saveUserProfile(mapped.id, { isPremium: true }); cloudProfile.isPremium = true; } catch (e) { console.warn('Failed to auto-upgrade premium', e); }
              }
              // Derive header picture from storage path if present
              if ((cloudProfile as any).avatar_url) {
                mapped.picture = getSupabaseAvatarPublicUrl((cloudProfile as any).avatar_url);
              }
              // Ignore legacy onboardingComplete and heuristics per new spec; rely only on isOnboarded
              if (isProfileComplete(cloudProfile)) {
                setStyleProfile(cloudProfile);
                setBodyType(cloudProfile.bodyType || 'None');
                setShowOnboarding(false);
              } else {
                // Incomplete / blank profile doc -> trigger onboarding
                setStyleProfile(null);
                setShowOnboarding(true);
              }
              try { localStorage.setItem(`${STYLE_PROFILE_KEY}-${mapped.id}`, JSON.stringify(cloudProfile)); } catch {}
            } else {
              // Fallback to local and decide onboarding
              const profileRaw = localStorage.getItem(`${STYLE_PROFILE_KEY}-${mapped.id}`);
              if (profileRaw) {
                const localProf = JSON.parse(profileRaw);
                console.log('[profile-load] source=local hasFlag=', !!localProf.onboardingComplete);
                if (fbUser.emailVerified && !localProf.isPremium) {
                  localProf.isPremium = true;
                }
                // Map local storage path to public URL for header
                if ((localProf as any).avatar_url) {
                  mapped.picture = getSupabaseAvatarPublicUrl((localProf as any).avatar_url);
                }
                // No heuristic backfill; will force onboarding if isOnboarded not true
                if (isProfileComplete(localProf)) {
                  setStyleProfile(localProf);
                  setBodyType(localProf.bodyType || 'None');
                  setShowOnboarding(false);
                  // lazy migrate to cloud
                  try { await saveUserProfile(mapped.id, localProf); } catch (e) { console.warn('Failed to migrate local profile to cloud', e); }
                } else {
                  setStyleProfile(null);
                  setShowOnboarding(true);
                }
              } else {
                // No profile anywhere: if not already triggered immediately, show onboarding now.
                if (!immediateOnboardingRef.current) {
                  console.log('[onboarding-decision] deferred-new-user-no-profile');
                  setShowOnboarding(true);
                }
              }
            }
          } catch (e) {
            console.warn('Failed to load profile from cloud, falling back to local', e);
            try {
              const profileRaw = localStorage.getItem(`${STYLE_PROFILE_KEY}-${mapped.id}`);
              if (profileRaw) {
                const localProf = JSON.parse(profileRaw);
                console.log('[profile-load] source=local-fallback hasFlag=', !!localProf.onboardingComplete);
                if (fbUser.emailVerified && !localProf.isPremium) localProf.isPremium = true;
                if ((localProf as any).avatar_url) {
                  mapped.picture = getSupabaseAvatarPublicUrl((localProf as any).avatar_url);
                }
                // No heuristic backfill in fallback
                if (isProfileComplete(localProf)) {
                  setStyleProfile(localProf);
                  setBodyType(localProf.bodyType || 'None');
                  setShowOnboarding(false);
                } else {
                  setStyleProfile(null);
                  if (!immediateOnboardingRef.current) setShowOnboarding(true);
                }
              } else {
                if (!immediateOnboardingRef.current) {
                  console.log('[onboarding-decision] fallback-no-profile');
                  setShowOnboarding(true);
                }
              }
            } catch {}
          }
          // Wardrobe cloud load (non-blocking). If none, keep local.
          try {
            const cloudWardrobe = await listWardrobe(mapped.id);
            if (cloudWardrobe && cloudWardrobe.length > 0) {
              setManagedWardrobe(cloudWardrobe);
              localStorage.setItem(`${WARDROBE_STORAGE_KEY}-${mapped.id}`, JSON.stringify(cloudWardrobe));
            } else {
              const savedWardrobe = localStorage.getItem(`${WARDROBE_STORAGE_KEY}-${mapped.id}`);
              if (savedWardrobe) {
                setManagedWardrobe(JSON.parse(savedWardrobe));
              } else {
                setManagedWardrobe([]);
              }
            }
          } catch (e) {
            console.warn('Failed to load wardrobe from cloud', e);
          }
        })();
      } else {
        setUser(null);
        setStyleProfile(null);
        setShowOnboarding(false);
      }
      setIsAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Immediate onboarding trigger right after signup (before profile fetch finishes)
  useEffect(() => {
    if (!user) return;
    if (styleProfile) return; // existing profile means no onboarding needed
    if (immediateOnboardingRef.current) return; // already triggered
    let newly: string | null = null;
    try { newly = sessionStorage.getItem('newlySignedUpUid'); } catch {}
    const hasLocal = (() => { try { return !!localStorage.getItem(`${STYLE_PROFILE_KEY}-${user.id}`); } catch { return false; }})();
    if (newly === user.id && !hasLocal) {
      console.log('[onboarding-decision] immediate-new-user');
      immediateOnboardingRef.current = true;
      setShowOnboarding(true);
      try { trackEvent('onboarding_start'); } catch {}
      try { sessionStorage.removeItem('newlySignedUpUid'); } catch {}
      // Background warm-up: optionally fetch profile after short delay (defensive; should not exist yet)
      setTimeout(() => {
        if (!styleProfile && user) {
          loadUserProfile(user.id).then(p => {
            if (p && p.onboardingComplete) {
              console.log('[onboarding-decision] unexpected-profile-found-during-onboarding');
            }
          }).catch(() => {});
        }
      }, 600);
    }
  }, [user, styleProfile]);
  
  // When the user signs in successfully, close the login view and try to resume any pending action
  useEffect(() => {
    if (user && showLogin) {
      // Only close login if onboarding is not needed
      if (!showOnboarding) setShowLogin(false);
    }
  }, [user, showLogin, showOnboarding]);

  const resumePendingAction = useCallback(async () => {
    if (!user || !pendingAction) return;
    if (showOnboarding) return; // wait until onboarding is completed to resume
    const action = pendingAction;
    switch (action.type) {
      case 'add-wardrobe-items': {
        await handleAddItemsToWardrobe(action.items);
        setPendingAction(null);
        break;
      }
      case 'save-unsaved-items': {
        // call the same helper to save items from analysis
        handleSaveUnsavedItems();
        setPendingAction(null);
        break;
      }
      case 'open-chat': {
        // respect premium gating on resume
        if (!styleProfile) {
          // wait for profile to load before deciding
          return;
        }
        if (!styleProfile.isPremium) {
          setShowPremiumUpsell(true);
        } else {
          setChatContext(action.context);
          setChatNewItem(action.newItem);
          setIsChatOpen(true);
        }
        setPendingAction(null);
        break;
      }
      default:
        break;
    }
  }, [user, pendingAction, showOnboarding, styleProfile]);

  useEffect(() => {
    if (user && pendingAction && !showOnboarding) {
      if (pendingAction.type === 'open-chat' && !styleProfile) {
        // wait for styleProfile to be available to decide on premium
        return;
      }
      // defer to next tick to allow any profile state to settle
      const t = setTimeout(() => { resumePendingAction(); }, 0);
      return () => clearTimeout(t);
    }
  }, [user, pendingAction, showOnboarding, resumePendingAction, styleProfile]);
  
  // Firebase auth is observed; LoginPage will handle sign-in/up and verification
  
  const handleSignOut = async () => {
    await fbSignOut();
    setUser(null);
    setStyleProfile(null);
    setManagedWardrobe([]);
    setBodyType('None');
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const handleOnboardingComplete = async (profile: StyleProfile): Promise<void> => {
    if (!user) return;
    console.log('[onboarding-save] start');
    // Ensure base user row (with email/display_name) exists before attempting style/profile upsert
    try {
      await ensureUserRow(user.id, user.email, user.name);
    } catch (e) {
      console.warn('[onboarding-save] ensureUserRow failed (will proceed anyway)', e);
    }
    let photoURL: string | undefined = undefined;
    const timeout = async <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
      return await new Promise<T>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
        p.then(v => { clearTimeout(t); resolve(v); }).catch(e => { clearTimeout(t); reject(e); });
      });
    };
    // Upload avatar if provided as data URL (OnboardingWizard now sends avatar as data URL in a transient field avatar_url or similar preview -- adapt if needed)
    let avatarUploadWarning: string | null = null;
    if ((profile as any).avatar_url && (profile as any).avatar_url.startsWith && (profile as any).avatar_url.startsWith('data:')) {
      try {
        console.log('[onboarding-save] uploading avatar (supabase)');
        photoURL = await timeout(uploadAvatar(user.id, (profile as any).avatar_url), 20000, 'Avatar upload'); // returns storage path
        console.log('[onboarding-save] avatar uploaded (path)', photoURL);
      } catch (e) {
        console.warn('[onboarding-save] avatar upload failed', e);
        avatarUploadWarning = 'We were unable to upload your photo. You can add one later in Profile.';
      }
    }
    const cloudProfile: any = {
      ...profile,
      // Only store storage path if upload succeeded; never store data URLs or absolute URLs
      avatar_url: photoURL || undefined,
      isOnboarded: true,
      // Include identity fields to satisfy potential NOT NULL/unique constraints on first write
      email: user.email,
      display_name: user.name,
    };
    console.log('[onboarding-save] prepared profile with isOnboarded=true, saving to Supabase');
    try {
      await timeout(saveUserProfile(user.id, cloudProfile), 15000, 'Profile save');
      console.log('[onboarding-save] profile saved');
    } catch (e: any) {
      // If we hit a NOT NULL on email (23502) it means ensureUserRow didn't persist; retry once after forcing it.
      if (e && (e.code === '23502' || e.code === 'PGRST204' || e.code === '23505')) {
        console.warn('[onboarding-save] first save failed (23502), retrying after ensureUserRow');
        try { await ensureUserRow(user.id, user.email, user.name); } catch {}
        try {
          await timeout(saveUserProfile(user.id, cloudProfile), 15000, 'Profile save retry');
          console.log('[onboarding-save] profile saved on retry');
        } catch (e2: any) {
          console.warn('[onboarding-save] failed retry; NOT marking isOnboarded true', e2);
          setOnboardingSuccessToast(false);
          const msg = (e2?.message || (e2?.error && e2?.error.message) || (typeof e2 === 'string' ? e2 : 'Failed to save profile'));
          throw new Error(msg);
        }
      } else {
        console.warn('[onboarding-save] failed to save full profile; NOT marking isOnboarded true', e);
        setOnboardingSuccessToast(false);
        const msg = (e?.message || (e?.error && e?.error.message) || (typeof e === 'string' ? e : 'Failed to save profile'));
        throw new Error(msg);
      }
    }
    try { localStorage.setItem(`${STYLE_PROFILE_KEY}-${user.id}`, JSON.stringify(cloudProfile)); } catch {}
    setStyleProfile(cloudProfile);
    setBodyType(cloudProfile.bodyType || 'None');
    if (photoURL) {
      // Derive public URL
      const publicUrl = getSupabaseAvatarPublicUrl(photoURL);
      const updatedUser = { ...user, picture: publicUrl } as User;
      setUser(updatedUser);
      try { localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser)); } catch {}
      updateUserProfile(updatedUser.name, publicUrl).catch(() => {});
    }
  setShowOnboarding(false);
  setOnboardingSuccessToast(true);
    if (avatarUploadWarning) {
      setProfileSavedBanner(avatarUploadWarning);
      setTimeout(() => setProfileSavedBanner(null), 7000);
    }
    if (pendingChatRetry) {
      const retry = pendingChatRetry;
      setTimeout(async () => {
        try {
          trackEvent('chat_retry_after_onboarding');
          await initiateChatSession(retry.context, retry.newItem, user as any, true);
          setChatContext(retry.context);
          setChatNewItem(retry.newItem);
          setIsChatOpen(true);
          setPendingChatRetry(null);
          setOnboardingGateBanner(false);
        } catch (e) { console.warn('[onboarding-save] chat retry failed', e); }
      }, 400);
    }
    if (user && !auth.currentUser?.emailVerified) {
      setProfileSavedBanner('Check your email to verify your account (look in Spam) to unlock premium features.');
      setTimeout(() => setProfileSavedBanner(null), 8000);
    }
    try { trackEvent('onboarding_complete'); } catch {}
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

  // Persistently surface email verification reminder on subsequent app loads until verified
  useEffect(() => {
    try {
      const current = auth.currentUser;
      if (user && current) {
        if (!current.emailVerified) {
          setShowVerifyEmailBanner(true);
        } else {
          setShowVerifyEmailBanner(false);
        }
      } else {
        setShowVerifyEmailBanner(false);
      }
    } catch {}
  }, [user]);


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
        setPendingAction({ type: 'add-wardrobe-items', items });
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
        setPendingAction({ type: 'save-unsaved-items' });
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
    if (occasion === 'None') { setError('Please select an occasion.'); return; }
    if (bodyType === 'None') { setError('Please select your body type for personalized advice.'); return; }

    setIsLoading(true);
    setError(null);
    setRecommendation(null);
    setUnsavedItemsFromAnalysis([]);

    try {
      const currentProfile = user ? styleProfile : null;
      const response = await getStyleAdvice(newItem, wardrobeItems, bodyType, occasion, currentProfile);
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
  }, [newItem, wardrobeItems, bodyType, occasion, managedWardrobe, styleProfile, user]);

  const handleWardrobeClick = () => {
    const element = document.getElementById('wardrobe-manager');
    element?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const [showPremiumUpsell, setShowPremiumUpsell] = useState(false);
  const handleOpenChat = (context: AiResponse, newItemForChat: AnalysisItem | null) => {
    if (!user) {
      setPendingAction({ type: 'open-chat', context, newItem: newItemForChat });
      setShowLogin(true);
      return;
    }
    if (!styleProfile || !isProfileComplete(styleProfile)) {
      setShowOnboarding(true);
      setOnboardingGateBanner(true);
      setPendingChatRetry({ context, newItem: newItemForChat });
      trackEvent('chat_attempt_blocked_onboarding');
      return;
    }
    // Require premium for stylist chat
    if (!styleProfile?.isPremium) {
      setShowPremiumUpsell(true);
      return;
    }
    setChatContext(context);
    setChatNewItem(newItemForChat);
    setIsChatOpen(true);
  };
  
  const renderPage = () => {
    if (isAuthLoading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-platinum"></div></div>;
    }
  if (showLogin) {
    return (
      <LoginPage 
        onBack={() => setShowLogin(false)}
        onNavigateToTerms={() => setCurrentPage('terms')}
        onNavigateToPrivacy={() => setCurrentPage('privacy')}
        initialMode={loginInitialMode}
      />
    );
  }
  if (user && showOnboarding) {
        return <OnboardingWizard user={user} onComplete={handleOnboardingComplete} />;
    }

    switch (currentPage) {
      case 'profile':
        return user ? (
          <ProfilePage
            user={user}
            initialProfile={styleProfile}
            onBack={() => setCurrentPage('main')}
            onSave={async (updatedUser, updatedProfile) => {
              let uploadedPath: string | undefined = undefined;
              let finalPictureUrl: string | undefined = undefined;
              try {
                if (updatedUser.picture && updatedUser.picture.startsWith('data:')) {
                  uploadedPath = await withTimeout(uploadAvatar(user.id, updatedUser.picture), 15000, 'Avatar upload');
                  finalPictureUrl = getSupabaseAvatarPublicUrl(uploadedPath);
                }
              } catch (e) { console.warn('Avatar upload failed', e); }
              const mergedUser = { ...user, ...updatedUser, picture: finalPictureUrl || updatedUser.picture || user.picture } as User;
              setUser(mergedUser);
              try { localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mergedUser)); } catch {}
              if (updatedProfile) {
                // If a new data URL avatar is present inside updatedProfile.avatar_url (used temporarily by ProfilePage for preview), upload it
                let newAvatarPath: string | undefined = undefined;
                if ((updatedProfile as any).avatar_url && (updatedProfile as any).avatar_url.startsWith && (updatedProfile as any).avatar_url.startsWith('data:')) {
                  try {
                    newAvatarPath = await withTimeout(uploadAvatar(user.id, (updatedProfile as any).avatar_url), 15000, 'Avatar upload');
                  } catch (e) { console.warn('Avatar re-upload failed', e); }
                }
                const updatedCloudProfile: any = { ...updatedProfile };
                if (newAvatarPath) {
                  updatedCloudProfile.avatar_url = newAvatarPath;
                  // Keep header picture in sync if profile avatar was provided this way
                  const publicUrl = getSupabaseAvatarPublicUrl(newAvatarPath);
                  const userWithNewAvatar = { ...mergedUser, picture: publicUrl } as User;
                  setUser(userWithNewAvatar);
                  try { localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithNewAvatar)); } catch {}
                } else if (updatedCloudProfile.avatar_url && typeof updatedCloudProfile.avatar_url === 'string') {
                  const val = updatedCloudProfile.avatar_url as string;
                  if (val.startsWith('data:') || val.startsWith('http://') || val.startsWith('https://')) {
                    // Do not persist data URLs or absolute URLs in DB
                    delete updatedCloudProfile.avatar_url;
                  }
                }
                try { await withTimeout(saveUserProfile(mergedUser.id, updatedCloudProfile), 10000, 'Profile save'); } catch (e) { console.warn('Failed to save profile to cloud', e); }
                setStyleProfile(updatedCloudProfile);
                setBodyType(updatedCloudProfile.bodyType || 'None');
                try { localStorage.setItem(`${STYLE_PROFILE_KEY}-${mergedUser.id}`, JSON.stringify(updatedCloudProfile)); } catch {}
              }
              updateUserProfile(mergedUser.name, mergedUser.picture).catch(() => {});
              // Keep Supabase display_name in sync as well
              try {
                const [first, ...rest] = (mergedUser.name || '').split(' ').filter(Boolean);
                const last = rest.join(' ');
                if (first || last) {
                  const { repositoryUpdateIdentity } = await import('./services/repository');
                  await repositoryUpdateIdentity({ firstName: first || undefined, lastName: last || undefined });
                  // Update identity cache to prevent name flicker on next load
                  try { localStorage.setItem(`identity-cache-${mergedUser.id}`, JSON.stringify({ display_name: mergedUser.name || '', date_of_birth: null })); } catch {}
                }
              } catch (e) { console.warn('Failed to sync display_name to Supabase', e); }
              // If ProfilePage captured DOB, it would be in a form-local state; since onSave signature doesn't include it, we cannot read it here without lifting state.
              // Optional follow-up: wire ProfilePage to send DOB via a context or extend onSave signature.
              setCurrentPage('main');
              setProfileSavedBanner('Profile updated');
              setTimeout(() => setProfileSavedBanner(null), 3000);
            }}
          />
        ) : null;
      case 'privacy':
        return <PrivacyPolicy onBack={() => setCurrentPage('main')} />;
      case 'terms':
        return <TermsOfService onBack={() => setCurrentPage('main')} />;
      case 'refund':
        return <RefundPolicy onBack={() => setCurrentPage('main')} />;
      case 'about':
        return (
          <AboutUs
            onBack={() => setCurrentPage('main')}
            onGoPartner={() => {
              setCurrentPage('partner');
            }}
          />
        );
      case 'partner':
        return <PartnerPage onBack={() => setCurrentPage('main')} />;
      case 'main':
      default:
        return (
          <>
            <main className="container mx-auto p-4 md:p-8">
              <div className="space-y-12">
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
                      onOccasionChange={setOccasion}
                      selectedOccasion={occasion}
                    />
                    <BodyTypeSelector selectedBodyType={bodyType} onBodyTypeChange={setBodyType} />
                    <div className="p-4 bg-dark-blue/80 backdrop-blur-lg rounded-2xl shadow-lg border border-platinum/20">
                      {error && <p className="text-red-400 text-center mb-4 font-medium">{error}</p>}
                      <button
                        onClick={handleGetAdvice}
                        disabled={isLoading || !newItem || wardrobeItems.length === 0 || bodyType === 'None' || occasion === 'None'}
                        className="w-full bg-platinum text-dark-blue font-bold py-4 px-4 rounded-full shadow-lg shadow-platinum/10 hover:scale-105 hover:shadow-glow disabled:bg-platinum/50 disabled:text-dark-blue/50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum/50"
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
                      user={user}
                      onOpenChat={handleOpenChat}
                      newItem={newItem}
                      isPremium={!!styleProfile?.isPremium}
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
            <StyleRecipes isLoggedIn={!!user} onRequireLogin={() => setShowLogin(true)} />
          </>
        );
    }
  };

  const activeUserForChat = user; // chat requires authenticated user now
  const firstName = React.useMemo(() => {
    if (!user) return null;
    try {
      const raw = localStorage.getItem(`identity-cache-${user.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        const fn = (parsed?.first_name as string | undefined)?.trim();
        if (fn) return fn;
        const dn = (parsed?.display_name as string | undefined)?.trim();
        if (dn) return dn.split(' ').filter(Boolean)[0] || null;
      }
    } catch {}
    const n = (user.name || '').trim();
    if (!n || n.includes('@')) return null;
    const fn = n.split(' ').filter(Boolean)[0];
    return fn || null;
  }, [user?.id, user?.name]);

  return (
    <div className="min-h-screen bg-dark-blue flex flex-col">
      <div className="flex-grow">
        {(profileSavedBanner || onboardingGateBanner || showVerifyEmailBanner) && (
          <div className="sticky top-0 z-30 space-y-2">
            {profileSavedBanner && (
              <div className="mx-auto max-w-3xl mt-3 px-4">
                <div role="status" className="px-3 py-2 rounded-xl text-sm border border-platinum/30 bg-platinum/5 text-platinum shadow">
                  {profileSavedBanner}
                </div>
              </div>
            )}
            {showVerifyEmailBanner && (
              <div className="mx-auto max-w-4xl mt-3 px-4">
                <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between px-4 py-3 rounded-xl text-sm border border-platinum/30 bg-dark-blue/60 text-platinum shadow">
                  <span>
                    {firstName ? (
                      <>Please verify your email, {firstName}. We've sent a link to {user?.email || 'your email'}.</>
                    ) : (
                      <>Please verify your email to unlock premium features. We've sent a link to {user?.email || 'your email'}.</>
                    )}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => { try { await resendVerification(); } catch (e) { console.warn('resend verification failed', e); } }}
                      className="px-3 py-1 rounded-full bg-platinum text-dark-blue font-semibold text-xs hover:opacity-90"
                    >Resend email</button>
                    <button
                      onClick={async () => {
                        try {
                          await auth.currentUser?.reload();
                          if (auth.currentUser?.emailVerified) {
                            setShowVerifyEmailBanner(false);
                          }
                        } catch (e) { console.warn('check verification failed', e); }
                      }}
                      className="px-3 py-1 rounded-full bg-dark-blue/40 border border-platinum/40 text-platinum font-medium text-xs hover:bg-dark-blue/60"
                    >Check again</button>
                    <button
                      onClick={() => setShowVerifyEmailBanner(false)}
                      className="px-3 py-1 rounded-full bg-transparent border border-platinum/30 text-platinum/70 font-medium text-xs hover:text-platinum"
                    >Dismiss</button>
                  </div>
                </div>
              </div>
            )}
            {onboardingGateBanner && (
              <div className="mx-auto max-w-3xl px-4">
                <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between px-4 py-3 rounded-xl text-sm border border-amber-400/40 bg-amber-400/10 text-amber-200 shadow">
                  <span>Please complete your style profile to be able to chat with a stylist.</span>
                  <div className="flex gap-2">
                    {pendingChatRetry && !showOnboarding && (
                      <button
                        onClick={async () => {
                          if (!styleProfile || !isProfileComplete(styleProfile)) { setShowOnboarding(true); return; }
                          try {
                            trackEvent('chat_manual_retry_banner');
                            const session = await initiateChatSession(pendingChatRetry.context, pendingChatRetry.newItem, user as any, true);
                            setChatContext(pendingChatRetry.context);
                            setChatNewItem(pendingChatRetry.newItem);
                            setIsChatOpen(true);
                            setPendingChatRetry(null);
                            setOnboardingGateBanner(false);
                          } catch (e) { console.warn('Manual retry failed', e); }
                        }}
                        className="px-3 py-1 rounded-full bg-platinum text-dark-blue font-semibold text-xs hover:opacity-90"
                      >Retry Chat</button>
                    )}
                    <button
                      onClick={() => { setShowOnboarding(true); trackEvent('banner_start_onboarding'); }}
                      className="px-3 py-1 rounded-full bg-dark-blue/40 border border-amber-400/40 text-amber-100 font-medium text-xs hover:bg-dark-blue/60"
                    >Complete Now</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <Header 
          user={user} 
          onSignOut={handleSignOut} 
          onSignIn={() => setShowLogin(true)}
          onOpenLogin={(mode) => { setShowLogin(true); /* store mode in state below */ setLoginInitialMode(mode); }}
          onChatNav={() => {
            if (!user) { setLoginInitialMode('signin'); setShowLogin(true); return; }
            if (!styleProfile || !isProfileComplete(styleProfile)) { setShowOnboarding(true); setOnboardingGateBanner(true); return; }
            if (!styleProfile.isPremium) { setShowPremiumUpsell(true); return; }
            setProfileSavedBanner('Upload an item and get style advice to start a chat with a stylist.');
            setTimeout(() => setProfileSavedBanner(null), 5000);
          }}
          onNavigateAbout={() => setCurrentPage('about')}
          onNavigateRecipes={() => {
            setCurrentPage('main');
            setTimeout(() => {
              try { document.getElementById('style-recipes')?.scrollIntoView({ behavior: 'smooth' }); } catch {}
            }, 0);
          }}
          onNavigatePartner={() => {
            setCurrentPage('partner');
          }}
          showWardrobeButton={currentPage === 'main'}
          onWardrobeClick={handleWardrobeClick}
          onEditProfile={() => setCurrentPage('profile')}
          activePage={currentPage}
          recipesActive={recipesInView}
        />
        {renderPage()}
      </div>
      <Footer 
        onNavigateToPrivacy={() => setCurrentPage('privacy')}
        onNavigateToTerms={() => setCurrentPage('terms')}
        onNavigateToRefund={() => setCurrentPage('refund')}
      />
      {activeUserForChat && (
        <StylistChatModal
            isOpen={isChatOpen}
            onClose={() => {
                setIsChatOpen(false);
            }}
            user={activeUserForChat}
            analysisContext={chatContext}
            newItemContext={chatNewItem}
            onRequireOnboarding={() => {
              setIsChatOpen(false);
              setShowOnboarding(true);
            }}
        />
      )}
      {showPremiumUpsell && <PremiumUpsellModal onClose={() => setShowPremiumUpsell(false)} />}
      {onboardingSuccessToast && (
        <div className="fixed inset-x-0 top-4 z-40 flex justify-center px-4 animate-fade-in">
          <div
            role="status"
            aria-live="polite"
            className="max-w-xl w-full md:w-auto px-5 py-3 rounded-2xl border bg-dark-blue/70 border-platinum/30 text-platinum shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md flex items-center gap-3"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-platinum/70 shadow-[0_0_12px_rgba(255,255,255,0.35)]" />
            <span className="font-semibold tracking-wide">{firstName ? `All set, ${firstName}. Your style profile is saved.` : 'Your style profile has been saved'}</span>
            <button
              onClick={() => setOnboardingSuccessToast(false)}
              className="ml-auto text-platinum/70 hover:text-platinum transition-colors text-sm"
              aria-label="Dismiss notification"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;