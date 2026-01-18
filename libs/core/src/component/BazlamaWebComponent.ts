/*
    Bazlama Web Component Project
    Base Web Component for Bazlama Web Component
    2024-7-21
    Version 1.0
    muratbudun@gmail.com
*/

import EventActionMap from "../event-action/EventActionMap";
import type { TEventActionMethod } from "../event-action/TEventActionMethod";
import type { IEventActionDefines } from "../event-action/types/IEventActionDefines";
import type { IEventActionMaps } from "../event-action/types/IEventActionMaps";
import { bazlamaWarn } from "../helper/BazlamaError";
import { clearSelectorCache } from "../helper/SelectorCache";
import type { IBazlamaWebComponentStatic } from "./IBazlamaWebComponentStatic";
import type { IPropertyChangeHandlers } from "../property/types/IPropertyChangeHandlers";
import type { IPropertyDefines } from "../property/types/IPropertyDefines";
import type { IPropertyValues } from "../property/types/IPropertyValues";
import PropertyDefine from "../property/PropertyDefine";
import type {
  TPropertyValueType,
  TPropertyValueTypeName,
} from "../property/types/TPropertyValueType";
import { ShadowRootMode } from "./ShadowRootMode";

/**
 * Base class for creating web components with Bazlama framework.
 * Extends HTMLElement and provides property management, event handling, and lifecycle hooks.
 *
 * @example
 * ```typescript
 * @CustomElement('my-component')
 * class MyComponent extends BazlamaWebComponent {
 *   @Property({ defaultValue: 'Hello' })
 *   @Attribute('message', true)
 *   message: string = 'Hello'
 *
 *   getRenderTemplate(): string {
 *     return `<div>${this.message}</div>`
 *   }
 * }
 * ```
 */
export default class BazlamaWebComponent extends HTMLElement {
  /** Indicates whether the component is connected to the DOM */
  public isDomConnected = false;

  /** Indicates whether the component has been rendered */
  public isRendered = false;

  /** Stores the current values of all defined properties */
  public propertyValues: IPropertyValues = {};

  /** Map of event action configurations */
  public eventActionMaps: IEventActionMaps = {};

  /** The root element for rendering (shadow root or the element itself) */
  public root: ShadowRoot | HTMLElement | null = null;

  /** If true, the component will not render automatically */
  public isNoRenderedComponent = false;

  /** Stores cleanup functions for event listeners to prevent memory leaks */
  private _eventCleanupFunctions: (() => void)[] = [];

  /**
   * Creates a new BazlamaWebComponent instance.
   * @param shadowMode - The shadow DOM mode to use (Open, Closed, or None)
   */
  constructor(shadowMode: ShadowRootMode = ShadowRootMode.Closed) {
    super();

    this.style.display = "block";
    this.root = this;

    if (shadowMode === ShadowRootMode.Open) {
      this.attachShadow({ mode: "open" });
      this.root = this.shadowRoot || this;
    }

    if (shadowMode === ShadowRootMode.Closed) {
      this.root = this.attachShadow({ mode: "closed" }) || this;
    }
  }

  /**
   * Renders the component by setting innerHTML and applying property hooks.
   * Called automatically when component connects to DOM.
   * Can be called manually to re-render the component.
   */
  render(): void {
    if (this.isNoRenderedComponent) return;

    // Clear selector cache before re-render since DOM will change
    clearSelectorCache(this);

    const htmlTemplate = this.beforeRender(this.getRenderTemplate());

    if (this.root) {
      this.root.innerHTML = htmlTemplate;
    }

    this.isRendered = true;

    this.ApplyAllPropertyChangeHooks();
    this.CreateHtmlElementEventActions();

    this.afterRender();
  }

  /**
   * Initializes the Bazlama web component.
   * Sets up properties and event action mappings.
   * Called internally during component setup.
   */
  public InitBazlamaWebComponent(): void {
    this.InitProperties();

    const eventActionMaps = this.createEventActionMaps();
    if (eventActionMaps && Array.isArray(eventActionMaps) && eventActionMaps.length > 0) {
      eventActionMaps.forEach((eventAction) => {
        this.eventActionMaps[eventAction.name] = eventAction;
      });
    }

    this.InitEventActionDecorators();
  }

