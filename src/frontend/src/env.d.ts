/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the NestJS API, e.g. http://localhost:3000 */
  readonly VITE_API_URL?: string;
  /** "false" switches the services from mock data to the real API. */
  readonly VITE_USE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
