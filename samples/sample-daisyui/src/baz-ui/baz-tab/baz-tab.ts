import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, EventAction, Property, ShadowRootMode, useAddRemoveClass } from "bazlama-web-component"
import template from "./baz-tab.htm?template"
import tabItemTemplate from "./baz-tab-item.htm?template"

@CustomElement("baz-tab")
export default class BazTab extends BazlamaWebComponent {
    public tabs: Record<string, { Title: string, IconName: string, Html: string }> = {}
    
    @Attribute("closable", false)
    @Property()
    public Closable: boolean = false

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

    @EventAction(":scope > div:first-child > ul > li > .tab-close", "click")
    public TabCloseClick = (_name: string, element: HTMLElement) => {
        const li = element.closest('li')
        const tabId = li?.getAttribute("tab-id")
        if (tabId) {
            this.removeTab(tabId)
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

    /**
     * Yeni bir tab ekler
     * @param tabId Tab'ın benzersiz kimliği
     * @param title Tab başlığı
     * @param content Tab içeriği (HTML string)
     * @param iconName Opsiyonel ikon adı
     * @param activate Eklendikten sonra aktif edilsin mi?
     */
    public addTab(tabId: string, title: string, content: string, iconName: string = "", activate: boolean = true): void {
        if (this.tabs[tabId]) {
            console.warn(`Tab with id "${tabId}" already exists`)
            return
        }

        this.tabs[tabId] = {
            Title: title,
            IconName: iconName,
            Html: `<div tab-id="${tabId}" class="hidden">${content}</div>`
        }

        this.render()

        if (activate) {
            this.ActiveTabId = tabId
        }
    }

    /**
     * Var olan bir tab'ı siler
     * @param tabId Silinecek tab'ın kimliği
     */
    public removeTab(tabId: string): void {
        if (!this.tabs[tabId]) {
            console.warn(`Tab with id "${tabId}" does not exist`)
            return
        }

        delete this.tabs[tabId]

        // Eğer aktif tab silindiyse, başka bir tab'a geç
        if (this.ActiveTabId === tabId) {
            const remainingTabs = Object.keys(this.tabs)
            this.ActiveTabId = remainingTabs.length > 0 ? remainingTabs[0] : ""
        }

        this.render()
    }

    /**
     * Bir tab'ın içeriğini günceller
     * @param tabId Güncellenecek tab'ın kimliği
     * @param title Yeni başlık (opsiyonel)
     * @param content Yeni içerik (opsiyonel)
     * @param iconName Yeni ikon (opsiyonel)
     */
    public updateTab(tabId: string, title?: string, content?: string, iconName?: string): void {
        if (!this.tabs[tabId]) {
            console.warn(`Tab with id "${tabId}" does not exist`)
            return
        }

        if (title !== undefined) {
            this.tabs[tabId].Title = title
        }

        if (iconName !== undefined) {
            this.tabs[tabId].IconName = iconName
        }

        if (content !== undefined) {
            this.tabs[tabId].Html = `<div tab-id="${tabId}" class="hidden">${content}</div>`
        }

        this.render()
    }

    /**
     * Tüm tab'ları temizler
     */
    public clearTabs(): void {
        this.tabs = {}
        this.ActiveTabId = ""
        this.render()
    }

    /**
     * Tab sayısını döndürür
     */
    public getTabCount(): number {
        return Object.keys(this.tabs).length
    }

    /**
     * Belirli bir tab'ın var olup olmadığını kontrol eder
     */
    public hasTab(tabId: string): boolean {
        return this.tabs.hasOwnProperty(tabId)
    }

    getRenderTemplate(): string {
        const tabHeaders = Object.entries(this.tabs).map(([tabId, tab]) => {
            return tabItemTemplate({
                TAB_ID: tabId,
                ICON_NAME: tab.IconName,
                TITLE: tab.Title,
                CLOSABLE: this.Closable ? "true" : ""
            })
        }).join('')

        const tabContents = Object.values(this.tabs).map(tab => tab.Html).join('')

        return template({
            TAB_HEADERS: tabHeaders,
            TAB_CONTENTS: tabContents
        })
    }
}
