/// <reference types="vite/client" />
// Augment Vite's env typings with the variables we use in this project.
interface ImportMetaEnv {
  // Add other environment variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
