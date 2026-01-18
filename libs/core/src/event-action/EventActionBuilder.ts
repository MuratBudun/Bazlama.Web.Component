import EventActionMap from "./EventActionMap";
import type { TEventActionMethod } from "./TEventActionMethod";

/**
 * Fluent builder for creating EventActionMap instances.
 * Provides a chainable API for configuring event action mappings.
 *
 * @example
 * ```typescript
 * const action = new EventActionBuilder('click-handler', '.button', 'click')
 *   .setActionMethod((name, element, eventName, event) => {
 *     console.log('Clicked!')
 *   })
 *   .build()
 * ```
 */
export default class EventActionBuilder {
  private name: string;
  private elQuery = "";
  private eventName: keyof HTMLElementEventMap = "click";
  public actionMethod: TEventActionMethod = () => {};

  /**
   * Creates a new EventActionBuilder.
   * @param name - Unique identifier for this event action
   * @param elQuery - Optional CSS selector for target elements
   * @param eventName - Optional event name (default: 'click')
   */
  constructor(name: string, elQuery?: string, eventName?: keyof HTMLElementEventMap) {
    this.name = name;
    this.elQuery = elQuery || "";
    this.eventName = eventName || "click";
    return this;
  }

  /**
   * Sets the CSS selector for target elements.
   * @param elQuery - CSS selector string
   * @returns This builder for chaining
   */
  public setElQuery(elQuery: string): EventActionBuilder {
    this.elQuery = elQuery;
    return this;
  }

  /**
   * Sets the DOM event name to listen for.
   * @param eventName - Event name (e.g., 'click', 'input', 'change')
   * @returns This builder for chaining
   */
  public setEventName(eventName: keyof HTMLElementEventMap): EventActionBuilder {
    this.eventName = eventName;
    return this;
  }

  /**
   * Sets the handler method to execute when event fires.
   * @param actionMethod - The event handler function
   * @returns This builder for chaining
   */
  public setActionMethod(actionMethod: TEventActionMethod): EventActionBuilder {
    this.actionMethod = actionMethod;
    return this;
  }

  /**
   * Builds and returns the EventActionMap instance.
   * @returns A new EventActionMap with the configured options
   */
  public build(): EventActionMap {
    return new EventActionMap(this.name, this.elQuery, this.eventName, this.actionMethod);
  }
}
