# Bazlama.Web.Component

Bazlama.Web.Component is a zero dependency web component library written in TypeScript. This library provides an easy way to manage properties and attributes for web components, making it lightweight and fast. With the slogan "zero dependency", Bazlama.Web.Component targets developers who prefer native development without using front-end frameworks.

## Features

- **Zero Dependency**: Works without any dependencies.
- **Lightweight and Fast**: Offers minimal size and high performance.
- **Easy Property and Attribute Management**: Simplifies managing properties and attributes in web components.
- **Hook System**: Includes a hook system that triggers when property values change.
- **Free to Use**: Completely free to use.

## Installation

You can easily install Bazlama.Web.Component via npm:

```bash
npm install bazlama-web-component
```

## Example
For more information and examples, visit our [GitHub page.](https://github.com/MuratBudun/Bazlama.Web.Component)



![TestWebComponentScreen01](https://github.com/user-attachments/assets/b8a7a668-d13b-444f-a2df-ca0ddbe12d23)

### index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bazlama Web Component Sample</title>
    <script type="module" src="/src/main.ts"></script>
  </head>
  <body>
      <test-user-card p-user-name="muratbudun" p-department="Computer Engineering" p-user-age="47"/>
  </body>
</html>
```

### test-user-card.ts
```typescript
import { BazlamaWebComponent, BazlamaProperty, useElementText, useElementInputValue, ShadowRootMode } from "bazlama-web-component"
import css from "./test-user-card.css"

class TestUserCard extends BazlamaWebComponent {
    private ComponentTitle = "Sample Bazlama Web Component"

    static get Properties(): BazlamaProperty<any>[] {
        return [
            new BazlamaProperty<string>("userName", {
                defaultValue: "Murat",
                isAttribute: true,
                isAttributeObserved: true,
                attributeName: "p-user-name",
                changeHooks: [
                    useElementText("#username"),
                    useElementInputValue("#username-input"),
                ],
            }),

            new BazlamaProperty<string>("department", {
                defaultValue: "Computer Engineering",
                isAttribute: true,
                isAttributeObserved: true,
                attributeName: "p-department",
                changeHooks: [
                    useElementText("#department"),
                    useElementInputValue("#department-input"),
                ],
            }),

            new BazlamaProperty<number>("userAge", {
                defaultValue: 47,
                isAttribute: true,
                isAttributeObserved: true,
                attributeName: "p-user-age",
                changeHooks: [
                    useElementText("#age"),
                    useElementInputValue("#age-input"),
                ],
            }),
        ]
    }

    getRenderTemplate(): string {
        return `
            <style>${css}</style>
            <div class="vertical container">
                <span class="title">${this.ComponentTitle}</span>
                <div class="horizontal">
                    <div class="card">
                        <div class="form-control">
                            <label for="username">User Name</label>
                            <input type="text" id="username-input" />
                        </div>
                        <div class="form-control">
                            <label for="department">User Department</label>
                            <input type="text" id="department-input" />
                        </div>
                        <div class="form-control">
                            <label for="age">User Age</label>
                            <input type="number" id="age-input" />
                        </div>
                    </div>
                    <div class="card">
                        <div class="form-control">
                            <label for="username">User Name</label>
                            <span id="username"></span>
                        </div>
                        <div class="form-control">
                            <label for="department">User Department</label>
                            <span id="department"></span>
                        </div>
                        <div class="form-control">
                            <label for="age">User Age</label>
                            <span id="age"></span>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
}

window.customElements.define("test-user-card", TestUserCard) 
```

### test-user-card.css.ts
```typescript
export default `
.container {
    background-color: rgba(200, 200, 200, 0.5);
    border-radius: 10px;
    padding: 10px 15px;
}

.vertical {
    display: inline-flex;
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
    border-radius: 10px;
}

.horizontal {
    display: flex;
    justify-content: left;
    gap: 10px;
    align-items: stretch;
    border-radius: 10px;
}

.title {
    font: 1.5em sans-serif;
    font-weight: bold;
    padding: 5px 0;
}

.card {
    background-color: rgba(200, 200, 200, 0.5);
    padding: 10px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    min-width: 200px;
}

.form-control {
    font: 0.9em sans-serif;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 5px;
}

.form-control label {
    font-weight: bold;
}

.form-control input {
    padding: 5px;
    border-radius: 5px;
    border: 1px solid #ccc;
}

.form-control input:focus {
    outline: none;
    border-color: #d19d2ed1;
}
`
```