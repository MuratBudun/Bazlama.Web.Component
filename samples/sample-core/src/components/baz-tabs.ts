/**
 * Tabs Component
 * Demonstrates: Multiple EventActions, dynamic class management
 */
import {
  BazlamaWebComponent,
  CustomElement,
  Property,
  Attribute,
  EventAction,
} from "bazlama-web-component";

@CustomElement("baz-tabs")
export class BazTabs extends BazlamaWebComponent {
  @Attribute("active-tab", true)
  @Property({ defaultValue: 0 })
  activeTab: number = 0;

  @EventAction(".tab-btn-1", "click")
  onTab1Click() {
    this.activeTab = 0;
    this.updateTabs();
  }

  @EventAction(".tab-btn-2", "click")
  onTab2Click() {
    this.activeTab = 1;
    this.updateTabs();
  }

  @EventAction(".tab-btn-3", "click")
  onTab3Click() {
    this.activeTab = 2;
    this.updateTabs();
  }

  private updateTabs(): void {
    const buttons = this.root?.querySelectorAll(".tab-btn");
    const contents = this.root?.querySelectorAll(".tab-content");

    buttons?.forEach((btn, index) => {
      btn.classList.toggle("active", index === this.activeTab);
    });

    contents?.forEach((content, index) => {
      content.classList.toggle("visible", index === this.activeTab);
    });
  }

  onRendered(): void {
    this.updateTabs();
  }

  getRenderTemplate(): string {
    return `
      <style>
        :host {
          display: block;
        }
        .tabs-container {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .tab-buttons {
          display: flex;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .tab-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
        }
        .tab-btn:hover {
          color: #3b82f6;
          background: #eff6ff;
        }
        .tab-btn.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background: white;
        }
        .tab-content {
          display: none;
          padding: 20px;
        }
        .tab-content.visible {
          display: block;
        }
        .tab-content h4 {
          margin: 0 0 8px 0;
          color: #1e293b;
        }
        .tab-content p {
          margin: 0;
          color: #64748b;
          line-height: 1.6;
        }
      </style>
      <div class="tabs-container">
        <div class="tab-buttons">
          <button class="tab-btn tab-btn-1 active">Overview</button>
          <button class="tab-btn tab-btn-2">Features</button>
          <button class="tab-btn tab-btn-3">Usage</button>
        </div>
        <div class="tab-content tab-content-1 visible">
          <h4>📖 Overview</h4>
          <p>Bazlama Web Component is a lightweight framework for building reusable web components with TypeScript decorators.</p>
        </div>
        <div class="tab-content tab-content-2">
          <h4>✨ Features</h4>
          <p>Property binding, attribute reflection, event actions, change hooks, and more. All with a simple decorator-based API.</p>
        </div>
        <div class="tab-content tab-content-3">
          <h4>🚀 Usage</h4>
          <p>Extend BazlamaWebComponent, add decorators to your properties, and implement getRenderTemplate() to define your component's HTML.</p>
        </div>
      </div>
    `;
  }
}
