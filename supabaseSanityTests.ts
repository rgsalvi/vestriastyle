// Quick Supabase CRUD sanity tests.
// Run manually with: npm run dev (app) or ts-node if configured. This file is not imported by the app.
// Assumes environment variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set.

import { repositoryEnsureUserRow as ensureUserRow, repositorySaveUserProfile as saveUserProfile, repositoryLoadUserProfile as loadUserProfile, repositorySaveWardrobeItems as saveWardrobe, repositoryListWardrobe as listWardrobe } from './services/repository';
import type { PersistentWardrobeItem, StyleProfile } from './types';

async function run() {
  const uid = 'sanity-test-user';
  console.log('[sanity] ensuring user row');
  await ensureUserRow(uid, 'sanity@example.com', 'Sanity User');

  console.log('[sanity] saving profile');
  const profile: Partial<StyleProfile> = {
    styleArchetypes: ['Minimalist'],
    colorPalettes: ['Monochrome'],
    bodyType: 'None',
    isOnboarded: true,
  };
  await saveUserProfile(uid, profile);
  const loaded = await loadUserProfile(uid);
  console.log('[sanity] loaded profile', loaded);

  if (!loaded || !loaded.styleArchetypes?.includes('Minimalist')) {
    throw new Error('Profile round-trip failed');
  }

  console.log('[sanity] saving wardrobe items');
  const items: PersistentWardrobeItem[] = [
    { id: 'item1', dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB', description: 'Test Item 1', category: 'Top', color: 'Black', fabric: 'Cotton', season: 'All' },
    { id: 'item2', dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB', description: 'Test Item 2', category: 'Bottom', color: 'Blue', fabric: 'Denim', season: 'All' },
  ];
  await saveWardrobe(uid, items);
  const w = await listWardrobe(uid);
  console.log('[sanity] wardrobe size', w.length);
  if (w.length < 2) throw new Error('Wardrobe upsert/list failed');

  console.log('[sanity] SUCCESS all tests passed');
}

run().catch(e => {
  console.error('[sanity] FAILURE', e);
  process.exit(1);
});
