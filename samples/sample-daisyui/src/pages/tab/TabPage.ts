import { BasePage } from "../../baz-ui/baz-router/classes/BasePage"
import tabHtml from "./tab.htm?raw"

export class TabPage extends BasePage {
    private demoCounter: number = 1

    render(): string {
        return tabHtml
    }

    init(): void {
        // Make functions globally available for onclick handlers
        (window as any).addDemoTab = () => this.addDemoTab();
        (window as any).updateDemoTab = () => this.updateDemoTab();
        (window as any).addCodeTab = () => this.addCodeTab();
        (window as any).showTabInfo = () => this.showTabInfo();
        (window as any).showExample = (type: string) => this.showExample(type);

        console.log('Tab page initialized')
    }

    private addDemoTab(): void {
        const tabs = this.querySelector('#demoTabs') as any
        const iconNames = ['rocket', 'zap', 'star', 'heart', 'gift']
        const randomIcon = iconNames[Math.floor(Math.random() * iconNames.length)]
        
        tabs.addTab(
            `demo-${this.demoCounter}`, 
            `Demo ${this.demoCounter}`, 
            `
            <div class="p-6">
                <div class="flex items-center gap-4 mb-4">
                    <div class="avatar placeholder">
                        <div class="bg-primary text-primary-content rounded-full w-16">
                            <span class="text-2xl">${this.demoCounter}</span>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold">Dynamic Tab ${this.demoCounter}</h3>
                        <p class="text-sm opacity-70">Created at ${new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
                <div class="stats shadow bg-base-300">
                    <div class="stat">
                        <div class="stat-title">Tab Number</div>
                        <div class="stat-value">${this.demoCounter}</div>
                        <div class="stat-desc">Dynamically generated</div>
                    </div>
                </div>
            </div>
        `, randomIcon, true)
        this.demoCounter++
    }

    private updateDemoTab(): void {
        const tabs = this.querySelector('#demoTabs') as any
        tabs.updateTab('overview', 'Updated Overview', `
            <div class="p-6">
                <div class="alert alert-success">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                        <h3 class="font-bold">Content Updated!</h3>
                        <div class="text-sm">Last update: ${new Date().toLocaleTimeString()}</div>
                    </div>
                </div>
                <div class="mt-4">
                    <p>This content was dynamically updated using the <code class="badge badge-sm">updateTab()</code> method.</p>
                </div>
            </div>
        `, 'check')
    }

    private addCodeTab(): void {
        const tabs = this.querySelector('#demoTabs') as any
        tabs.addTab('dynamic-code', 'Code Example', `
            <div class="p-6">
                <h3 class="text-lg font-bold mb-3">Dynamic Code Example</h3>
                <div class="mockup-code">
                    <pre data-prefix="1"><code>function addNewTab() {</code></pre>
                    <pre data-prefix="2"><code>  const tabs = document.querySelector('baz-tab');</code></pre>
                    <pre data-prefix="3"><code>  tabs.addTab('new', 'New Tab', '&lt;p&gt;Content&lt;/p&gt;');</code></pre>
                    <pre data-prefix="4"><code>}</code></pre>
                </div>
            </div>
        `, 'code', true)
    }

    private showTabInfo(): void {
        const tabs = this.querySelector('#demoTabs') as any
        const count = tabs.getTabCount()
        const activeTab = tabs.ActiveTabId
        
        alert(`Tab Information:\n\nTotal Tabs: ${count}\nActive Tab: ${activeTab}\n\nYou can inspect the component using browser DevTools!`)
    }

    private showExample(type: string): void {
        this.querySelectorAll<HTMLElement>('.example-content').forEach(el => el.classList.add('hidden'))
        this.querySelector<HTMLElement>(`#example-${type}`)?.classList.remove('hidden')
        
        this.querySelectorAll<HTMLButtonElement>('.tabs button').forEach(tab => tab.classList.remove('tab-active'))
        const target = (window.event as any)?.target
        target?.closest('button')?.classList.add('tab-active')
    }

    destroy(): void {
        // Cleanup global functions
        delete (window as any).addDemoTab;
        delete (window as any).updateDemoTab;
        delete (window as any).addCodeTab;
        delete (window as any).showTabInfo;
        delete (window as any).showExample;
        
        console.log('Tab page destroyed')
    }
}
