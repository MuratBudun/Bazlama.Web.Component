/*
    Bazlama Web Component Project
    Selector Cache Helper
    2024-8-1
    Version 1.0
    muratbudun@gmail.com
*/

import type BazlamaWebComponent from "../component/BazlamaWebComponent";

/**
 * Cache key generator for element lookups.
 * Uses WeakMap to avoid memory leaks when components are garbage collected.
 */
const elementCache = new WeakMap<BazlamaWebComponent, Map<string, Element[]>>();

/**
 * Gets elements matching a CSS selector, with caching for performance.
 * Results are cached per component to avoid repeated DOM queries.
 *
 * @param component - The BazlamaWebComponent to query within
 * @param selector - CSS selector string
 * @returns Array of matching elements (may be empty)
 *
 * @example
 * ```typescript
 * const elements = queryCached(component, '.my-class')
 * elements.forEach(el => el.textContent = 'Updated')
 * ```
 */
export function queryCached(component: BazlamaWebComponent, selector: string): Element[] {
  if (!component.root) return [];

  let componentCache = elementCache.get(component);
  if (!componentCache) {
    componentCache = new Map();
    elementCache.set(component, componentCache);
  }

  let elements = componentCache.get(selector);
  if (!elements) {
    elements = Array.from(component.root.querySelectorAll(selector));
    componentCache.set(selector, elements);
  }

  return elements;
}

/**
 * Clears the selector cache for a specific component.
 * Should be called when the component's DOM structure changes.
 *
 * @param component - The component to clear cache for
 *
 * @example
 * ```typescript
 * // After re-rendering
 * clearSelectorCache(this)
 * ```
 */
export function clearSelectorCache(component: BazlamaWebComponent): void {
  elementCache.delete(component);
}

/**
 * Clears a specific selector from a component's cache.
 * Useful when only part of the DOM has changed.
 *
 * @param component - The component to update
 * @param selector - The specific selector to invalidate
 */
export function invalidateSelector(component: BazlamaWebComponent, selector: string): void {
  const componentCache = elementCache.get(component);
  if (componentCache) {
    componentCache.delete(selector);
  }
}
