/*
    Bazlama Web Component Project
    Performance and Statistics Monitor
    2026-01-28
    Version 1.0
    muratbudun@gmail.com
*/

/**
 * Statistics for a specific component instance
 */
export interface IComponentStats {
  /** Component tag name */
  tagName: string;
  /** Total render count */
  renderCount: number;
  /** Total attribute change callback count */
  attributeCallbackCount: number;
  /** Total property change callback count */
  propertyCallbackCount: number;
  /** Total event action executions */
  eventActionCount: number;
  /** Component lifecycle timestamps */
  lifecycle: {
    created?: number;
    connected?: number;
    disconnected?: number;
    firstRender?: number;
    lastRender?: number;
  };
  /** Average render duration in ms */
  avgRenderDuration: number;
  /** Total render duration in ms */
  totalRenderDuration: number;
  /** Custom metrics */
  custom: Record<string, number>;
}

/**
 * Global statistics for all components
 */
export interface IGlobalStats {
  /** Total number of component instances created */
  totalComponentsCreated: number;
  /** Total number of renders across all components */
  totalRenders: number;
  /** Total number of attribute callbacks */
  totalAttributeCallbacks: number;
  /** Total number of property callbacks */
  totalPropertyCallbacks: number;
  /** Total number of event actions */
  totalEventActions: number;
  /** Statistics by component type */
  byComponent: Map<string, IComponentStats>;
  /** Statistics by component instance */
  byInstance: Map<HTMLElement, IComponentStats>;
}

/**
 * BazlamaMonitor - Performance and statistics monitoring for Bazlama components
 * 
 * Tracks component lifecycle, render performance, and callback executions.
 * Enable by setting window.BazlamaMonitor.enabled = true
 * 
 * @example
 * ```typescript
 * // Enable monitoring
 * window.BazlamaMonitor.enabled = true;
 * 
 * // Get statistics
 * const stats = window.BazlamaMonitor.getGlobalStats();
 * console.log(stats);
 * 
 * // Get component-specific stats
 * const componentStats = window.BazlamaMonitor.getComponentStats('baz-input');
 * console.log(componentStats);
 * 
 * // Reset all statistics
 * window.BazlamaMonitor.reset();
 * ```
 */
export class BazlamaMonitor {
  /** Enable/disable monitoring (disabled by default for performance) */
  public enabled = false;

  /** Enable detailed per-instance tracking (more memory usage) */
  public trackInstances = false;

  /** Global statistics */
  private stats: IGlobalStats = {
    totalComponentsCreated: 0,
    totalRenders: 0,
    totalAttributeCallbacks: 0,
    totalPropertyCallbacks: 0,
    totalEventActions: 0,
    byComponent: new Map(),
    byInstance: new Map(),
  };

  /**
   * Track component creation
   */
  trackComponentCreated(component: HTMLElement): void {
    if (!this.enabled) return;

    const tagName = component.tagName.toLowerCase();
    this.stats.totalComponentsCreated++;

    // Initialize component stats if not exists
    if (!this.stats.byComponent.has(tagName)) {
      this.stats.byComponent.set(tagName, {
        tagName,
        renderCount: 0,
        attributeCallbackCount: 0,
        propertyCallbackCount: 0,
        eventActionCount: 0,
        lifecycle: {},
        avgRenderDuration: 0,
        totalRenderDuration: 0,
        custom: {},
      });
    }

    const componentStats = this.stats.byComponent.get(tagName)!;
    componentStats.lifecycle.created = performance.now();

    // Track instance if enabled
    if (this.trackInstances) {
      this.stats.byInstance.set(component, {
        tagName,
        renderCount: 0,
        attributeCallbackCount: 0,
        propertyCallbackCount: 0,
        eventActionCount: 0,
        lifecycle: {
          created: performance.now(),
        },
        avgRenderDuration: 0,
        totalRenderDuration: 0,
        custom: {},
      });
    }
  }

