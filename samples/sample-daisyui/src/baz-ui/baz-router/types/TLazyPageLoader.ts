import { BasePage } from "../classes/BasePage";

/**
 * Type for lazy-loaded page module
 */
export type LazyPageModule = {
  default: new (
    container: HTMLElement,
    params?: Record<string, string>,
    query?: Record<string, string>
  ) => BasePage;
};

/**
 * Type for lazy page loader function
 * Returns a Promise that resolves to a module with a default export (Page Class)
 */
export type TLazyPageLoader = () => Promise<LazyPageModule>;
