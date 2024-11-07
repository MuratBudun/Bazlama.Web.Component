import BazTimeline from "../baz-timeline"
import TimelineLayer from "./TimelineLayer"
import TimelineMainLayer from "./TimelineMainLayer"

export default class TimelineLayerManager {
    #owner: BazTimeline
    public get Owner() { return this.#owner }

    public mainLayer?: TimelineMainLayer

    #layers: Record<string, TimelineLayer> = {}
    public get Layers() { return this.#layers } 

    constructor(owner: BazTimeline, mainLayer?: TimelineMainLayer) {
        this.#owner = owner
        this.mainLayer = mainLayer
    }

    public setMainLayer(mainLayer: TimelineMainLayer) {
        this.mainLayer = mainLayer
    }

    public removeAllLayers() {
        this.#layers = {}
    }

    public addLayer(layer: TimelineLayer) {
        if (layer == null) {
            throw new Error("layer is null")
        }

        if (layer.Name == null || layer.Name == "") {
            throw new Error("layer name is null or empty")
        }

        if (this.Layers[layer.Name] != null) {
            throw new Error(`Layer with name ${layer.Name} already exists`)
        }
        this.Layers[layer.Name] = layer
    }

    public removeLayer(layer: TimelineLayer) {
        delete this.Layers[layer.Name]
    }

    public removeLayerByName(name: string) {
        delete this.Layers[name]
    }

    public getLayer(name: string): TimelineLayer {
        return this.Layers[name]
    }

    public existsLayer(name: string): boolean {
        return this.Layers[name] != null
    }

    public draw() {
        if (this.mainLayer != null) {
            this.mainLayer.drawFunction()
        }
        for (const layerName in this.Layers) {
            const layer = this.Layers[layerName]
            if (layer != null) {
                layer.drawFunction()
            }
        }
    }

    public drawLoop() {
        if (this.mainLayer != null && this.mainLayer.isNeedRedraw) {
            this.mainLayer.drawFunction()
        }
        for (const layerName in this.Layers) {
            const layer = this.Layers[layerName]
            if (layer != null && layer.isNeedRedraw) {
                layer.drawFunction()
            }
        }
    }

    public postDrawMessage() {
        if (this.mainLayer != null) {
            this.mainLayer.postDrawMessage()
        }
        for (const layerName in this.Layers) {
            const layer = this.Layers[layerName]
            if (layer != null) {
                layer.postDrawMessage()
            }
        }
    }

    public setCanvasSize(width: number, height: number) {
        if (this.mainLayer != null) {
            this.mainLayer.setSize(width, height)
        }

        for (const layerName in this.Layers) {
            const layer = this.Layers[layerName]
            if (layer != null) {
                layer.setSize(width, height)
            }
        }

        this.Owner.Ruler.VisibleArea.SetSize(width, height)
    }

    public computeDrawStyles() {
        if (this.mainLayer != null) {
            this.mainLayer.computeDrawStyles()
        }

        for (const layerName in this.Layers) {
            const layer = this.Layers[layerName]
            if (layer != null) {
                layer.computeDrawStyles()
            }
        }
    }
}