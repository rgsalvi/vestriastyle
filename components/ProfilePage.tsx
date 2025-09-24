import React, { useEffect, useRef, useState } from 'react';
import type { User, StyleProfile, BodyType } from '../types';
import { BodyTypeSelector } from './BodyTypeSelector';
import { resizeImageToDataUrl } from '../utils/imageProcessor';
import { deleteCurrentUser } from '../services/firebase';

interface ProfilePageProps {
  user: User;
  initialProfile: StyleProfile | null;
  onBack: () => void;
  onSave: (updatedUser: Partial<User>, updatedProfile: StyleProfile) => void;
}

const styleArchetypes = [
  'Minimalist','Streetwear','Classic','Bohemian','Edgy','Vibrant'
];

const colorPalettes = [
  'Earthy Neutrals','Bold & Bright','Monochrome','Pastels','Deep Tones'
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, initialProfile, onBack, onSave }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState<string>(user.picture);
  const [profile, setProfile] = useState<StyleProfile>(() => initialProfile || {
    styleArchetypes: [],
    colorPalettes: [],
    favoriteColors: '',
    favoriteBrands: '',
    bodyType: 'None',
    avatarDataUrl: user.picture,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleInArray = (list: string[], value: string, limit?: number) => {
    let next = list.includes(value) ? list.filter(v => v !== value) : [...list, value];
    if (limit) next = next.slice(0, limit);
    return next;
  };

  const handleAvatarSelect = async (file: File) => {
    const dataUrl = await resizeImageToDataUrl(file, 512, 0.85);
    setAvatar(dataUrl);
    setProfile(p => ({ ...p, avatarDataUrl: dataUrl }));
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
            <img src={avatar} alt={user.name} className="h-32 w-32 rounded-full border-2 border-platinum/30 object-cover" />
            <button onClick={() => fileInputRef.current?.click()} className="bg-platinum text-dark-blue text-sm font-semibold px-3 py-1.5 rounded-full hover:opacity-90">Change Photo</button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarSelect(f); }} />
            <p className="text-xs text-platinum/60">PNG/JPG, up to ~2MB</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-platinum/70 mb-1">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum" />
            </div>
            <div>
              <label className="block text-sm text-platinum/70 mb-1">Email</label>
              <input value={user.email} disabled className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum/70" />
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

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onBack} className="px-4 py-2 rounded-full border border-platinum/30 text-platinum/80 hover:bg-black/20">Cancel</button>
          <button onClick={() => onSave({ name: name.trim() || user.name, picture: avatar }, profile)} className="px-4 py-2 rounded-full bg-platinum text-dark-blue font-semibold hover:opacity-90">Save Changes</button>
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

  const reset = () => { setConfirming(false); setStep(1); setConfirmText(''); setAck(false); };

  const doDelete = async () => {
    await deleteCurrentUser();
    localStorage.clear();
    location.href = '/';
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
          <label className="inline-flex items-center gap-2 text-sm text-red-200">
            <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} className="rounded" />
            I acknowledge that this action is permanent and non-reversible.
          </label>
          <div className="mt-3 flex gap-2">
            <button disabled={!ack} onClick={doDelete} className={`px-3 py-2 rounded-full text-sm font-semibold ${ack ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-900/40 text-red-200 cursor-not-allowed'}`}>Permanently delete my account</button>
            <button onClick={reset} className="px-3 py-2 rounded-full border border-platinum/30 text-platinum/80 hover:bg-black/20 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};
