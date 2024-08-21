import BazlamaWebComponent from "../component/BazlamaWebComponent";
import PropertyDefine from "../property/PropertyDefine";

export default function Attribute(attributeName: string, isObserved: boolean = false, 
    isFireRenderOnChanged: boolean = false, isFireEventOnChanged: boolean = false) {
    return function (target: any, propertyName: string) { 
        if (!(target instanceof BazlamaWebComponent)) {
            console.error(`Property Decorator Error: Target is not BazlamaWebComponent for ${propertyName}`)
            return
        }
        const bazComponent = target as BazlamaWebComponent
        const constructor = bazComponent.getConstructor()

        if (constructor.HasPropertyDefine(propertyName)) {
            constructor.PropertyDefines[propertyName].isAttribute = true
            constructor.PropertyDefines[propertyName].attributeName = attributeName
            constructor.PropertyDefines[propertyName].isAttributeObserved = isObserved
            constructor.PropertyDefines[propertyName].isFireRenderOnChanged = isFireRenderOnChanged
            constructor.PropertyDefines[propertyName].isFireEventOnChanged = isFireEventOnChanged
            constructor.PropertyDefines[propertyName].changeHooks = [
                ...constructor.PropertyDefines[propertyName].changeHooks]
            return
        }

        const prop = new PropertyDefine(propertyName, { 
            isAttribute: true, 
            attributeName: attributeName, 
            isAttributeObserved: isObserved,
            isFireRenderOnChanged: isFireRenderOnChanged,
            isFireEventOnChanged: isFireEventOnChanged})
    
        constructor.PropertyDefines[propertyName] = prop
    }
}