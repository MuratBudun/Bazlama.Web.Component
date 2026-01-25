// Barrel export for all Bazlama UI components
// Usage: import "./baz-ui" to import all components at once
// Or: import "./baz-ui/baz-icon/baz-icon" for individual components

import "./baz-app/baz-app"
import "./baz-textbox/baz-textbox"
import "./baz-input/baz-input"
import "./baz-icon/baz-icon"
import "./baz-modal/baz-modal"
import "./baz-tab/baz-tab"
import "./baz-theme/baz-theme-switcher"

// Re-export classes for programmatic usage if needed
export { BazApp } from "./baz-app/baz-app"
export { default as PageRouter } from "./baz-router/classes/PageRouter"
export { default as PageRoute } from "./baz-router/classes/PageRoute"
export { BasePage } from "./baz-router/classes/BasePage"

// Export types
export type { INavigationItem, NavigationItemType } from "./baz-app/types"

// Export icon libraries for programmatic usage
export { iconCategories, allIcons, type IconCategory } from "./baz-icon/icon-libs"
