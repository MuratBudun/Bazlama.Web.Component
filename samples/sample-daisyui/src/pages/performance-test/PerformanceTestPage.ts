import { BasePage } from "../../baz-ui/baz-router/classes/BasePage";
import { BazlamaMonitor } from "bazlama-web-component";
import type { BazInput } from "../../baz-ui/baz-input";
import template from "./template.htm?raw";

interface ITestLog {
  timestamp: number;
  action: string;
  method: string;
  duration: number;
  renderCount: number;
  attributeCallbacks: number;
  propertyCallbacks: number;
}

/**
 * Performance Test Page - Compare attribute vs property changes
 */
export class PerformanceTestPage extends BasePage {
  private testInput: BazInput | null = null;
  private logs: ITestLog[] = [];

  render(): string {
    return template;
  }

  init(): void {
    // Enable monitoring FIRST
    BazlamaMonitor.enabled = true;
    BazlamaMonitor.trackInstances = true;

    this.testInput = this.querySelector("#test-input") as BazInput;
    
    // Manually register the component with monitor since it was created before monitoring was enabled
    if (this.testInput) {
      BazlamaMonitor.trackComponentCreated(this.testInput);
      BazlamaMonitor.trackComponentConnected(this.testInput);
      console.log("Component manually registered with monitor");
    }
    
    this.setupControls();
    this.updateCurrentStats();
  }

  private setupControls(): void {
    if (!this.testInput) return;

    // Property Change Controls
    this.addClickListener("#btn-prop-label", () => {
      this.changeViaProperty("label", this.getRandomLabel());
    });

    this.addClickListener("#btn-prop-placeholder", () => {
      this.changeViaProperty("placeholder", this.getRandomPlaceholder());
    });

    this.addClickListener("#btn-prop-size", () => {
      const sizes = ["xs", "sm", "md", "lg", "xl"];
      const currentIndex = sizes.indexOf(this.testInput!.size);
      const nextSize = sizes[(currentIndex + 1) % sizes.length];
      this.changeViaProperty("size", nextSize);
    });

    this.addClickListener("#btn-prop-color", () => {
      const colors = ["neutral", "primary", "secondary", "accent", "info", "success", "warning", "error"];
      const currentIndex = colors.indexOf(this.testInput!.color);
      const nextColor = colors[(currentIndex + 1) % colors.length];
      this.changeViaProperty("color", nextColor);
    });

    this.addClickListener("#btn-prop-value", () => {
      this.changeViaProperty("value", this.getRandomValue());
    });

    // Attribute Change Controls
    this.addClickListener("#btn-attr-label", () => {
      this.changeViaAttribute("label", this.getRandomLabel());
    });

    this.addClickListener("#btn-attr-placeholder", () => {
      this.changeViaAttribute("placeholder", this.getRandomPlaceholder());
    });

    this.addClickListener("#btn-attr-size", () => {
      const sizes = ["xs", "sm", "md", "lg", "xl"];
      const current = this.testInput!.getAttribute("size") || "md";
      const currentIndex = sizes.indexOf(current);
      const nextSize = sizes[(currentIndex + 1) % sizes.length];
      this.changeViaAttribute("size", nextSize);
    });

    this.addClickListener("#btn-attr-color", () => {
      const colors = ["neutral", "primary", "secondary", "accent", "info", "success", "warning", "error"];
      const current = this.testInput!.getAttribute("color") || "neutral";
      const currentIndex = colors.indexOf(current);
      const nextColor = colors[(currentIndex + 1) % colors.length];
      this.changeViaAttribute("color", nextColor);
    });

    this.addClickListener("#btn-attr-value", () => {
      this.changeViaAttribute("value", this.getRandomValue());
    });

    // Batch Operations
    this.addClickListener("#btn-batch-props", () => {
      this.batchChangeViaProperty();
    });

    this.addClickListener("#btn-batch-attrs", () => {
      this.batchChangeViaAttribute();
    });

    // Clear logs
    this.addClickListener("#btn-clear-logs", () => {
      this.logs = [];
      this.updateLogsTable();
      this.showToast("Logs cleared");
    });

    // Manual render
    this.addClickListener("#btn-manual-render", () => {
      this.manualRender();
    });

    // Reset stats
    this.addClickListener("#btn-reset-stats", () => {
      BazlamaMonitor.reset();
      this.updateCurrentStats();
      this.showToast("Stats reset");
    });
  }

