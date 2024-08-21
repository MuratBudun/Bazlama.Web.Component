import { BazlamaWebComponent, CustomElement, ShadowRootMode } from "bazlama-web-component"
import PageRoute from "./classes/PageRoute"
import PageRouter from "./classes/PageRouter"

@CustomElement("baz-router-menu")
export default class BazRouterMenu extends BazlamaWebComponent {
    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    private buildMenu(route: PageRoute, parentPath: string = ""): string {
        if (!route) { return "" }       
        
        if (route.children.length === 0) {
            return `<li><a href="${PageRouter.linkSignature}${parentPath}/${route.path}">${route.title}</a></li>`
        }

        let menu = `<li><details open><summary>${route.title}</summary><ul>`

        for (const child of route.children) {
            menu += this.buildMenu(child, parentPath + "/" + route.path)
        }
        menu += `</ul></details></li>`

        return menu
    }

    private routeMapChangeHandler() {
        this.render()
    }

    onConnected() {
        window.addEventListener("route-map-change", this.routeMapChangeHandler.bind(this))
    }

    onDisconnected(): void {
        window.removeEventListener("route-map-change", this.routeMapChangeHandler.bind(this))
    }

    getRenderTemplate() {
        let menuHtml = ""

        if (PageRouter.RootRoute.children.length > 0) {
            for (const child of PageRouter.RootRoute.children) {
                menuHtml += this.buildMenu(child)
            }
        }

        return `<ul class="menu bg-base-200 rounded-box w-full">${menuHtml}</ul>`
    }
}
