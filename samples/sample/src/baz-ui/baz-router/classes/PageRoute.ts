import { TGetPageContentFunc } from "../types/TGetPageContentFunc"

export default class PageRoute {
    title: string
    path: string
    htmlContentFunc: TGetPageContentFunc
    children: PageRoute[]

    constructor(title: string, path: string, htmlContent: TGetPageContentFunc, children: PageRoute[] = []) {
        this.title = title
        this.path = path
        this.htmlContentFunc = htmlContent
        this.children = children
    }

    public addRoute(route: PageRoute): PageRoute {
        this.children.push(route)
        return route
    }

    public addRoutes(routes: PageRoute[]): void {
        this.children.push(...routes)
    }

    public match(pathParts: string[]): PageRoute | null {
        if (this.path === "/" && pathParts.length === 0) {
            return this
        }

        if (this.path === pathParts[0]) {
            if (pathParts.length === 1) {
                return this
            }

            for (const child of this.children) {
                const matchedRoute = child.match(pathParts.slice(1))
                if (matchedRoute) {
                    return matchedRoute
                }
            }
        }

        return null
    }

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