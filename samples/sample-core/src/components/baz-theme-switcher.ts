/**
 * Theme Switcher Component
 * Demonstrates: useSwitchClass, @FireEvent
 */
import {
  BazlamaWebComponent,
  CustomElement,
  Property,
  Attribute,
  ChangeHooks,
  EventAction,
  FireEvent,
  useSwitchClass,
} from "bazlama-web-component";

@CustomElement("baz-theme-switcher")
export class BazThemeSwitcher extends BazlamaWebComponent {
  @FireEvent()
  @ChangeHooks([useSwitchClass(".theme-display", "theme-")])
  @Attribute("theme", true)
  @Property({ defaultValue: "light" })
  theme: string = "light";

  @EventAction(".btn-light", "click")
  setLight() {
    this.theme = "light";
  }

  @EventAction(".btn-dark", "click")
  setDark() {
    this.theme = "dark";
  }

  @EventAction(".btn-blue", "click")
  setBlue() {
    this.theme = "blue";
  }

  getRenderTemplate(): string {
    return `
      <style>
        :host {
          display: block;
        }
        .theme-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .theme-display {
          padding: 2rem;
          border-radius: 8px;
          text-align: center;
          font-weight: 500;
          transition: all 0.3s;
        }
        .theme-display.theme-light {
          background: #f8fafc;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }
        .theme-display.theme-dark {
          background: #1e293b;
          color: #f8fafc;
        }
        .theme-display.theme-blue {
          background: #3b82f6;
          color: white;
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
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-light {
          background: #f8fafc;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }
        .btn-dark {
          background: #1e293b;
          color: #f8fafc;
        }
        .btn-blue {
          background: #3b82f6;
          color: white;
        }
        button:hover {
          opacity: 0.8;
        }
      </style>
      <div class="theme-container">
        <div class="theme-display theme-${this.theme}">
          Current Theme: ${this.theme}
        </div>
        <div class="buttons">
          <button class="btn-light">Light</button>
          <button class="btn-dark">Dark</button>
          <button class="btn-blue">Blue</button>
        </div>
      </div>
    `;
  }
}
