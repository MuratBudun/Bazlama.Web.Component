import BazTimeline from "../baz-timeline";
import TimelineTrack, { TTrackFragment } from "../tracks/TimelineTrack";
import TimelineLayer from "./TimelineLayer";

export default class TimelineTrackLayer extends TimelineLayer {
    constructor(owner: BazTimeline, name: string, canvas: HTMLCanvasElement) {
        super(owner, name, canvas)
        this.addDrawStyle("track-primary-background", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-primary-fragment-primary", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-primary-fragment-secondary", "#d9d9d9", "#bbb")

        this.addDrawStyle("track-secondary-background", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-secondary-fragment-primary", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-secondary-fragment-secondary", "#d9d9d9", "#bbb")
        
        this.addDrawStyle("track-accent-background", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-accent-fragment-primary", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-accent-fragment-secondary", "#d9d9d9", "#bbb")

        this.addDrawStyle("track-info-background", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-info-fragment-primary", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-info-fragment-secondary", "#d9d9d9", "#bbb")

        this.addDrawStyle("track-success-background", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-success-fragment-primary", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-success-fragment-secondary", "#d9d9d9", "#bbb")

        this.addDrawStyle("track-warning-background", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-warning-fragment-primary", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-warning-fragment-secondary", "#d9d9d9", "#bbb")

        this.addDrawStyle("track-error-background", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-error-fragment-primary", "#d9d9d9", "#bbb")
        this.addDrawStyle("track-error-fragment-secondary", "#d9d9d9", "#bbb")
    }

    public drawFunction(): void {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        let startTopPx = this.Owner.Ruler.Computed.HeaderHeightPx + 1

        for (const trackName in this.Owner.TrackManager.Tracks) {
            const track = this.Owner.TrackManager.Tracks[trackName]
            this.drawTrack(startTopPx, track)

            startTopPx += track.HeightPx
        }
    }

    private drawTrack(startTopPx: number, track: TimelineTrack) {
        this.setContextStyle(`track-${track.ColorTheme}-background`)
        this.fillRect(0, startTopPx, this.CanvasWidthPx, track.HeightPx)        

        track.Fragments.forEach(fragment => {
            this.drawTrackFragment(track, startTopPx, fragment)
        })
    }

    private drawTrackFragment(track: TimelineTrack, startTopPx: number, fragment: TTrackFragment) {
        let startPx = this.VisibleArea.GetStartPxFromDateTime(fragment.startDateTime)
        let endPx = this.VisibleArea.GetStartPxFromDateTime(fragment.endDateTime)

        if (startPx >= this.CanvasWidthPx || endPx < 0) return
        if (startPx < 0 && endPx < 0) return
        if (startPx <0) startPx = 0

        let width = endPx - startPx
        if (startPx + width > this.CanvasWidthPx) {
            width = this.CanvasWidthPx - startPx
        }


        this.clearRect(startPx, startTopPx, width, track.HeightPx)
        this.setContextStyle(`track-${track.ColorTheme}-background`)
        this.fillRect(startPx, startTopPx, width, track.HeightPx)


        this.setContextStyle(`track-${track.ColorTheme}-fragment-${fragment.colorTheme}`)
        this.fillRect(startPx, startTopPx, width, track.HeightPx)
        //this.strokeRect(startPx, startTopPx, width, track.HeightPx)

        //console.log(`Draw Fragment: ${track.Name} ${this.context.fillStyle} ${this.context.strokeStyle} ${startPx} ${startTopPx} ${width} ${track.HeightPx}`)
    }
}