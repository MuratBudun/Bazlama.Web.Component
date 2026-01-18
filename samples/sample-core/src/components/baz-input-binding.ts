/**
 * Input Binding Component
 * Demonstrates: useElementInputValue, useElementText (two-way binding)
 */
import {
  BazlamaWebComponent,
  CustomElement,
  Property,
  ChangeHooks,
  useElementInputValue,
  useElementText,
} from "bazlama-web-component";

@CustomElement("baz-input-binding")
export class BazInputBinding extends BazlamaWebComponent {
  @ChangeHooks([
    useElementInputValue(".text-input"),
    useElementText(".text-preview"),
    useElementText(".char-count", "Characters: "),
  ])
  @Property({ defaultValue: "Hello, World!" })
  text: string = "Hello, World!";

  getRenderTemplate(): string {
    return `
      <style>
        :host {
          display: block;
        }
        .binding-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
        }
        input {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus {
          border-color: #3b82f6;
        }
        .preview-box {
          background: #f1f5f9;
          border-radius: 8px;
          padding: 1rem;
        }
        .text-preview {
          font-size: 1.25rem;
          color: #1e293b;
          word-break: break-word;
        }
        .char-count {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 0.5rem;
        }
      </style>
      <div class="binding-container">
        <div class="input-group">
          <label>Type something:</label>
          <input type="text" class="text-input" placeholder="Enter text..." />
        </div>
        <div class="preview-box">
          <div class="text-preview">${this.text}</div>
          <div class="char-count">Characters: ${this.text.length}</div>
        </div>
      </div>
    `;
  }
}
