/// <reference types="vite/client" />

declare const __DEV__: boolean;

declare module '*.htm?template' {
  const render: (data?: Record<string, any>) => string
  export default render
  export const placeholders: string[]
}

declare module '*.htm?tpl' {
  const render: (data?: Record<string, any>) => string
  export default render
  export const placeholders: string[]
}
