/**
 * Accordion Component
 * Demonstrates: useToggleClass, multiple panels, dynamic height
 */
import {
  BazlamaWebComponent,
  CustomElement,
  Property,
  EventAction,
} from "bazlama-web-component";

@CustomElement("baz-accordion")
export class BazAccordion extends BazlamaWebComponent {
  @Property({ defaultValue: -1 })
  activePanel: number = -1;

  @EventAction(".accordion-header", "click")
  onHeaderClick(
    _eventActionName: string,
    element: HTMLElement,
    _eventName: string,
    _event: Event
  ) {
    const index = parseInt(element.dataset.index || "-1", 10);
    this.activePanel = this.activePanel === index ? -1 : index;
    this.updatePanels();
  }

  private updatePanels(): void {
    const headers = this.root?.querySelectorAll(".accordion-header");
    const contents = this.root?.querySelectorAll(".accordion-content");

    headers?.forEach((header, index) => {
      if (index === this.activePanel) {
        header.classList.add("active");
      } else {
        header.classList.remove("active");
      }
    });

    contents?.forEach((content, index) => {
      const el = content as HTMLElement;
      if (index === this.activePanel) {
        el.style.maxHeight = el.scrollHeight + "px";
        el.classList.add("open");
      } else {
        el.style.maxHeight = "0";
        el.classList.remove("open");
      }
    });
  }

  getRenderTemplate(): string {
    return `
      <style>
        :host {
          display: block;
        }
        .accordion {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .accordion-item {
          border-bottom: 1px solid #e2e8f0;
        }
        .accordion-item:last-child {
          border-bottom: none;
        }
        .accordion-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 16px 20px;
          border: none;
          background: #f8fafc;
          cursor: pointer;
          text-align: left;
          font-size: 15px;
          font-weight: 500;
          color: #334155;
          transition: background 0.2s;
        }
        .accordion-header:hover {
          background: #f1f5f9;
        }
        .accordion-header.active {
          background: #eff6ff;
          color: #3b82f6;
        }
        .accordion-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }
        .accordion-header.active .accordion-icon {
          transform: rotate(180deg);
        }
        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
          background: white;
        }
        .accordion-content.open {
          border-top: 1px solid #e2e8f0;
        }
        .accordion-body {
          padding: 16px 20px;
          color: #64748b;
          line-height: 1.6;
        }
        .accordion-body h4 {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 14px;
        }
        .accordion-body p {
          margin: 0;
        }
        .accordion-body ul {
          margin: 8px 0 0 0;
          padding-left: 20px;
        }
        .accordion-body li {
          margin: 4px 0;
        }
      </style>
      <div class="accordion">
        <div class="accordion-item">
          <button class="accordion-header" data-index="0">
            <span>🎯 What is Bazlama Web Component?</span>
            <span class="accordion-icon">▼</span>
          </button>
          <div class="accordion-content">
            <div class="accordion-body">
              <h4>A Modern Web Component Framework</h4>
              <p>Bazlama Web Component is a lightweight TypeScript framework that makes building custom elements simple and intuitive using decorators.</p>
            </div>
          </div>
        </div>
        <div class="accordion-item">
          <button class="accordion-header" data-index="1">
            <span>⚡ Key Features</span>
            <span class="accordion-icon">▼</span>
          </button>
          <div class="accordion-content">
            <div class="accordion-body">
              <h4>What's Included</h4>
              <ul>
                <li><strong>@Property</strong> - Reactive property binding</li>
                <li><strong>@Attribute</strong> - Attribute reflection</li>
                <li><strong>@ChangeHooks</strong> - DOM update hooks</li>
                <li><strong>@EventAction</strong> - Declarative event handling</li>
                <li><strong>@FireEvent</strong> - Custom event dispatching</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="accordion-item">
          <button class="accordion-header" data-index="2">
            <span>🚀 Getting Started</span>
            <span class="accordion-icon">▼</span>
          </button>
          <div class="accordion-content">
            <div class="accordion-body">
              <h4>Quick Start Guide</h4>
              <p>Install the package, extend BazlamaWebComponent, add your decorators, and implement getRenderTemplate(). That's all you need to create powerful custom elements!</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
