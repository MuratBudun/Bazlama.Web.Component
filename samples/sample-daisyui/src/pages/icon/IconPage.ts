import { BasePage } from "../../baz-ui/baz-router/classes/BasePage"
import iconHtml from "./icon.htm?raw"

export class IconPage extends BasePage {
    render(): string {
        return iconHtml
    }

    init(): void {
        const tabButtons = this.querySelectorAll<HTMLButtonElement>('.tabs button[data-category]')
        if (tabButtons.length === 0) return

        console.log('Icon page initialized:', tabButtons.length, 'tabs found')

        // Category tab handlers
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.category
                if (!category) return

                // Hide all categories
                this.querySelectorAll('.icon-category').forEach(el => el.classList.add('hidden'))

                // Show selected category
                const targetCategory = this.querySelector(`#category-${category}`)
                if (targetCategory) {
                    targetCategory.classList.remove('hidden')
                }

                // Update tab active state
                this.querySelectorAll('.tabs button').forEach(tab => tab.classList.remove('tab-active'))
                button.classList.add('tab-active')
            })
        })

        // Add click handlers to copy icon names
        const iconItems = this.querySelectorAll<HTMLElement>('.icon-item')
        iconItems.forEach(item => {
            item.addEventListener('click', () => {
                const iconName = item.dataset.icon
                if (!iconName) return

                navigator.clipboard.writeText(iconName).then(() => {
                    this.showToast(`Copied: ${iconName}`, 'success')
                })
            })
        })
    }

    destroy(): void {
        console.log('Icon page destroyed')
    }
}
