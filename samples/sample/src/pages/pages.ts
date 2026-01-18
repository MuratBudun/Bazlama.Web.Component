import PageRoute from "../baz-ui/baz-router/classes/PageRoute"
import PageRouter from "../baz-ui/baz-router/classes/PageRouter"

import page404 from "./404.htm"
import pageIndex from "./index.htm"
import pageGettingStarted from "./getting-started.htm"
import pageApiReference from "./api-reference.htm"
import pageBestPractices from "./best-practices.htm"
import pageLiveDemo from "./live-demo.htm"

import pagePropertyUseElementText from "./property/hooks/useElementText.htm"
import pagePropertyUseElementTextWithFunction from "./property/hooks/useElementTextWithFunction.htm"
import pagePropertyUseElementInputValue from "./property/hooks/useElementInputValue.htm"
import pagePropertyUseElementAttribute from "./property/hooks/useElementAttribute.htm"
import pagePropertyUseElementProperty from "./property/hooks/useElementProperty.htm"
import pagePropertyUseAddRemoveClass from "./property/hooks/useAddRemoveClass.htm"
import pagePropertyUseElementStyle from "./property/hooks/useElementStyle.htm"
import pagePropertyUseToggleClass from "./property/hooks/useToggleClass.htm"
import pagePropertyUseSwitchClass from "./property/hooks/useSwitchClass.htm"
import pagePropertyUseCustomHook from "./property/hooks/useCustomHook.htm"
import pagePropertyUseFunction from "./property/hooks/useFunction.htm"

import pageDecoratorCustomElement from "./decorators/CustomElement.htm"
import pageDecoratorProperty from "./decorators/Property.htm"
import pageDecoratorAttribute from "./decorators/Attribute.htm"
import pageDecoratorChangeHooks from "./decorators/ChangeHooks.htm"
import pageDecoratorEventAction from "./decorators/EventAction.htm"
import pageDecoratorFireEvent from "./decorators/FireEvent.htm"
import pageDecoratorFireRender from "./decorators/FireRender.htm"

const sampleRootPage = new PageRoute("Home", "/", () => pageIndex, [])

sampleRootPage.addRoute(new PageRoute("Getting Started", "getting-started", () => pageGettingStarted))
sampleRootPage.addRoute(new PageRoute("Live Demo", "live-demo", () => pageLiveDemo))
sampleRootPage.addRoute(new PageRoute("API Reference", "api-reference", () => pageApiReference))
sampleRootPage.addRoute(new PageRoute("Best Practices", "best-practices", () => pageBestPractices))

sampleRootPage.addRoute(new PageRoute("Decorators", "decorators", () => ""))
    .addRoutes([
        new PageRoute("@CustomElement", "custom-element", () => pageDecoratorCustomElement),
        new PageRoute("@Property", "property", () => pageDecoratorProperty),
        new PageRoute("@Attribute", "attribute", () => pageDecoratorAttribute),
        new PageRoute("@ChangeHooks", "change-hooks", () => pageDecoratorChangeHooks),
        new PageRoute("@EventAction", "event-action", () => pageDecoratorEventAction),
        new PageRoute("@FireEvent", "fire-event", () => pageDecoratorFireEvent),
        new PageRoute("@FireRender", "fire-render", () => pageDecoratorFireRender),
    ])

sampleRootPage.addRoute(new PageRoute("Property Change Hooks", "property-hooks", () => ""))
    .addRoutes([
        new PageRoute("useElementText", "use-element-text", () => pagePropertyUseElementText),
        new PageRoute("useElementTextWithFunction", "use-element-text-with-function", () => pagePropertyUseElementTextWithFunction),
        new PageRoute("useElementInputValue", "use-element-input-value", () => pagePropertyUseElementInputValue),
        new PageRoute("useElementAttribute", "use-element-attribute", () => pagePropertyUseElementAttribute),
        new PageRoute("useElementProperty", "use-element-property", () => pagePropertyUseElementProperty),
        new PageRoute("useAddRemoveClass", "use-add-remove-class", () => pagePropertyUseAddRemoveClass),
        new PageRoute("useElementStyle", "use-element-style", () => pagePropertyUseElementStyle),
        new PageRoute("useToggleClass", "use-toggle-class", () => pagePropertyUseToggleClass),
        new PageRoute("useSwitchClass", "use-switch-class", () => pagePropertyUseSwitchClass),
        new PageRoute("useCustomHook", "use-custom-hook", () => pagePropertyUseCustomHook),
        new PageRoute("useFunction", "use-function", () => pagePropertyUseFunction),
    ])

PageRouter.RootRoute = sampleRootPage
PageRouter.Route404 = new PageRoute("404", "404", () => page404)

export default PageRouter
