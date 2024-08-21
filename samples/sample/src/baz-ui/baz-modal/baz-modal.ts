import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, ShadowRootMode, useElementText } from "bazlama-web-component"
import htmlTemplate from "./template.htm"

@CustomElement("baz-modal")
export default class BazModal extends BazlamaWebComponent {
    @ChangeHooks([useElementText("h3[ref='title']")])
    @Attribute("title", true)
    public title: string = "Bazlama Modal"


    public dialogEl: Symbol = Symbol("dialogEl")

    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    public ShowModal() {
        const dialog = this.root?.querySelector("dialog")
        dialog?.showModal()
        dialog?.addEventListener("close", () => {
            alert("Dialog is closed")
        })
    }

    getRenderTemplate() {
        return `${htmlTemplate.replace("{dialogEl}", this.dialogEl.toString())}`
    }

    //#region Static ...
    static Alert(title: string, message: string) {
        const modal: BazModal = document.createElement("baz-modal") as BazModal
        modal.title = title
        modal.innerHTML = `<p>${message}</p>`
        document.body.appendChild(modal)
        modal.ShowModal()
    }
    //#endregion
}
