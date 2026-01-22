import { BasePage } from "../../baz-ui/baz-router/classes/BasePage"
import { iconCategories, allIcons } from "../../baz-ui/baz-icon/icon-libs"

export class IconPage extends BasePage {
    render(): string {
        const totalIcons = Object.keys(allIcons).length
        
        return `
<div class="p-6">
    <div class="prose max-w-none mb-6">
        <h1 class="text-4xl font-bold mb-2">Icon Library</h1>
        <p class="text-base-content/70">Browse and use icons from the Bazlama icon library</p>
        
        <div class="stats shadow my-6">
            <div class="stat">
                <div class="stat-figure text-primary">
                    <baz-icon icon="icons" size="32"></baz-icon>
                </div>
                <div class="stat-title">Total Icons</div>
                <div class="stat-value text-primary">${totalIcons}</div>
                <div class="stat-desc">Across ${iconCategories.length} categories</div>
            </div>
            
            <div class="stat">
                <div class="stat-figure text-secondary">
                    <baz-icon icon="package" size="32"></baz-icon>
                </div>
                <div class="stat-title">Categories</div>
                <div class="stat-value text-secondary">${iconCategories.length}</div>
                <div class="stat-desc">Organized collections</div>
            </div>
        </div>
    </div>

    <!-- Category Tabs -->
    <div class="tabs tabs-boxed mb-6">
        ${iconCategories.map((category, index) => `
            <button class="tab ${index === 0 ? 'tab-active' : ''}" data-category="${category.name}">
                ${category.title}
            </button>
        `).join('')}
    </div>

    <!-- Icon Categories -->
    ${iconCategories.map((category, index) => `
        <div id="category-${category.name}" class="icon-category ${index !== 0 ? 'hidden' : ''}">
            <div class="mb-4">
                <h2 class="text-2xl font-semibold">${category.title}</h2>
                <p class="text-base-content/70">${category.description}</p>
                <div class="badge badge-accent mt-2">${Object.keys(category.icons).length} icons</div>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                ${Object.keys(category.icons).map(iconName => `
                    <div class="icon-item card bg-base-200 hover:bg-base-300 cursor-pointer transition-all hover:scale-105" data-icon="${iconName}">
                        <div class="card-body items-center text-center p-4">
                            <baz-icon icon="${iconName}" size="32"></baz-icon>
                            <p class="text-xs mt-2 truncate w-full" title="${iconName}">${iconName}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('')}
</div>
        `
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