  /**
   * Track component connected to DOM
   */
  trackComponentConnected(component: HTMLElement): void {
    if (!this.enabled) return;

    const tagName = component.tagName.toLowerCase();
    const componentStats = this.stats.byComponent.get(tagName);
    if (componentStats) {
      componentStats.lifecycle.connected = performance.now();
    }

    if (this.trackInstances) {
      const instanceStats = this.stats.byInstance.get(component);
      if (instanceStats) {
        instanceStats.lifecycle.connected = performance.now();
      }
    }
  }

  /**
   * Track component disconnected from DOM
   */
  trackComponentDisconnected(component: HTMLElement): void {
    if (!this.enabled) return;

    const tagName = component.tagName.toLowerCase();
    const componentStats = this.stats.byComponent.get(tagName);
    if (componentStats) {
      componentStats.lifecycle.disconnected = performance.now();
    }

    if (this.trackInstances) {
      const instanceStats = this.stats.byInstance.get(component);
      if (instanceStats) {
        instanceStats.lifecycle.disconnected = performance.now();
      }
    }
  }

  /**
   * Track render start (returns timing token)
   */
  trackRenderStart(_component: HTMLElement): number | null {
    if (!this.enabled) return null;
    return performance.now();
  }

  /**
   * Track render end
   */
  trackRenderEnd(component: HTMLElement, startTime: number | null): void {
    if (!this.enabled || startTime === null) return;

    const duration = performance.now() - startTime;
    const tagName = component.tagName.toLowerCase();

    this.stats.totalRenders++;

    const componentStats = this.stats.byComponent.get(tagName);
    if (componentStats) {
      componentStats.renderCount++;
      componentStats.totalRenderDuration += duration;
      componentStats.avgRenderDuration =
        componentStats.totalRenderDuration / componentStats.renderCount;
      
      if (!componentStats.lifecycle.firstRender) {
        componentStats.lifecycle.firstRender = performance.now();
      }
      componentStats.lifecycle.lastRender = performance.now();
    }

    if (this.trackInstances) {
      const instanceStats = this.stats.byInstance.get(component);
      if (instanceStats) {
        instanceStats.renderCount++;
        instanceStats.totalRenderDuration += duration;
        instanceStats.avgRenderDuration =
          instanceStats.totalRenderDuration / instanceStats.renderCount;
        
        if (!instanceStats.lifecycle.firstRender) {
          instanceStats.lifecycle.firstRender = performance.now();
        }
        instanceStats.lifecycle.lastRender = performance.now();
      }
    }
  }

  /**
   * Track attribute callback execution
   */
  trackAttributeCallback(component: HTMLElement): void {
    if (!this.enabled) return;

    const tagName = component.tagName.toLowerCase();
    this.stats.totalAttributeCallbacks++;

    const componentStats = this.stats.byComponent.get(tagName);
    if (componentStats) {
      componentStats.attributeCallbackCount++;
    }

    if (this.trackInstances) {
      const instanceStats = this.stats.byInstance.get(component);
      if (instanceStats) {
        instanceStats.attributeCallbackCount++;
      }
    }
  }

  /**
   * Track property callback execution
   */
  trackPropertyCallback(component: HTMLElement): void {
    if (!this.enabled) return;

    const tagName = component.tagName.toLowerCase();
    this.stats.totalPropertyCallbacks++;

    const componentStats = this.stats.byComponent.get(tagName);
    if (componentStats) {
      componentStats.propertyCallbackCount++;
    }

    if (this.trackInstances) {
      const instanceStats = this.stats.byInstance.get(component);
      if (instanceStats) {
        instanceStats.propertyCallbackCount++;
      }
    }
  }

  /**
   * Track event action execution
   */
  trackEventAction(component: HTMLElement): void {
    if (!this.enabled) return;

    const tagName = component.tagName.toLowerCase();
    this.stats.totalEventActions++;

    const componentStats = this.stats.byComponent.get(tagName);
    if (componentStats) {
      componentStats.eventActionCount++;
    }

    if (this.trackInstances) {
      const instanceStats = this.stats.byInstance.get(component);
      if (instanceStats) {
        instanceStats.eventActionCount++;
      }
    }
  }

