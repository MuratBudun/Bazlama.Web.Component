import BazlamaWebComponent from "../component/BazlamaWebComponent"
import { TEventActionMethod } from "./TEventActionMethod"

export default class EventActionMap {
    public name: string
    public elQuery: string
    public eventName: keyof HTMLElementEventMap
    public actionMethod: TEventActionMethod

    constructor(
        name: string,
        elQuery: string,
        eventName: keyof HTMLElementEventMap,
        actionMethod: TEventActionMethod
    ) {
        this.name = name
        this.elQuery = elQuery
        this.eventName = eventName
        this.actionMethod = actionMethod
    }

    public CreateElementEvent(bazComponent: BazlamaWebComponent): void {
        const elements = bazComponent.root?.querySelectorAll(this.elQuery)
        if (elements) {
            elements.forEach(element => {
                element.addEventListener(this.eventName as string, (event: Event) => {
                    this.actionMethod(this.name, element as HTMLElement, this.eventName, event)
                })
            })
        }
    }
}
