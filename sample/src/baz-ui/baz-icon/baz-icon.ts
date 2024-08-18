import { BazlamaWebComponent, CustomElement } from "bazlama-web-component"
import { icons } from "./baz-icon-lib"
import aa from "./icons/search.svg"

@CustomElement("baz-icon")
export default class BazIcon extends BazlamaWebComponent {
    public icon: string = ""

    public color: string = "black"

    public size: string = "1em"

    public strokeWidth: string = "0"

    public stroke: string = "none"

    public fill: string = "currentColor"

    public viewBox: string = "0 0 24 24"

    public ariaLabel: string = ""

    public role: string = "img"

    public ariaHidden: string = "true"

    getRenderTemplate() {
        const icon = icons.search
        console.log("aaaa", aa)
        const template = `
            <svg xmlns="http://www.w3.org/2000/svg" 
                fill="${this.fill}" 
                viewBox="${this.viewBox}" 
                stroke="${this.stroke}" 
                stroke-width="${this.strokeWidth}" 
                width="${this.size}" 
                height="${this.size}" 
                role="${this.role}" 
                aria-label="${this.ariaLabel}" 
                aria-hidden="${this.ariaHidden}" 
                class="icon-${this.color}">
                ${icon}
            </svg>
        `
        console.log(template)
        return template
    }
}