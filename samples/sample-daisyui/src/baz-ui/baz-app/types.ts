/**
 * Navigation item type for menu rendering
 */
export type NavigationItemType = 'item' | 'group' | 'divider'

/**
 * Navigation item configuration
 * Supports single items, groups, dividers, and nested tree structure
 */
export interface INavigationItem {
    /** Type of navigation element */
    type: NavigationItemType
    
    /** Display title */
    title?: string
    
    /** Route path (for items only) */
    path?: string
    
    /** Icon name from baz-icon library (for items only) */
    icon?: string
    
    /** Child items for groups or nested tree structure */
    items?: INavigationItem[]
    
    /** Optional badge text (for items only) */
    badge?: string
    
    /** Badge color class (for items with badge) */
    badgeClass?: string
}
