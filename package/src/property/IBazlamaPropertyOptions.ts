/*
    Bazlama Web Component Project
    Property Option Class for Bazlama
    2024-7-21
    Version 1.0
    muratbudun@gmail.com
*/

import TPropertyChangeHandler from "./TPropertyChangeHandler"

interface IBazlamaPropertyOptions<T> {
    defaultValue?: T
    isAttribute?: boolean
    isAttributeObserved?: boolean
    attributeName?: string
    changeHooks?: TPropertyChangeHandler<T>[]
}

export default IBazlamaPropertyOptions