  //#region Initialize Properties ...
  /**
   * Initializes all defined properties for this component.
   * Sets up getters/setters and applies default values.
   */
  public InitProperties(): void {
    const constructor = this.getConstructor();
    if (constructor.PropertyDefinesIsNullOrEmpty) return;

    for (const key in constructor.PropertyDefines) {
      if (Object.prototype.hasOwnProperty.call(constructor.PropertyDefines, key)) {
        const prop = constructor.PropertyDefines[key];
        if (prop instanceof PropertyDefine) {
          this.InitProperty(prop);
        }
      }
    }
  }

  /**
   * Initializes a single property with getter/setter and default value.
   * @param propertyDefine - The property definition to initialize
   */
  public InitProperty(propertyDefine: PropertyDefine) {
    let defaultValue = propertyDefine.defaultValue;

    if (Object.keys(this).includes(propertyDefine.name)) {
      defaultValue = this[propertyDefine.name as keyof BazlamaWebComponent] as TPropertyValueType;
      propertyDefine.valueTypeName = (typeof defaultValue as TPropertyValueTypeName) || "string";
      propertyDefine.defaultValue = defaultValue;
    }

    this.propertyValues[propertyDefine.name] = defaultValue;

    Object.defineProperty(this, propertyDefine.name, {
      get() {
        return this.propertyValues[propertyDefine.name];
      },

      set(value: TPropertyValueType) {
        const prop = this.getConstructor().GetPropertyDefine(propertyDefine.name);
        prop!.setValue(this, value);
      },
    });
  }

  /**
   * Applies all property change hooks with current values.
   * Called after render to sync UI with property values.
   */
  public ApplyAllPropertyChangeHooks(): void {
    const constructor = this.getConstructor();
    if (constructor.PropertyDefinesIsNullOrEmpty) return;

    for (const key in constructor.PropertyDefines) {
      if (Object.prototype.hasOwnProperty.call(constructor.PropertyDefines, key)) {
        const prop = constructor.PropertyDefines[key];
        if (prop instanceof PropertyDefine) {
          const value = prop.getValue(this);
          prop.changeHooks.forEach((event) => event(this, value, prop, value));
        }
      }
    }
  }

  /**
   * Gets the current value of a property by name.
   * @param propertyName - The name of the property to get
   * @returns The current property value
   */
  public GetPropertyValue(propertyName: string): TPropertyValueType {
    return this.propertyValues[propertyName];
  }

  /**
   * Sets the value of a property by name.
   * @param propertyName - The name of the property to set
   * @param value - The new value to assign
   */
  public SetPropertyValue(propertyName: string, value: TPropertyValueType): void {
    const prop = this.getConstructor().GetPropertyDefine(propertyName);
    if (prop) {
      prop.setValue(this, value);
    }
  }
  //#endregion

  //#region Event Actions ...
  /**
   * Initializes event action decorators defined on this component.
   * Creates EventActionMap instances for each decorated method.
   */
  public InitEventActionDecorators(): void {
    const constructor = this.getConstructor();
    if (constructor.EventActionDefines) {
      for (const key in constructor.EventActionDefines) {
        if (Object.prototype.hasOwnProperty.call(constructor.EventActionDefines, key)) {
          const eventActionDefine = constructor.EventActionDefines[key];

          const eventMethod = (this as unknown as Record<string, TEventActionMethod>)[
            eventActionDefine.actionMethodName
          ];

          if (!eventMethod) {
            bazlamaWarn(`Event method not found: ${eventActionDefine.actionMethodName}`, {
              componentName: this.constructor.name,
              methodName: eventActionDefine.actionMethodName,
            });
            continue;
          }

          // Bind the method to this component instance
          const boundMethod = eventMethod.bind(this);

          const eventAction = new EventActionMap(
            eventActionDefine.name,
            eventActionDefine.elQuery,
            eventActionDefine.eventName,
            boundMethod
          );

          this.eventActionMaps[eventActionDefine.name] = eventAction;
        }
      }
    }
  }

  /**
   * Creates event listeners for all event action mappings.
   * Attaches listeners to elements matching the query selectors.
   */
  public CreateHtmlElementEventActions(): void {
    for (const key in this.eventActionMaps) {
      if (Object.prototype.hasOwnProperty.call(this.eventActionMaps, key)) {
        const eventAction = this.eventActionMaps[key];
        eventAction.CreateElementEvent(this);
      }
    }
  }
  //#endregion

  //#region Static ...
  /** @internal */
  private static getStaticStorage(): IBazlamaWebComponentStatic {
    return this as unknown as IBazlamaWebComponentStatic;
  }

