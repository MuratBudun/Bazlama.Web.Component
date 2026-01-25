import {
  Attribute,
  BazlamaWebComponent,
  ChangeHooks,
  CustomElement,
  FireEvent,
  ShadowRootMode,
  useElementAttribute,
  useElementInputValue,
  useElementText,
} from "bazlama-web-component";
import type { TPropertyChangeHook } from "bazlama-web-component";
import htmlTemplate from "./template.htm";

type TColor =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";
type TSize = "xs" | "sm" | "md" | "lg";

/**
 * Button configuration for BazInput action buttons
 */
export interface IBazInputButton {
  /** Button name/identifier */
  name: string;
  /** Icon name (for baz-icon) */
  icon: string;
  /** Tooltip/description */
  description?: string;
  /** Button color style */
  color?: TColor | "ghost";
  /** Click handler */
  onClick?: (event: MouseEvent) => void;
}

/**
 * Size mapping from input size to button size
 * Input size is one level above button size
 */
const sizeMap: Record<TSize, string> = {
  lg: "md",
  md: "sm",
  sm: "xs",
  xs: "xs",
};

/**
 * Hook to update size classes on input elements
 * Applies input-{size} to both wrapper and input element
 */
const useSizeChange: TPropertyChangeHook = (component, value, _prop, oldValue) => {
  const inputBorder = component.root?.querySelector("[ref='input-border']") as HTMLElement;
  const inputElement = component.root?.querySelector("[ref='input']") as HTMLInputElement;

  // Remove old size class
  if (oldValue && oldValue !== value) {
    inputBorder?.classList.remove(`input-${oldValue}`);
    inputElement?.classList.remove(`input-${oldValue}`);
  }

  // Add new size class
  if (value) {
    inputBorder?.classList.add(`input-${value}`);
    inputElement?.classList.add(`input-${value}`);
  }

  // Re-render buttons with new size
  if (component instanceof BazInput) {
    component.renderButtons();
  }
};

/**
 * Hook to update color classes on input border
 * Applies input-{color} class (except for neutral)
 */
const useColorChange: TPropertyChangeHook = (component, value, _prop, oldValue) => {
  const inputBorder = component.root?.querySelector("[ref='input-border']") as HTMLElement;
  if (!inputBorder) return;

  // Remove old color class
  if (oldValue && oldValue !== "neutral" && oldValue !== value) {
    inputBorder.classList.remove(`input-${oldValue}`);
  }

  // Add new color class (except neutral - it's the default)
  if (value && value !== "neutral") {
    inputBorder.classList.add(`input-${value}`);
  }
};

/**
 * BazInput - DaisyUI styled input component with prefix, suffix and action buttons
 *
 * This component provides a unified input group using fieldset structure:
 * - Label (legend)
 * - Description text
 * - Optional prefix text (e.g., "https://", "$", "@")
 * - Optional suffix text (e.g., ".com", "kg", "%")
 * - Action buttons with configuration
 * - Help text
 * - Full DaisyUI theme support
 *
 * @example
 * ```html
 * <baz-input
 *   label="Website URL"
 *   description="Enter your website address"
 *   prefix="https://"
 *   placeholder="example.com"
 *   help-text="URL will be validated"
 *   color="primary"
 *   size="lg">
 * </baz-input>
 * ```
 *
 * @fires value - Emitted when input value changes
 */
@CustomElement("baz-input")
export class BazInput extends BazlamaWebComponent {
  @FireEvent()
  @ChangeHooks([useElementInputValue("input")])
  @Attribute("value", true)
  public value = "";

  @ChangeHooks([useElementAttribute("input", "placeholder")])
  @Attribute("placeholder", true)
  public placeholder = "Type here...";

  @ChangeHooks([useColorChange])
  @Attribute("color", true)
  public color: TColor = "neutral";

  @ChangeHooks([useSizeChange])
  @Attribute("size", true)
  public size: TSize = "md";

  @ChangeHooks([useElementText("[ref='label']")])
  @Attribute("label", true)
  public label = "";

  @ChangeHooks([useElementText("[ref='description']")])
  @Attribute("description", true)
  public description = "";

  @ChangeHooks([useElementText("[ref='prefix']")])
  @Attribute("prefix", true)
  public prefix = "";

  @ChangeHooks([useElementText("[ref='suffix']")])
  @Attribute("suffix", true)
  public suffix = "";

  @ChangeHooks([useElementText("[ref='help-text']")])
  @Attribute("help-text", true)
  public helpText = "";

  @Attribute("disabled", false)
  public disabled = false;

  @Attribute("readonly", false)
  public readonly = false;

