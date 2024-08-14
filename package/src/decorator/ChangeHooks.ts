import BazlamaWebComponent from "../component/BazlamaWebComponent"
import TPropertyChangeHook from "../property/types/TPropertyChangeHandler"

export default function ChangeHooks(changeHooks: TPropertyChangeHook[]) {
    return function (target: any, propertyName: string) {
        if (!(target instanceof BazlamaWebComponent)) {
            console.error("Property Decorator Error: Target is not BazlamaWebComponent")
            return
        }

        const bazComponent = target as BazlamaWebComponent
        const constructor = bazComponent.getConstructor()

        if (constructor.HasPropertyDefine(propertyName)) {
            constructor.PropertyDefines[propertyName].changeHooks = [
                ...constructor.PropertyDefines[propertyName].changeHooks,
                ...(changeHooks || []),
            ]

            return
        }

        console.error("ChangeHooks Error: PropertyDefine not found for", propertyName)
    }
}
