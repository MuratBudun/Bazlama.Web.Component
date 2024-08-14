import BazlamaWebComponent from "../component/BazlamaWebComponent"
import { TEventActionMethod } from "./TEventActionMethod"

export default class EventAction {
    public name: string
    public bazComponent: BazlamaWebComponent
    public elQuery: string
    public eventName: keyof HTMLElementEventMap
    public actionMethod: TEventActionMethod

    constructor(
        name: string,
        bazComponent: BazlamaWebComponent,
        elQuery: string,
        eventName: keyof HTMLElementEventMap,
        actionMethod: TEventActionMethod
    ) {
        this.name = name
        this.bazComponent = bazComponent
        this.elQuery = elQuery
        this.eventName = eventName
        this.actionMethod = actionMethod
    }

    public CreateElementEvent(): void {
        const element = this.bazComponent.root?.querySelector(this.elQuery)
        if (element) {
            element.addEventListener(this.eventName as string, (event: Event) => {
                this.actionMethod(
                    this.name, 
                    element as HTMLElement, 
                    this.eventName, 
                    event)
            })
        }
    }
}