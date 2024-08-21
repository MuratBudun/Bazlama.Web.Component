import BazlamaWebComponent from "../component/BazlamaWebComponent"

export default function FireEvent() {
    return function (target: any, propertyName: string) {
        if (!(target instanceof BazlamaWebComponent)) {
            console.error(`Property Decorator Error: Target is not BazlamaWebComponent for ${propertyName}`)
            return
        }

        const bazComponent = target as BazlamaWebComponent
        const constructor = bazComponent.getConstructor()

        if (constructor.HasPropertyDefine(propertyName)) {
            constructor.PropertyDefines[propertyName].isFireEventOnChanged = true
            return
        }

        console.error(`FireEvent Error: PropertyDefine not found for ${propertyName} in ${constructor.name}`)
    }
}