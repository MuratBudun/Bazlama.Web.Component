import BazlamaWebComponent from "../component/BazlamaWebComponent";
import IPropertyDefineOption from "../property/IPropertyDefineOption";
import PropertyDefine from "../property/PropertyDefine";

export default function Property(options: IPropertyDefineOption = {}) {
    return function (target: any, propertyName: string) { 
        if (!(target instanceof BazlamaWebComponent)) {
            console.error("Property Decorator Error: Target is not BazlamaWebComponent")
            return
        }

        const bazComponent = target as BazlamaWebComponent
        const constructor = bazComponent.getConstructor()
        //const changeHooks = constructor.CreatePropertyHooks()[propertyName]

        if (constructor.HasPropertyDefine(propertyName)) {
            constructor.PropertyDefines[propertyName].isAttribute = options.isAttribute || false
            constructor.PropertyDefines[propertyName].attributeName = options.attributeName || ""
            constructor.PropertyDefines[propertyName].isAttributeObserved = options.isAttributeObserved || false
            constructor.PropertyDefines[propertyName].changeHooks = [
                ...constructor.PropertyDefines[propertyName].changeHooks, 
                ...options.changeHooks || []]
                //...changeHooks]

            return
        }

        const prop = new PropertyDefine(propertyName, options)
        // prop.changeHooks = [
        //     ...prop.changeHooks, 
        //     ...changeHooks]

        constructor.PropertyDefines[propertyName] = prop
    }
}