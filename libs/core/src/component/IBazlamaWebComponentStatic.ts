/*
    Bazlama Web Component Project
    Static Interface for BazlamaWebComponent class storage
    2024-8-9
    Version 1.0
    muratbudun@gmail.com
*/

import type { IEventActionDefines } from "../event-action/types/IEventActionDefines";
import type { IPropertyChangeHandlers } from "../property/types/IPropertyChangeHandlers";
import type { IPropertyDefines } from "../property/types/IPropertyDefines";

/**
 * Interface for static storage on BazlamaWebComponent constructor
 * Used to avoid (this as any) pattern for storing class-level metadata
 */
export interface IBazlamaWebComponentStatic {
  _isPropertyDefineInitialized?: boolean;
  _PropertyDefines?: IPropertyDefines;
  _EventActionDefines?: IEventActionDefines;
  _PropertyChangeHandlers?: IPropertyChangeHandlers;
}

/**
 * Type alias for BazlamaWebComponent constructor with static storage
 */
export type BazlamaWebComponentConstructor = (new (...args: unknown[]) => HTMLElement) &
  IBazlamaWebComponentStatic;
