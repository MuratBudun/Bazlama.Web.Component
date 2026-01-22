/**
 * Abstract base class for all page implementations using the Page Class Pattern.
 * Provides lifecycle hooks and helper methods for page rendering and interaction.
 * 
 * @example
 * ```typescript
 * // Simple page with event handling
 * export class MyPage extends BasePage {
 *     render(): string {
 *         return '<button data-action="click">Click Me</button>'
 *     }
 *     
 *     init(): void {
 *         this.addClickListener('[data-action="click"]', () => {
 *             this.showToast('Button clicked!', 'success')
 *         })
 *     }
 * }
 * 
 * // Page with event delegation
 * export class ListPage extends BasePage {
 *     render(): string {
 *         return `
 *             <div>
 *                 <button data-action="add">Add</button>
 *                 <button data-action="delete">Delete</button>
 *             </div>
 *         `
 *     }
 *     
 *     init(): void {
 *         this.addDelegatedListener('click', '[data-action]', (e) => {
 *             const action = (e.target as HTMLElement).getAttribute('data-action')
 *             console.log('Action:', action)
 *         })
 *     }
 * }
 * 
 * // Page with route params
 * export class UserPage extends BasePage {
 *     render(): string {
 *         return `<h1>User: ${this.params.id}</h1>`
 *     }
 *     
 *     init(): void {
 *         console.log('Tab:', this.query.tab)
 *     }
 * }
 * ```
 */
export abstract class BasePage {
    protected container: HTMLElement;
    protected params: Record<string, string>;
    protected query: Record<string, string>;
    private abortController: AbortController;

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
        this.container = container;
        this.params = params;
        this.query = query;
        this.abortController = new AbortController();
    }

    // Abstract methods - every page must implement
    abstract render(): string;
    abstract init(): void;

    // Optional lifecycle hook - can be overridden by subclasses
    destroy(): void {
        // Clean up all event listeners automatically
        this.abortController.abort();
    }

    // Helper methods available to all pages
    protected querySelector<T extends Element>(selector: string): T | null {
        return this.container.querySelector<T>(selector);
    }

    protected querySelectorAll<T extends Element>(selector: string): NodeListOf<T> {
        return this.container.querySelectorAll<T>(selector);
    }

    /**
     * Add an event listener to a specific element
     * Automatically cleaned up when page is destroyed
     * @param selector - CSS selector for the target element
     * @param eventType - Event type (e.g., 'click', 'change', 'input')
     * @param handler - Event handler function
     */
    protected addEventListener<K extends keyof HTMLElementEventMap>(
        selector: string,
        eventType: K,
        handler: (event: HTMLElementEventMap[K]) => void
    ): void {
        const element = this.querySelector(selector);
        if (element) {
            element.addEventListener(eventType, handler as EventListener, {
                signal: this.abortController.signal
            });
        }
    }

    /**
     * Add a click listener (shorthand for addEventListener with 'click')
     * @param selector - CSS selector for the target element
     * @param handler - Click event handler
     */
    protected addClickListener(
        selector: string,
        handler: (event: MouseEvent) => void
    ): void {
        this.addEventListener(selector, 'click', handler);
    }

    /**
     * Add a change listener (shorthand for addEventListener with 'change')
     * @param selector - CSS selector for the target element
     * @param handler - Change event handler
     */
    protected addChangeListener(
        selector: string,
        handler: (event: Event) => void
    ): void {
        this.addEventListener(selector, 'change', handler);
    }

    /**
     * Add an input listener (shorthand for addEventListener with 'input')
     * @param selector - CSS selector for the target element
     * @param handler - Input event handler
     */
    protected addInputListener(
        selector: string,
        handler: (event: Event) => void
    ): void {
        this.addEventListener(selector, 'input', handler);
    }

    /**
     * Add a delegated event listener to the container
     * Useful for handling events on dynamic content
     * @param eventType - Event type (e.g., 'click', 'change')
     * @param selector - CSS selector for the target elements
     * @param handler - Event handler function
     */
    protected addDelegatedListener<K extends keyof HTMLElementEventMap>(
        eventType: K,
        selector: string,
        handler: (event: HTMLElementEventMap[K]) => void
    ): void {
        this.container.addEventListener(
            eventType,
            (e) => {
                const target = (e.target as HTMLElement).closest(selector);
                if (target) {
                    handler(e as HTMLElementEventMap[K]);
                }
            },
            { signal: this.abortController.signal }
        );
    }

    /**
     * Get the AbortController signal for advanced use cases
     * @returns AbortSignal that will be aborted when page is destroyed
     */
    protected getSignal(): AbortSignal {
        return this.abortController.signal;
    }

    protected showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast toast-top toast-center';
        toast.innerHTML = `
            <div class="alert alert-${type}">
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
}
