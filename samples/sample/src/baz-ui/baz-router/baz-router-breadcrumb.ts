import { BazlamaWebComponent, CustomElement, ShadowRootMode } from "bazlama-web-component"
import PageRouter from "./classes/PageRouter"

@CustomElement("baz-router-breadcrumb")
export default class BazRouterBreadcrumb extends BazlamaWebComponent {
    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    private routeMapChangeHandler() {
        this.render()
    }

    onConnected() {
        window.addEventListener("route-change", this.routeMapChangeHandler.bind(this))
    }

    onDisconnected(): void {
        window.removeEventListener("route-change", this.routeMapChangeHandler.bind(this))
    }

    getRenderTemplate() {
        const breadcrumb = PageRouter.getBreadcrumb()

        if (breadcrumb.length === 0) {
            return ""
        }

        let breadcrumbHtml = ""
        for (let i = 0; i < breadcrumb.length; i++) {
            const route = breadcrumb[i]
            if (i === breadcrumb.length - 1) {
                breadcrumbHtml += `<li><span class="inline-flex items-center gap-2">${route.title}</span></li>`
                continue
            }

            breadcrumbHtml += `<li><a href="${PageRouter.linkSignature}${route.path}"><baz-icon size="1em" icon="folder" class="pr-2"></baz-icon>${route.title}</a></li>`
        }

        return `<div class="breadcrumbs text-sm"><ul>${breadcrumbHtml}</ul></div>`
    }
}