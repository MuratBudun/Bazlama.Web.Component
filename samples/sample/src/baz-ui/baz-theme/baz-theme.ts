import { Attribute, BazlamaWebComponent, ChangeHooks, CustomElement, ShadowRootMode, useElementInputRadioValue, useElementInputValue, useFunction } from "bazlama-web-component"
import htmlTemplate from "./template.htm"

@CustomElement("baz-theme")
export default class BazTheme extends BazlamaWebComponent {
    @ChangeHooks([
        useElementInputRadioValue("theme-radio-group"),
        useFunction((bazComponent, value) => {
            const theme = (bazComponent as BazTheme).getThemeList().find((theme) => theme.name === value)
            if (theme) {
                const htmlElement = document.querySelector("html")
                if (htmlElement) htmlElement.setAttribute("data-theme", theme.name)
                const themeTitleEl = bazComponent.root?.querySelector("span[ref='theme-title']")
                if (themeTitleEl) themeTitleEl.innerHTML = theme.title
            }
        })
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

        const themeList = this.getThemeList()

        if (!themeList || themeList.length === 0) {
            themeListEl.innerHTML = 
            `<li>
                <input type="radio" name="theme-radio-group"
                    class="btn btn-sm btn-block btn-ghost justify-start" aria-label="Default"
                    value="default" />
            </li>`

            this.Theme = "default"
            return
        }

        themeListEl.innerHTML = this.getThemeList().map((theme) => 
            `<li>
                <input type="radio" name="theme-radio-group"
                    class="btn btn-sm btn-block btn-ghost justify-start" aria-label="${theme.title}"
                    value="${theme.name}" />
            </li>`).join("")
        
        const themeBackup = this.Theme
        this.Theme = ""
        this.Theme = themeBackup
    }

    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
    }

    getRenderTemplate() {
        return htmlTemplate
    }
}