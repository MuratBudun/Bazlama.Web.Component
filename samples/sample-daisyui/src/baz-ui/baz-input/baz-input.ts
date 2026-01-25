import {
  Attribute,
  BazConvert,
  BazlamaWebComponent,
  ChangeHooks,
  CustomElement,
  FireEvent,
  ShadowRootMode,
  useCustomHook,
  useElementAttribute,
  useElementInputValue,
  useElementText,
  useSwitchClass,
  useToggleClass,
} from "bazlama-web-component";
import htmlTemplate from "./template.htm";
import "../baz-icon/baz-icon";
import BazIcon from "../baz-icon/baz-icon";

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

const sizeMapIcon: Record<TSize, string> = {
  lg: "24px",
  md: "20px",
  sm: "16px",
  xs: "12px",
};

/**
 * BazInput - DaisyUI styled input component with prefix, suffix and action buttons
 *
 * This component provides a unified input group using fieldset structure:
 * - Label (legend)
 * - Description text
 * - Optional prefix text (e.g., "https://", "$", "@")
 * - Optional suffix text (e.g., ".com", "kg", "%")
 * - Action buttons with configuration (JSON attribute or unregistered custom elements)
 * - Help text
 * - Full DaisyUI theme support
 *
 * @example Basic usage
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
 * @example With buttons (JSON attribute)
 * ```html
 * <baz-input
 *   label="Search"
 *   buttons='[{"name":"search","icon":"search","color":"primary"}]'>
 * </baz-input>
 * ```
 *
 * @example With buttons (unregistered custom elements)
 * ```html
 * <baz-input label="Search">
 *   <input-button name="clear" icon="x" color="ghost" description="Clear"></input-button>
 *   <input-button name="search" icon="search" color="primary"></input-button>
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
  public placeholder = "";

  @ChangeHooks([
    useSwitchClass("[ref='input-border']", "input-"),
  ])
  @Attribute("color", true)
  public color: TColor = "neutral";

  @ChangeHooks([
    useSwitchClass("[ref='input-border']", "input-"),
    useSwitchClass("[ref='input']", "input-"),
    useSwitchClass("[ref='prefix']", "text-"),
    useSwitchClass("[ref='suffix']", "text-"),
    useSwitchClass("[ref='button-container'] > button", "text-"),    
    useCustomHook("[ref='button-container'] > button", (target, value, _prop, oldValue) => {
      const oldSize = sizeMap[oldValue as TSize] || "sm";
      const newSize = sizeMap[value as TSize] || "sm";
      target.classList.remove(`btn-${oldSize}`);
      target.classList.add(`btn-${newSize}`);
      if (target.firstElementChild && target.firstElementChild instanceof BazIcon) {
        (target.firstElementChild as BazIcon).size = sizeMapIcon[value as TSize] || "16px";
      }
    }),
  ])
  @Attribute("size", true)
  public size: TSize = "md";

  @ChangeHooks([
    useToggleClass("[ref='prefix']", "font-mono", (value) => (value != null ? BazConvert.anyToBoolean(value) : false)),
    useToggleClass("[ref='suffix']", "font-mono", (value) => (value != null ? BazConvert.anyToBoolean(value) : false))
  ])
  @Attribute("use-mono-font-for-prefix-suffix", false)
  public useMonoFontForPrefixSuffix = false;
  
  @ChangeHooks([
    useElementText("[ref='label']"),
    useToggleClass("[ref='label']", "hidden", (value) => !value)
  ])
  @Attribute("label", true)
  public label = "";

  @ChangeHooks([
    useElementText("[ref='description']"),
    useToggleClass("[ref='description']", "hidden", (value) => !value)
  ])
  @Attribute("description", true)
  public description = "";

  @ChangeHooks([
    useElementText("[ref='prefix']"),
    useToggleClass("[ref='prefix-container']", "hidden", (value) => !value)
  ])
  @Attribute("prefix", true)
  public prefix = "";

  @ChangeHooks([
    useElementText("[ref='suffix']"),
    useToggleClass("[ref='suffix-container']", "hidden", (value) => !value)
  ])
  @Attribute("suffix", true)
  public suffix = "";

  @ChangeHooks([
    useElementText("[ref='help-text']"),
    useToggleClass("[ref='help-text']", "hidden", (value) => !value)
  ])
  @Attribute("help-text", true)
  public helpText = "";

  @Attribute("disabled", false)
  public disabled = false;

  @Attribute("readonly", false)
  public readonly = false;

  @ChangeHooks([
    useElementAttribute("input", "type"),
  ])
  @Attribute("type", true)
  public type = "text";

  @Attribute("buttons", true)
  private _buttonsJson = "";

  /** Button configurations */
  private _buttons: IBazInputButton[] = [];

  constructor() {
    super(ShadowRootMode.None);
    
    // Parse buttons BEFORE template renders (to preserve child elements)
    this.parseButtonsFromChildren();
    
    this.InitBazlamaWebComponent();
  }

  /**
   * Parse buttons from JSON attribute
   */
  private parseButtonsFromAttribute(): void {
    if (!this._buttonsJson) return;
    
    try {
      const parsed = JSON.parse(this._buttonsJson);
      if (Array.isArray(parsed)) {
        this._buttons = parsed;
      }
    } catch (error) {
      console.error('Failed to parse buttons attribute:', error);
    }
  }

  /**
   * Parse buttons from unregistered <input-button> child elements
   * Supports HTML declaration like:
   * <baz-input>
   *   <input-button name="clear" icon="x" color="ghost"></input-button>
   * </baz-input>
   */
  private parseButtonsFromChildren(): void {
    const buttonElements = this.querySelectorAll('input-button');
    
    if (buttonElements.length === 0) return;
    
    // Child buttons override JSON attribute
    this._buttons = Array.from(buttonElements).map(btn => {
      const result: IBazInputButton = {
        name: btn.getAttribute('name') || '',
        icon: btn.getAttribute('icon') || '',
        color: (btn.getAttribute('color') as TColor | 'ghost') || 'primary',
        description: btn.getAttribute('description') || undefined,
      };
      
      // Support onclick attribute
      const onclickAttr = btn.getAttribute('onclick');
      if (onclickAttr) {
        result.onClick = new Function('event', onclickAttr) as (event: MouseEvent) => void;
      }
      
      return result;
    });
    
    // Remove button elements from DOM (cleanup)
    buttonElements.forEach(btn => btn.remove());
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
      buttonEl.className = `btn btn-square ${colorClass} btn-${btnSize}`;

      // Add tooltip if description exists
      if (btn.description) {
        buttonEl.title = btn.description;
      }

      // Create icon programmatically
      const icon = new BazIcon();
      icon.icon = btn.icon;
      // Map button size to icon size
      icon.size = sizeMapIcon[this.size] || "16px";
      buttonEl.appendChild(icon);

      // Add click handler
      if (btn.onClick) {
        buttonEl.addEventListener("click", btn.onClick);
      }

      buttonContainer.appendChild(buttonEl);
    });

    // Show/hide container
    buttonContainer.classList.toggle("hidden", this._buttons.length === 0);
    if (!buttonContainer.classList.contains("hidden")) {
      buttonContainer.classList.add("pr-1");
    }
  }

  afterRender(): void {
    // Parse buttons from JSON attribute (if child buttons weren't already parsed)
    if (this._buttons.length === 0) {
      this.parseButtonsFromAttribute();
    }
    
    // Render buttons to DOM
    this.renderButtons();
  }
}

export default BazInput;
