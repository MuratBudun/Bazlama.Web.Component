/**
 * Toggle Panel Component
 * Demonstrates: useToggleClass, @FireRender
 */
import {
  BazlamaWebComponent,
  CustomElement,
  Property,
  ChangeHooks,
  EventAction,
  FireRender,
  useToggleClass,
} from "bazlama-web-component";

@CustomElement("baz-toggle-panel")
export class BazTogglePanel extends BazlamaWebComponent {
  @FireRender()
  @ChangeHooks([
    useToggleClass(".panel", "panel-open", (value) => value === true),
    useToggleClass(".toggle-icon", "rotated", (value) => value === true),
  ])
  @Property({ defaultValue: false })
  isOpen: boolean = false;

  @EventAction(".toggle-header", "click")
  toggle() {
    this.isOpen = !this.isOpen;
  }

  getRenderTemplate(): string {
    return `
      <style>
        :host {
          display: block;
        }
        .toggle-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: #f1f5f9;
          border-radius: 8px;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s;
        }
        .toggle-header:hover {
          background: #e2e8f0;
        }
        .toggle-title {
          font-weight: 500;
          color: #1e293b;
        }
        .toggle-icon {
          font-size: 1.25rem;
          transition: transform 0.3s;
        }
        .toggle-icon.rotated {
          transform: rotate(180deg);
        }
        .panel {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
          background: #f8fafc;
          border-radius: 0 0 8px 8px;
        }
        .panel.panel-open {
          max-height: 200px;
          padding: 1rem;
        }
        .panel-content {
          color: #64748b;
          line-height: 1.6;
        }
        .status {
          margin-top: 1rem;
          padding: 0.5rem;
          background: #e0f2fe;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #0369a1;
        }
      </style>
      <div class="toggle-header">
        <span class="toggle-title">Click to toggle content</span>
        <span class="toggle-icon ${this.isOpen ? "rotated" : ""}">▼</span>
      </div>
      <div class="panel ${this.isOpen ? "panel-open" : ""}">
        <div class="panel-content">
          <p>
            This is the collapsible content! The panel uses <code>useToggleClass</code> 
            to add/remove the <code>panel-open</code> class based on the <code>isOpen</code> property.
          </p>
          <p>
            The <code>@FireRender()</code> decorator ensures the template is re-rendered 
            when the property changes.
          </p>
        </div>
      </div>
      <div class="status">
        Panel is currently: <strong>${this.isOpen ? "Open" : "Closed"}</strong>
      </div>
    `;
  }
}
