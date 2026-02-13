import { BasePage } from "../../baz-ui/baz-router/classes/BasePage";
import { BazlamaMonitor } from "bazlama-web-component";
import template from "./template.htm?raw";

/**
 * Monitor page - Shows Bazlama component performance statistics
 */
export class MonitorPage extends BasePage {
  private updateInterval: number | null = null;

  render(): string {
    return template;
  }

  init(): void {
    this.setupControls();
    this.updateStats();
    this.startAutoUpdate();
  }

  private setupControls(): void {
    // Enable/disable monitoring
    const enableToggle = this.querySelector("#enable-monitor") as HTMLInputElement;
    if (enableToggle) {
      enableToggle.checked = BazlamaMonitor.enabled;
      this.addChangeListener("#enable-monitor", () => {
        BazlamaMonitor.enabled = enableToggle.checked;
        this.updateStats();
        this.showToast(
          enableToggle.checked ? "Monitoring enabled" : "Monitoring disabled"
        );
      });
    }

    // Enable/disable instance tracking
    const trackInstancesToggle = this.querySelector("#track-instances") as HTMLInputElement;
    if (trackInstancesToggle) {
      trackInstancesToggle.checked = BazlamaMonitor.trackInstances;
      this.addChangeListener("#track-instances", () => {
        BazlamaMonitor.trackInstances = trackInstancesToggle.checked;
        this.updateStats();
        this.showToast(
          trackInstancesToggle.checked
            ? "Instance tracking enabled"
            : "Instance tracking disabled"
        );
      });
    }

    // Reset button
    const resetBtn = this.querySelector("#reset-stats") as HTMLButtonElement;
    if (resetBtn) {
      this.addClickListener("#reset-stats", () => {
        BazlamaMonitor.reset();
        this.updateStats();
        this.showToast("Statistics reset");
      });
    }

    // Refresh button
    const refreshBtn = this.querySelector("#refresh-stats") as HTMLButtonElement;
    if (refreshBtn) {
      this.addClickListener("#refresh-stats", () => {
        this.updateStats();
        this.showToast("Statistics refreshed");
      });
    }

    // Export button
    const exportBtn = this.querySelector("#export-stats") as HTMLButtonElement;
    if (exportBtn) {
      this.addClickListener("#export-stats", () => {
        this.exportStats();
      });
    }

    // Print to console button
    const printBtn = this.querySelector("#print-console") as HTMLButtonElement;
    if (printBtn) {
      this.addClickListener("#print-console", () => {
        BazlamaMonitor.printStats();
        this.showToast("Statistics printed to console");
      });
    }
  }

  private updateStats(): void {
    const stats = BazlamaMonitor.getGlobalStats();

    // Update global stats
    this.updateElement("#total-components", stats.totalComponentsCreated.toString());
    this.updateElement("#total-renders", stats.totalRenders.toString());
    this.updateElement(
      "#total-attributes",
      stats.totalAttributeCallbacks.toString()
    );
    this.updateElement(
      "#total-properties",
      stats.totalPropertyCallbacks.toString()
    );
    this.updateElement("#total-events", stats.totalEventActions.toString());

    // Update component breakdown table
    const tableBody = this.querySelector("#component-stats-body") as HTMLTableSectionElement;
    if (tableBody) {
      tableBody.innerHTML = "";

      if (stats.byComponent.size === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `
          <td colspan="6" class="text-center text-base-content/50 py-8">
            No statistics available. Enable monitoring to start tracking.
          </td>
        `;
        tableBody.appendChild(emptyRow);
      } else {
        Array.from(stats.byComponent.entries())
          .sort((a, b) => b[1].renderCount - a[1].renderCount)
          .forEach(([tagName, componentStats]) => {
            const row = document.createElement("tr");
            row.className = "hover";
            row.innerHTML = `
              <td class="font-mono text-sm">&lt;${tagName}&gt;</td>
              <td class="text-right">${componentStats.renderCount}</td>
              <td class="text-right">${componentStats.avgRenderDuration.toFixed(2)}ms</td>
              <td class="text-right">${componentStats.attributeCallbackCount}</td>
              <td class="text-right">${componentStats.propertyCallbackCount}</td>
              <td class="text-right">${componentStats.eventActionCount}</td>
            `;
            tableBody.appendChild(row);
          });
      }
    }

    // Update status indicator
    const statusBadge = this.querySelector("#monitor-status") as HTMLElement;
    if (statusBadge) {
      if (BazlamaMonitor.enabled) {
        statusBadge.className = "badge badge-success gap-2";
        statusBadge.innerHTML = `
          <div class="w-2 h-2 rounded-full bg-success-content animate-pulse"></div>
          Active
        `;
      } else {
        statusBadge.className = "badge badge-ghost gap-2";
        statusBadge.innerHTML = `
          <div class="w-2 h-2 rounded-full bg-base-content/30"></div>
          Inactive
        `;
      }
    }
  }

  private updateElement(selector: string, text: string): void {
    const element = this.querySelector(selector);
    if (element) {
      element.textContent = text;
    }
  }

  private startAutoUpdate(): void {
    // Auto-refresh every 2 seconds when monitoring is enabled
    this.updateInterval = window.setInterval(() => {
      if (BazlamaMonitor.enabled) {
        this.updateStats();
      }
    }, 2000);
  }

  private exportStats(): void {
    try {
      const json = BazlamaMonitor.exportStats();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bazlama-stats-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast("Statistics exported");
    } catch (err) {
      console.error("Failed to export stats:", err);
      this.showToast("Export failed");
    }
  }

  destroy(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    super.destroy();
  }
}

export default MonitorPage;
