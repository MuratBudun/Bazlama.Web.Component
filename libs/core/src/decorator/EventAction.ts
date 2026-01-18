import BazlamaWebComponent from "../component/BazlamaWebComponent";
import { BazlamaDecoratorError } from "../helper/BazlamaError";
import type { TEventActionDefine } from "../event-action/TEventActionDefine";

/**
 * Decorator that binds a method to DOM events on elements matching a query.
 * The decorated method will be called when the specified event occurs.
 *
 * @param elQuery - CSS selector to match elements within the component
 * @param eventName - The DOM event name to listen for
 * @returns A method decorator function
 *
 * @example
 * ```typescript
 * class MyComponent extends BazlamaWebComponent {
 *   @EventAction('.btn', 'click')
 *   handleClick(name: string, element: HTMLElement, eventName: string, event: Event) {
 *     console.log('Button clicked!')
 *   }
 * }
 * ```
 */
export default function EventAction(elQuery: string, eventName: keyof HTMLElementEventMap) {
  return function (target: BazlamaWebComponent, propertyName: string) {
    if (!(target instanceof BazlamaWebComponent)) {
      throw new BazlamaDecoratorError(`Target is not BazlamaWebComponent`, {
        decoratorName: "EventAction",
        propertyName,
        additionalInfo: { eventName },
      });
    }
    const bazComponent = target as BazlamaWebComponent;

    const eventActionDefine: TEventActionDefine = {
      name: propertyName,
      elQuery: elQuery,
      eventName: eventName,
      actionMethodName: propertyName,
    };

    const constructor = bazComponent.getConstructor();
    constructor.EventActionDefines[propertyName] = eventActionDefine;
  };
}
