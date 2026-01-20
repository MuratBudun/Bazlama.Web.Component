import { 
    Attribute, 
    BazlamaWebComponent, 
    ChangeHooks, 
    CustomElement, 
    FireEvent,
    ShadowRootMode, 
    useElementText 
} from "bazlama-web-component"
import htmlTemplate from "./template.htm"

type TModalSize = "sm" | "md" | "lg" | "full"
type TModalPosition = "middle" | "bottom" | "top"

/**
 * BazModal - DaisyUI styled modal dialog component
 * 
 * @example
 * ```html
 * <baz-modal 
 *   id="my-modal" 
 *   title="Confirm Action"
 *   size="md"
 *   position="middle">
 *   <p>Are you sure you want to proceed?</p>
 *   <div slot="actions">
 *     <button class="btn">Cancel</button>
 *     <button class="btn btn-primary">Confirm</button>
 *   </div>
 * </baz-modal>
 * ```
 * 
 * @fires close - Emitted when modal is closed
 * @fires open - Emitted when modal is opened
 */
@CustomElement("baz-modal")
export default class BazModal extends BazlamaWebComponent {
    @ChangeHooks([useElementText("h3[ref='title']")])
    @Attribute("title", true)
    public title: string = "Modal"

    @Attribute("size", true)
    public size: TModalSize = "md"

    @Attribute("position", true)
    public position: TModalPosition = "middle"

    @Attribute("backdrop-closeable", false)
    public backdropCloseable: boolean = true

    @FireEvent()
    @Attribute("open", false)
    public isOpen: boolean = false

    private dialogEl: string = `dialog-${Math.random().toString(36).substr(2, 9)}`
    private contentSlot: HTMLElement[] = []
    private actionsSlot: HTMLElement[] = []

    constructor() {
        super(ShadowRootMode.None)
        this.InitBazlamaWebComponent()
        
        // Separate content and actions
        Array.from(this.children).forEach((child) => {
            if (child.getAttribute("slot") === "actions") {
                this.actionsSlot.push(child as HTMLElement)
            } else {
                this.contentSlot.push(child as HTMLElement)
            }
        })
    }

    afterRender(): void {
        const dialog = this.root?.querySelector("dialog") as HTMLDialogElement
        const modalBody = this.root?.querySelector("div[ref='modal-body']")
        const modalActions = this.root?.querySelector("div[ref='modal-actions']")

        // Insert content
        this.contentSlot.forEach((el) => {
            modalBody?.appendChild(el)
        })

        // Insert actions
        this.actionsSlot.forEach((el) => {
            modalActions?.appendChild(el)
        })

        // Apply size and position classes
        const modalBox = this.root?.querySelector("div[ref='modal-box']")
        if (modalBox) {
            if (this.size === "sm") modalBox.classList.add("max-w-sm")
            else if (this.size === "lg") modalBox.classList.add("max-w-3xl")
            else if (this.size === "full") modalBox.classList.add("max-w-full", "w-full", "h-full")
        }

        const modalContainer = this.root?.querySelector("dialog")
        if (modalContainer) {
            if (this.position === "bottom") modalContainer.classList.add("modal-bottom")
            else if (this.position === "top") modalContainer.classList.add("modal-top")
        }

        // Setup event listeners
        if (dialog) {
            dialog.addEventListener("close", () => {
                this.isOpen = false
                this.dispatchEvent(new CustomEvent("close"))
            })

            // Backdrop click handling
            if (this.backdropCloseable) {
                dialog.addEventListener("click", (e) => {
                    const rect = dialog.getBoundingClientRect()
                    const isInDialog = (
                        rect.top <= e.clientY &&
                        e.clientY <= rect.top + rect.height &&
                        rect.left <= e.clientX &&
                        e.clientX <= rect.left + rect.width
                    )
                    if (!isInDialog) {
                        dialog.close()
                    }
                })
            }
        }

        // Auto-open if attribute is set
        if (this.isOpen) {
            setTimeout(() => this.showModal(), 0)
        }
    }

    /**
     * Opens the modal
     */
    public showModal(): void {
        const dialog = this.root?.querySelector("dialog") as HTMLDialogElement
        if (dialog && !dialog.open) {
            dialog.showModal()
            this.isOpen = true
            this.dispatchEvent(new CustomEvent("open"))
        }
    }

    /**
     * Closes the modal
     */
    public close(): void {
        const dialog = this.root?.querySelector("dialog") as HTMLDialogElement
        if (dialog && dialog.open) {
            dialog.close()
        }
    }

    getRenderTemplate() {
        return htmlTemplate.replace(/{dialogEl}/g, this.dialogEl)
    }

    /**
     * Static method to show a simple alert modal
     * @param title - Modal title
     * @param message - Modal message
     * @param buttonText - Close button text (default: "OK")
     */
    static alert(title: string, message: string, buttonText: string = "OK"): Promise<void> {
        return new Promise((resolve) => {
            const modal: BazModal = document.createElement("baz-modal") as BazModal
            modal.title = title
            modal.innerHTML = `
                <p class="py-4">${message}</p>
                <div slot="actions">
                    <button class="btn btn-primary" data-modal-action="close">${buttonText}</button>
                </div>
            `
            document.body.appendChild(modal)
            
            modal.addEventListener("open", () => {
                const closeBtn = modal.querySelector('[data-modal-action="close"]')
                closeBtn?.addEventListener("click", () => {
                    modal.close()
                })
            })

            modal.addEventListener("close", () => {
                setTimeout(() => {
                    document.body.removeChild(modal)
                    resolve()
                }, 100)
            })

            modal.showModal()
        })
    }

    /**
     * Static method to show a confirmation modal
     * @param title - Modal title
     * @param message - Modal message
     * @param confirmText - Confirm button text (default: "Confirm")
     * @param cancelText - Cancel button text (default: "Cancel")
     */
    static confirm(
        title: string, 
        message: string, 
        confirmText: string = "Confirm",
        cancelText: string = "Cancel"
    ): Promise<boolean> {
        return new Promise((resolve) => {
            const modal: BazModal = document.createElement("baz-modal") as BazModal
            modal.title = title
            modal.backdropCloseable = false
            modal.innerHTML = `
                <p class="py-4">${message}</p>
                <div slot="actions" class="flex gap-2">
                    <button class="btn" data-modal-action="cancel">${cancelText}</button>
                    <button class="btn btn-primary" data-modal-action="confirm">${confirmText}</button>
                </div>
            `
            document.body.appendChild(modal)

            modal.addEventListener("open", () => {
                const confirmBtn = modal.querySelector('[data-modal-action="confirm"]')
                const cancelBtn = modal.querySelector('[data-modal-action="cancel"]')
                
                confirmBtn?.addEventListener("click", () => {
                    modal.close()
                    resolve(true)
                })

                cancelBtn?.addEventListener("click", () => {
                    modal.close()
                    resolve(false)
                })
            })

            modal.addEventListener("close", () => {
                setTimeout(() => {
                    document.body.removeChild(modal)
                }, 100)
            })

            modal.showModal()
        })
    }
}
