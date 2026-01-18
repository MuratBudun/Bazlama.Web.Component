/**
 * Progress Component
 * Demonstrates: useElementStyle, useElementAttribute, useElementText
 */
import {
  BazlamaWebComponent,
  CustomElement,
  Property,
  Attribute,
  ChangeHooks,
  EventAction,
  useElementStyle,
  useElementAttribute,
  useElementText,
} from "bazlama-web-component";

@CustomElement("baz-progress")
export class BazProgress extends BazlamaWebComponent {
  @ChangeHooks([
    useElementStyle(".progress-fill", "width", "%"),
    useElementAttribute(".progress-fill", "aria-valuenow"),
    useElementText(".progress-text", "", "%"),
  ])
  @Attribute("value", true)
  @Property({ defaultValue: 0 })
  value: number = 0;

  @Attribute("max", true)
  @Property({ defaultValue: 100 })
  max: number = 100;

  @EventAction(".progress-slider", "input")
  onSliderChange(
    eventActionName: string,
    element: HTMLElement,
    eventName: string,
    event: Event
  ) {
    const target = event.target as HTMLInputElement;
    this.value = parseInt(target.value, 10);
  }

  getRenderTemplate(): string {
    return `
      <style>
        :host {
          display: block;
        }
        .progress-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .progress-bar {
          background: #e2e8f0;
          border-radius: 999px;
          height: 24px;
          overflow: hidden;
          position: relative;
        }
        .progress-fill {
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          height: 100%;
          border-radius: 999px;
          transition: width 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .progress-text {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
        }
        .slider-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .progress-slider {
          flex: 1;
          height: 8px;
          -webkit-appearance: none;
          appearance: none;
          background: #e2e8f0;
          border-radius: 4px;
          outline: none;
        }
        .progress-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        .progress-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      </style>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${this.value}%" aria-valuenow="${this.value}" role="progressbar"></div>
          <span class="progress-text">${this.value}%</span>
        </div>
        <div class="slider-group">
          <input type="range" class="progress-slider" min="0" max="${this.max}" value="${this.value}" />
        </div>
      </div>
    `;
  }
}
