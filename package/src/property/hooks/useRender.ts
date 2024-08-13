import TPropertyChangeHook from "../TPropertyChangeHandler"

export default function useRender(): TPropertyChangeHook {
    return (bazComponent) => {
        bazComponent.render()
    }
}