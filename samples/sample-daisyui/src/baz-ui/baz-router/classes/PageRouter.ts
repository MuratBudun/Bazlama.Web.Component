import BazAnimation from "../../baz-animation/BazAnimation"
import { TGetPageContentEl } from "../types/TGetPageContentEl"
import PageRoute from "./PageRoute"
import { BasePage } from "./BasePage"

declare global {
    interface Window {
        BazPageRouter: PageRouter
    }
}

/**
 * Client-side router for single page applications.
 * Manages navigation, route matching, and page lifecycle.
 * Supports both function-based pages and Page Class Pattern.
 * 
 * @example
 * ```typescript
 * // Setup routes
 * const rootRoute = new PageRoute("Home", "/", () => '<div>Home</div>')
 * rootRoute.addRoute(new PageRoute("About", "about", AboutPage))
 * 
 * // Configure and initialize
 * PageRouter.RootRoute = rootRoute
 * PageRouter.initialize("#page-content")
 * ```
 */
export default class PageRouter {
    /** Link signature prefix for router links (e.g., "baz-router:/about") */
    public static linkSignature = "baz-router:"
    
    /** Root route containing all application routes */
    private static rootRoute: PageRoute = new PageRoute("Home", "/", () => "<h1>Home</h1>")
    
    /** 404 error route */
    private static route404: PageRoute = new PageRoute("404", "404", () => "<h1>404</h1>")
    
    /** Container element for page content */
    private static pageContentEl: HTMLElement = document.body
    
    /** Base path for the application (e.g., "/" or "/app") */
    private static basePath: string = "/"
    
    /** Current page instance (for Page Class Pattern) */
    private static currentPageInstance: BasePage | null = null

    /**
     * Initializes the router
     * @param elQuery - CSS selector for the page content container (default: "#page-content")
     * @param basePath - Base path for the application (auto-detected if not provided)
     */
    static initialize(elQuery: string = "#page-content", basePath?: string): void {
        this.pageContentEl = document.querySelector(elQuery) as HTMLElement
        this.basePath = basePath ?? this.detectBasePath()
        window.BazPageRouter = this
        window.addEventListener("popstate", this.handlePopState.bind(this))
        document.addEventListener("DOMContentLoaded", this.initLinkClickHandler.bind(this))

        this.handleRouteChange()
        this.fireRouteMapChange()
        this.fireRouteChange()
    }

    private static detectBasePath(): string {
        // Auto-detect base path from <base> tag or Vite's import.meta.env.BASE_URL
        const baseEl = document.querySelector("base")
        if (baseEl?.href) {
            const url = new URL(baseEl.href)
            return url.pathname.replace(/\/$/, "") || "/"
        }
        return "/"
    }

    /**
     * Gets the application base path
     */
    public static get BasePath(): string {
        return this.basePath
    }

    /**
     * Sets the application base path
     * @param value - Base path (trailing slash will be removed)
     */
    public static set BasePath(value: string) {
        this.basePath = value.replace(/\/$/, "") || "/"
    }

    private static getPathWithoutBase(): string {
        let pathname = window.location.pathname
        if (this.basePath !== "/" && pathname.startsWith(this.basePath)) {
            pathname = pathname.slice(this.basePath.length) || "/"
        }
        return pathname
    }

    public static getFullPath(path: string): string {
        if (this.basePath === "/") {
            return path
        }
        return `${this.basePath}${path}`.replace(/\/+/g, "/")
    }

    public static fireRouteMapChange(): void {
        window.dispatchEvent(new CustomEvent("route-map-change"))
    }

    public static fireRouteChange(): void {
        window.dispatchEvent(new CustomEvent("route-change"))
    }

    /**
     * Gets the root route
     */
    public static get RootRoute(): PageRoute {
        return this.rootRoute
    }

    /**
     * Sets the root route
     * @param value - Root route containing all application routes
     */
    public static set RootRoute(value: PageRoute) {
        this.rootRoute = value
        this.fireRouteMapChange()
    }

    /**
     * Gets the 404 error route
     */
    public static get Route404(): PageRoute {
        return this.route404
    }

    /**
     * Sets the 404 error route
     * @param value - Route to display when no match is found
     */
    public static set Route404(value: PageRoute) {
        this.route404 = value
    }

    public static get PageContentEl(): HTMLElement {
        return this.pageContentEl
    }

    public static set PageContentEl(pageContentEl: TGetPageContentEl) {
        this.pageContentEl = typeof pageContentEl === "function" ? pageContentEl() : pageContentEl
    }

    /**
     * Navigates to a route
     * @param path - Route path (e.g., "/about" or "about")
     */
    public static navigate(path: string): void {
        const fullPath = this.getFullPath(path || "/")
        history.pushState({}, "", fullPath)
        this.handleRouteChange()
    }

    /**
     * Gets the currently matched route
     * @returns Current route or null if no match
     */
    public static getCurrentRoute(): PageRoute | null {
        const pathname = this.getPathWithoutBase()
        const pathParts = pathname.split("/").filter(Boolean)
        return this.rootRoute.match(pathParts)
    }

    static getBreadcrumb(): PageRoute[] {
        if (!this.rootRoute) {
            throw new Error("Router not initialized. Call Router.initialize with a root route.")
        }

        const pathname = this.getPathWithoutBase()
        const pathParts = ["/", ...pathname.split("/").filter(Boolean)]
        if (pathParts.length === 1) {
            return [this.rootRoute]
        }
        const matchedRoutes = this.rootRoute.getBreadcrumb(pathParts)
        console.log("matchedRoutes", matchedRoutes)

        return matchedRoutes.length > 0 ? matchedRoutes : [this.route404]
    }

    public static handleRouteChange(): void {
        const pathname = this.getPathWithoutBase()
        const pathParts = ["/", ...pathname.split("/").filter(Boolean)]
        const matchedRoute = this.rootRoute.match(pathParts)

        BazAnimation.animate(this.pageContentEl, "fadeOut", { duration: 0.2 }, ["standart"], () => {
            // Destroy previous page instance
            if (this.currentPageInstance?.destroy) {
                this.currentPageInstance.destroy()
            }
            this.currentPageInstance = null

            if (matchedRoute) {
                // Check if route uses Page Class pattern
                if (matchedRoute.isPageClass(matchedRoute.content)) {
                    // Create page instance
                    const pageInstance = new matchedRoute.content(this.pageContentEl)
                    this.currentPageInstance = pageInstance
                    
                    // Render and initialize
                    this.pageContentEl.innerHTML = pageInstance.render()
                    setTimeout(() => pageInstance.init(), 0)
                } else {
                    // Function-based page: just render HTML
                    this.pageContentEl.innerHTML = matchedRoute.content()
                }
            } else {
                // 404 page
                this.pageContentEl.innerHTML = this.route404.isPageClass(this.route404.content) 
                    ? new this.route404.content(this.pageContentEl).render()
                    : this.route404.content()
            }
            BazAnimation.animate(this.pageContentEl, "fadeIn")
        })

        this.fireRouteChange()
    }

    private static handlePopState(): void {
        console.log("popstate")
        this.handleRouteChange()
    }

    private static initLinkClickHandler(): void {
        document.addEventListener("click", this.handleLinkClick.bind(this))
    }

    private static handleLinkClick(event: Event): void {
        const target = event.target as HTMLAnchorElement

        if (target.tagName === "A" && target.href.startsWith(this.linkSignature)) {
            const path = target.href.replace(this.linkSignature, "")
            event.preventDefault()
            const fullPath = this.getFullPath(path)
            history.pushState({}, "", fullPath)
            this.handleRouteChange()
        }
    }
}