  private changeViaProperty(propName: string, value: string): void {
    if (!this.testInput) return;

    const startTime = performance.now();
    const beforeStats = this.captureStats();

    // Change property directly
    (this.testInput as any)[propName] = value;

    const duration = performance.now() - startTime;
    const afterStats = this.captureStats();

    this.logChange(
      `${propName} = "${value}"`,
      "Property",
      duration,
      afterStats.renders - beforeStats.renders,
      afterStats.attributes - beforeStats.attributes,
      afterStats.properties - beforeStats.properties
    );

    this.updateCurrentStats();
  }

  private changeViaAttribute(attrName: string, value: string): void {
    if (!this.testInput) return;

    const startTime = performance.now();
    const beforeStats = this.captureStats();

    // Change attribute
    this.testInput.setAttribute(attrName, value);

    const duration = performance.now() - startTime;
    const afterStats = this.captureStats();

    this.logChange(
      `${attrName}="${value}"`,
      "Attribute",
      duration,
      afterStats.renders - beforeStats.renders,
      afterStats.attributes - beforeStats.attributes,
      afterStats.properties - beforeStats.properties
    );

    this.updateCurrentStats();
  }

  private batchChangeViaProperty(): void {
    if (!this.testInput) return;

    const startTime = performance.now();
    const beforeStats = this.captureStats();

    // Batch change via properties
    this.testInput.label = this.getRandomLabel();
    this.testInput.placeholder = this.getRandomPlaceholder();
    this.testInput.value = this.getRandomValue();
    this.testInput.size = "lg";
    this.testInput.color = "primary";

    const duration = performance.now() - startTime;
    const afterStats = this.captureStats();

    this.logChange(
      "5 properties changed",
      "Batch Property",
      duration,
      afterStats.renders - beforeStats.renders,
      afterStats.attributes - beforeStats.attributes,
      afterStats.properties - beforeStats.properties
    );

    this.updateCurrentStats();
  }

  private batchChangeViaAttribute(): void {
    if (!this.testInput) return;

    const startTime = performance.now();
    const beforeStats = this.captureStats();

    // Batch change via attributes
    this.testInput.setAttribute("label", this.getRandomLabel());
    this.testInput.setAttribute("placeholder", this.getRandomPlaceholder());
    this.testInput.setAttribute("value", this.getRandomValue());
    this.testInput.setAttribute("size", "lg");
    this.testInput.setAttribute("color", "primary");

    const duration = performance.now() - startTime;
    const afterStats = this.captureStats();

    this.logChange(
      "5 attributes changed",
      "Batch Attribute",
      duration,
      afterStats.renders - beforeStats.renders,
      afterStats.attributes - beforeStats.attributes,
      afterStats.properties - beforeStats.properties
    );

    this.updateCurrentStats();
  }

  private manualRender(): void {
    if (!this.testInput) return;

    const startTime = performance.now();
    const beforeStats = this.captureStats();

    console.log("Before render:", beforeStats);
    console.log("Monitoring enabled:", BazlamaMonitor.enabled);
    console.log("Track instances:", BazlamaMonitor.trackInstances);
    console.log("Test input element:", this.testInput);
    console.log("Test input tagName:", this.testInput.tagName);
    
    // Check if component is in the instance map
    const instanceStats = BazlamaMonitor.getInstanceStats(this.testInput);
    console.log("Instance stats before render:", instanceStats);

    // Manually call render on the component
    console.log("Calling render()...");
    (this.testInput as any).render();
    console.log("Render() called");

    const duration = performance.now() - startTime;
    
    // Small delay to ensure stats are updated
    setTimeout(() => {
      const afterStats = this.captureStats();
      const instanceStatsAfter = BazlamaMonitor.getInstanceStats(this.testInput!);
      
      console.log("After render:", afterStats);
      console.log("Instance stats after render:", instanceStatsAfter);
      console.log("Render count diff:", afterStats.renders - beforeStats.renders);

      this.logChange(
        "Manual render() call",
        "Manual Render",
        duration,
        afterStats.renders - beforeStats.renders,
        afterStats.attributes - beforeStats.attributes,
        afterStats.properties - beforeStats.properties
      );

      this.updateCurrentStats();
    }, 10);
  }

