import TPropertyChangeHook from "./TPropertyChangeHandler";

export interface IPropertyChangeHandlers {
    [key: string]: TPropertyChangeHook[]
}