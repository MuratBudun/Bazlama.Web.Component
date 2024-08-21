import { BazlamaWebComponent, CustomElement, ShadowRootMode } from "bazlama-web-component"
import PageRouter from "./classes/PageRouter"

@CustomElement("baz-router-home-logo")
export default class BazRouterHomeLogo extends BazlamaWebComponent {
    constructor() {
        super(ShadowRootMode.None)
        this.isNoRenderedComponent = true
        this.style.display = "flex"
        this.style.alignItems = "center"
        this.style.justifyContent = "start"
        this.InitBazlamaWebComponent()
    }

    public goHome() {
        PageRouter.navigate("/")
    }

    onConnected(): void {
        this.addEventListener("click", this.goHome)
    }

    onDisconnected(): void {
        this.removeEventListener("click", this.goHome)
    }
 }