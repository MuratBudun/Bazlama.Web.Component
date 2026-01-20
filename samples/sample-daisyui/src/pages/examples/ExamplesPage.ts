import { BasePage } from "../../baz-ui/baz-router/classes/BasePage"
import examplesHtml from "./examples.htm?raw"

/**
 * Examples page demonstrating router params and query usage
 */
export class ExamplesPage extends BasePage {
    render(): string {
        return examplesHtml
    }

    init(): void {
        // Tab switching functionality
        this.querySelectorAll<HTMLButtonElement>('.tabs button[data-example]').forEach(button => {
            button.addEventListener('click', () => {
                const exampleType = button.dataset.example
                this.showExample(exampleType!)
            })
        })

        console.log('Examples page initialized')
    }

    private showExample(type: string): void {
        // Hide all examples
        this.querySelectorAll<HTMLElement>('.example-content').forEach(el => {
            el.classList.add('hidden')
        })

        // Show selected example
        this.querySelector<HTMLElement>(`#example-${type}`)?.classList.remove('hidden')

        // Update tab active state
        this.querySelectorAll<HTMLButtonElement>('.tabs button').forEach(tab => {
            tab.classList.remove('tab-active')
        })
        this.querySelector<HTMLButtonElement>(`.tabs button[data-example="${type}"]`)?.classList.add('tab-active')
    }

    destroy(): void {
        console.log('Examples page destroyed')
    }
}
