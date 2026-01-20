import { BasePage } from "../../baz-ui/baz-router/classes/BasePage"

/**
 * Products list page
 */
export class ProductsListPage extends BasePage {
    render(): string {
        const products = [
            { id: 1, name: "Product Alpha", colors: ["red", "blue"] },
            { id: 2, name: "Product Beta", colors: ["green", "yellow"] },
            { id: 3, name: "Product Gamma", colors: ["purple", "orange"] },
            { id: 12, name: "Product Delta", colors: ["red", "green", "blue"] },
            { id: 42, name: "Product Omega", colors: ["blue", "yellow"] }
        ]

        return `
            <div class="max-w-4xl mx-auto">
                <div class="mb-8">
                    <h1 class="text-4xl font-bold mb-2">Products Catalog</h1>
                    <p class="text-base-content/70">Browse our product collection</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${products.map(product => `
                        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                            <div class="card-body">
                                <h2 class="card-title">${product.name}</h2>
                                <p class="text-sm text-base-content/70">ID: ${product.id}</p>
                                
                                <div class="flex gap-1 my-2">
                                    ${product.colors.map(color => `
                                        <div class="badge badge-outline">${color}</div>
                                    `).join("")}
                                </div>
                                
                                <div class="card-actions justify-end">
                                    <a href="baz-router:/products/${product.id}" class="btn btn-primary btn-sm">
                                        View Details
                                    </a>
                                    ${product.colors.map(color => `
                                        <a href="baz-router:/products/${product.id}?color=${color}" 
                                           class="btn btn-outline btn-sm">
                                            ${color}
                                        </a>
                                    `).join("")}
                                </div>
                            </div>
                        </div>
                    `).join("")}
                </div>

                <div class="alert alert-info mt-8">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                        <h3 class="font-bold">URL Parameters Demo</h3>
                        <div class="text-sm">
                            Click any product to see path params (<code>:id</code>) 
                            and query params (<code>?color=...</code>) in action!
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    init(): void {
        console.log("ProductsListPage initialized")
    }
}
