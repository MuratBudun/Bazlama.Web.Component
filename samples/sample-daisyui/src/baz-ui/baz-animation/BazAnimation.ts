/**
 * Animation pattern definition
 */
export interface IAnimationPattern {
  keyFrames: Keyframe[];
  options?: KeyframeAnimationOptions;
}

/**
 * Animation callback function type
 */
export type TAnimationCallback = () => void | Promise<void>;

/**
 * Animation library type
 */
export type IAnimationLibrary = Record<string, IAnimationPattern>;

/**
 * Animation configuration options
 */
export interface IAnimationConfig {
  /** Whether animations are enabled globally */
  enabled?: boolean;
  /** Global playback speed multiplier (1 = normal, 2 = 2x faster) */
  playbackSpeed?: number;
  /** Reduce motion for accessibility */
  reduceMotion?: boolean;
}

/**
 * BazAnimation - A powerful animation utility class for Web Animations API
 *
 * @example
 * ```typescript
 * // Basic usage
 * BazAnimation.animate(element, 'fadeIn')
 *
 * // With options
 * BazAnimation.animate(element, 'fadeIn', { duration: 500 })
 *
 * // With callback
 * BazAnimation.animate(element, 'fadeIn', {}, ['custom'], () => {
 *   console.log('Animation complete!')
 * })
 *
 * // Sequence animations
 * await BazAnimation.sequence(element, [
 *   { name: 'fadeIn', options: { duration: 300 } },
 *   { name: 'bounce', options: { duration: 500 } }
 * ])
 *
 * // Register custom animation
 * BazAnimation.registerAnimation('myAnimation', {
 *   keyFrames: [{ opacity: 0 }, { opacity: 1 }],
 *   options: { duration: 1000, easing: 'ease-out' }
 * })
 * ```
 */
export default class BazAnimation {
  /** Whether animations are enabled globally */
  public static isActivated = true;

  /** Global playback speed multiplier (1 = normal, 2 = 2x faster) */
  public static playbackSpeed = 1;

  /** Respect user's reduced motion preference */
  public static respectReducedMotion = true;

