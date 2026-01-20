import PageRouter from "../baz-ui/baz-router/classes/PageRouter"
import PageRoute from "../baz-ui/baz-router/classes/PageRoute"
import homeHtml from "./home.htm?raw"
import themeHtml from "./theme.htm?raw"
import { IconPage } from "./icon/IconPage"
import { TabPage } from "./tab/TabPage"
import { TextboxPage } from "./textbox/TextboxPage"
import { ModalPage } from "./modal/ModalPage"
import { ExamplesPage } from "./examples/ExamplesPage"
import { ProductsListPage } from "./examples/ProductsListPage"
import { ProductsPage } from "./examples/ProductsPage"

export function initializeRouter() {
    // Setup routes
    const rootRoute = new PageRoute("Home", "/", () => homeHtml)
    rootRoute.addRoute(new PageRoute("Tab", "tab", TabPage))
    rootRoute.addRoute(new PageRoute("Textbox", "textbox", TextboxPage))
    rootRoute.addRoute(new PageRoute("Modal", "modal", ModalPage))
    rootRoute.addRoute(new PageRoute("Theme", "theme", () => themeHtml))
    rootRoute.addRoute(new PageRoute("Icon", "icon", IconPage))
    rootRoute.addRoute(new PageRoute("Examples", "examples", ExamplesPage))
    
    // Products routes with nested dynamic route
    const productsRoute = new PageRoute("Products", "products", ProductsListPage)
    productsRoute.addRoute(new PageRoute("Product Detail", ":id", ProductsPage))
    rootRoute.addRoute(productsRoute)

    // Configure router
    PageRouter.RootRoute = rootRoute
    PageRouter.Route404 = new PageRoute("404", "404", () => `
        <div class="flex items-center justify-center min-h-screen">
            <div class="text-center">
                <h1 class="text-6xl font-bold text-error">404</h1>
                <p class="text-2xl mt-4">Page not found</p>
                <a href="baz-router:/" class="btn btn-primary mt-8">Go Home</a>
            </div>
        </div>
    `)

    // Initialize router
    PageRouter.initialize("#page-content", import.meta.env.BASE_URL)
}
