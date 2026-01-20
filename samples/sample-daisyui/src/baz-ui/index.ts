// Barrel export for all Bazlama UI components
// Usage: import "./baz-ui" to import all components at once
// Or: import "./baz-ui/baz-icon/baz-icon" for individual components

import "./baz-textbox/baz-textbox"
import "./baz-icon/baz-icon"
import "./baz-modal/baz-modal"
import "./baz-tab/baz-tab"
import "./baz-theme/baz-theme-switcher"

// Re-export classes for programmatic usage if needed
export { default as PageRouter } from "./baz-router/classes/PageRouter"
export { default as PageRoute } from "./baz-router/classes/PageRoute"
export { BasePage } from "./baz-router/classes/BasePage"
