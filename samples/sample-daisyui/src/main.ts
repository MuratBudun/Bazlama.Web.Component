import "./baz-ui/baz-textbox/baz-textbox.ts"
import "./baz-ui/baz-icon/baz-icon.ts"
import "./baz-ui/baz-modal/baz-modal.ts"
import "./baz-ui/baz-tab/baz-tab.ts"
import "./baz-ui/baz-theme/baz-theme-switcher.ts"

import PageRouter from "./baz-ui/baz-router/classes/PageRouter"
import PageRoute from "./baz-ui/baz-router/classes/PageRoute"
import homeHtml from "./pages/home.htm?raw"
import tabHtml from "./pages/tab.htm?raw"
import themeHtml from "./pages/theme.htm?raw"
import iconHtml from "./pages/icon.htm?raw"

// Initialize router
PageRouter.initialize("#page-content")

// Setup routes
const rootRoute = new PageRoute("Home", "/", () => homeHtml)
rootRoute.addRoute(new PageRoute("Tab", "tab", () => tabHtml))
rootRoute.addRoute(new PageRoute("Theme", "theme", () => themeHtml))
rootRoute.addRoute(new PageRoute("Icon", "icon", () => iconHtml))

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
