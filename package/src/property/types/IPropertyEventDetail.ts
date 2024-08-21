import BazlamaWebComponent from "../../component/BazlamaWebComponent"

interface IPropertyEventDetail {
    bazComponent: BazlamaWebComponent
    name: string
    value: any
    oldValue: any
}

export default IPropertyEventDetail