  /**
   * Standard animation library with common animations
   */
  public static animationLibraryStandard: IAnimationLibrary = {
    // Fade animations
    fadeIn: {
      keyFrames: [{ opacity: 0 }, { opacity: 1 }],
      options: { duration: 300, easing: "ease-out" },
    },
    fadeOut: {
      keyFrames: [{ opacity: 1 }, { opacity: 0 }],
      options: { duration: 300, easing: "ease-in" },
    },
    fadeInUp: {
      keyFrames: [
        { opacity: 0, transform: "translateY(20px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      options: { duration: 400, easing: "ease-out" },
    },
    fadeInDown: {
      keyFrames: [
        { opacity: 0, transform: "translateY(-20px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      options: { duration: 400, easing: "ease-out" },
    },

    // Slide animations
    slideInLeft: {
      keyFrames: [{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }],
      options: { duration: 400, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    },
    slideInRight: {
      keyFrames: [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }],
      options: { duration: 400, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    },
    slideOutLeft: {
      keyFrames: [{ transform: "translateX(0)" }, { transform: "translateX(-100%)" }],
      options: { duration: 400, easing: "cubic-bezier(0.4, 0, 0.6, 1)" },
    },
    slideOutRight: {
      keyFrames: [{ transform: "translateX(0)" }, { transform: "translateX(100%)" }],
      options: { duration: 400, easing: "cubic-bezier(0.4, 0, 0.6, 1)" },
    },

    // Scale animations
    zoomIn: {
      keyFrames: [
        { opacity: 0, transform: "scale(0.5)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      options: { duration: 300, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
    },
    zoomOut: {
      keyFrames: [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(0.5)" },
      ],
      options: { duration: 300, easing: "ease-in" },
    },

    // Bounce & Shake
    bounce: {
      keyFrames: [
        { transform: "translateY(0)", offset: 0 },
        { transform: "translateY(-30px)", offset: 0.4 },
        { transform: "translateY(0)", offset: 0.6 },
        { transform: "translateY(-15px)", offset: 0.75 },
        { transform: "translateY(0)", offset: 0.85 },
        { transform: "translateY(-5px)", offset: 0.95 },
        { transform: "translateY(0)", offset: 1 },
      ],
      options: { duration: 600, easing: "ease-out" },
    },
    shake: {
      keyFrames: [
        { transform: "translate(0, 0) rotate(0deg)", offset: 0 },
        { transform: "translate(-10px, 0) rotate(-1deg)", offset: 0.1 },
        { transform: "translate(10px, 0) rotate(1deg)", offset: 0.2 },
        { transform: "translate(-10px, 0) rotate(-1deg)", offset: 0.3 },
        { transform: "translate(10px, 0) rotate(1deg)", offset: 0.4 },
        { transform: "translate(-10px, 0) rotate(-1deg)", offset: 0.5 },
        { transform: "translate(10px, 0) rotate(1deg)", offset: 0.6 },
        { transform: "translate(-10px, 0) rotate(-1deg)", offset: 0.7 },
        { transform: "translate(10px, 0) rotate(1deg)", offset: 0.8 },
        { transform: "translate(-10px, 0) rotate(-1deg)", offset: 0.9 },
        { transform: "translate(0, 0) rotate(0deg)", offset: 1 },
      ],
      options: { duration: 500, easing: "ease-in-out" },
    },

    // Rotate animations
    rotateIn: {
      keyFrames: [
        { opacity: 0, transform: "rotate(-200deg) scale(0)" },
        { opacity: 1, transform: "rotate(0deg) scale(1)" },
      ],
      options: { duration: 600, easing: "ease-out" },
    },
    rotateOut: {
      keyFrames: [
        { opacity: 1, transform: "rotate(0deg) scale(1)" },
        { opacity: 0, transform: "rotate(200deg) scale(0)" },
      ],
      options: { duration: 600, easing: "ease-in" },
    },

    // Pulse & Flash
    pulse: {
      keyFrames: [
        { transform: "scale(1)", offset: 0 },
        { transform: "scale(1.05)", offset: 0.5 },
        { transform: "scale(1)", offset: 1 },
      ],
      options: { duration: 1000, easing: "ease-in-out" },
    },
    flash: {
      keyFrames: [
        { opacity: 1, offset: 0 },
        { opacity: 0, offset: 0.25 },
        { opacity: 1, offset: 0.5 },
        { opacity: 0, offset: 0.75 },
        { opacity: 1, offset: 1 },
      ],
      options: { duration: 750, easing: "linear" },
    },

    // Flip animations
    flipX: {
      keyFrames: [
        { transform: "perspective(400px) rotateX(90deg)", opacity: 0 },
        { transform: "perspective(400px) rotateX(0deg)", opacity: 1 },
      ],
      options: { duration: 500, easing: "ease-out" },
    },
    flipY: {
      keyFrames: [
        { transform: "perspective(400px) rotateY(90deg)", opacity: 0 },
        { transform: "perspective(400px) rotateY(0deg)", opacity: 1 },
      ],
      options: { duration: 500, easing: "ease-out" },
    },
  };

  /**
   * Animation libraries registry
   */
  public static animationLibraries: Record<string, IAnimationLibrary> = {
    standard: this.animationLibraryStandard,
    standart: this.animationLibraryStandard, // Backwards compatibility
  };

  /**
   * Get animation pattern from libraries
   * @param animationName - Name of the animation
   * @param animationLibraryNames - Array of library names to search in
   * @returns Animation pattern or null if not found
   */
  private static getAnimation(
    animationName: string,
    animationLibraryNames: string[] = ["standard"]
  ): IAnimationPattern | null {
    for (const libraryName of animationLibraryNames) {
      const library = this.animationLibraries[libraryName];
      if (library && library[animationName]) {
        return library[animationName];
      }
    }
    return null;
  }

  /**
   * Check if user prefers reduced motion
   * @returns True if reduced motion is preferred
   */
  private static prefersReducedMotion(): boolean {
    return (
      this.respectReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  /**
   * Apply playback speed to animation options
   * @param options - Original animation options
   * @returns Modified options with adjusted duration
   */
  private static applyPlaybackSpeed(options: KeyframeAnimationOptions): KeyframeAnimationOptions {
    if (this.playbackSpeed !== 1 && options.duration) {
      return {
        ...options,
        duration: Number(options.duration) / this.playbackSpeed,
      };
    }
    return options;
  }

  /**
   * Animate an element with specified animation
   * @param element - HTML element to animate
   * @param animationName - Name of the animation
   * @param options - Animation options to override defaults
   * @param animationLibraryNames - Array of library names to search in
   * @param callback - Callback function to execute when animation completes
   * @returns Animation instance or null
   */
  public static animate(
    element: HTMLElement | null,
    animationName: string,
    options?: KeyframeAnimationOptions,
    animationLibraryNames: string[] = ["standard"],
    callback?: TAnimationCallback
  ): Animation | null {
    // Early returns for invalid inputs
    if (!element) {
      console.warn("BazAnimation: Element is null or undefined");
      callback?.();
      return null;
    }

    if (!this.isActivated) {
      callback?.();
      return null;
    }

    if (this.prefersReducedMotion()) {
      callback?.();
      return null;
    }

    if (!animationName || typeof animationName !== "string") {
      console.warn("BazAnimation: Invalid animation name");
      callback?.();
      return null;
    }

    // Get animation pattern
    const animation = this.getAnimation(animationName, animationLibraryNames);
    if (!animation) {
      console.warn(
        `BazAnimation: Animation "${animationName}" not found in libraries [${animationLibraryNames.join(", ")}]`
      );
      callback?.();
      return null;
    }

    try {
      // Merge and apply options
      const animationOptions = this.applyPlaybackSpeed({
        ...animation.options,
        ...options,
      });

      // Create and start animation
      const animationInstance = element.animate(animation.keyFrames, animationOptions);

      // Handle completion
      animationInstance.finished
        .then(() => callback?.())
        .catch((error) => {
          console.error("BazAnimation: Animation error", error);
          callback?.();
        });

      return animationInstance;
    } catch (error) {
      console.error("BazAnimation: Failed to create animation", error);
      callback?.();
      return null;
    }
  }

  /**
   * Animate element with Promise support
   * @param element - HTML element to animate
   * @param animationName - Name of the animation
   * @param options - Animation options
   * @param animationLibraryNames - Array of library names to search in
   * @returns Promise that resolves when animation completes
   */
  public static animateAsync(
    element: HTMLElement | null,
    animationName: string,
    options?: KeyframeAnimationOptions,
    animationLibraryNames: string[] = ["standard"]
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      this.animate(element, animationName, options, animationLibraryNames, () => {
        resolve();
      });
    });
  }

  /**
   * Run multiple animations in sequence
   * @param element - HTML element to animate
   * @param animations - Array of animation configurations
   * @returns Promise that resolves when all animations complete
   */
  public static async sequence(
    element: HTMLElement | null,
    animations: {
      name: string;
      options?: KeyframeAnimationOptions;
      libraries?: string[];
    }[]
  ): Promise<void> {
    for (const anim of animations) {
      await this.animateAsync(element, anim.name, anim.options, anim.libraries || ["standard"]);
    }
  }

  /**
   * Run multiple animations in parallel
   * @param element - HTML element to animate
   * @param animations - Array of animation configurations
   * @returns Promise that resolves when all animations complete
   */
  public static async parallel(
    element: HTMLElement | null,
    animations: {
      name: string;
      options?: KeyframeAnimationOptions;
      libraries?: string[];
    }[]
  ): Promise<void> {
    await Promise.all(
      animations.map((anim) =>
        this.animateAsync(element, anim.name, anim.options, anim.libraries || ["standard"])
      )
    );
  }

  /**
   * Register a new animation pattern
   * @param name - Animation name
   * @param pattern - Animation pattern
   * @param libraryName - Library name to add to (default: 'custom')
   */
  public static registerAnimation(
    name: string,
    pattern: IAnimationPattern,
    libraryName = "custom"
  ): void {
    if (!this.animationLibraries[libraryName]) {
      this.animationLibraries[libraryName] = {};
    }
    this.animationLibraries[libraryName][name] = pattern;
  }

  /**
   * Register multiple animations at once
   * @param animations - Object with animation name as key and pattern as value
   * @param libraryName - Library name to add to (default: 'custom')
   */
  public static registerAnimations(
    animations: IAnimationLibrary,
    libraryName = "custom"
  ): void {
    if (!this.animationLibraries[libraryName]) {
      this.animationLibraries[libraryName] = {};
    }
    Object.assign(this.animationLibraries[libraryName], animations);
  }

  /**
   * Configure animation settings
   * @param config - Configuration options
   */
  public static configure(config: IAnimationConfig): void {
    if (config.enabled !== undefined) {
      this.isActivated = config.enabled;
    }
    if (config.playbackSpeed !== undefined) {
      this.playbackSpeed = config.playbackSpeed;
    }
    if (config.reduceMotion !== undefined) {
      this.respectReducedMotion = config.reduceMotion;
    }
  }

  /**
   * Get list of available animations in a library
   * @param libraryName - Library name (default: 'standard')
   * @returns Array of animation names
   */
  public static getAvailableAnimations(libraryName = "standard"): string[] {
    const library = this.animationLibraries[libraryName];
    return library ? Object.keys(library) : [];
  }

  /**
   * Check if an animation exists
   * @param animationName - Name of the animation
   * @param libraryNames - Array of library names to search in
   * @returns True if animation exists
   */
  public static hasAnimation(
    animationName: string,
    libraryNames: string[] = ["standard"]
  ): boolean {
    return this.getAnimation(animationName, libraryNames) !== null;
  }
}
