/// <reference types="vite/client" />
// Augment Vite's env typings with the variables we use in this project.
interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID_WEB: string;
  // Add other environment variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
