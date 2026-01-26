/* eslint-disable no-console */
/**
 * Performance monitoring utility for measuring render, DOM, and memory performance
 *
 * Usage in browser console:
 * ```js
 * PerfMon.logMemory()           // Log current memory usage
 * PerfMon.logDOMComplexity()    // Log DOM node count and depth
 * PerfMon.printReport()         // Full performance report
 * PerfMon.monitorFPS(5000)      // Monitor FPS for 5 seconds
 * ```
 */
export class PerformanceMonitor {
  private static marks = new Map<string, number>();
  private static measurements = new Map<string, number[]>();

  /**
   * Start timing a specific operation
   */
  static start(label: string): void {
    this.marks.set(label, performance.now());
    performance.mark(`${label}-start`);
  }

  /**
   * End timing and record the measurement
   */
  static end(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`No start mark found for: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);

    // Store for averaging
    const existing = this.measurements.get(label) ?? [];
    existing.push(duration);
    this.measurements.set(label, existing);

    return duration;
  }

  /**
   * Measure a function execution time
   */
  static measure<T>(label: string, fn: () => T): T {
    this.start(label);
    const result = fn();
    const duration = this.end(label);
    console.log(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
    return result;
  }

  /**
   * Measure an async function execution time
   */
  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    const result = await fn();
    const duration = this.end(label);
    console.log(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
    return result;
  }

  /**
   * Get average time for a label
   */
  static getAverage(label: string): number {
    const times = this.measurements.get(label);
    if (!times || times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  /**
   * Get memory usage (Chrome only with --enable-precise-memory-info flag)
   */
  static getMemoryUsage(): {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null {
    const memory = (
      performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }
    ).memory;

    if (memory) {
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  /**
   * Format bytes to human readable string
   */
  static formatBytes(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let unitIndex = 0;
    let size = bytes;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Log current memory usage
   */
  static logMemory(label?: string): void {
    const memory = this.getMemoryUsage();
    if (memory) {
      console.log(
        `[Memory]${label ? ` ${label}:` : ""} Used: ${this.formatBytes(memory.usedJSHeapSize)} / Total: ${this.formatBytes(memory.totalJSHeapSize)}`
      );
    } else {
      console.log("[Memory] Not available (use Chrome with --enable-precise-memory-info)");
    }
  }

  /**
   * Measure DOM complexity
   */
  static measureDOMComplexity(): {
    totalNodes: number;
    maxDepth: number;
    elementCount: number;
    textNodeCount: number;
  } {
    let totalNodes = 0;
    let maxDepth = 0;
    let elementCount = 0;
    let textNodeCount = 0;

    function traverse(node: Node, depth: number): void {
      totalNodes++;
      maxDepth = Math.max(maxDepth, depth);

      if (node.nodeType === Node.ELEMENT_NODE) {
        elementCount++;
      } else if (node.nodeType === Node.TEXT_NODE) {
        textNodeCount++;
      }

      node.childNodes.forEach((child) => traverse(child, depth + 1));
    }

    traverse(document.body, 0);

    return { totalNodes, maxDepth, elementCount, textNodeCount };
  }

  /**
   * Log DOM complexity
   */
  static logDOMComplexity(label?: string): void {
    const complexity = this.measureDOMComplexity();
    console.log(
      `[DOM]${label ? ` ${label}:` : ""} Nodes: ${complexity.totalNodes}, Elements: ${complexity.elementCount}, Depth: ${complexity.maxDepth}`
    );
  }

  /**
   * Monitor frame rate for a specified duration
   * @param duration - Duration in milliseconds (default: 5000)
   */
  static monitorFPS(duration = 5000): Promise<{
    avgFPS: number;
    minFPS: number;
    maxFPS: number;
    frames: number;
  }> {
    return new Promise((resolve) => {
      const frames: number[] = [];
      let lastTime = performance.now();
      const startTime = lastTime;
      let frameCount = 0;

      function measureFrame(): void {
        const now = performance.now();
        const delta = now - lastTime;

        if (delta > 0) {
          frames.push(1000 / delta);
        }

        lastTime = now;
        frameCount++;

        if (now - startTime < duration) {
          requestAnimationFrame(measureFrame);
        } else {
          const avgFPS = frames.reduce((a, b) => a + b, 0) / frames.length;
          const minFPS = Math.min(...frames);
          const maxFPS = Math.max(...frames);

          console.log(
            `[FPS] Avg: ${Math.round(avgFPS)}, Min: ${Math.round(minFPS)}, Max: ${Math.round(maxFPS)}, Frames: ${frameCount}`
          );

          resolve({
            avgFPS: Math.round(avgFPS),
            minFPS: Math.round(minFPS),
            maxFPS: Math.round(maxFPS),
            frames: frameCount,
          });
        }
      }

      console.log(`[FPS] Monitoring for ${duration / 1000}s...`);
      requestAnimationFrame(measureFrame);
    });
  }

  /**
   * Measure layout thrashing (forced reflows)
   */
  static measureLayoutThrashing<T>(label: string, fn: () => T): T {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "layout-shift") {
          const layoutEntry = entry as PerformanceEntry & { value?: number };
          console.warn(`[Layout Shift] Score: ${layoutEntry.value?.toFixed(4) ?? "N/A"}`);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ["layout-shift"] });
      return this.measure(label, fn);
    } finally {
      observer.disconnect();
    }
  }

  /**
   * Print summary report
   */
  static printReport(): void {
    console.group("📊 Performance Report");

    // Memory
    const memory = this.getMemoryUsage();
    if (memory) {
      console.group("💾 Memory");
      console.log(`Used:  ${this.formatBytes(memory.usedJSHeapSize)}`);
      console.log(`Total: ${this.formatBytes(memory.totalJSHeapSize)}`);
      console.log(`Limit: ${this.formatBytes(memory.jsHeapSizeLimit)}`);
      console.log(`Usage: ${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)}%`);
      console.groupEnd();
    }

    // DOM Complexity
    const complexity = this.measureDOMComplexity();
    console.group("🌳 DOM Complexity");
    console.log(`Total Nodes: ${complexity.totalNodes}`);
    console.log(`Elements:    ${complexity.elementCount}`);
    console.log(`Text Nodes:  ${complexity.textNodeCount}`);
    console.log(`Max Depth:   ${complexity.maxDepth}`);

    // Warnings
    if (complexity.totalNodes > 1500) {
      console.warn("⚠️ High node count may impact performance");
    }
    if (complexity.maxDepth > 32) {
      console.warn("⚠️ Deep DOM tree may impact performance");
    }
    console.groupEnd();

    // Measurements
    if (this.measurements.size > 0) {
      console.group("⏱️ Measurements");
      this.measurements.forEach((times, label) => {
        const avg = this.getAverage(label);
        const min = Math.min(...times);
        const max = Math.max(...times);
        console.log(
          `${label}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms (${times.length} samples)`
        );
      });
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Test for memory leaks by comparing memory before and after operations
   */
  static async testMemoryLeak(
    testFn: () => Promise<void>,
    iterations = 10
  ): Promise<{
    initialMemory: number;
    finalMemory: number;
    difference: number;
    potentialLeak: boolean;
  }> {
    // Force GC if available
    const gc = (window as Window & { gc?: () => void }).gc;
    if (gc) gc();

    const initialMemory = this.getMemoryUsage()?.usedJSHeapSize ?? 0;
    console.log(`[Memory Leak Test] Starting with ${this.formatBytes(initialMemory)}`);

    for (let i = 0; i < iterations; i++) {
      await testFn();
      console.log(`[Memory Leak Test] Iteration ${i + 1}/${iterations}`);
    }

    // Force GC if available
    if (gc) gc();

    // Wait a bit for cleanup
    await new Promise((r) => setTimeout(r, 100));

    const finalMemory = this.getMemoryUsage()?.usedJSHeapSize ?? 0;
    const difference = finalMemory - initialMemory;
    const potentialLeak = difference > 5 * 1024 * 1024; // 5MB threshold

    console.log(`[Memory Leak Test] Final: ${this.formatBytes(finalMemory)}`);
    console.log(`[Memory Leak Test] Difference: ${this.formatBytes(difference)}`);

    if (potentialLeak) {
      console.warn("[Memory Leak Test] ⚠️ Potential memory leak detected!");
    } else {
      console.log("[Memory Leak Test] ✅ No significant memory growth");
    }

    return { initialMemory, finalMemory, difference, potentialLeak };
  }

  /**
   * Clear all measurements
   */
  static clear(): void {
    this.marks.clear();
    this.measurements.clear();
    performance.clearMarks();
    performance.clearMeasures();
    console.log("[Perf] Measurements cleared");
  }
}

// Export singleton for console access
if (typeof window !== "undefined") {
  (window as Window & { PerfMon?: typeof PerformanceMonitor }).PerfMon = PerformanceMonitor;
}

export default PerformanceMonitor;
