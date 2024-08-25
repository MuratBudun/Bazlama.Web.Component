/// <reference types="vite/client" />
declare module "*.htm" {
    const content: string
    export default content
}

declare module "*.txt" {
    const content: string
    export default content
}