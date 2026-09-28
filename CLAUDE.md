# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`bazlama-web-component` is a zero-dependency, decorator-based TypeScript framework for building native Web Components (published to npm). The repo contains the library (`libs/core`), three demo apps (`samples/*`, deployed to GitHub Pages), and a Vitest suite (`tests/core`).

## Commands

Library (run inside `libs/core`):
```bash
npm run build          # vite library build -> dist/ (es, cjs, umd + .d.ts via vite-plugin-dts)
```

Samples (run inside `samples/sample`, `samples/sample-core`, or `samples/sample-daisyui`):
```bash
npm run dev            # vite dev server
npm run build          # tsc && vite build; BASE_PATH env var sets the vite `base`
```

Root:
```bash
npm test                                                        # vitest (jsdom) using tests/vitest.config.ts
npx vitest run --config tests/vitest.config.ts tests/core/BazConvert.test.ts   # single file
npx vitest run --config tests/vitest.config.ts -t "test name"                  # single test by name
npm run lint / lint:fix / format / format:check
```

**Known path mismatch:** the root `package.json` scripts (`build`, `lint`, `format`, `clean`, workspaces) and `tests/vitest.config.ts` / `tests/tsconfig.json` still point at `packages/core`, but the library lives in `libs/core`. As a result `npm test` currently fails with `Failed to resolve import "@bazlama/core"`, and root `npm run build`/`lint`/`format` target nothing. Fix the paths (alias `@bazlama/core` → `libs/core/src/index.ts`) before relying on them. `eslint.config.js` already uses the correct `libs/core` paths.

## How samples consume the library

Samples import from `"bazlama-web-component"`, which resolves to `libs/core` (via `file:../../libs/core` dependencies, and a root `node_modules/bazlama-web-component` symlink for `sample-daisyui`). The package's `exports` point to `dist/`, so **rebuild `libs/core` after changing library source** before the samples see the change. CI (`deploy-sample.yml`) does the same: build core, then build each sample with its `BASE_PATH`.

Samples load HTML templates from `.htm` files through a local Vite plugin (`src/vite-plugin/htm-import.ts`): plain `import x from "./template.htm"` yields a raw string; `?html` yields an `HTMLTemplateElement`; `?template`/`?tpl` yields a `{{placeholder}}` render function. `sample-daisyui` also contains a reusable UI kit (`src/baz-ui/`) including a hash/lazy page router.

## Core architecture (`libs/core/src`)

- **`BazlamaWebComponent`** extends `HTMLElement`. The constructor takes a `ShadowRootMode` (default **Closed**; `None` renders into light DOM) and sets `this.root`. Lifecycle: `connectedCallback` → `InitBazlamaWebComponent()` (installs property getters/setters, builds event action maps) → `onConnected()` → `render()`. `render()` clears the selector cache, sets `root.innerHTML = beforeRender(getRenderTemplate())`, runs every property's change hooks with the current value, wires `@EventAction` listeners, then calls `afterRender()`. Subclasses override `getRenderTemplate`, `onConnected`, `onDisconnected`, `beforeRender`, `afterRender`.
- **Static per-class metadata**: `PropertyDefines`, `EventActionDefines`, and `PropertyChangeHandlers` are stored on the subclass constructor (lazily created via `getStaticStorage`). `observedAttributes` triggers `InitPropertyDefines()` once, merging the programmatic `static CreatePropertyDefines()` / `static CreatePropertyHooks()` with decorator-created defines.
- **`PropertyDefine`** holds type, default, attribute mapping, flags, and `changeHooks`. The data flow: setting a property whose define is an attribute calls `setAttribute` → `attributeChangedCallback` → `setDirectValue`; non-attribute properties go straight to `setDirectValue`. `setDirectValue` coerces the value via `BazConvert` based on `valueTypeName` (inferred from the field initializer's `typeof` in `InitProperty`), runs the change hooks, re-renders if `isFireRenderOnChanged`, and dispatches `property-changed` and `<name>-changed` CustomEvents if `isFireEventOnChanged`.
- **Decorators** (`decorator/`): `@Property` and `@Attribute` create or update a `PropertyDefine`. `@ChangeHooks`, `@FireRender`, and `@FireEvent` **throw if the define doesn't exist yet**. TypeScript applies decorators bottom-up, so `@Property`/`@Attribute` must be the lowest decorator (closest to the field), as in the samples:
  ```ts
  @FireEvent()
  @ChangeHooks([useElementInputValue("input")])
  @Attribute("value", true)
  public value: string = ""
  ```
  `@EventAction(selector, eventName)` registers a method; it's bound per instance and attached to all matching elements in `root` after each render. `@CustomElement(tag)` calls `customElements.define`.
- **Hooks** (`property/hooks/use*.ts`) are factories returning `(component, value, propertyDefine, oldValue) => void`. They look up targets with `queryCached` (`helper/SelectorCache.ts`, a WeakMap cache per component, cleared on every render). New hooks must be exported from `src/index.ts`, the only public entry point.
- **Errors**: use `BazlamaError` subclasses and `bazlamaWarn`/`bazlamaLogError` from `helper/BazlamaError.ts`.

Consumers need `experimentalDecorators: true` (legacy decorators) in `tsconfig.json`.

## Conventions

- Prettier config: 2 spaces, double quotes, semicolons, width 100. Library and tests follow it; much sample code is older style (4 spaces, no semicolons), so match the file you're editing.
- ESLint enforces `consistent-type-imports` (use `import type` for types) and `_`-prefixed names for intentionally unused vars.

## Experimental redesign (`next/`)

`next/` is a separate, self-contained project (own `package.json` and `node_modules`, not part of the root workspaces) for the redesign: `packages/core` (signals + `html` templates + `define()`), `packages/headless` (`bz-*` elements, light DOM, `data-part` anatomy), `packages/ui` (CSS only, `@layer bazlama.*`), `packages/themes` (token files), `packages/router` (Navigation API router: `createRouter`, `definePage`, `<bz-outlet>`), and a Vite `playground` that itself runs on the router (path URLs such as `/button`). Run commands inside `next/`: `npm run dev`, `npm test`, `npm run typecheck`, `npm run size`. Design decisions and measured observations are in `next/README.md`. VS Code debug configs for the playground (Chrome/Edge, with the dev server as a pre-launch task) and for Vitest are in the root `.vscode/launch.json` and `.vscode/tasks.json`.

## Releases

Publishing is driven by pushing a `v*.*.*` tag. `publish-npm.yml` sets `libs/core`'s version from the tag, builds, and publishes to npm (`NPM_TOKEN` secret), then creates a GitHub Release from `CHANGELOG.md`. Update `CHANGELOG.md` (Keep a Changelog sections) before tagging. See `RELEASE.md`.