  /**
   * Track custom metric
   */
  trackCustomMetric(component: HTMLElement, metricName: string, value = 1): void {
    if (!this.enabled) return;

    const tagName = component.tagName.toLowerCase();

    const componentStats = this.stats.byComponent.get(tagName);
    if (componentStats) {
      componentStats.custom[metricName] = (componentStats.custom[metricName] || 0) + value;
    }

    if (this.trackInstances) {
      const instanceStats = this.stats.byInstance.get(component);
      if (instanceStats) {
        instanceStats.custom[metricName] = (instanceStats.custom[metricName] || 0) + value;
      }
    }
  }

  /**
   * Get global statistics
   */
  getGlobalStats(): IGlobalStats {
    return {
      ...this.stats,
      byComponent: new Map(this.stats.byComponent),
      byInstance: new Map(this.stats.byInstance),
    };
  }

  /**
   * Get statistics for a specific component type
   */
  getComponentStats(tagName: string): IComponentStats | null {
    return this.stats.byComponent.get(tagName.toLowerCase()) || null;
  }

  /**
   * Get statistics for a specific component instance
   */
  getInstanceStats(component: HTMLElement): IComponentStats | null {
    return this.stats.byInstance.get(component) || null;
  }

  /**
   * Get all component types being tracked
   */
  getTrackedComponents(): string[] {
    return Array.from(this.stats.byComponent.keys());
  }

  /**
   * Print formatted statistics to console
   */
  printStats(): void {
    console.group('🔍 Bazlama Component Statistics');
    
    console.log('Global Stats:', {
      'Total Components Created': this.stats.totalComponentsCreated,
      'Total Renders': this.stats.totalRenders,
      'Total Attribute Callbacks': this.stats.totalAttributeCallbacks,
      'Total Property Callbacks': this.stats.totalPropertyCallbacks,
      'Total Event Actions': this.stats.totalEventActions,
    });

    if (this.stats.byComponent.size > 0) {
      console.group('Component Breakdown:');
      
      this.stats.byComponent.forEach((stats, tagName) => {
        console.groupCollapsed(`<${tagName}>`);
        console.log('Renders:', stats.renderCount);
        console.log('Avg Render Duration:', stats.avgRenderDuration.toFixed(2) + 'ms');
        console.log('Total Render Duration:', stats.totalRenderDuration.toFixed(2) + 'ms');
        console.log('Attribute Callbacks:', stats.attributeCallbackCount);
        console.log('Property Callbacks:', stats.propertyCallbackCount);
        console.log('Event Actions:', stats.eventActionCount);
        
        if (Object.keys(stats.custom).length > 0) {
          console.log('Custom Metrics:', stats.custom);
        }
        
        console.log('Lifecycle:', stats.lifecycle);
        console.groupEnd();
      });
      
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.stats = {
      totalComponentsCreated: 0,
      totalRenders: 0,
      totalAttributeCallbacks: 0,
      totalPropertyCallbacks: 0,
      totalEventActions: 0,
      byComponent: new Map(),
      byInstance: new Map(),
    };
    console.log('✅ Bazlama Monitor statistics reset');
  }

  /**
   * Export statistics as JSON
   */
  exportStats(): string {
    const exportData = {
      ...this.stats,
      byComponent: Array.from(this.stats.byComponent.entries()),
      byInstance: Array.from(this.stats.byInstance.entries()).map(([component, stats]) => ({
        tagName: component.tagName.toLowerCase(),
        id: component.id || '(no id)',
        stats,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Create global singleton instance
const globalMonitor = new BazlamaMonitor();

// Attach to window for global access
if (typeof window !== 'undefined') {
  (window as any).BazlamaMonitor = globalMonitor;
}

export default globalMonitor;
