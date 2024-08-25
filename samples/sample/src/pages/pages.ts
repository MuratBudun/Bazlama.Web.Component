import PageRoute from "../baz-ui/baz-router/classes/PageRoute"
import PageRouter from "../baz-ui/baz-router/classes/PageRouter"

import page404 from "./404.htm"
import pageIndex from "./index.htm"
import pageAbout from "./about.htm"

import pagePropertyUseElementText from "./property/hooks/useElementText.htm"

const sampleRootPage = new PageRoute("Home", "/", () => pageIndex, [])

sampleRootPage.addRoute(new PageRoute("Property / Attribute", "property", () => ""))
    .addRoutes([
        new PageRoute("Change Hooks", "property-chnage-hooks", () => "", [
            new PageRoute("useElementText", "useElementText", () => pagePropertyUseElementText),
        ]),
    ])

sampleRootPage.addRoute(new PageRoute("About", "about", () => pageAbout))
    .addRoutes([
        new PageRoute("Contact", "contact", () => "<h1>About -> Contact</h1>"),
        new PageRoute("Team", "team", () => "<h1>About -> Team</h1>"),
        new PageRoute("History", "history", () => "<h1>About -> History</h1>", [
            new PageRoute("2020", "2020", () => "<h1>About -> History -> 2020</h1>"),
            new PageRoute("2019", "2019", () => "<h1>About -> History -> 2019</h1>"),
            new PageRoute("2018", "2018", () => "<h1>About -> History -> 2018</h1>"),
        ]),
    ])
    
sampleRootPage.addRoute(new PageRoute("Services", "services", () => "<h1>Services</h1>"))
    .addRoutes([
        new PageRoute("Design", "design", () => "<h1>Services -> Design</h1>"),
        new PageRoute("Development", "development", () => "<h1>Services -> Development</h1>"),
        new PageRoute("Marketing", "marketing", () => "<h1>Services -> Marketing</h1>"),
    ])

PageRouter.RootRoute = sampleRootPage
PageRouter.Route404 = new PageRoute("404", "404", () => page404)

export default PageRouter
