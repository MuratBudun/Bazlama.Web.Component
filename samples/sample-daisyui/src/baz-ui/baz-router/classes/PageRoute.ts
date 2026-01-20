import { TGetPageContentFunc } from "../types/TGetPageContentFunc"
import { BasePage } from "./BasePage"

/**
 * Page Class type - constructor function that creates a BasePage instance
 */
type PageClass = new (
    container: HTMLElement,
    params?: Record<string, string>,
    query?: Record<string, string>
) => BasePage

/**
 * Represents a route in the application with its content and children.
 * Supports both function-based pages and Page Class Pattern.
 * 
 * @example
 * ```typescript
 * // Function-based route
 * const homeRoute = new PageRoute("Home", "/", () => '<div>Home Page</div>')
 * 
 * // Function-based route with params and query
 * const userRoute = new PageRoute("User", "user", (context) => {
 *     const userId = context?.params?.id || 'unknown'
 *     const tab = context?.query?.tab || 'profile'
 *     return `
 *         <div>
 *             <h1>User: ${userId}</h1>
 *             <p>Active Tab: ${tab}</p>
 *         </div>
 *     `
 * })
 * 
 * // Page Class route
 * const aboutRoute = new PageRoute("About", "about", AboutPage)
 * 
 * // Nested routes
 * homeRoute.addRoute(userRoute)
 * homeRoute.addRoute(aboutRoute)
 * ```
 */
export default class PageRoute {
    /** Route title for display purposes */
    title: string
    
    /** Route path segment (e.g., "about", "user/:id", "/" for root) */
    path: string
    
    /** Route content - either a function returning HTML or a Page Class */
    content: TGetPageContentFunc | PageClass
    
    /** Child routes */
    children: PageRoute[]
    
    /** Parsed params from the path match */
    private params: Record<string, string> = {}

    /**
     * Creates a new route
     * @param title - Display title for the route
     * @param path - Path segment (without leading slash except for root "/")
     * @param content - Function returning HTML string or Page Class constructor
     * @param children - Array of child routes (optional)
     */
    constructor(
        title: string,
        path: string,
        content: TGetPageContentFunc | PageClass,
        children: PageRoute[] = []
    ) {
        this.title = title
        this.path = path
        this.content = content
        this.children = children
    }

    /**
     * Type guard to check if content is a Page Class
     * @param value - Value to check
     * @returns True if value is a Page Class constructor
     */
    public isPageClass(value: any): value is PageClass {
        // Check if it's a class (constructor function)
        return typeof value === 'function' && value.prototype && value.prototype.constructor === value
    }

    /**
     * Adds a child route
     * @param route - Child route to add
     * @returns The added route for chaining
     */
    public addRoute(route: PageRoute): PageRoute {
        this.children.push(route)
        return route
    }

    /**
     * Adds multiple child routes
     * @param routes - Array of routes to add
     */
    public addRoutes(routes: PageRoute[]): void {
        this.children.push(...routes)
    }

    /**
     * Matches a path against this route and its children
     * Supports dynamic segments like :id, :slug, etc.
     * @param pathParts - Array of path segments to match
     * @returns Matched route with parsed params or null if no match
     */
    public match(pathParts: string[]): PageRoute | null {
        if (this.path === "/" && pathParts.length === 0) {
            return this
        }

        const pathSegment = pathParts[0]
        const isMatch = this.matchSegment(this.path, pathSegment)
        
        if (isMatch) {
            // Extract param if path segment is dynamic (e.g., :id)
            if (this.path.startsWith(":")) {
                const paramName = this.path.slice(1)
                this.params[paramName] = pathSegment
            }
            
            if (pathParts.length === 1) {
                return this
            }

            // Try to match children
            for (const child of this.children) {
                const matchedRoute = child.match(pathParts.slice(1))
                if (matchedRoute) {
                    // Copy parent params to child
                    matchedRoute.params = { ...this.params, ...matchedRoute.params }
                    return matchedRoute
                }
            }
        }

        return null
    }
    
    /**
     * Checks if a path segment matches a route segment
     * @param routeSegment - Route segment (e.g., "users", ":id")
     * @param pathSegment - Actual path segment from URL
     * @returns True if segments match
     */
    private matchSegment(routeSegment: string, pathSegment: string): boolean {
        // Dynamic segment (starts with :)
        if (routeSegment.startsWith(":")) {
            return true
        }
        // Exact match
        return routeSegment === pathSegment
    }
    
    /**
     * Gets parsed URL parameters
     * @returns Object containing URL parameters
     */
    public getParams(): Record<string, string> {
        return { ...this.params }
    }

    /**
     * Gets breadcrumb trail for a given path
     * @param pathParts - Array of path segments
     * @returns Array of routes forming the breadcrumb trail
     */
    public getBreadcrumb(pathParts: string[]): PageRoute[] {
        if (!this.path || !Array.isArray(pathParts) || pathParts.length == 0) { return [] }
        if (pathParts[0] === "/" && pathParts.length == 1) { return [] }

        const breadcrumb: PageRoute[] = []
        this.findBreadcrumb(pathParts, breadcrumb)
        return breadcrumb
    }

    private findBreadcrumb(pathParts: string[], breadcrumb: PageRoute[]): boolean {
        if (pathParts.length === 0) {
            breadcrumb.push(this)
            return true
        }

        const [currentPart, ...restParts] = pathParts
        if (this.path === currentPart) {
            breadcrumb.push(this)
            for (const child of this.children) {
                if (child.findBreadcrumb(restParts, breadcrumb)) {
                    return true
                }
            }
        }

        return false
    }
}
