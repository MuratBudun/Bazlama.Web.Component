export type TEventActionDefine = {
    name: string
    elQuery: string
    eventName: keyof HTMLElementEventMap
    actionMethodName: string
}
