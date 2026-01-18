/**
 * Test utilities and setup for Bazlama Web Component tests
 */

/**
 * Creates a test fixture element and appends it to the document body
 * @param html - HTML string to create element from
 * @returns The created element
 */
export function createFixture<T extends HTMLElement>(html: string): T {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  const element = template.content.firstChild as T;
  document.body.appendChild(element);
  return element;
}

/**
 * Removes an element from the document body
 * @param element - Element to remove
 */
export function removeFixture(element: HTMLElement): void {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Waits for a custom element to be defined
 * @param tagName - The custom element tag name
 * @param _timeout - Maximum time to wait in ms (not used, kept for API compatibility)
 */
export async function waitForElement(tagName: string, _timeout = 1000): Promise<void> {
  await customElements.whenDefined(tagName);
}

/**
 * Waits for the next animation frame
 */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Waits for a specified number of milliseconds
 * @param ms - Milliseconds to wait
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clears all registered custom elements (for test isolation)
 * Note: Custom elements cannot be unregistered, so we track registered names
 */
const registeredElements = new Set<string>();

export function isElementRegistered(tagName: string): boolean {
  return registeredElements.has(tagName) || customElements.get(tagName) !== undefined;
}

export function markElementRegistered(tagName: string): void {
  registeredElements.add(tagName);
}

/**
 * Generates a unique tag name for testing
 * @param prefix - Prefix for the tag name
 */
export function uniqueTagName(prefix = "test"): string {
  const id = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${id}`;
}
