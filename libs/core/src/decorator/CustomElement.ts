/**
 * Decorator that registers a class as a custom HTML element.
 *
 * @param tagName - The HTML tag name for the custom element (must contain a hyphen)
 * @returns A class decorator function
 *
 * @example
 * ```typescript
 * @CustomElement('my-button')
 * class MyButton extends BazlamaWebComponent {
 *   // ...
 * }
 * ```
 */
export default function CustomElement(tagName: string) {
  return function (target: CustomElementConstructor) {
    customElements.define(tagName, target);
  };
}