  static get isPropertyDefineInitialized(): boolean {
    const storage = this.getStaticStorage();
    if (storage._isPropertyDefineInitialized === undefined) {
      storage._isPropertyDefineInitialized = false;
    }
    return storage._isPropertyDefineInitialized;
  }

  static set isPropertyDefineInitialized(value: boolean) {
    this.getStaticStorage()._isPropertyDefineInitialized = value;
  }

  /** Map of all property definitions for this component class */
  static get PropertyDefines(): IPropertyDefines {
    const storage = this.getStaticStorage();
    if (storage._PropertyDefines === undefined) {
      storage._PropertyDefines = {};
    }
    return storage._PropertyDefines;
  }

  /** Map of all event action definitions for this component class */
  static get EventActionDefines(): IEventActionDefines {
    const storage = this.getStaticStorage();
    if (storage._EventActionDefines === undefined) {
      storage._EventActionDefines = {};
    }
    return storage._EventActionDefines;
  }

  /** Map of property change handlers for this component class */
  static get PropertyChangeHandlers(): IPropertyChangeHandlers {
    const storage = this.getStaticStorage();
    if (storage._PropertyChangeHandlers === undefined) {
      storage._PropertyChangeHandlers = {};
    }
    return storage._PropertyChangeHandlers;
  }

  /**
   * Initializes property definitions from CreatePropertyDefines and CreatePropertyHooks.
   * Called automatically when observedAttributes is accessed.
   * @internal
   */
  static InitPropertyDefines(): void {
    const propertyDefines = this.CreatePropertyDefines();
    const createPropertyHooks = this.CreatePropertyHooks();

    if (propertyDefines && Array.isArray(propertyDefines) && propertyDefines.length > 0) {
      propertyDefines.forEach((prop) => {
        if (this.HasPropertyDefine(prop.name)) {
          this.PropertyDefines[prop.name].isAttribute = prop.isAttribute;
          this.PropertyDefines[prop.name].attributeName = prop.attributeName;
          this.PropertyDefines[prop.name].isAttributeObserved = prop.isAttributeObserved;
          this.PropertyDefines[prop.name].changeHooks = [
            ...this.PropertyDefines[prop.name].changeHooks,
            ...prop.changeHooks,
          ];
        } else {
          this.PropertyDefines[prop.name] = prop;
        }
      });
    }

    if (createPropertyHooks) {
      for (const key in this.PropertyDefines) {
        if (Object.prototype.hasOwnProperty.call(this.PropertyDefines, key)) {
          const prop = this.PropertyDefines[key];
          if (createPropertyHooks[prop.name]) {
            prop.changeHooks = [...prop.changeHooks, ...createPropertyHooks[prop.name]];
          }
        }
      }
    }
  }

  /**
   * Override this method to define properties programmatically.
   * @returns Array of PropertyDefine instances
   * @example
   * ```typescript
   * static CreatePropertyDefines(): PropertyDefine[] {
   *   return [
   *     new PropertyBuilder('count', 'number').setDefaultValue(0).build()
   *   ]
   * }
   * ```
   */
  static CreatePropertyDefines(): PropertyDefine[] {
    return [];
  }

  /**
   * Override this method to define property change hooks programmatically.
   * @returns Object mapping property names to arrays of change hooks
   */
  static CreatePropertyHooks(): IPropertyChangeHandlers {
    return {};
  }

  /** Returns true if no property definitions exist for this component */
  static get PropertyDefinesIsNullOrEmpty(): boolean {
    return !this.PropertyDefines || Object.keys(this.PropertyDefines).length === 0;
  }

  /**
   * Checks if a property definition exists.
   * @param propertyName - The property name to check
   * @param isOnlyAttribute - If true, only returns true for attribute properties
   * @returns True if the property definition exists
   */
  static HasPropertyDefine(propertyName: string, isOnlyAttribute = false): boolean {
    if (this.PropertyDefinesIsNullOrEmpty) return false;
    const _isOnlyAttribute = isOnlyAttribute === true;

    const prop = this.PropertyDefines[propertyName];
    if (!prop) return false;
    if (!_isOnlyAttribute) return true;

    return prop.isAttribute;
  }

  /**
   * Gets a property definition by name.
   * @param propertyName - The property name to get
   * @param isOnlyAttribute - If true, only returns attribute properties
   * @returns The PropertyDefine or null if not found
   */
  static GetPropertyDefine(propertyName: string, isOnlyAttribute = false): PropertyDefine | null {
    if (this.PropertyDefinesIsNullOrEmpty) return null;
    const _isOnlyAttribute = isOnlyAttribute === true;
    const prop = this.PropertyDefines[propertyName];
    if (!prop) return null;
    if (!_isOnlyAttribute) return prop;
    if (prop.isAttribute) return prop;

    return null;
  }

