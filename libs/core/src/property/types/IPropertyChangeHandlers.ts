import type TPropertyChangeHook from "./TPropertyChangeHandler";

export type IPropertyChangeHandlers = Record<string, TPropertyChangeHook[]>;
