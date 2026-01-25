import { BasePage } from "../../baz-ui/baz-router/classes/BasePage";
import inputHtml from "./input.htm";
import type { BazInput, IBazInputButton } from "../../baz-ui/baz-input";

/**
 * BazInput component demo page
 */
export class InputPage extends BasePage {
  render(): string {
    return inputHtml;
  }

  init(): void {
    // Playground baz-input component
    const playgroundInput = this.querySelector("#playground-input") as BazInput;
    const generatedCode = this.querySelector("#generated-code") as HTMLElement;

    // Control elements
    const ctrlLabel = this.querySelector("#ctrl-label") as HTMLInputElement;
    const ctrlDescription = this.querySelector("#ctrl-description") as HTMLInputElement;
    const ctrlPrefix = this.querySelector("#ctrl-prefix") as HTMLInputElement;
    const ctrlSuffix = this.querySelector("#ctrl-suffix") as HTMLInputElement;
    const ctrlPlaceholder = this.querySelector("#ctrl-placeholder") as HTMLInputElement;
    const ctrlHelpText = this.querySelector("#ctrl-help-text") as HTMLInputElement;
    const ctrlSize = this.querySelector("#ctrl-size") as HTMLSelectElement;
    const ctrlColor = this.querySelector("#ctrl-color") as HTMLSelectElement;
    const ctrlDisabled = this.querySelector("#ctrl-disabled") as HTMLInputElement;
    const ctrlReadonly = this.querySelector("#ctrl-readonly") as HTMLInputElement;
    const ctrlUseMonoFont = this.querySelector("#ctrl-use-mono-font") as HTMLInputElement;
    const copyCodeBtn = this.querySelector("#copy-code-btn") as HTMLButtonElement;

    // Button controls
    const ctrlBtn1Icon = this.querySelector("#ctrl-btn1-icon") as HTMLSelectElement;
    const ctrlBtn1Color = this.querySelector("#ctrl-btn1-color") as HTMLSelectElement;
    const ctrlBtn2Icon = this.querySelector("#ctrl-btn2-icon") as HTMLSelectElement;
    const ctrlBtn2Color = this.querySelector("#ctrl-btn2-color") as HTMLSelectElement;

    // Example inputs - add buttons
    this.setupExampleInputs();

    const updatePreview = () => {
      if (!playgroundInput) return;

      const label = ctrlLabel?.value || "";
      const description = ctrlDescription?.value || "";
      const prefix = ctrlPrefix?.value || "";
      const suffix = ctrlSuffix?.value || "";
      const placeholder = ctrlPlaceholder?.value || "Type here...";
      const helpText = ctrlHelpText?.value || "";
      const size = ctrlSize?.value || "lg";
      const color = ctrlColor?.value || "neutral";
      const disabled = ctrlDisabled?.checked || false;
      const readonly = ctrlReadonly?.checked || false;
      const useMonoFont = ctrlUseMonoFont?.checked || false;

      // Button config
      const btn1Icon = ctrlBtn1Icon?.value || "";
      const btn1Color = ctrlBtn1Color?.value || "ghost";
      const btn2Icon = ctrlBtn2Icon?.value || "";
      const btn2Color = ctrlBtn2Color?.value || "primary";

      // Update baz-input attributes
      playgroundInput.setAttribute("label", label);
      playgroundInput.setAttribute("description", description);
      playgroundInput.setAttribute("prefix", prefix);
      playgroundInput.setAttribute("suffix", suffix);
      playgroundInput.setAttribute("placeholder", placeholder);
      playgroundInput.setAttribute("help-text", helpText);
      playgroundInput.setAttribute("size", size);
      playgroundInput.setAttribute("color", color);

      if (disabled) {
        playgroundInput.setAttribute("disabled", "");
      } else {
        playgroundInput.removeAttribute("disabled");
      }

      if (readonly) {
        playgroundInput.setAttribute("readonly", "");
      } else {
        playgroundInput.removeAttribute("readonly");
      }

      if (useMonoFont) {
        playgroundInput.setAttribute("use-mono-font-for-prefix-suffix", "");
      } else {
        playgroundInput.removeAttribute("use-mono-font-for-prefix-suffix");
      }

      // Build buttons array
      const buttons: IBazInputButton[] = [];
      if (btn1Icon) {
        buttons.push({
          name: "btn1",
          icon: btn1Icon,
          description: `${btn1Icon} button`,
          color: btn1Color,
          onClick: () => console.log(`Button 1 (${btn1Icon}) clicked`),
        });
      }
      if (btn2Icon) {
        buttons.push({
          name: "btn2",
          icon: btn2Icon,
          description: `${btn2Icon} button`,
          color: btn2Color,
          onClick: () => console.log(`Button 2 (${btn2Icon}) clicked`),
        });
      }

      // Set buttons programmatically
      //playgroundInput.setButtons(buttons);

      // Generate code
      updateGeneratedCode();
    };

    const updateGeneratedCode = () => {
      if (!generatedCode) return;

      const label = ctrlLabel?.value || "";
      const description = ctrlDescription?.value || "";
      const prefix = ctrlPrefix?.value || "";
      const suffix = ctrlSuffix?.value || "";
      const placeholder = ctrlPlaceholder?.value || "Type here...";
      const helpText = ctrlHelpText?.value || "";
      const size = ctrlSize?.value || "lg";
      const color = ctrlColor?.value || "neutral";
      const disabled = ctrlDisabled?.checked || false;
      const readonly = ctrlReadonly?.checked || false;
      const useMonoFont = ctrlUseMonoFont?.checked || false;

      // Button config
      const btn1Icon = ctrlBtn1Icon?.value || "";
      const btn1Color = ctrlBtn1Color?.value || "ghost";
      const btn2Icon = ctrlBtn2Icon?.value || "";
      const btn2Color = ctrlBtn2Color?.value || "primary";

      // Build HTML attributes
      let attrs: string[] = [];
      if (label) attrs.push(`label="${label}"`);
      if (description) attrs.push(`description="${description}"`);
      if (prefix) attrs.push(`prefix="${prefix}"`);
      if (suffix) attrs.push(`suffix="${suffix}"`);
      attrs.push(`placeholder="${placeholder}"`);
      if (helpText) attrs.push(`help-text="${helpText}"`);
      if (size !== "md") attrs.push(`size="${size}"`);
      if (color !== "neutral") attrs.push(`color="${color}"`);
      if (disabled) attrs.push("disabled");
      if (readonly) attrs.push("readonly");
      if (useMonoFont) attrs.push("use-mono-font-for-prefix-suffix");

      // Build buttons JS code
      let buttonsCode = "";
      if (btn1Icon || btn2Icon) {
        buttonsCode = "\n\n// Set buttons programmatically\ninput.setButtons([";
        const btnDefs: string[] = [];
        if (btn1Icon) {
          btnDefs.push(`\n  { name: 'btn1', icon: '${btn1Icon}', color: '${btn1Color}' }`);
        }
        if (btn2Icon) {
          btnDefs.push(`\n  { name: 'btn2', icon: '${btn2Icon}', color: '${btn2Color}' }`);
        }
        buttonsCode += btnDefs.join(",") + "\n]);";
      }

      const htmlCode = `<baz-input id="my-input"\n  ${attrs.join("\n  ")}>\n</baz-input>`;
      const code = htmlCode + buttonsCode;

      generatedCode.textContent = code;
    };

    // Get signal for cleanup
    const signal = this.getSignal();

    // Add event listeners to all text input controls
    const textInputs = [
      ctrlLabel,
      ctrlDescription,
      ctrlPrefix,
      ctrlSuffix,
      ctrlPlaceholder,
      ctrlHelpText,
    ];
    textInputs.forEach((ctrl) => {
      if (ctrl) {
        ctrl.addEventListener("input", updatePreview, { signal });
      }
    });

    // Add change listeners to selects
    const selects = [ctrlSize, ctrlColor, ctrlBtn1Icon, ctrlBtn1Color, ctrlBtn2Icon, ctrlBtn2Color];
    selects.forEach((select) => {
      if (select) {
        select.addEventListener("change", updatePreview, { signal });
      }
    });

    // Add change listeners to checkboxes
    const checkboxes = [ctrlDisabled, ctrlReadonly, ctrlUseMonoFont];
    checkboxes.forEach((checkbox) => {
      if (checkbox) {
        checkbox.addEventListener("change", updatePreview, { signal });
      }
    });

    // Copy code button
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

    // Initialize preview with initial button configuration
    updatePreview();
  }

