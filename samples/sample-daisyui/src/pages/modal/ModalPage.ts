import { BasePage } from "../../baz-ui/baz-router/classes/BasePage"
import BazModal from "../../baz-ui/baz-modal/baz-modal"

/**
 * Modal component demo page
 */
export class ModalPage extends BasePage {
    render(): string {
        return `
            <div class="max-w-6xl mx-auto">
                <div class="mb-8">
                    <h1 class="text-4xl font-bold mb-2">Modal Component</h1>
                    <p class="text-base-content/70">DaisyUI styled modal dialog component</p>
                </div>

                <!-- Basic Modal -->
                <div class="card bg-base-100 shadow-xl mb-6">
                    <div class="card-body">
                        <h2 class="card-title">Basic Modal</h2>
                        <p class="text-sm text-base-content/70 mb-4">Simple modal with content and actions</p>
                        
                        <button class="btn btn-primary" data-action="show-basic">
                            Open Basic Modal
                        </button>

                        <baz-modal id="basic-modal" title="Welcome!">
                            <p class="py-4">This is a basic modal with some content.</p>
                            <p class="text-sm text-base-content/70">You can click outside to close it.</p>
                            <div slot="actions">
                                <button class="btn" data-modal-close>Close</button>
                                <button class="btn btn-primary" data-modal-ok>OK</button>
                            </div>
                        </baz-modal>
                    </div>
                </div>

                <!-- Modal Sizes -->
                <div class="card bg-base-100 shadow-xl mb-6">
                    <div class="card-body">
                        <h2 class="card-title">Modal Sizes</h2>
                        <div class="flex flex-wrap gap-2">
                            <button class="btn btn-sm btn-outline" data-action="show-size-sm">
                                Small Modal
                            </button>
                            <button class="btn btn-sm btn-outline" data-action="show-size-md">
                                Medium Modal (Default)
                            </button>
                            <button class="btn btn-sm btn-outline" data-action="show-size-lg">
                                Large Modal
                            </button>
                            <button class="btn btn-sm btn-outline" data-action="show-size-full">
                                Full Screen Modal
                            </button>
                        </div>

                        <baz-modal id="modal-sm" title="Small Modal" size="sm">
                            <p>This is a small modal.</p>
                            <div slot="actions">
                                <button class="btn btn-sm" data-modal-close>Close</button>
                            </div>
                        </baz-modal>

                        <baz-modal id="modal-md" title="Medium Modal" size="md">
                            <p>This is a medium modal (default size).</p>
                            <p class="mt-2">It has a comfortable width for most content.</p>
                            <div slot="actions">
                                <button class="btn btn-sm" data-modal-close>Close</button>
                            </div>
                        </baz-modal>

                        <baz-modal id="modal-lg" title="Large Modal" size="lg">
                            <p>This is a large modal.</p>
                            <p class="mt-2">Perfect for displaying more content, forms, or detailed information.</p>
                            <div slot="actions">
                                <button class="btn btn-sm" data-modal-close>Close</button>
                            </div>
                        </baz-modal>

                        <baz-modal id="modal-full" title="Full Screen Modal" size="full">
                            <p>This modal takes up the full screen.</p>
                            <p class="mt-2">Ideal for immersive experiences or complex forms.</p>
                            <div slot="actions">
                                <button class="btn btn-sm" data-modal-close>Close</button>
                            </div>
                        </baz-modal>
                    </div>
                </div>

                <!-- Modal Positions -->
                <div class="card bg-base-100 shadow-xl mb-6">
                    <div class="card-body">
                        <h2 class="card-title">Modal Positions</h2>
                        <div class="flex flex-wrap gap-2">
                            <button class="btn btn-sm btn-outline" data-action="show-position-top">
                                Top Position
                            </button>
                            <button class="btn btn-sm btn-outline" data-action="show-position-middle">
                                Middle Position (Default)
                            </button>
                            <button class="btn btn-sm btn-outline" data-action="show-position-bottom">
                                Bottom Position
                            </button>
                        </div>

                        <baz-modal id="modal-top" title="Top Modal" position="top">
                            <p>This modal appears at the top of the screen.</p>
                            <div slot="actions">
                                <button class="btn btn-sm" data-modal-close>Close</button>
                            </div>
                        </baz-modal>

                        <baz-modal id="modal-middle" title="Middle Modal" position="middle">
                            <p>This modal appears in the middle (default).</p>
                            <div slot="actions">
                                <button class="btn btn-sm" data-modal-close>Close</button>
                            </div>
                        </baz-modal>

                        <baz-modal id="modal-bottom" title="Bottom Modal" position="bottom">
                            <p>This modal appears at the bottom.</p>
                            <div slot="actions">
                                <button class="btn btn-sm" data-modal-close>Close</button>
                            </div>
                        </baz-modal>
                    </div>
                </div>

                <!-- Static Methods -->
                <div class="card bg-base-100 shadow-xl mb-6">
                    <div class="card-body">
                        <h2 class="card-title">Static Methods</h2>
                        <p class="text-sm text-base-content/70 mb-4">Programmatic modals using static methods</p>
                        
                        <div class="flex flex-wrap gap-2">
                            <button class="btn btn-info" data-action="alert">
                                Show Alert
                            </button>
                            <button class="btn btn-warning" data-action="confirm">
                                Show Confirm
                            </button>
                        </div>

                        <div class="alert alert-info mt-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <div class="font-bold">Static Methods</div>
                                <div class="text-xs">These modals are created programmatically and removed after closing.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Rich Content -->
                <div class="card bg-base-100 shadow-xl mb-6">
                    <div class="card-body">
                        <h2 class="card-title">Rich Content Modal</h2>
                        
                        <button class="btn btn-success" data-action="show-rich">
                            Open Rich Modal
                        </button>

                        <baz-modal id="modal-rich" title="Product Details" size="lg">
                            <div class="space-y-4">
                                <div class="flex gap-4">
                                    <div class="avatar">
                                        <div class="w-24 rounded-xl bg-base-300 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-bold text-lg">Premium Product</h3>
                                        <p class="text-sm text-base-content/70">SKU: PRD-12345</p>
                                        <div class="badge badge-primary mt-2">In Stock</div>
                                    </div>
                                </div>

                                <div class="divider"></div>

                                <div class="stats shadow w-full">
                                    <div class="stat">
                                        <div class="stat-title">Price</div>
                                        <div class="stat-value text-primary">$99</div>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-title">Rating</div>
                                        <div class="stat-value text-secondary">4.8</div>
                                    </div>
                                </div>

                                <p class="text-sm">
                                    This is a premium product with excellent features and quality.
                                    It comes with a 1-year warranty and free shipping.
                                </p>
                            </div>
                            <div slot="actions">
                                <button class="btn" data-modal-close>Cancel</button>
                                <button class="btn btn-primary">Add to Cart</button>
                            </div>
                        </baz-modal>
                    </div>
                </div>

                <!-- Code Example -->
                <div class="card bg-base-200">
                    <div class="card-body">
                        <h2 class="card-title">Usage Examples</h2>
                        
                        <div class="tabs tabs-boxed mb-4">
                            <a class="tab tab-active" data-tab="html">HTML</a>
                            <a class="tab" data-tab="js">JavaScript</a>
                        </div>

                        <div class="mockup-code" data-content="html">
                            <pre><code>&lt;baz-modal id="my-modal" title="Hello" size="md"&gt;
  &lt;p&gt;Modal content here&lt;/p&gt;
  &lt;div slot="actions"&gt;
    &lt;button class="btn"&gt;Close&lt;/button&gt;
  &lt;/div&gt;
&lt;/baz-modal&gt;

&lt;button onclick="document.getElementById('my-modal').showModal()"&gt;
  Open Modal
&lt;/button&gt;</code></pre>
                        </div>

                        <div class="mockup-code hidden" data-content="js">
                            <pre><code>// Alert
await BazModal.alert('Success', 'Operation completed!')

// Confirm
const confirmed = await BazModal.confirm(
  'Delete Item',
  'Are you sure?'
)

if (confirmed) {
  console.log('User confirmed')
}</code></pre>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    init(): void {
        console.log("ModalPage initialized")

        // Modal action handlers using event delegation
        this.addDelegatedListener('click', '[data-action]', async (e) => {
            const action = (e.target as HTMLElement).getAttribute('data-action');
            
            // Handle special actions
            if (action === 'alert') {
                await BazModal.alert(
                    "Information",
                    "This is a simple alert modal created with BazModal.alert()"
                );
                console.log("Alert closed");
                return;
            }
            
            if (action === 'confirm') {
                const confirmed = await BazModal.confirm(
                    "Confirm Action",
                    "Do you want to proceed with this action?",
                    "Yes, proceed",
                    "Cancel"
                );
                
                if (confirmed) {
                    await BazModal.alert("Success", "Action confirmed!");
                } else {
                    await BazModal.alert("Cancelled", "Action was cancelled.");
                }
                return;
            }
            
            // Handle show modal actions
            const modalId = action?.replace('show-', '');
            if (modalId) {
                (document.getElementById(modalId) as any)?.showModal();
            }
        });

        // Close buttons
        this.addDelegatedListener('click', '[data-modal-close]', (e) => {
            const modal = (e.target as HTMLElement).closest('baz-modal') as any;
            modal?.close();
        });

        // OK buttons
        this.addDelegatedListener('click', '[data-modal-ok]', (e) => {
            const modal = (e.target as HTMLElement).closest('baz-modal') as any;
            modal?.close();
            alert("OK clicked!");
        });

        // Tab switching
        this.addDelegatedListener('click', '[data-tab]', (e) => {
            const tab = e.target as HTMLElement;
            const tabName = tab.getAttribute('data-tab');
            
            // Update active tab
            this.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('tab-active'));
            tab.classList.add('tab-active');
            
            // Show corresponding content
            this.querySelectorAll('[data-content]').forEach(content => {
                if (content.getAttribute('data-content') === tabName) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    }
}
