import BazTimeline from "../baz-timeline";
import TimelineTrack, { TrackFragment } from "../classes/TimelineTrack";
import TimelineLayer from "./TimelineLayer";

export default class TimelineTrackLayer extends TimelineLayer {


    constructor(owner: BazTimeline, name: string, canvas: HTMLCanvasElement) {
        super(owner, name, canvas)
        this.addDrawStyle("track-background", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-background-outside", "#d9d9d9", "#bbb")
    }

    public drawFunction(): void {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

        let index = 0
        this.Owner.Tracks.forEach(track => {
            this.drawTrack(index, track)
            index++
        })
    }

    private drawTrack(index: number, track: TimelineTrack) {
        track.Fragments.forEach(fragment => {
            this.drawTrackFragment(index, fragment)
        })
    }

    private drawTrackFragment(index: number, fragment: TrackFragment) {
        const startPx = this.VisibleArea.GetStartPxFromDateTime(fragment.startDateTime)
        const endPx = this.VisibleArea.GetStartPxFromDateTime(fragment.endDateTime)

        if (startPx >= this.CanvasWidthPx || endPx < 0) return

        let width = endPx - startPx
        if (startPx + width > this.CanvasWidthPx) {
            width = this.CanvasWidthPx - startPx
        }

        const margin = 100;
        const top = margin + index * 40
        const height = 30

        this.setContextStyle("track-background")
        this.context.fillRect(startPx, top, width, height)
        this.context.strokeRect(startPx, top, width, height)

    }
}