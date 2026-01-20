# Bazlama Web Component

A lightweight, decorator-based TypeScript framework for building modern Web Components with reactive properties, automatic DOM updates, and zero dependencies.

## Features

- **Zero Dependencies**: No external runtime dependencies - pure TypeScript compiled to standard Web Components
- **Lightweight and Fast**: Minimal size with high performance
- **Decorator-Based API**: Use familiar TypeScript decorators like `@Property`, `@Attribute`, and `@EventAction`
- **Reactive Properties**: Automatic DOM updates when properties change with `@ChangeHooks`
- **Shadow DOM Support**: Choose between Shadow DOM (open/closed) or Light DOM
- **Built-in Hooks**: 11+ pre-built hooks for common DOM operations
- **TypeScript First**: Full TypeScript support with type-safe decorators and intellisense
- **MIT License**: Free to use in any project

## Live Demos

Try out Bazlama Web Component with interactive examples:

- **[Full Documentation & Interactive Samples](https://muratbudun.github.io/Bazlama.Web.Component/)** - Complete documentation with live examples
- **[DaisyUI Component Library](https://muratbudun.github.io/Bazlama.Web.Component/sample-daisyui/)** - Modern UI components with DaisyUI and Router
- **[Core Examples](https://muratbudun.github.io/Bazlama.Web.Component/sample-core/)** - Basic usage examples

## Installation

```bash
npm install bazlama-web-component
```

## TypeScript Configuration

Enable decorators in your `tsconfig.json`:

```json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "target": "ES2020",
        "module": "ESNext",
        "moduleResolution": "bundler"
    }
}
```

## Quick Example

```typescript
import { 
    BazlamaWebComponent, 
    CustomElement, 
    Property, 
    Attribute,
    ChangeHooks,
    EventAction,
    useElementText 
} from "bazlama-web-component"

@CustomElement("hello-world")
class HelloWorld extends BazlamaWebComponent {
    constructor() {
        super()
        this.InitBazlamaWebComponent()
    }

    @ChangeHooks([useElementText(".greeting")])
    @Attribute("name", true)
    @Property({ defaultValue: "World" })
    name: string = "World"

    @EventAction(".btn", "click")
    onButtonClick() {
        this.name = "Bazlama"
    }

    getRenderTemplate() {
        return `
            <div class="container">
                <h1 class="greeting">Hello, World!</h1>
                <button class="btn">Change Name</button>
            </div>
        `
    }
}
```

## Usage in HTML

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module" src="./hello-world.ts"></script>
</head>
<body>
    <hello-world name="Developer"></hello-world>
</body>
</html>
```

## Documentation

For complete documentation, examples, and live demos, visit our [samples page](./samples/sample/).

## Key Concepts

### Decorators
TypeScript decorators provide declarative syntax for defining properties, attributes, and event handlers.

### Reactive Properties
`@Property` creates reactive properties. When changed, hooks are automatically triggered.

### Change Hooks
`@ChangeHooks` connects property changes to DOM updates without manual manipulation.

### Event Actions
`@EventAction` binds DOM events to methods with automatic cleanup.

### Shadow DOM
Components use Shadow DOM by default for style encapsulation. Use `ShadowRootMode.None` for light DOM.

## Built-in Hooks

- `useElementText` - Update element text content
- `useElementProperty` - Sync with element properties
- `useElementAttribute` - Manage element attributes
- `useElementStyle` - Apply CSS styles
- `useToggleClass` - Toggle CSS classes
- `useSwitchClass` - Switch between classes
- `useAddRemoveClass` - Add/remove classes conditionally
- `useElementInputValue` - Sync with input values
- `useFunction` - Execute custom functions
- `useCustomHook` - Create custom logic
- And more...

## Releases

New versions are automatically published to NPM when a version tag is pushed to the repository.

See [RELEASE.md](./RELEASE.md) for detailed release process and [CHANGELOG.md](./CHANGELOG.md) for version history.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see LICENSE file for details.


