import EventActionMap from "./EventActionMap"
import { TEventActionMethod } from "./TEventActionMethod"

export default class EventActionBuilder {
    private name: string
    private elQuery: string = ""
    private eventName: keyof HTMLElementEventMap = "click"
    public actionMethod: TEventActionMethod = () => { }

    constructor(name: string, elQuery?: string, eventName?: keyof HTMLElementEventMap) {
        this.name = name
        this.elQuery = elQuery || ""
        this.eventName = eventName || "click"
        return this
    }

    public setElQuery(elQuery: string): EventActionBuilder {
        this.elQuery = elQuery
        return this
    }

    public setEventName(eventName: keyof HTMLElementEventMap): EventActionBuilder {
        this.eventName = eventName
        return this
    }

    public setActionMethod(actionMethod: TEventActionMethod): EventActionBuilder {
        this.actionMethod = actionMethod
        return this
    }

    public build(): EventActionMap {
        return new EventActionMap(this.name, this.elQuery, this.eventName, this.actionMethod)
    }
}