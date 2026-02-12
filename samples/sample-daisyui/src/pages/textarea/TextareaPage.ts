import { BasePage } from "../../baz-ui/baz-router/classes/BasePage";
import textareaHtml from "./textarea.htm";

export class TextareaPage extends BasePage {
  render(): string {
    return textareaHtml;
  }

  init(): void {
    const playgroundTextarea = this.querySelector("#playground-textarea") as HTMLTextAreaElement;
    const generatedCode = this.querySelector("#generated-code") as HTMLElement;

    const ctrlPlaceholder = this.querySelector("#ctrl-placeholder") as HTMLInputElement;
    const ctrlRows = this.querySelector("#ctrl-rows") as HTMLInputElement;
    const ctrlValue = this.querySelector("#ctrl-value") as HTMLInputElement;
    const ctrlSize = this.querySelector("#ctrl-size") as HTMLSelectElement;
    const ctrlColor = this.querySelector("#ctrl-color") as HTMLSelectElement;
    const ctrlDisabled = this.querySelector("#ctrl-disabled") as HTMLInputElement;
    const ctrlReadonly = this.querySelector("#ctrl-readonly") as HTMLInputElement;
    const copyCodeBtn = this.querySelector("#copy-code-btn") as HTMLButtonElement;

    const buildTextareaClass = (size: string, color: string) => {
      const classes = ["textarea", "textarea-bordered", "w-full"];

      if (size && size !== "md") {
        classes.push(`textarea-${size}`);
      }

      if (color && color !== "neutral") {
        classes.push(`textarea-${color}`);
      }

      return classes.join(" ");
    };

    const updatePreview = () => {
      if (!playgroundTextarea) return;

      const placeholder = ctrlPlaceholder?.value || "Write a message...";
      const rows = Number.parseInt(ctrlRows?.value || "4", 10);
      const value = ctrlValue?.value || "";
      const size = ctrlSize?.value || "md";
      const color = ctrlColor?.value || "neutral";
      const disabled = ctrlDisabled?.checked || false;
      const readonly = ctrlReadonly?.checked || false;

      playgroundTextarea.placeholder = placeholder;
      playgroundTextarea.rows = Number.isFinite(rows) ? rows : 4;
      playgroundTextarea.value = value;
      playgroundTextarea.className = buildTextareaClass(size, color);

      if (disabled) {
        playgroundTextarea.setAttribute("disabled", "");
      } else {
        playgroundTextarea.removeAttribute("disabled");
      }

      if (readonly) {
        playgroundTextarea.setAttribute("readonly", "");
      } else {
        playgroundTextarea.removeAttribute("readonly");
      }

      updateGeneratedCode();
    };

    const escapeHtml = (value: string) =>
      value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const updateGeneratedCode = () => {
      if (!generatedCode) return;

      const placeholder = ctrlPlaceholder?.value || "Write a message...";
      const rows = Number.parseInt(ctrlRows?.value || "4", 10);
      const value = ctrlValue?.value || "";
      const size = ctrlSize?.value || "md";
      const color = ctrlColor?.value || "neutral";
      const disabled = ctrlDisabled?.checked || false;
      const readonly = ctrlReadonly?.checked || false;

      const className = buildTextareaClass(size, color);
      const attrs: string[] = [];
      attrs.push(`class="${className}"`);
      attrs.push(`rows="${Number.isFinite(rows) ? rows : 4}"`);
      attrs.push(`placeholder="${placeholder}"`);
      if (disabled) attrs.push("disabled");
      if (readonly) attrs.push("readonly");

      const code = `<textarea ${attrs.join(" ")}>${escapeHtml(value)}</textarea>`;
      generatedCode.textContent = code;
    };

    const signal = this.getSignal();

    const textInputs = [ctrlPlaceholder, ctrlRows, ctrlValue];
    textInputs.forEach((ctrl) => {
      if (ctrl) {
        ctrl.addEventListener("input", updatePreview, { signal });
      }
    });

    const selects = [ctrlSize, ctrlColor];
    selects.forEach((select) => {
      if (select) {
        select.addEventListener("change", updatePreview, { signal });
      }
    });

    const checkboxes = [ctrlDisabled, ctrlReadonly];
    checkboxes.forEach((checkbox) => {
      if (checkbox) {
        checkbox.addEventListener("change", updatePreview, { signal });
      }
    });

    if (copyCodeBtn) {
      copyCodeBtn.addEventListener(
        "click",
        async () => {
          const code = generatedCode?.textContent || "";
          try {
            await navigator.clipboard.writeText(code);
            const originalText = copyCodeBtn.innerHTML;
            copyCodeBtn.innerHTML = '<baz-icon icon="check"></baz-icon> Copied!';
            copyCodeBtn.classList.add("btn-success");
            copyCodeBtn.classList.remove("btn-primary");
            setTimeout(() => {
              copyCodeBtn.innerHTML = originalText;
              copyCodeBtn.classList.remove("btn-success");
              copyCodeBtn.classList.add("btn-primary");
            }, 2000);
          } catch (err) {
            console.error("Failed to copy:", err);
          }
        },
        { signal }
      );
    }

    updatePreview();
  }
}

export default TextareaPage;
