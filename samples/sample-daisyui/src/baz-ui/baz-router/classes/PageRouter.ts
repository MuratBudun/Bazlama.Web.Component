import BazAnimation from "../../baz-animation/BazAnimation"
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
    private static basePath: string = "/"

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

    public static get BasePath(): string {
        return this.basePath
    }

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
        const fullPath = this.getFullPath(path || "/")
        history.pushState({}, "", fullPath)
        this.handleRouteChange()
    }

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
            if (matchedRoute) {
                this.pageContentEl.innerHTML = matchedRoute.htmlContentFunc()
            } else {
                this.pageContentEl.innerHTML = this.route404.htmlContentFunc()
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
