/**
 * Page content function type
 * @param context - Route context information
 * @param context.route - Current matched route
 * @param context.params - Path parameters (e.g., /user/:id -> {id: "123"})
 * @param context.query - Query parameters (e.g., ?search=test -> {search: "test"})
 * @param context.previousRoute - Previous route (if any)
 * @returns HTML content as string
 */
export type TGetPageContentFunc = (context?: {
    route?: any
    params?: Record<string, string>
    query?: Record<string, string>
    previousRoute?: any
}) => string
