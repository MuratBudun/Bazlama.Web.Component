import type BazlamaWebComponent from "../component/BazlamaWebComponent";
import type { TEventActionMethod } from "./TEventActionMethod";

/**
 * Maps DOM events to action methods.
 * Handles event listener setup and cleanup for web components.
 *
 * @example
 * ```typescript
 * const map = new EventActionMap(
 *   'handleClick',
 *   'button.submit',
 *   'click',
 *   (name, el, eventName, event) => console.log('Clicked!')
 * )
 * map.CreateElementEvent(component)
 * ```
 */
export default class EventActionMap {
  /** Unique name for this event action mapping */
  public name: string;
  /** CSS selector to find target elements */
  public elQuery: string;
  /** DOM event type to listen for */
  public eventName: keyof HTMLElementEventMap;
  /** Method to call when event fires */
  public actionMethod: TEventActionMethod;

  /**
   * Creates a new event action mapping.
   * @param name - Unique identifier for this mapping
   * @param elQuery - CSS selector for target elements
   * @param eventName - DOM event type (e.g., 'click', 'input')
   * @param actionMethod - Handler function for the event
   */
  constructor(
    name: string,
    elQuery: string,
    eventName: keyof HTMLElementEventMap,
    actionMethod: TEventActionMethod
  ) {
    this.name = name;
    this.elQuery = elQuery;
    this.eventName = eventName;
    this.actionMethod = actionMethod;
  }

  /**
   * Sets up event listeners on matching elements.
   * Automatically registers cleanup to remove listeners on component disconnect.
   * @param bazComponent - The component instance to bind events to
   */
  public CreateElementEvent(bazComponent: BazlamaWebComponent): void {
    const elements = bazComponent.root?.querySelectorAll(this.elQuery);
    if (elements) {
      elements.forEach((element) => {
        const handler = (event: Event) => {
          this.actionMethod(this.name, element as HTMLElement, this.eventName, event);
        };

        element.addEventListener(this.eventName as string, handler);

        // Register cleanup function to remove event listener when component disconnects
        bazComponent.registerCleanup(() => {
          element.removeEventListener(this.eventName as string, handler);
        });
      });
    }
  }
}
