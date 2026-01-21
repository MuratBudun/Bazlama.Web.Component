import { BazlamaWebComponent, CustomElement, Property, EventAction, ShadowRootMode } from "bazlama-web-component"

@CustomElement("baz-theme-switcher")
export default class BazThemeSwitcher extends BazlamaWebComponent {
    @Property()
    public CurrentTheme: string = this.getInitialTheme()

    @Property()
    public Themes: string[] = this.getAvailableThemes()

    @Property()
    public ShowLabel: boolean = true

    constructor() {
        super(ShadowRootMode.None)
        // Theme already applied by inline script in index.html
        this.InitBazlamaWebComponent()
    }

    private getInitialTheme(): string {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) return savedTheme;
        
        // No saved theme, use prefers-color-scheme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    }

    private getAvailableThemes(): string[] {
        // Try to parse themes from DaisyUI config (if available in CSS)
        // For now, return a hardcoded list that matches index.css
        // In future, this could parse the actual CSS config
        return [
            "light",
            "dark", 
            "cupcake",
            "nord",
            "sunset",
            "dracula",
            "retro",
            "cyberpunk",
            "valentine",
            "aqua"
        ];
    }

    private applyTheme(theme: string) {
        document.documentElement.setAttribute("data-theme", theme)
        localStorage.setItem("theme", theme)
    }

    @EventAction("select", "change")
    public ThemeChange = (_name: string, element: HTMLSelectElement) => {
        this.CurrentTheme = element.value
        this.applyTheme(element.value)
    }

    getRenderTemplate(): string {
        const labelHtml = this.ShowLabel ? `
            <label class="label">
                <span class="label-text">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    Theme
                </span>
            </label>
        ` : ''

        const optionsHtml = this.Themes.map(theme => 
            `<option value="${theme}" ${theme === this.CurrentTheme ? 'selected' : ''}>${theme.charAt(0).toUpperCase() + theme.slice(1)}</option>`
        ).join('')

        return `
            <div class="form-control w-full">
                ${labelHtml}
                <select class="select select-bordered select-sm w-full">
                    ${optionsHtml}
                </select>
            </div>
        `
    }
}
