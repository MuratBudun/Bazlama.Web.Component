import BazTimeline from "../baz-timeline"
import TimelineTrackLayer from "../layers/TimelineTrackLayer"
import TimelineTrack from "./TimelineTrack"

export default class TimelineTrackManager {
    #owner: BazTimeline
    public get Owner() { return this.#owner }

    //public trackLayer?: TimelineTrackLayer

    #tracks: Record<string, TimelineTrack> = {}
    public get Tracks() { return this.#tracks } 

    constructor(owner: BazTimeline) { //, trackLayer?: TimelineTrackLayer) {
        this.#owner = owner
        //this.trackLayer = trackLayer
    }

    /*
    public setTrackLayer(trackLayer: TimelineTrackLayer) {
        this.trackLayer = trackLayer
        this.trackLayer?.postDrawMessage()
    }
    */
    public AddTrack(track: TimelineTrack) {
        this.#tracks[track.Name] = track
        this.Owner.LayerManager.postDrawMessage()
    }

    public RemoveTrack(track: TimelineTrack) {
        delete this.#tracks[track.Name]
        this.Owner.LayerManager.postDrawMessage()
    }
}