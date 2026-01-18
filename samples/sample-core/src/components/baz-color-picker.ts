/**
 * Color Picker Component
 * Demonstrates: Multiple ChangeHooks, useElementStyle, custom events
 */
import {
  BazlamaWebComponent,
  CustomElement,
  Property,
  Attribute,
  ChangeHooks,
  EventAction,
  useElementStyle,
  useElementText,
} from "bazlama-web-component";

@CustomElement("baz-color-picker")
export class BazColorPicker extends BazlamaWebComponent {
  @ChangeHooks([
    useElementStyle(".color-preview", "background-color"),
    useElementText(".hex-value"),
  ])
  @Attribute("color", true)
  @Property({ defaultValue: "#3b82f6" })
  color: string = "#3b82f6";

  private fireColorChange(detail: { color: string; rgb: string }): void {
    this.dispatchEvent(
      new CustomEvent("color-change", { detail, bubbles: true, composed: true })
    );
  }

  @EventAction(".color-input", "input")
  onColorInput(
    _eventActionName: string,
    _element: HTMLElement,
    _eventName: string,
    event: Event
  ) {
    const target = event.target as HTMLInputElement;
    this.color = target.value;
    this.fireColorChange({
      color: this.color,
      rgb: this.hexToRgb(this.color),
    });
    this.updateRgbDisplay();
  }

  @EventAction(".preset-color", "click")
  onPresetClick(
    _eventActionName: string,
    element: HTMLElement,
    _eventName: string,
    _event: Event
  ) {
    const color = element.dataset.color;
    if (color) {
      this.color = color;
      const colorInput = this.root?.querySelector(".color-input") as HTMLInputElement;
      if (colorInput) {
        colorInput.value = color;
      }
      this.fireColorChange({
        color: this.color,
        rgb: this.hexToRgb(this.color),
      });
      this.updateRgbDisplay();
    }
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
    }
    return "rgb(0, 0, 0)";
  }

  private updateRgbDisplay(): void {
    const rgbDisplay = this.root?.querySelector(".rgb-value");
    if (rgbDisplay) {
      rgbDisplay.textContent = this.hexToRgb(this.color);
    }
  }

  onConnected(): void {
    super.onConnected();
    // Set initial RGB value after render
    setTimeout(() => this.updateRgbDisplay(), 0);
  }

  getRenderTemplate(): string {
    return `
      <style>
        :host {
          display: block;
        }
        .picker-container {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .preview-section {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }
        .color-preview {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          background-color: #3b82f6;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .color-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 8px;
        }
        .color-value {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .color-label {
          font-size: 12px;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 600;
          width: 40px;
        }
        .hex-value, .rgb-value {
          font-family: monospace;
          font-size: 14px;
          color: #334155;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .input-section {
          margin-bottom: 20px;
        }
        .color-input {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          padding: 4px;
        }
        .color-input::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        .color-input::-webkit-color-swatch {
          border: none;
          border-radius: 6px;
        }
        .presets-section h4 {
          margin: 0 0 12px 0;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        .preset-colors {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .preset-color {
          width: 36px;
          height: 36px;
          border: 2px solid white;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .preset-color:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
      </style>
      <div class="picker-container">
        <div class="preview-section">
          <div class="color-preview"></div>
          <div class="color-info">
            <div class="color-value">
              <span class="color-label">HEX</span>
              <span class="hex-value">#3b82f6</span>
            </div>
            <div class="color-value">
              <span class="color-label">RGB</span>
              <span class="rgb-value">rgb(59, 130, 246)</span>
            </div>
          </div>
        </div>
        <div class="input-section">
          <input type="color" class="color-input" value="#3b82f6" />
        </div>
        <div class="presets-section">
          <h4>Preset Colors</h4>
          <div class="preset-colors">
            <button class="preset-color" data-color="#ef4444" style="background: #ef4444"></button>
            <button class="preset-color" data-color="#f97316" style="background: #f97316"></button>
            <button class="preset-color" data-color="#eab308" style="background: #eab308"></button>
            <button class="preset-color" data-color="#22c55e" style="background: #22c55e"></button>
            <button class="preset-color" data-color="#14b8a6" style="background: #14b8a6"></button>
            <button class="preset-color" data-color="#3b82f6" style="background: #3b82f6"></button>
            <button class="preset-color" data-color="#8b5cf6" style="background: #8b5cf6"></button>
            <button class="preset-color" data-color="#ec4899" style="background: #ec4899"></button>
          </div>
        </div>
      </div>
    `;
  }
}
