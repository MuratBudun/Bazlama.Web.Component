import { BasePage } from "../../baz-ui/baz-router/classes/BasePage"

/**
 * Textbox component demo page
 */
export class TextboxPage extends BasePage {
    render(): string {
        return `
            <div class="max-w-6xl mx-auto">
                <div class="mb-8">
                    <h1 class="text-4xl font-bold mb-2">Textbox Component</h1>
                    <p class="text-base-content/70">DaisyUI styled input component with labels and actions</p>
                </div>

                <!-- Basic Usage -->
                <div class="card bg-base-100 shadow-xl mb-6">
                    <div class="card-body">
                        <h2 class="card-title">Basic Usage</h2>
                        <div class="space-y-4">
                            <baz-textbox 
                                label="Username" 
                                placeholder="Enter your username"
                                value="">
                            </baz-textbox>

                            <baz-textbox 
                                label="Email" 
                                placeholder="name@example.com"
                                type="email">
                            </baz-textbox>

                            <baz-textbox 
                                label="Password" 
                                placeholder="Enter password"
                                type="password">
                            </baz-textbox>
                        </div>
                    </div>
                </div>

                <!-- With Labels -->
                <div class="card bg-base-100 shadow-xl mb-6">
                    <div class="card-body">
                        <h2 class="card-title">With Helper Text</h2>
                        <div class="space-y-4">
                            <baz-textbox 
                                label="Full Name" 
                                placeholder="John Doe"
                                label-alt-left="Your display name">
                            </baz-textbox>

                            <baz-textbox 
                                label="Website" 
                                placeholder="https://example.com"
                                label-alt-right="Optional">
                            </baz-textbox>

                            <baz-textbox 
                                label="Bio" 
                                placeholder="Tell us about yourself"
                                label-alt-left="Maximum 160 characters"
                                label-alt-right="0/160">
                            </baz-textbox>
                        </div>
                    </div>
                </div>

                <!-- Colors -->
                <div class="card bg-base-100 shadow-xl mb-6">
                    <div class="card-body">
                        <h2 class="card-title">Colors</h2>
                        <div class="space-y-4">
                            <baz-textbox 
                                label="Primary" 
                                placeholder="Primary input"
                                color="primary">
                            </baz-textbox>

                            <baz-textbox 
                                label="Secondary" 
                                placeholder="Secondary input"
                                color="secondary">
                            </baz-textbox>

                            <baz-textbox 
                                label="Accent" 
                                placeholder="Accent input"
                                color="accent">
                            </baz-textbox>

                            <baz-textbox 
                                label="Success" 
                                placeholder="Success input"
                                color="success"
                                label-alt-left="✓ Looks good!">
                            </baz-textbox>

                            <baz-textbox 
                                label="Warning" 
                                placeholder="Warning input"
                                color="warning"
                                label-alt-left="⚠ Check this field">
                            </baz-textbox>

                            <baz-textbox 
                                label="Error" 
                                placeholder="Error input"
                                color="error"
                                label-alt-left="✗ Invalid input">
                            </baz-textbox>
                        </div>
                    </div>
                </div>

                <!-- Sizes -->
                <div class="card bg-base-100 shadow-xl mb-6">
                    <div class="card-body">
                        <h2 class="card-title">Sizes</h2>
                        <div class="space-y-4">
                            <baz-textbox 
                                label="Extra Small (xs)" 
                                placeholder="xs input"
                                size="xs">
                            </baz-textbox>

                            <baz-textbox 
                                label="Small (sm)" 
                                placeholder="sm input"
                                size="sm">
                            </baz-textbox>

                            <baz-textbox 
                                label="Medium (md)" 
                                placeholder="md input (default)"
                                size="md">
                            </baz-textbox>

                            <baz-textbox 
                                label="Large (lg)" 
                                placeholder="lg input"
                                size="lg">
                            </baz-textbox>
                        </div>
                    </div>
                </div>

                <!-- With Action Buttons -->
                <div class="card bg-base-100 shadow-xl mb-6">
                    <div class="card-body">
                        <h2 class="card-title">With Action Buttons</h2>
                        <p class="text-sm text-base-content/70 mb-4">Buttons appear on hover/focus</p>
                        <div class="space-y-4">
                            <baz-textbox 
                                id="search-input"
                                label="Search" 
                                placeholder="Search..."
                                value="Example text">
                                <button class="btn btn-ghost btn-xs" data-action="clear">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </baz-textbox>

                            <baz-textbox 
                                id="copy-input"
                                label="API Key" 
                                placeholder="Your API key"
                                value="sk_test_123456789abcdef"
                                type="password">
                                <button class="btn btn-ghost btn-xs" data-action="copy">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                                <button class="btn btn-ghost btn-xs" data-action="toggle-visibility">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                            </baz-textbox>
                        </div>
                    </div>
                </div>

                <!-- Code Example -->
                <div class="card bg-base-200">
                    <div class="card-body">
                        <h2 class="card-title">Usage Example</h2>
                        <div class="mockup-code">
                            <pre><code>&lt;baz-textbox 
  label="Username" 
  placeholder="Enter username"
  color="primary"
  size="md"
  label-alt-left="Your display name"&gt;
  &lt;button class="btn btn-ghost btn-xs"&gt;
    Clear
  &lt;/button&gt;
&lt;/baz-textbox&gt;</code></pre>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    init(): void {
        console.log("TextboxPage initialized")

        // Clear button handler
        const clearBtn = this.querySelector('[data-action="clear"]')
        clearBtn?.addEventListener("click", () => {
            const textbox = document.getElementById("search-input") as any
            if (textbox) {
                textbox.value = ""
            }
        })

        // Copy button handler
        const copyBtn = this.querySelector('[data-action="copy"]')
        copyBtn?.addEventListener("click", () => {
            const textbox = document.getElementById("copy-input") as any
            if (textbox?.value) {
                navigator.clipboard.writeText(textbox.value).then(() => {
                    alert("Copied to clipboard!")
                })
            }
        })

        // Toggle visibility handler
        const toggleBtn = this.querySelector('[data-action="toggle-visibility"]')
        toggleBtn?.addEventListener("click", () => {
            const textbox = document.getElementById("copy-input") as any
            const input = textbox?.querySelector("input")
            if (input) {
                input.type = input.type === "password" ? "text" : "password"
            }
        })
    }
}