  private captureStats() {
    const stats = BazlamaMonitor.getInstanceStats(this.testInput!);
    return {
      renders: stats?.renderCount || 0,
      attributes: stats?.attributeCallbackCount || 0,
      properties: stats?.propertyCallbackCount || 0,
    };
  }

  private logChange(
    action: string,
    method: string,
    duration: number,
    renders: number,
    attributes: number,
    properties: number
  ): void {
    this.logs.unshift({
      timestamp: Date.now(),
      action,
      method,
      duration,
      renderCount: renders,
      attributeCallbacks: attributes,
      propertyCallbacks: properties,
    });

    // Keep only last 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(0, 50);
    }

    this.updateLogsTable();
  }

  private updateLogsTable(): void {
    const tbody = this.querySelector("#logs-tbody") as HTMLTableSectionElement;
    if (!tbody) return;

    if (this.logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-base-content/50 py-8">
            No logs yet. Click buttons above to test performance.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.logs
      .map(
        (log) => `
      <tr class="hover">
        <td class="text-xs">${new Date(log.timestamp).toLocaleTimeString()}</td>
        <td class="text-sm">${log.action}</td>
        <td>
          <span class="badge ${
            log.method === "Property"
              ? "badge-primary"
              : log.method === "Attribute"
              ? "badge-secondary"
              : log.method === "Manual Render"
              ? "badge-warning"
              : "badge-accent"
          } badge-sm">
            ${log.method}
          </span>
        </td>
        <td class="text-right font-mono text-sm">${log.duration.toFixed(2)}ms</td>
        <td class="text-right">${log.renderCount}</td>
        <td class="text-right text-xs">
          <span class="text-secondary">${log.attributeCallbacks}</span> / 
          <span class="text-primary">${log.propertyCallbacks}</span>
        </td>
      </tr>
    `
      )
      .join("");
  }

  private updateCurrentStats(): void {
    const stats = BazlamaMonitor.getInstanceStats(this.testInput!);
    
    if (stats) {
      this.updateElement("#stat-renders", stats.renderCount.toString());
      this.updateElement("#stat-avg-duration", stats.avgRenderDuration.toFixed(2) + "ms");
      this.updateElement("#stat-attributes", stats.attributeCallbackCount.toString());
      this.updateElement("#stat-properties", stats.propertyCallbackCount.toString());
      this.updateElement("#stat-total-duration", stats.totalRenderDuration.toFixed(2) + "ms");
    }
  }

  private updateElement(selector: string, text: string): void {
    const element = this.querySelector(selector);
    if (element) {
      element.textContent = text;
    }
  }

  private getRandomLabel(): string {
    const labels = [
      "Username",
      "Email Address",
      "Full Name",
      "Phone Number",
      "Company Name",
      "Address",
      "City",
      "Postal Code"
    ];
    return labels[Math.floor(Math.random() * labels.length)];
  }

  private getRandomPlaceholder(): string {
    const placeholders = [
      "Enter text here...",
      "Type something...",
      "Your input...",
      "Start typing...",
      "Write here...",
      "Input value..."
    ];
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  }

  private getRandomValue(): string {
    const values = [
      "test123",
      "sample@email.com",
      "John Doe",
      "+1234567890",
      "ACME Corp",
      "Random Value " + Math.floor(Math.random() * 1000)
    ];
    return values[Math.floor(Math.random() * values.length)];
  }

  destroy(): void {
    super.destroy();
  }
}

export default PerformanceTestPage;
