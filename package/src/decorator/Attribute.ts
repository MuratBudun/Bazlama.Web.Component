import BazlamaWebComponent from "../component/BazlamaWebComponent";
import PropertyDefine from "../property/PropertyDefine";

export default function Attribute(attributeName: string, isObserved: boolean = false) {
    return function (target: any, propertyName: string) { 
        if (!(target instanceof BazlamaWebComponent)) {
            console.error("Property Decorator Error: Target is not BazlamaWebComponent")
            return
        }
        const bazComponent = target as BazlamaWebComponent
        const constructor = bazComponent.getConstructor()
        //const changeHooks = constructor.CreatePropertyHooks()[propertyName]

        if (constructor.HasPropertyDefine(propertyName)) {
            constructor.PropertyDefines[propertyName].isAttribute = true
            constructor.PropertyDefines[propertyName].attributeName = attributeName
            constructor.PropertyDefines[propertyName].isAttributeObserved = isObserved
            constructor.PropertyDefines[propertyName].changeHooks = [
                ...constructor.PropertyDefines[propertyName].changeHooks]
                //...changeHooks]
            return
        }

        const prop = new PropertyDefine(propertyName, { 
            isAttribute: true, 
            attributeName: attributeName, 
            isAttributeObserved: isObserved })
        //prop.changeHooks = [...changeHooks]
    
        constructor.PropertyDefines[propertyName] = prop
    }
}