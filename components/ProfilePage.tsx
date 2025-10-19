import React, { useEffect, useRef, useState } from 'react';
import type { User, StyleProfile, BodyType } from '../types';
import { BodyTypeSelector } from './BodyTypeSelector';
import { resizeImageToDataUrl } from '../utils/imageProcessor';
import { auth, deleteCurrentUser } from '../services/firebase';
import { repositoryDeleteAllUserData as deleteAllUserData, getSupabaseAvatarPublicUrl, repositoryUpdateIdentity } from '../services/repository';

interface ProfilePageProps {
  user: User;
  initialProfile: StyleProfile | null;
  onBack: () => void;
  onSave: (updatedUser: Partial<User>, updatedProfile: StyleProfile) => Promise<void>;
}

const styleArchetypes = [
  'Minimalist','Streetwear','Classic','Bohemian','Edgy','Vibrant'
];

const colorPalettes = [
  'Earthy Neutrals','Bold & Bright','Monochrome','Pastels','Deep Tones'
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, initialProfile, onBack, onSave }) => {
  const [name, setName] = useState(user.name);
  const [dob, setDob] = useState<string>('');
  // Initialize with a stable public URL if a storage path exists to avoid image flicker
  const [avatar, setAvatar] = useState<string>(
    initialProfile?.avatar_url ? getSupabaseAvatarPublicUrl(initialProfile.avatar_url) : user.picture
  );
  const [profile, setProfile] = useState<StyleProfile>(() => initialProfile || {
    styleArchetypes: [],
    colorPalettes: [],
    favoriteColors: '',
    favoriteBrands: '',
    bodyType: 'None',
    avatar_url: undefined,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Safety: if saving takes too long, reset and show an error to avoid a stuck button
  useEffect(() => {
    if (!saving) return;
    const t = setTimeout(() => {
      setSaving(false);
      setSaveError(prev => prev || 'Saving is taking longer than expected. Please try again.');
    }, 20000);
    return () => clearTimeout(t);
  }, [saving]);

  // Keep form state in sync if the caller loads a profile after mount or user changes
  useEffect(() => {
    if (initialProfile) {
      setProfile(prev => ({
        ...prev,
        ...initialProfile,
        avatar_url: initialProfile.avatar_url || prev.avatar_url,
      }));
      if (initialProfile.avatar_url) {
        try {
          setAvatar(getSupabaseAvatarPublicUrl(initialProfile.avatar_url));
        } catch {
          setAvatar(user.picture);
        }
      } else {
        setAvatar(user.picture);
      }
    } else {
      // If no initial profile yet, ensure name/avatar reflect user
      setAvatar(user.picture);
    }
    setName(user.name);
  }, [initialProfile, user.name, user.picture]);

  const toggleInArray = (list: string[], value: string, limit?: number) => {
    let next = list.includes(value) ? list.filter(v => v !== value) : [...list, value];
    if (limit) next = next.slice(0, limit);
    return next;
  };

  const handleAvatarSelect = async (file: File) => {
    const dataUrl = await resizeImageToDataUrl(file, 512, 0.85);
    setAvatar(dataUrl);
  // avatar upload will occur in higher-level save; keep local only
  };

  return (
    <div className="min-h-screen bg-dark-blue p-4">
      <div className="max-w-3xl mx-auto bg-dark-blue/80 backdrop-blur-lg rounded-2xl border border-platinum/20 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-platinum/80 hover:text-white">← Back</button>
          <h1 className="text-2xl font-bold text-platinum tracking-tight">Edit Profile</h1>
          <div />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[160px,1fr] items-start">
          <div className="flex flex-col items-center gap-3">
            <img
              src={avatar}
              alt={user.name}
              className="h-32 w-32 rounded-full border-2 border-platinum/30 object-cover"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.onerror = null;
                target.src = user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`;
              }}
            />
            <button onClick={() => fileInputRef.current?.click()} className="bg-platinum text-dark-blue text-sm font-semibold px-3 py-1.5 rounded-full hover:opacity-90">Change Photo</button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" title="Upload profile photo" aria-label="Upload profile photo" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarSelect(f); }} />
            <p className="text-xs text-platinum/60">JPG/PNG/WebP accepted (we convert to JPEG), up to ~2MB</p>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="profile-name" className="block text-sm text-platinum/70 mb-1">Name</label>
              <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum" />
            </div>
            <div>
              <label htmlFor="profile-dob" className="block text-sm text-platinum/70 mb-1">Date of birth</label>
              <input id="profile-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum" />
              <p className="mt-1 text-xs text-platinum/60">This stays private and is used to tailor your experience.</p>
            </div>
            <div>
              <label htmlFor="profile-email" className="block text-sm text-platinum/70 mb-1">Email</label>
              <input id="profile-email" value={user.email} disabled className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum/70" />
              <p className="mt-1 text-xs text-platinum/50">Email cannot be changed. Contact support to modify your email address.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-platinum">Style Vibe</h2>
            <p className="text-sm text-platinum/60">Choose up to three.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {styleArchetypes.map(a => {
                const selected = profile.styleArchetypes.includes(a);
                return (
                  <button key={a} onClick={() => setProfile(p => ({ ...p, styleArchetypes: toggleInArray(p.styleArchetypes, a, 3) }))} className={`px-3 py-1.5 rounded-full text-sm border ${selected ? 'bg-platinum text-dark-blue border-transparent' : 'bg-black/20 text-platinum border-platinum/30 hover:bg-black/30'}`}>{a}</button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-platinum">Color Palette</h2>
            <p className="text-sm text-platinum/60">Choose up to two.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {colorPalettes.map(c => {
                const selected = profile.colorPalettes.includes(c);
                return (
                  <button key={c} onClick={() => setProfile(p => ({ ...p, colorPalettes: toggleInArray(p.colorPalettes, c, 2) }))} className={`px-3 py-1.5 rounded-full text-sm border ${selected ? 'bg-platinum text-dark-blue border-transparent' : 'bg-black/20 text-platinum border-platinum/30 hover:bg-black/30'}`}>{c}</button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-platinum">Favorite Colors (optional)</h2>
            <input value={profile.favoriteColors || ''} onChange={e => setProfile(p => ({ ...p, favoriteColors: e.target.value }))} placeholder="e.g., forest green, lavender" className="mt-2 w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-platinum">Favorite Brands (optional)</h2>
            <input value={profile.favoriteBrands} onChange={e => setProfile(p => ({ ...p, favoriteBrands: e.target.value }))} placeholder="e.g., Everlane, Zara" className="mt-2 w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-platinum">Body Type</h2>
            <div className="mt-2">
              <BodyTypeSelector selectedBodyType={profile.bodyType as BodyType} onBodyTypeChange={bt => setProfile(p => ({ ...p, bodyType: bt }))} />
            </div>
          </div>
        </div>

        {saveError && (
          <div role="alert" className="mt-6 flex items-start gap-3 p-3 rounded-xl border border-red-400/30 bg-red-900/20 text-red-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10.29 3.86a2 2 0 013.42 0l8.2 14.2A2 2 0 0120.2 21H3.8a2 2 0 01-1.71-2.94l8.2-14.2zM13 16a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v4a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm leading-relaxed">{saveError}</div>
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onBack} className="px-4 py-2 rounded-full border border-platinum/30 text-platinum/80 hover:bg-black/20">Cancel</button>
          <button
            onClick={async () => {
              setSaveError(null);
              setSaving(true);
              try {
                // If DOB provided, persist it securely via serverless endpoint
                if (dob && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
                  try { await repositoryUpdateIdentity({ dateOfBirth: dob }); } catch (e) { console.warn('Failed to update DOB', e); }
                }
                await onSave({ name: name.trim() || user.name, picture: avatar }, profile);
              } catch (e) {
                setSaveError(e instanceof Error ? e.message : 'Failed to save changes.');
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className={`px-4 py-2 rounded-full bg-platinum text-dark-blue font-semibold ${saving ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'}`}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        <div className="mt-10 border-t border-platinum/20 pt-6">
          <h3 className="text-lg font-semibold text-red-300">Danger Zone</h3>
          <p className="text-sm text-platinum/60 mt-1">Deleting your account is permanent and cannot be undone.</p>
          <DeleteAccountBlock />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

const DeleteAccountBlock: React.FC = () => {
  const [confirming, setConfirming] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirmText, setConfirmText] = useState('');
  const [ack, setAck] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const reset = () => { setConfirming(false); setStep(1); setConfirmText(''); setAck(false); };

  const doDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      // Attempt server-side deletion first (more reliable)
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (idToken) {
          const res = await fetch('/api/delete-account', { method: 'POST', headers: { Authorization: `Bearer ${idToken}` } });
          if (!res.ok) throw new Error('Server delete failed');
        } else {
          // fallback to client-side delete of data
          const raw = localStorage.getItem('ai-wardrobe-user');
          const current = raw ? JSON.parse(raw) : null;
          const uid = current?.id as string | undefined;
          if (uid) {
            try { await deleteAllUserData(uid); } catch (e) { console.warn('Failed to delete Firestore/Storage data', e); }
          }
        }
      } catch (e) {
        console.warn('Server-side delete failed', e);
      }
      try {
        await deleteCurrentUser();
      } catch (e: any) {
        const msg = (e && e.code) ? String(e.code) : (e instanceof Error ? e.message : 'Failed to delete account.');
        if (msg.includes('requires-recent-login')) {
          setDeleteError('For your security, please sign in again and then retry account deletion.');
        } else {
          setDeleteError('Could not delete your account. Please try again in a moment.');
        }
        return;
      }
      try { localStorage.clear(); } catch {}
      try { window.location.href = '/'; } catch {}
    } finally {
      setDeleting(false);
    }
  };

  if (!confirming) {
    return (
      <div className="mt-4">
        <button onClick={() => setConfirming(true)} className="text-sm text-red-400 hover:text-red-300 underline decoration-red-400/40 underline-offset-4">Delete my account</button>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-red-900/20 border border-red-400/30 rounded-xl p-4 space-y-3">
      {step === 1 && (
        <div>
          <p className="text-sm text-red-200">This will permanently remove your profile and all associated data. Are you absolutely sure?</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setStep(2)} className="px-3 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm">I understand</button>
            <button onClick={reset} className="px-3 py-2 rounded-full border border-platinum/30 text-platinum/80 hover:bg-black/20 text-sm">Cancel</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div>
          <label className="block text-sm text-red-200">Type DELETE to confirm:</label>
          <div className="mt-2 flex items-center gap-2">
            <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="DELETE" className="rounded-full bg-black/20 border border-platinum/30 px-3 py-2 text-platinum text-sm" />
            <button disabled={confirmText !== 'DELETE'} onClick={() => setStep(3)} className={`px-3 py-2 rounded-full text-sm font-semibold ${confirmText === 'DELETE' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-900/40 text-red-200 cursor-not-allowed'}`}>Continue</button>
            <button onClick={reset} className="px-3 py-2 rounded-full border border-platinum/30 text-platinum/80 hover:bg-black/20 text-sm">Cancel</button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div>
          {deleteError && (
            <div role="alert" className="mb-3 flex items-start gap-3 p-3 rounded-xl border border-red-400/30 bg-red-900/20 text-red-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10.29 3.86a2 2 0 013.42 0l8.2 14.2A2 2 0 0120.2 21H3.8a2 2 0 01-1.71-2.94l8.2-14.2zM13 16a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v4a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm leading-relaxed">{deleteError}</div>
            </div>
          )}
          <label className="inline-flex items-center gap-2 text-sm text-red-200">
            <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} className="rounded" />
            I acknowledge that this action is permanent and non-reversible.
          </label>
          <div className="mt-3 flex gap-2">
            <button disabled={!ack || deleting} onClick={doDelete} className={`px-3 py-2 rounded-full text-sm font-semibold ${ack && !deleting ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-900/40 text-red-200 cursor-not-allowed'}`}>{deleting ? 'Deleting…' : 'Permanently delete my account'}</button>
            <button onClick={reset} className="px-3 py-2 rounded-full border border-platinum/30 text-platinum/80 hover:bg-black/20 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};
