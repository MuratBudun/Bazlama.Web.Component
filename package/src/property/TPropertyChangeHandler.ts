/*
    Bazlama Web Component Project
    Change Event for Bazlama Web Component Property
    2024-7-21
    Version 1.0
    muratbudun@gmail.com
*/

import BazlamaWebComponent from "../component/BazlamaWebComponent"
import BazlamaProperty from "./BazlamaProperty"

type TPropertyChangeHandler<T> = (
    element: BazlamaWebComponent,
    value: T,
    property: BazlamaProperty<T>
) => void

export default TPropertyChangeHandler
