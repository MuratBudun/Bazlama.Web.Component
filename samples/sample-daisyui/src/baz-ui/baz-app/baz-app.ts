import { BazlamaWebComponent, CustomElement, Property, ShadowRootMode } from "bazlama-web-component"
import htmlTemplate from "./template.htm"
import PageRouter from "../baz-router/classes/PageRouter"
import PageRoute from "../baz-router/classes/PageRoute"
import type { INavigationItem } from "./types"

/**
 * BazApp - Application shell component
 * Manages routing, theming, navigation, and application layout
 * 
 * @example
 * ```html
 * <baz-app app-title="My App" show-theme-switcher>
 *   <!-- Content automatically managed by router -->
 * </baz-app>
 * ```
 */
@CustomElement("baz-app")
export class BazApp extends BazlamaWebComponent {
    @Property()
    public appTitle: string = "Bazlama App"

    @Property()
    public showThemeSwitcher: boolean = true

    @Property()
    public showDrawer: boolean = true

    @Property()
    public logoUrl: string = ""

    private router: typeof PageRouter | null = null
    private rootRoute: PageRoute | null = null
    private route404: PageRoute | null = null

    constructor() {
        super(ShadowRootMode.None)
        
        // Initialize theme immediately to prevent flickering
        this.initializeTheme()
        
        this.InitBazlamaWebComponent()
    }

    /**
     * Initialize theme from localStorage or system preference
     * Called immediately in constructor to prevent flickering
     */
    private initializeTheme(): void {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme)
        } else {
            // No saved theme, use prefers-color-scheme
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            const defaultTheme = prefersDark ? 'dark' : 'light'
            document.documentElement.setAttribute('data-theme', defaultTheme)
        }
    }

    /**
     * Initialize the router with routes
     * @param rootRoute - Root route containing all application routes
     * @param route404 - Optional 404 error route
     */
    public initializeRouter(rootRoute: PageRoute, route404?: PageRoute): void {
        this.rootRoute = rootRoute
        this.route404 = route404 || new PageRoute("404", "404", () => `
            <div class="flex items-center justify-center min-h-screen">
                <div class="text-center">
                    <h1 class="text-6xl font-bold text-error">404</h1>
                    <p class="text-2xl mt-4">Page not found</p>
                    <a href="baz-router:/" class="btn btn-primary mt-8">Go Home</a>
                </div>
            </div>
        `)

        PageRouter.RootRoute = this.rootRoute
        PageRouter.Route404 = this.route404
        PageRouter.initialize("#page-content", import.meta.env.BASE_URL)
        
        this.router = PageRouter
        this.updateNavigation()
    }

    /**
     * Set navigation items with support for groups, dividers, and nested tree structure
     * @param items - Array of navigation items
     * 
     * @example
     * ```typescript
     * app.setNavigationItems([
     *   { type: 'group', title: 'Getting Started', items: [
     *     { type: 'item', title: 'Home', path: '/', icon: 'home' }
     *   ]},
     *   { type: 'divider' },
     *   { type: 'group', title: 'Components', items: [
     *     { type: 'item', title: 'Tab', path: '/tab', icon: 'layout' },
     *     { type: 'item', title: 'Settings', path: '/settings', icon: 'settings', items: [
     *       { type: 'item', title: 'Profile', path: '/settings/profile' }
     *     ]}
     *   ]}
     * ])
     * ```
     */
    public setNavigationItems(items: INavigationItem[]): void {
        const navContainer = this.root?.querySelector("#nav-items")
        if (!navContainer) return

        navContainer.innerHTML = this.renderNavigationItems(items)
        this.updateNavigation()
    }

    /**
     * Render navigation items recursively
     */
    private renderNavigationItems(items: INavigationItem[], depth: number = 0): string {
        return items.map(item => {
            if (item.type === 'divider') {
                return '<div class="divider"></div>'
            }
            
            if (item.type === 'group') {
                return `
                    <li class="menu-title">
                        <span>${item.title || ''}</span>
                    </li>
                    ${item.items ? this.renderNavigationItems(item.items, depth) : ''}
                `
            }
            
            // type === 'item'
            const hasChildren = item.items && item.items.length > 0
            const paddingLeft = depth > 0 ? `style="padding-left: ${depth * 1.5}rem"` : ''
            
            if (hasChildren) {
                return `
                    <li>
                        <details>
                            <summary ${paddingLeft}>
                                ${item.icon ? `<baz-icon icon="${item.icon}" size="20"></baz-icon>` : ''}
                                ${item.title}
                                ${item.badge ? `<span class="badge ${item.badgeClass || 'badge-primary'}">${item.badge}</span>` : ''}
                            </summary>
                            <ul>
                                ${item.items ? this.renderNavigationItems(item.items, depth + 1) : ''}
                            </ul>
                        </details>
                    </li>
                `
            }
            
            return `
                <li>
                    <a href="baz-router:${item.path}" class="nav-link" ${paddingLeft}>
                        ${item.icon ? `<baz-icon icon="${item.icon}" size="20"></baz-icon>` : ''}
                        ${item.title}
                        ${item.badge ? `<span class="badge ${item.badgeClass || 'badge-primary'}">${item.badge}</span>` : ''}
                    </a>
                </li>
            `
        }).join('')
    }

    private updateNavigation(): void {
        if (!this.router) return

        // Update active link
        const currentPath = this.router.getRelativePath()
        const links = this.root?.querySelectorAll('.nav-link')
        
        links?.forEach((link: Element) => {
            const anchor = link as HTMLAnchorElement
            const href = anchor.getAttribute('href') || ''
            const path = href.replace('baz-router:', '')
            
            // Exact match to prevent /icon matching /icon-s
            if (path === currentPath) {
                anchor.classList.add('active')
            } else {
                anchor.classList.remove('active')
            }
        })
    }

    afterRender(): void {
        // Listen to route changes
        window.addEventListener('route-change', () => {
            this.updateNavigation()
        })

        // Hide theme switcher if not needed
        if (!this.showThemeSwitcher) {
            const themeContainer = this.root?.querySelector('#theme-switcher-container')
            themeContainer?.classList.add('hidden')
        }

        // Hide drawer if not needed
        if (!this.showDrawer) {
            const drawer = this.root?.querySelector('.drawer')
            drawer?.classList.remove('lg:drawer-open')
        }

        // Set app title
        const titleElement = this.root?.querySelector('#app-title')
        if (titleElement) {
            titleElement.textContent = this.appTitle
        }

        // Set logo if provided
        if (this.logoUrl) {
            const logoContainer = this.root?.querySelector('#logo-container')
            if (logoContainer) {
                logoContainer.innerHTML = `<img src="${this.logoUrl}" alt="${this.appTitle}" class="h-8">`
            }
        }
    }

    getRenderTemplate(): string {
        return htmlTemplate
    }
}
