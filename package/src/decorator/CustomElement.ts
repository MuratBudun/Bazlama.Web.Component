export default function CustomElement(tagName: string) {
    return function (target: any) {
        customElements.define(tagName, target)
    }
}