  /**
   * Gets a property definition by its HTML attribute name.
   * @param attributeName - The HTML attribute name to search for
   * @returns The PropertyDefine or null if not found
   */
  static GetPropertyDefineByAttributeName(attributeName: string): PropertyDefine | null {
    if (this.PropertyDefinesIsNullOrEmpty) return null;

    for (const key in this.PropertyDefines) {
      if (Object.prototype.hasOwnProperty.call(this.PropertyDefines, key)) {
        const prop = this.PropertyDefines[key];
        if (prop.attributeName === attributeName) return prop;
      }
    }

    return null;
  }

  /**
   * Returns array of observed attribute names for this component.
   * Used by the browser to determine which attributes trigger attributeChangedCallback.
   */
  static get observedAttributes(): string[] {
    if (this.isPropertyDefineInitialized === false) {
      this.InitPropertyDefines();
      this.isPropertyDefineInitialized = true;
    }

    if (this.PropertyDefinesIsNullOrEmpty) return [];
    const attributes = Object.values(this.PropertyDefines)
      .filter((prop) => prop.isAttribute)
      .map((prop) => prop.attributeName);
    return attributes;
  }

  /**
   * Gets the constructor of this component with proper typing.
   * @returns The constructor function
   */
  getConstructor(): typeof BazlamaWebComponent {
    return this.constructor as typeof BazlamaWebComponent;
  }
  //#endregion

  //#region Callbacks ...
  /**
   * Called when an observed attribute changes.
   * @param name - The attribute name
   * @param oldValue - The previous value
   * @param newValue - The new value
   */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;

    const prop = this.getConstructor().GetPropertyDefineByAttributeName(name);
    if (!prop) return;

    prop.setDirectValue(this, newValue ?? "");
  }

  /**
   * Called when the component is added to the DOM.
   * Initializes the component and triggers initial render.
   */
  connectedCallback(): void {
    this.isDomConnected = true;
    this.isRendered = false;
    this.InitBazlamaWebComponent();
    this.onConnected();
    this.render();
  }

  /**
   * Called when the component is removed from the DOM.
   * Cleans up event listeners to prevent memory leaks.
   */
  disconnectedCallback(): void {
    this.cleanupEventListeners();
    this.isDomConnected = false;
    this.isRendered = false;
    this.onDisconnected();
  }

  /**
   * Removes all event listeners registered by this component.
   * Called automatically in disconnectedCallback to prevent memory leaks.
   */
  public cleanupEventListeners(): void {
    this._eventCleanupFunctions.forEach((cleanup) => cleanup());
    this._eventCleanupFunctions = [];
  }

  /**
   * Registers a cleanup function that will be called when component is disconnected.
   * Use this to register any cleanup logic for event listeners or subscriptions.
   */
  public registerCleanup(cleanupFn: () => void): void {
    this._eventCleanupFunctions.push(cleanupFn);
  }
  //#endregion

  //#region Virtual Methods ...
  /**
   * Called when the component is connected to the DOM.
   * Override this method to perform initialization logic.
   */
  onConnected(): void {}

  /**
   * Called when the component is disconnected from the DOM.
   * Override this method to perform cleanup logic.
   */
  onDisconnected(): void {}

  /**
   * Returns the HTML template for this component.
   * Override this method to define the component's markup.
   * @returns The HTML template string
   * @example
   * ```typescript
   * getRenderTemplate(): string {
   *   return `<div class="container">${this.title}</div>`
   * }
   * ```
   */
  getRenderTemplate(): string {
    return `<span>Not implemented.</span>`;
  }

  /**
   * Called before rendering. Can be used to transform the template.
   * @param htmlTemplate - The template from getRenderTemplate
   * @returns The (optionally modified) template to render
   */
  beforeRender(htmlTemplate: string): string {
    return htmlTemplate;
  }

  /**
   * Called after rendering is complete.
   * Override this method to perform post-render logic.
   */
  afterRender(): void {}

  /**
   * Override to create event action mappings programmatically.
   * @returns Array of EventActionMap instances
   */
  createEventActionMaps(): EventActionMap[] {
    return [];
  }
  //#endregion
}
