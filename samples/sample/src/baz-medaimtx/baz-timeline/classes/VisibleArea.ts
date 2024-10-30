import TimelineRuler from "./TimelineRuler"

export default class VisibleArea {
    #owner: TimelineRuler
    public get Owner() { return this.#owner }


    #widthPx: number = 0
    public get widthPx() { return this.#widthPx }

    #heightPx: number = 0
    public get heightPx() { return this.#heightPx }

    constructor(owner: TimelineRuler) {
        this.#owner = owner
    } 
    
    public SetSize(widthPx: number, heightPx: number) {
        this.#widthPx = widthPx
        this.#heightPx = heightPx
    }
    
}