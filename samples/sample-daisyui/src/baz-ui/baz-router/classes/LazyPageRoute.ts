import type { TGetPageContentFunc } from "../types/TGetPageContentFunc";
import type { TLazyPageLoader, LazyPageModule } from "../types/TLazyPageLoader";
import PageRoute from "./PageRoute";
import type { BasePage } from "./BasePage";

/**
 * Lazy-loaded route that dynamically imports page class only when needed.
 * Supports code splitting and reduces initial bundle size for enterprise applications.
 *
 * @example
 * ```typescript
 * // Basic lazy route
 * const dashboardRoute = new LazyPageRoute(
 *     "Dashboard",
 *     "dashboard",
 *     () => import("./pages/DashboardPage")
 * );
 *
 * // With preloading on hover
 * const reportsRoute = new LazyPageRoute(
 *     "Reports",
 *     "reports",
 *     () => import("./pages/ReportsPage"),
 *     { preload: true }
 * );
 *
 * // With loading fallback
 * const analyticsRoute = new LazyPageRoute(
 *     "Analytics",
 *     "analytics",
 *     () => import("./pages/AnalyticsPage"),
 *     {
 *         preload: true,
 *         loadingContent: () => '<div class="loading loading-spinner loading-lg"></div>'
 *     }
 * );
 * ```
 */
export class LazyPageRoute extends PageRoute {
  private loader: TLazyPageLoader;
  private loadedModule: LazyPageModule | null = null;
  private loadingPromise: Promise<LazyPageModule> | null = null;
  private preload: boolean;
  private loadingContent?: TGetPageContentFunc;

  /**
   * Creates a new lazy-loaded route
   * @param title - Display title for the route
   * @param path - Path segment (without leading slash except for root "/")
   * @param loader - Function that returns a dynamic import Promise
   * @param options - Configuration options
   * @param options.preload - Whether to preload the module on hover (default: false)
   * @param options.loadingContent - Optional loading state content while module loads
   * @param children - Array of child routes (optional)
   */
  constructor(
    title: string,
    path: string,
    loader: TLazyPageLoader,
    options?: {
      preload?: boolean;
      loadingContent?: TGetPageContentFunc;
    },
    children: PageRoute[] = []
  ) {
    // Pass a placeholder function as content
    super(title, path, () => "", children);
    this.loader = loader;
    this.preload = options?.preload ?? false;
    this.loadingContent = options?.loadingContent;
  }

  /**
   * Loads the page module if not already loaded
   * @returns Promise resolving to the loaded module
   */
  public async load(): Promise<LazyPageModule> {
    // Return cached module if already loaded
    if (this.loadedModule) {
      return this.loadedModule;
    }

    // Return in-progress loading promise if currently loading
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start loading
    this.loadingPromise = this.loader()
      .then((module) => {
        this.loadedModule = module;
        this.loadingPromise = null;
        return module;
      })
      .catch((error) => {
        this.loadingPromise = null;
        console.error(`Failed to load page module for route "${this.path}":`, error);
        throw error;
      });

    return this.loadingPromise;
  }

  /**
   * Preloads the page module without rendering
   * Useful for prefetching on hover or during idle time
   */
  public preloadModule(): void {
    if (!this.loadedModule && !this.loadingPromise) {
      this.load().catch(() => {
        // Silently fail on preload errors
      });
    }
  }

  /**
   * Checks if the module is currently loaded
   */
  public isLoaded(): boolean {
    return this.loadedModule !== null;
  }

  /**
   * Checks if the module is currently loading
   */
  public isLoading(): boolean {
    return this.loadingPromise !== null;
  }

  /**
   * Gets the loaded Page Class constructor
   * @throws Error if module is not yet loaded
   */
  public getPageClass(): typeof BasePage {
    if (!this.loadedModule) {
      throw new Error(`Page module for route "${this.path}" is not loaded yet`);
    }
    return this.loadedModule.default;
  }

  /**
   * Gets whether this route should preload on hover
   */
  public shouldPreload(): boolean {
    return this.preload;
  }

  /**
   * Gets the loading state content function
   */
  public getLoadingContent(): TGetPageContentFunc | undefined {
    return this.loadingContent;
  }

  /**
   * Type guard to check if a route is a LazyPageRoute
   */
  public static isLazyRoute(route: PageRoute): route is LazyPageRoute {
    return route instanceof LazyPageRoute;
  }
}