  /**
   * Setup example inputs with buttons
   */
  private setupExampleInputs(): void {
    // URL input with verify button
    const urlInput = this.querySelector("#example-url") as BazInput;
    if (urlInput) {
      urlInput.setButtons([
        { name: "verify", icon: "check", color: "success", description: "Verify URL" },
      ]);
    }

    // Email input with send button
    const emailInput = this.querySelector("#example-email") as BazInput;
    if (emailInput) {
      emailInput.setButtons([
        { name: "send", icon: "send", color: "primary", description: "Send email" },
      ]);
    }

    // Currency input with calculator button
    const currencyInput = this.querySelector("#example-currency") as BazInput;
    if (currencyInput) {
      currencyInput.setButtons([
        { name: "calc", icon: "calculator", color: "ghost", description: "Calculator" },
      ]);
    }

    // Search input with search and clear buttons
    const searchInput = this.querySelector("#example-search") as BazInput;
    if (searchInput) {
      searchInput.setButtons([
        { name: "clear", icon: "x", color: "ghost", description: "Clear" },
        { name: "search", icon: "search", color: "primary", description: "Search" },
      ]);
    }

    // Size variant inputs with buttons
    const sizeInputs = ["size-xs", "size-sm", "size-md", "size-lg"];
    sizeInputs.forEach((id) => {
      const input = this.querySelector(`#${id}`) as BazInput;
      if (input) {
        input.setButtons([
          { name: "action", icon: "arrow-right", color: "primary", description: "Action" },
        ]);
      }
    });

    // Color variant inputs - just basic buttons
    const colorInputs = [
      "color-primary",
      "color-secondary",
      "color-accent",
      "color-neutral",
      "color-info",
      "color-success",
      "color-warning",
      "color-error",
    ];
    colorInputs.forEach((id) => {
      const input = this.querySelector(`#${id}`) as BazInput;
      if (input) {
        input.setButtons([
          { name: "action", icon: "chevron-right", color: "ghost", description: "Go" },
        ]);
      }
    });

    // State inputs
    const normalInput = this.querySelector("#state-normal") as BazInput;
    if (normalInput) {
      normalInput.setButtons([
        { name: "action", icon: "edit", color: "ghost", description: "Edit" },
      ]);
    }
  }
}

export default InputPage;
