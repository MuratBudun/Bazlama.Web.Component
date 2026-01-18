import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, EventAction, Property, ShadowRootMode, useAddRemoveClass } from "bazlama-web-component"

@CustomElement("baz-tab")
export default class BazTab extends BazlamaWebComponent {
    public tabs: Record<string, { Title: string, IconName: string, Html: string }> = {}

    @ChangeHooks([
        useAddRemoveClass({
            addClassName: "hidden",
            removeClassName: "hidden",
            addElQuery: (_, oldValue) => `:scope > div[tab-id="${oldValue}"]`,
            removeElQuery: (_, value) => `:scope > div[tab-id="${value}"]`
        }),
        useAddRemoveClass({
            addClassName: ["text-primary", "!border-primary"],
            removeClassName: ["text-primary", "!border-primary"],
            addElQuery: (value) => `:scope > div:first-child > ul > li[tab-id="${value}"]`,
            removeElQuery: (oldValue) => `:scope > div:first-child > ul > li[tab-id="${oldValue}"]`
        })
    ])
    @Attribute("active-tab-id", true)
    @Property()
    public ActiveTabId: string = ""

    @EventAction(":scope > div:first-child > ul > li", "click")
    public TabClick = (_name: string, element: HTMLElement) => {
        const tabId = element.getAttribute("tab-id")
        if (tabId) {
            this.ActiveTabId = tabId
        }
    }

    constructor() {
        super(ShadowRootMode.None)
        this.initTabs()
        this.InitBazlamaWebComponent()
    }

    private initTabs() {
        const directDivs = Array.from(this.children).filter(child => child.tagName === "DIV") as HTMLElement[]
        
        directDivs.forEach((child, i) => {
            const tabId = child.getAttribute("tab-id") ?? child.getAttribute("id") ?? `tab-${i}`
            child.setAttribute("tab-id", tabId)
            child.classList.add("hidden")

            const title = child.getAttribute("title") ?? `Tab ${i}`
            const iconName = child.getAttribute("icon-name") ?? ""

            this.tabs[tabId] = {
                Title: title,
                IconName: iconName,
                Html: child.outerHTML
            }
        })
    }

    afterRender(): void {
        if (this.ActiveTabId === "") {
            this.ActiveTabId = Object.keys(this.tabs)[0]
        }
    }

    getRenderTemplate(): string {
        let result = `
            <div class="border-b border-neutral">
            <ul class="flex flex-wrap -mb-px text-sm font-medium text-center">`

        for (const tabId in this.tabs) {
            const tab = this.tabs[tabId]
            result += `<li tab-id="${tabId}" class="cursor-pointer me-2 inline-flex items-center justify-center p-4 border-b-2 border-transparent rounded-t-lg hover:text-primary hover:border-primary group">`
            if (tab.IconName !== "") {
                result += `<baz-icon class="me-2" icon="${tab.IconName}"></baz-icon>`
            }
            result += tab.Title
            result += `</li>`
        }

        result += '</ul></div>'
        for (const tabId in this.tabs) {
            const tab = this.tabs[tabId]
            result += tab.Html
        }

        return result
    }
}
