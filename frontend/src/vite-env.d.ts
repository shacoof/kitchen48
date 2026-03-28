/// <reference types="vite/client" />

declare module 'virtual:pwa-register/react' {
  import type { Dispatch, SetStateAction } from 'react'

  export function useRegisterSW(options?: {
    immediate?: boolean
    onRegisteredSW?: (swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: Error) => void
  }): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>]
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}

declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}
