import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, ShadowRootMode, useFunction } from "bazlama-web-component"
import htmlTemplate from "./template.htm"

@CustomElement("baz-theme")
export default class BazTheme extends BazlamaWebComponent {
    @ChangeHooks([
        useFunction((bazComponent, value) => {
            const me = bazComponent as BazTheme
            const htmlElement = document.querySelector("html")
            if (htmlElement) {
                htmlElement.setAttribute("data-theme", String(value))
            }
            const themeNameEl = me.root?.querySelector("span[ref='theme-name']")
            if (themeNameEl) {
                (themeNameEl as HTMLElement).innerText = me.getThemeTitle(String(value))
            }
        }),
    ])
    @Attribute("theme", true)
    public Theme: string = "default"

    @ChangeHooks([useFunction((bazComponent) => {
        (bazComponent as BazTheme).updateThemeList()
    })])
    @Attribute("theme-list", true)
    public ThemeList: string = "default, dark, light, retro, cyberpunk, valentine, aqua"
    
    @ChangeHooks([useFunction((bazComponent) => {
        (bazComponent as BazTheme).updateThemeList()
    })])
    @Attribute("theme-title-list", true)
    public ThemeTitleList: string = "Default, Dark, Light, Retro, Cyberpunk, Valentine, Aqua"

    public getThemeList(): { name: string, title: string }[] {
        const themeNameList = this.ThemeList.split(",").map((theme) => theme.trim())
        const themeTitleList = this.ThemeTitleList.split(",").map((theme) => theme.trim())

        return themeNameList.map((theme, index) => {
            return { name: theme, title: index < themeTitleList.length ? themeTitleList[index] : theme }
        })
    }

    public getThemeTitle(themeName: string): string {
        const theme = this.getThemeList().find((theme) => theme.name === themeName)
        return theme ? theme.title : themeName
    }

    public updateThemeList() {
        const themeListEl = this.root?.querySelector("ul[ref='theme-list']")
        if (!themeListEl) return

        themeListEl.innerHTML = this.getThemeList().map((theme) => 
            `<li>
                <input type="radio" name="theme-dropdown"
                    class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="${theme.title}"
                    value="${theme.name}" />
            </li>`).join("")
    }

    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    getRenderTemplate() {
        return htmlTemplate
    }
}