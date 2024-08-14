import BazlamaWebComponent from "../component/BazlamaWebComponent";
import { TEventActionDefine } from "../event-action/TEventActionDefine";

export default function EventAction(
    elQuery: string, 
    eventName: keyof HTMLElementEventMap) 
{
    return function (
        target: any, 
        propertyName: string) 
    { 
        if (!(target instanceof BazlamaWebComponent)) {
            console.error("Event Action Decorator Error: Target is not BazlamaWebComponent")
            return
        }
        const bazComponent = target as BazlamaWebComponent

        const eventActionDefine: TEventActionDefine = {
            name: propertyName,
            elQuery: elQuery,
            eventName: eventName,
            actionMethodName: propertyName
        }

        const constructor = bazComponent.getConstructor()
        constructor.EventActionDefines[propertyName] = eventActionDefine
    }
}