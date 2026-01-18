/**
 * Counter Component
 * Demonstrates: @Property, @Attribute, @ChangeHooks, @EventAction
 */
import {
  BazlamaWebComponent,
  CustomElement,
  Property,
  Attribute,
  ChangeHooks,
  EventAction,
  useElementText,
} from "bazlama-web-component";

@CustomElement("baz-counter")
export class BazCounter extends BazlamaWebComponent {
  @ChangeHooks([useElementText(".count-display")])
  @Attribute("count", true)
  @Property({ defaultValue: 0 })
  count: number = 0;

  @EventAction(".btn-increment", "click")
  onIncrement() {
    this.count++;
  }

  @EventAction(".btn-decrement", "click")
  onDecrement() {
    this.count--;
  }

  @EventAction(".btn-reset", "click")
  onReset() {
    this.count = 0;
  }

  getRenderTemplate(): string {
    return `
      <style>
        :host {
          display: block;
        }
        .counter-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .count-display {
          font-size: 2rem;
          font-weight: bold;
          min-width: 80px;
          text-align: center;
          color: #3b82f6;
        }
        .buttons {
          display: flex;
          gap: 0.5rem;
        }
        button {
          cursor: pointer;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-increment {
          background: #22c55e;
          color: white;
        }
        .btn-increment:hover {
          background: #16a34a;
        }
        .btn-decrement {
          background: #ef4444;
          color: white;
        }
        .btn-decrement:hover {
          background: #dc2626;
        }
        .btn-reset {
          background: #e2e8f0;
          color: #1e293b;
        }
        .btn-reset:hover {
          background: #cbd5e1;
        }
      </style>
      <div class="counter-container">
        <div class="count-display">${this.count}</div>
        <div class="buttons">
          <button class="btn-decrement">−</button>
          <button class="btn-increment">+</button>
          <button class="btn-reset">Reset</button>
        </div>
      </div>
    `;
  }
}
