import { BasePage } from "../../baz-ui/baz-router/classes/BasePage"

/**
 * Example page demonstrating URL parameters and query strings
 * 
 * Route: /products/:id
 * Example URLs:
 * - /products/12
 * - /products/12?color=red&size=large
 * - /products/42?color=blue
 */
export class ProductsPage extends BasePage {
    private productId: string;
    private color: string;
    private size: string;

    constructor(
        container: HTMLElement,
        params: Record<string, string> = {},
        query: Record<string, string> = {}
    ) {
        super(container, params, query);
        this.productId = params.id || "unknown";
        this.color = query.color || "default";
        this.size = query.size || "medium";
    }

    render(): string {
        return `
            <div class="max-w-4xl mx-auto">
                <!-- Page Header -->
                <div class="mb-8">
                    <h1 class="text-4xl font-bold mb-2">Product Details</h1>
                    <div class="text-sm breadcrumbs">
                        <ul>
                            <li><a href="baz-router:/">Home</a></li>
                            <li><a href="baz-router:/products">Products</a></li>
                            <li>Product #${this.productId}</li>
                        </ul>
                    </div>
                </div>

                <!-- Product Card -->
                <div class="card bg-base-100 shadow-xl mb-8">
                    <div class="card-body">
                        <h2 class="card-title text-2xl">Product #${this.productId}</h2>
                        
                        <!-- Product Info -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                            <div class="stat bg-base-200 rounded-lg">
                                <div class="stat-title">Product ID</div>
                                <div class="stat-value text-primary">${this.productId}</div>
                            </div>
                            <div class="stat bg-base-200 rounded-lg">
                                <div class="stat-title">Color</div>
                                <div class="stat-value text-secondary">${this.color}</div>
                            </div>
                            <div class="stat bg-base-200 rounded-lg">
                                <div class="stat-title">Size</div>
                                <div class="stat-value">${this.size}</div>
                            </div>
                        </div>

                        <!-- URL Parameters Display -->
                        <div class="divider">URL Information</div>
                        
                        <div class="overflow-x-auto">
                            <table class="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Key</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Object.entries(this.params).map(([key, value]) => `
                                        <tr>
                                            <td><span class="badge badge-primary">Path Param</span></td>
                                            <td><code>${key}</code></td>
                                            <td><strong>${value}</strong></td>
                                        </tr>
                                    `).join("")}
                                    ${Object.entries(this.query).map(([key, value]) => `
                                        <tr>
                                            <td><span class="badge badge-secondary">Query Param</span></td>
                                            <td><code>${key}</code></td>
                                            <td><strong>${value}</strong></td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        </div>

                        <!-- Current URL Display -->
                        <div class="alert alert-info mt-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <div class="font-bold">Current URL</div>
                                <div class="text-xs"><code>${window.location.pathname}${window.location.search}</code></div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="card-actions justify-end mt-4">
                            <button class="btn btn-primary" data-action="change-color">
                                Try Different Color
                            </button>
                            <button class="btn btn-secondary" data-action="change-product">
                                View Another Product
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Examples Section -->
                <div class="card bg-base-200">
                    <div class="card-body">
                        <h3 class="card-title">Try These Examples</h3>
                        <div class="space-y-2">
                            <a href="baz-router:/products/1" class="btn btn-outline btn-sm btn-block justify-start">
                                Product 1 (no query)
                            </a>
                            <a href="baz-router:/products/2?color=red" class="btn btn-outline btn-sm btn-block justify-start">
                                Product 2 (red color)
                            </a>
                            <a href="baz-router:/products/3?color=blue&size=large" class="btn btn-outline btn-sm btn-block justify-start">
                                Product 3 (blue, large)
                            </a>
                            <a href="baz-router:/products/42?color=green&size=small" class="btn btn-outline btn-sm btn-block justify-start">
                                Product 42 (green, small)
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    init(): void {
        console.log("ProductsPage initialized", {
            params: this.params,
            query: this.query
        })

        // Action handlers using event delegation
        this.addDelegatedListener('click', '[data-action]', (e) => {
            const action = (e.target as HTMLElement).getAttribute('data-action');
            
            if (action === 'change-color') {
                const colors = ["red", "blue", "green", "yellow", "purple", "orange"];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                const newUrl = `/products/${this.productId}?color=${randomColor}&size=${this.size}`;
                
                if (window.BazPageRouter) {
                    window.BazPageRouter.navigate(newUrl);
                }
            } else if (action === 'change-product') {
                const randomId = Math.floor(Math.random() * 100) + 1;
                const newUrl = `/products/${randomId}?color=${this.color}&size=${this.size}`;
                
                if (window.BazPageRouter) {
                    window.BazPageRouter.navigate(newUrl);
                }
            }
        });
    }
}
