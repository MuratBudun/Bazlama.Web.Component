/**
 * Abstract base class for all page implementations using the Page Class Pattern.
 * Provides lifecycle hooks and helper methods for page rendering and interaction.
 * 
 * @example
 * ```typescript
 * // Simple page
 * export class MyPage extends BasePage {
 *     render(): string {
 *         return '<div>My Page Content</div>'
 *     }
 *     
 *     init(): void {
 *         this.querySelector('button')?.addEventListener('click', () => {
 *             this.showToast('Button clicked!', 'success')
 *         })
 *     }
 * }
 * 
 * // Page with route params and query
 * export class UserPage extends BasePage {
 *     private userId: string
 *     private params: Record<string, string>
 *     private query: Record<string, string>
 *     
 *     constructor(container: HTMLElement, params?: Record<string, string>, query?: Record<string, string>) {
 *         super(container)
 *         this.params = params || {}
 *         this.query = query || {}
 *         this.userId = params?.id || 'unknown'
 *     }
 *     
 *     render(): string {
 *         const tab = this.query.tab || 'profile'
 *         return `
 *             <div>
 *                 <h1>User: ${this.userId}</h1>
 *                 <p>Active Tab: ${tab}</p>
 *             </div>
 *         `
 *     }
 *     
 *     init(): void {
 *         console.log('User page loaded with params:', this.params, 'query:', this.query)
 *     }
 * }
 * ```
 */
export abstract class BasePage {
    protected container: HTMLElement
    protected params: Record<string, string>
    protected query: Record<string, string>

    /**
     * Creates a new page instance
     * @param container - The HTML element that will contain the page
     * @param params - URL path parameters (e.g., { id: "12" } from /products/:id)
     * @param query - URL query parameters (e.g., { color: "red" } from ?color=red)
     */
    constructor(
        container: HTMLElement, 
        params: Record<string, string> = {}, 
        query: Record<string, string> = {}
    ) {
        this.container = container
        this.params = params
        this.query = query
    }

    // Abstract methods - every page must implement
    abstract render(): string
    abstract init(): void

    // Optional lifecycle hook
    destroy?(): void

    // Helper methods available to all pages
    protected querySelector<T extends Element>(selector: string): T | null {
        return this.container.querySelector<T>(selector)
    }

    protected querySelectorAll<T extends Element>(selector: string): NodeListOf<T> {
        return this.container.querySelectorAll<T>(selector)
    }

    protected showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
        const toast = document.createElement('div')
        toast.className = 'toast toast-top toast-center'
        toast.innerHTML = `
            <div class="alert alert-${type}">
                <span>${message}</span>
            </div>
        `
        document.body.appendChild(toast)
        setTimeout(() => toast.remove(), 2000)
    }
}