  @Attribute("type", true)
  public type = "text";

  /** Button configurations */
  private _buttons: IBazInputButton[] = [];

  constructor() {
    super(ShadowRootMode.None);
    this.InitBazlamaWebComponent();
  }

  /**
   * Set action buttons programmatically
   */
  public setButtons(buttons: IBazInputButton[]): void {
    this._buttons = buttons;
    this.renderButtons();
  }

  /**
   * Get current button configurations
   */
  public getButtons(): IBazInputButton[] {
    return [...this._buttons];
  }

  /**
   * Add a single button
   */
  public addButton(button: IBazInputButton): void {
    this._buttons.push(button);
    this.renderButtons();
  }

  /**
   * Remove a button by name
   */
  public removeButton(name: string): void {
    this._buttons = this._buttons.filter((b) => b.name !== name);
    this.renderButtons();
  }

  getRenderTemplate(): string {
    return htmlTemplate;
  }

  public renderButtons(): void {
    const buttonContainer = this.root?.querySelector("div[ref='button-container']") as HTMLElement;
    if (!buttonContainer) return;

    // Clear existing buttons
    buttonContainer.innerHTML = "";

    // Get button size based on input size
    const btnSize = sizeMap[this.size] || "sm";

    // Render each button
    this._buttons.forEach((btn) => {
      const buttonEl = document.createElement("button");
      buttonEl.type = "button";
      buttonEl.dataset.name = btn.name;

      // Determine button class
      const colorClass =
        btn.color === "ghost" ? "btn-ghost border-0" : `btn-${btn.color || "primary"}`;
      buttonEl.className = `btn ${colorClass} btn-${btnSize}`;

      // Add tooltip if description exists
      if (btn.description) {
        buttonEl.title = btn.description;
      }

      // Create icon
      const iconEl = document.createElement("baz-icon");
      iconEl.setAttribute("icon", btn.icon);
      buttonEl.appendChild(iconEl);

      // Add click handler
      if (btn.onClick) {
        buttonEl.addEventListener("click", btn.onClick);
      }

      buttonContainer.appendChild(buttonEl);
    });

    // Show/hide container
    buttonContainer.classList.toggle("hidden", this._buttons.length === 0);
  }

  afterRender(): void {
    const inputElement = this.root?.querySelector("[ref='input']") as HTMLInputElement;
    const inputBorder = this.root?.querySelector("[ref='input-border']") as HTMLElement;
    const prefixContainer = this.root?.querySelector("[ref='prefix-container']") as HTMLElement;
    const suffixContainer = this.root?.querySelector("[ref='suffix-container']") as HTMLElement;
    const labelElement = this.root?.querySelector("[ref='label']") as HTMLElement;
    const descriptionElement = this.root?.querySelector("[ref='description']") as HTMLElement;
    const helpTextElement = this.root?.querySelector("[ref='help-text']") as HTMLElement;
    const buttonContainer = this.root?.querySelector("div[ref='button-container']") as HTMLElement;

    // Apply size to input border (wrapper label)
    if (this.size && inputBorder) {
      inputBorder.classList.add(`input-${this.size}`);
    }

    // Apply size to inner input element (same as input border)
    if (this.size && inputElement) {
      inputElement.classList.add(`input-${this.size}`);
    }

    // Apply color to input border
    if (this.color && this.color !== "neutral" && inputBorder) {
      inputBorder.classList.add(`input-${this.color}`);
    }

    // Apply disabled state
    if (this.disabled && inputElement) {
      inputElement.disabled = true;
      inputBorder?.classList.add("input-disabled");
    }

    // Apply readonly state
    if (this.readonly && inputElement) {
      inputElement.readOnly = true;
    }

    // Set input type
    if (inputElement) {
      inputElement.type = this.type;
    }

    // Show/hide prefix
    if (this.prefix && prefixContainer) {
      prefixContainer.classList.remove("hidden");
    }

    // Show/hide suffix
    if (this.suffix && suffixContainer) {
      suffixContainer.classList.remove("hidden");
    }

    // Show/hide label
    if (this.label && labelElement) {
      labelElement.classList.remove("hidden");
    }

    // Show/hide description
    if (this.description && descriptionElement) {
      descriptionElement.classList.remove("hidden");
    }

    // Show/hide help text
    if (this.helpText && helpTextElement) {
      helpTextElement.classList.remove("hidden");
    }

    // Initial button container state
    if (buttonContainer && this._buttons.length === 0) {
      buttonContainer.classList.add("hidden");
    }

    // Render buttons (buttons use one size smaller)
    this.renderButtons();
  }
}

export default BazInput;
