// Simple localStorage-based user profile storage
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
}

const PROFILE_KEY = 'user_profile';

export const saveProfile = (uid: string, profile: Partial<UserProfile>) => {
  try {
    const existing = getProfile(uid);
    const updated = { ...existing, uid, ...profile };
    localStorage.setItem(`${PROFILE_KEY}_${uid}`, JSON.stringify(updated));
    console.log('[storage] Profile saved:', updated);
  } catch (e) {
    console.error('[storage] Failed to save profile:', e);
  }
};

export const getProfile = (uid: string): UserProfile | null => {
  try {
    const data = localStorage.getItem(`${PROFILE_KEY}_${uid}`);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error('[storage] Failed to get profile:', e);
    return null;
  }
};

export const deleteProfile = (uid: string) => {
  try {
    localStorage.removeItem(`${PROFILE_KEY}_${uid}`);
  } catch (e) {
    console.error('[storage] Failed to delete profile:', e);
  }
};
