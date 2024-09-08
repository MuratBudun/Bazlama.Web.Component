import { Attribute, BazConvert, BazlamaWebComponent, ChangeHooks, CustomElement, ShadowRootMode, useElementTextWithFunction } from "bazlama-web-component"
import htmlTemplate from "./template.htm"

@CustomElement("baz-s02")
export default class BazS02 extends BazlamaWebComponent {
    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    @ChangeHooks([useElementTextWithFunction("span[ref='label-text']", (value) => {
        const _debit = BazConvert.anyToNumber(value, 0)
        let result = `Your debit is ${_debit} TL`
        if (_debit > 1000) {
            result += " and it's too much"
        }
        return result
    })])
    @Attribute("debit", true)
    public debit = 0

    getRenderTemplate() {
        return htmlTemplate
    }
}
