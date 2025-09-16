// Fix: Replaced the non-resolving 'vite/client' type reference with explicit definitions
// for ImportMeta and ImportMetaEnv. This addresses both the type definition file error
// and provides TypeScript with the necessary information about Vite's environment variables.
interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  // Add other environment variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
