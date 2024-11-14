import BazTimeline from "../baz-timeline"
import TimelineHelper from "../classes/TimelineHelper"


export type TColorTheme = "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error"
export type TColorThemeFragment = "primary" | "secondary"

export type TTrackFragment = {
    startDateTime: Date
    endDateTime: Date
    startMs: number
    durationMs: number
    colorTheme: TColorTheme
}

export default class TimelineTrack {
    #owner: BazTimeline
    public get Owner() { return this.#owner }   
        
    #name: string = ""
    public get Name(): string { return this.#name }

    #colorTheme: string = "primary"
    public get ColorTheme(): string { return this.#colorTheme }
    public set ColorTheme(value: string) { 
        this.#colorTheme = value 
        this.Owner.LayerManager.postDrawMessage()
    }

    #heightRem = 2
    public get HeightRem(): number { return this.#heightRem }
    public set HeightRem(value: number) { 
        this.#heightRem = value 
        this.Owner.LayerManager.postDrawMessage()
    }
    public get HeightPx(): number {
        return TimelineHelper.RemToPx(this.#heightRem)
    }


    #fragments: TTrackFragment[] = []
    public get Fragments(): TTrackFragment[] { return this.#fragments }

    public constructor(owner: BazTimeline, name: string, colorTheme?:TColorTheme, fragments?: TTrackFragment[]) {
        if (owner == null) throw new Error("owner is null")
    
        this.#name = name
        this.#owner = owner
        this.#colorTheme = colorTheme || "primary"
        this.#fragments = fragments || []
    }
        

    public AddFragment(fragment: TTrackFragment) {
        this.#fragments.push(fragment)
    }

    public RemoveFragment(fragment: TTrackFragment) {
        const index = this.#fragments.indexOf(fragment)
        if (index >= 0) {
            this.#fragments.splice(index, 1)
        }
    }

    public ClearFragments() {
        this.#fragments = []
    }

    public static CreateFragmentFromDateTime(
        startDateTime: Date, endDateTime: Date, 
        colorTheme?: TColorThemeFragment): TTrackFragment {
        return {
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            startMs: startDateTime.getTime(),
            durationMs: endDateTime.getTime() - startDateTime.getTime(),
            colorTheme: colorTheme || "primary"
        }
    }

    public AddFragmentFromDateTime(
        startDateTime: Date, endDateTime: Date, 
        colorTheme?: TColorThemeFragment) {
        const fragment: TTrackFragment = {
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            startMs: startDateTime.getTime(),
            durationMs: endDateTime.getTime() - startDateTime.getTime(),
            colorTheme: colorTheme || "primary"
        }

        this.AddFragment(fragment)
    }
}