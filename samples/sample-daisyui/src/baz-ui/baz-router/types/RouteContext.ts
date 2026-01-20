/**
 * Context information passed to route handlers
 */
export interface RouteContext {
    /** URL path parameters (e.g., { id: "12" } from /products/:id) */
    params: Record<string, string>
    
    /** URL query parameters (e.g., { color: "red" } from ?color=red) */
    query: Record<string, string>
}
