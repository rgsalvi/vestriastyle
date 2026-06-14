import type { StyleProfile, PersistentWardrobeItem } from '../types';
import * as firestoreImpl from './repository-firestore';

// All functions now use Firestore exclusively
export const repositoryLoadUserProfile = firestoreImpl.repositoryLoadUserProfile;
export const repositorySaveUserProfile = firestoreImpl.repositorySaveUserProfile;
export const repositoryEnsureUserRow = firestoreImpl.repositoryEnsureUserRow;
export const repositoryListWardrobe = firestoreImpl.repositoryListWardrobe;
export const repositorySaveWardrobeItems = firestoreImpl.repositorySaveWardrobeItems;
export const repositoryUploadAvatar = firestoreImpl.repositoryUploadAvatar;
export const repositoryDeleteAllUserData = firestoreImpl.repositoryDeleteAllUserData;
export const repositoryLoadUserIdentity = firestoreImpl.repositoryLoadUserIdentity;
export const repositoryUpdateIdentity = firestoreImpl.repositoryUpdateIdentity;
export const repositoryFindUserByEmail = firestoreImpl.repositoryFindUserByEmail;
export const getAvatarPublicUrl = firestoreImpl.getFirebaseStorageAvatarPublicUrl;
