import TPropertyChangeHook from "../types/TPropertyChangeHandler"

export default function useRender(): TPropertyChangeHook {
    return (bazComponent) => {
        bazComponent.render()
    }
}
