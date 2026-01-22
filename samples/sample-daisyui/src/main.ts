// Import all Bazlama UI components
import "./baz-ui"
import { BazApp } from "./baz-ui"
import { getRoutes, get404Route, getNavigationItems } from "./pages/router"

// Get BazApp instance
const app = document.querySelector('baz-app') as BazApp

// Initialize router with routes
app.initializeRouter(getRoutes(), get404Route())

// Set navigation items
app.setNavigationItems(getNavigationItems())
