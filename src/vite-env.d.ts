/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RENDERER?: 'webgl' | 'webgpu'
  readonly VITE_DEBUG?: string
}
interface ImportMeta { readonly env: ImportMetaEnv }
