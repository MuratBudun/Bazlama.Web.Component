import PageRoute from "../baz-ui/baz-router/classes/PageRoute"
import { LazyPageRoute } from "../baz-ui/baz-router/classes/LazyPageRoute"
import type { INavigationItem } from "../baz-ui/baz-app/types"
import homeHtml from "./home.htm?raw"
import themeHtml from "./theme.htm?raw"
import iconHtml from "./icon/icon.htm?raw"
import { IconPage } from "./icon/IconPage"
import { TabPage } from "./tab/TabPage"
import { TextboxPage } from "./textbox/TextboxPage"
import { ModalPage } from "./modal/ModalPage"
import { AnimationPage } from "./animation/AnimationPage"
import { ExamplesPage } from "./examples/ExamplesPage"
import { ProductsListPage } from "./examples/ProductsListPage"
import { ProductsPage } from "./examples/ProductsPage"

export function getRoutes() {
    // Setup routes
    const rootRoute = new PageRoute("Home", "/", () => homeHtml)
    
    // Eager-loaded routes (small, frequently used)
    rootRoute.addRoute(new PageRoute("Tab", "tab", TabPage))
    rootRoute.addRoute(new PageRoute("Textbox", "textbox", TextboxPage))
    rootRoute.addRoute(new PageRoute("Modal", "modal", ModalPage))
    rootRoute.addRoute(new PageRoute("Animation", "animation", AnimationPage))
    rootRoute.addRoute(new PageRoute("Theme", "theme", () => themeHtml))
    rootRoute.addRoute(new PageRoute("Icon", "icon", IconPage))
    rootRoute.addRoute(new PageRoute("Icon", "icon-s", () => iconHtml))
    rootRoute.addRoute(new PageRoute("Examples", "examples", ExamplesPage))
    
    // Lazy-loaded route example (large page, loaded only when needed)
    // This will be code-split into a separate chunk by Vite
    rootRoute.addRoute(
        new LazyPageRoute(
            "Dashboard",
            "dashboard",
            () => 
                // Simulate slow network with 2 second delay to demonstrate loading state
                new Promise((resolve) => {
                    setTimeout(() => {
                        import("./dashboard/DashboardPage").then(m => resolve({ default: m.DashboardPage }));
                    }, 2000);
                }),
            {
                preload: true, // Preload on hover
                loadingContent: () => `
                    <div class="flex flex-col items-center justify-center min-h-screen gap-4">
                        <span class="loading loading-spinner loading-lg text-primary"></span>
                        <p class="text-lg font-semibold">Loading Dashboard...</p>
                        <p class="text-sm text-base-content/70">This is a lazy-loaded page with simulated 2s delay</p>
                    </div>
                `
            }
        )
    )
    
    // Products routes with nested dynamic route
    const productsRoute = new PageRoute("Products", "products", ProductsListPage)
    productsRoute.addRoute(new PageRoute("Product Detail", ":id", ProductsPage))
    rootRoute.addRoute(productsRoute)

    return rootRoute
}

export function get404Route() {
    return new PageRoute("404", "404", () => `
        <div class="flex items-center justify-center min-h-screen">
            <div class="text-center">
                <h1 class="text-6xl font-bold text-error">404</h1>
                <p class="text-2xl mt-4">Page not found</p>
                <a href="baz-router:/" class="btn btn-primary mt-8">Go Home</a>
            </div>
        </div>
    `)
}

export function getNavigationItems(): INavigationItem[] {
    return [
        {
            type: 'group',
            title: 'Getting Started',
            items: [
                { type: 'item', title: 'Home', path: '/', icon: 'home' }
            ]
        },
        {
            type: 'divider'
        },
        {
            type: 'group',
            title: 'Components',
            items: [
                { type: 'item', title: 'Tab', path: '/tab', icon: 'layout' },
                { type: 'item', title: 'Textbox', path: '/textbox', icon: 'edit' },
                { type: 'item', title: 'Modal', path: '/modal', icon: 'layout2' },
                { type: 'item', title: 'Animation', path: '/animation', icon: 'sparkles' },
                { type: 'item', title: 'Theme Switcher', path: '/theme', icon: 'colorSwatch' },
                { type: 'item', title: 'Icon', path: '/icon', icon: 'icons' },
                { type: 'item', title: 'Icon Html', path: '/icon-s', icon: 'icons' }
            ]
        },
        {
            type: 'divider'
        },
        {
            type: 'group',
            title: 'Examples',
            items: [
                { type: 'item', title: 'Dashboard (Lazy)', path: '/dashboard', icon: 'chart' },
                { type: 'item', title: 'Router Examples', path: '/examples', icon: 'code' },
                { type: 'item', title: 'Products (Params Demo)', path: '/products', icon: 'package' }
            ]
        }
    ]
}
