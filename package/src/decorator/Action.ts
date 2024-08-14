import EventAction, { TEventActionMethod } from "../event-action/EventAction";
import BazlamaWebComponent from "../component/BazlamaWebComponent";

export default function Action(
    elQuery: string, 
    eventName: keyof HTMLElementEventMap) 
{
    return function (
        target: any, 
        propertyName: string) 
    { 
        if (!(target instanceof BazlamaWebComponent)) {
            console.error("Property Decorator Error: Target is not BazlamaWebComponent")
            return
        }
        const bazComponent = target as BazlamaWebComponent

        const descriptor = Object.getOwnPropertyDescriptor(bazComponent, propertyName);

        //descriptor.value?.call()
        console.log("Action Decorator elQuery: ", elQuery)
        console.log("Action Decorator eventName: ", eventName)
        console.log("Action Decorator bazComponent: ", bazComponent)
        console.log("Action Decorator target: ", target)
        console.log("Action Decorator propertyName: ", propertyName)
        console.log("Action Decorator descriptorrrrrrrr : ", descriptor)
        //const bazComponent = target as BazlamaWebComponent
        //const actionDefine = new ActionDefine(bazComponent, elQuery, eventName, originalMethod)
        //bazComponent.actionList.push(actionDefine)
    }
}