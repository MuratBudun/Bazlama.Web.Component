import { TGetPageContentEl } from "../types/TGetPageContentEl"
import PageRoute from "./PageRoute"

declare global {
    interface Window {
        BazPageRouter: PageRouter
    }
}

export default class PageRouter {
    public static linkSignature = "baz-router:"
    private static rootRoute: PageRoute = new PageRoute("Home", "/", () => "<h1>Home</h1>")
    private static route404: PageRoute = new PageRoute("404", "404", () => "<h1>404</h1>")
    private static pageContentEl: HTMLElement = document.body

    static initialize(elQuery: string = "#page-content"): void {
        this.pageContentEl = document.querySelector(elQuery) as HTMLElement
        window.BazPageRouter = this
        window.addEventListener("popstate", this.handlePopState.bind(this))
        document.addEventListener("DOMContentLoaded", this.initLinkClickHandler.bind(this))

        this.handleRouteChange()
        this.fireRouteMapChange()
        this.fireRouteChange()
    }

    public static fireRouteMapChange(): void {
        window.dispatchEvent(new CustomEvent("route-map-change"))
    }

    public static fireRouteChange(): void {
        window.dispatchEvent(new CustomEvent("route-change"))
    }

    public static get RootRoute(): PageRoute {
        return this.rootRoute
    }

    public static set RootRoute(value: PageRoute) {
        this.rootRoute = value
        this.fireRouteMapChange()
    }

    public static get Route404(): PageRoute {
        return this.route404
    }

    public static set Route404(value: PageRoute) {
        this.route404 = value
    }

    public static get PageContentEl(): HTMLElement {
        return this.pageContentEl
    }

    public static set PageContentEl(pageContentEl: TGetPageContentEl) {
        this.pageContentEl = typeof pageContentEl === "function" ? pageContentEl() : pageContentEl
    }

    public static navigate(path: string): void {
        history.pushState({}, "", path || "/")
        this.handleRouteChange()
    }

    public static getCurrentRoute(): PageRoute | null {
        const pathParts = window.location.pathname.split("/").filter(Boolean)
        return this.rootRoute.match(pathParts)
    }

    static getBreadcrumb(): PageRoute[] {
        if (!this.rootRoute) {
            throw new Error("Router not initialized. Call Router.initialize with a root route.")
        }

        const pathParts = ["/", ...window.location.pathname.split("/").filter(Boolean)]
        console.log("pathParts", pathParts)
        if (pathParts.length === 1) {
            return [this.rootRoute]
        }
        const matchedRoutes = this.rootRoute.getBreadcrumb(pathParts)
        console.log("matchedRoutes", matchedRoutes)

        return matchedRoutes.length > 0 ? matchedRoutes : [this.route404]
    }

    public static handleRouteChange(): void {
        const pathParts = ["/", ...window.location.pathname.split("/").filter(Boolean)]
        const matchedRoute = this.rootRoute.match(pathParts)

        if (matchedRoute) {
            this.pageContentEl.innerHTML = matchedRoute.htmlContentFunc()
        } else {
            this.pageContentEl.innerHTML = this.route404.htmlContentFunc()
        }

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
            const url = target.href.replace(this.linkSignature, "")
            event.preventDefault()
            history.pushState({}, "", url)
            this.handleRouteChange()
        }
    }
}
