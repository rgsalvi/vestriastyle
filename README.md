<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1KD9RaiPmc8ZuHrA6oNXrQ6ez4pDpHzP8

## Deploy on Vercel

This repo is configured for Vercel out of the box:

- Build: `vite build`
- Output: `dist/`
- API routes: `/api/*.ts` (Node.js Serverless Functions)

Before deploying, set these environment variables in your Vercel project (Project Settings → Environment Variables):

- `API_KEY` — Google GenAI API key used by serverless endpoints (`/api/generate-flatlay`, `/api/generate-tryon`, `/api/validate-full-body`, etc.).
- `IMAGE_GENERATE_MODEL` (optional) — Model ID for product-style image generation. Defaults to `imagen-4.0-generate-001` if unset.
- `IMAGE_EDIT_MODEL` (optional) — Model ID for image editing. Defaults to `gemini-2.5-flash-image-preview` if unset.

Optional (but recommended) function settings are already present in `vercel.json`:

- `functions.api/*.ts.maxDuration = 60` (use up to 60s execution if your plan allows it)
  (Note: the `memory` setting has been removed for Active CPU billing.)

Notes:

- On the Hobby plan, Serverless Functions are limited to ~10s. The Virtual Try-On endpoints may take longer. If you see timeouts, either upgrade the plan or simplify prompts to keep execution under the plan limit.
- No client secret is exposed in the browser — the `API_KEY` lives only on the serverless side.

Quick start:

1) Push this repo to GitHub and import it into Vercel.
2) Add `API_KEY` (and optionally `IMAGE_GENERATE_MODEL`, `IMAGE_EDIT_MODEL`) in Project Settings → Environment Variables (apply to Preview and Production).
3) Deploy. Your app will serve the static site from `dist/` and handle API calls via `/api/*`.


### Admin model status page

To enable the admin-only page at `/admin-model-status` (which verifies Firebase ID tokens server-side), set these Firebase Admin credentials in your environment (Vercel → Project Settings → Environment Variables recommended):

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Notes:

- The private key can be provided with `\n` escapes; the server converts them to real newlines at runtime.
- Access is restricted to the admin email `support@vestria.style`.

## Run Locally

**Prerequisites:**
- Node.js 18+
- A Supabase project (Postgres + Storage)
- Firebase project (Auth only) if you are deploying authentication yourself

### 1. Install dependencies
`npm install`

### 2. Environment variables
Create a `.env.local` (not committed) with:

```
VITE_GEMINI_API_KEY=YOUR_GEMINI_KEY
VITE_SUPABASE_URL=https://YOUR_PROJECT.ref.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_FIREBASE_API_KEY=...            # Firebase Auth
VITE_FIREBASE_AUTH_DOMAIN=...        # yourapp.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...

# Server-side (Node) env vars used by `/api/*` endpoints
API_KEY=YOUR_GEMINI_KEY
# Optional: switch model IDs without code changes
# IMAGE_GENERATE_MODEL=imagen-4.1-pro-001
# IMAGE_EDIT_MODEL=gemini-2.5-image-edit-001
```

Only Firebase Auth is used; all application data is stored in Supabase (see architecture below).

### 3. Run the dev server
`npm run dev`

Open the printed localhost URL in your browser.

Tip (Windows PowerShell, temporary for session only):

```powershell
$env:IMAGE_GENERATE_MODEL = "imagen-4.1-pro-001"; $env:IMAGE_EDIT_MODEL = "gemini-2.5-image-edit-001"; npm run dev
```


---

## Architecture Overview

| Concern | Technology | Notes |
|---------|------------|-------|
| Authentication | Firebase Auth | Email/password & email verification only. No Firestore usage. |
| Data (profiles, wardrobe, future chat, assets metadata) | Supabase Postgres | Central source of truth. `users` and `wardrobe_items` tables currently. |
| Avatar images | Supabase Storage (public bucket `avatars`) | Only the storage path is persisted (`avatar_url`); UI derives public URL. |
| AI / Style Advice | Gemini API | Via `services/geminiService.ts`. |

### Firebase Auth Scope
Firebase is now limited to:
1. Account creation (email/password)
2. Sign-in / sign-out
3. Email verification status
4. Retrieving ID tokens for any future server-side protected endpoints

Everything else (user profile persistence, wardrobe, avatar storage) has been migrated to Supabase.

### Supabase Schema (Current)
`users` table columns (essential):
- id (uuid / text, matches Firebase UID)
- email (text)
- display_name (text, optional)
- styleArchetypes (text[])
- colorPalettes (text[])
- favoriteColors (text, nullable)
- favoriteBrands (text, nullable)
- bodyType (text)
- avatar_url (text, storage path) 
- isOnboarded (boolean)
- isPremium (boolean)
- created_at / updated_at (timestamps)

`wardrobe_items` table columns (essential):
- id (uuid or text primary key)
- user_id (fk → users.id)
- dataUrl (text) – (currently stores item image data URL; may change to storage path later)
- description, category, color, fabric, season
- created_at

### Repository Pattern
All Supabase access is funneled through `services/repository.ts`:
- `repositoryLoadUserProfile`
- `repositorySaveUserProfile`
- `repositoryListWardrobe`
- `repositorySaveWardrobeItems`
- `repositoryUploadAvatar`
- `repositoryEnsureUserRow`

### Avatar Handling
1. User selects an image (data URL in memory only).
2. On save, data URL is uploaded to `avatars` bucket: `users/{uid}/avatar.{ext}`.
3. Only the path is stored in `users.avatar_url`.
4. UI derives a public URL via Supabase storage helper and assigns to `user.picture`.

---

## Migration Notes
Firestore + Firebase Storage have been fully removed for data persistence:
- Removed legacy Firestore CRUD (`services/db.ts`) and REST helper (`services/firestoreRest.ts`).
- Replaced all profile & wardrobe operations with Supabase equivalents.
- Added `repositoryEnsureUserRow` to guarantee the primary user row exists immediately after auth.

If you have lingering local data from older builds, clear `localStorage` for a clean start.

---

## Supabase Sanity Test (Optional)
There is a lightweight script `supabaseSanityTests.ts` you can run (manually) to verify basic CRUD:

```
npx ts-node supabaseSanityTests.ts
```

It upserts a test user, profile, and wardrobe items, then validates round-trips.

---

## Future Enhancements (Planned)
- Chat history table (`chat_messages`)
- Generated AI image metadata table (`ai_images`)
- Migrate wardrobe item image storage from data URLs to Supabase Storage paths for size/perf
- Add Vitest + CI test harness (convert sanity script to automated tests)

---

## Troubleshooting
| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| Avatar not updating | Public URL cached | Hard refresh or append cache-busting query param |
| Profile not saving | Supabase RLS / missing anon key | Verify env vars & table policies |
| Onboarding repeats | `isOnboarded` flag never persisted | Check network tab for `/users` upsert errors |

---

## License
Proprietary / Internal (adjust as needed).
