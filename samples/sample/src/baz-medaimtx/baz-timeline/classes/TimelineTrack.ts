export type TrackFragment = {
    startDateTime: Date
    endDateTime: Date
    startMs: number
    durationMs: number
}

export default class TimelineTrack {
    #name: string = ""
    public get Name(): string { return this.#name }

    #fragments: TrackFragment[] = []
    public get Fragments(): TrackFragment[] { return this.#fragments }

    public constructor(name: string, fragments?: TrackFragment[]) {
        this.#name = name
        if (fragments != null) {
            this.#fragments = fragments
        }
    }

    public AddFragment(fragment: TrackFragment) {
        this.#fragments.push(fragment)
    }

    public RemoveFragment(fragment: TrackFragment) {
        const index = this.#fragments.indexOf(fragment)
        if (index >= 0) {
            this.#fragments.splice(index, 1)
        }
    }

    public ClearFragments() {
        this.#fragments = []
    }

    public static CreateFragmentFromDateTime(startDateTime: Date, endDateTime: Date): TrackFragment {
        return {
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            startMs: startDateTime.getTime(),
            durationMs: endDateTime.getTime() - startDateTime.getTime()
        }
    }

    public AddFragmentFromDateTime(startDateTime: Date, endDateTime: Date) {
        const fragment: TrackFragment = {
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            startMs: startDateTime.getTime(),
            durationMs: endDateTime.getTime() - startDateTime.getTime()
        }

        this.AddFragment(fragment)
    }

    public RemoveFragmentFromDateTime(startDateTime: Date, endDateTime: Date) {
        const fragment: TrackFragment = {
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            startMs: startDateTime.getTime(),
            durationMs: endDateTime.getTime() - startDateTime.getTime()
        }

        this.RemoveFragment(fragment)
    }

    public ClearFragmentsFromDateTime(startDateTime: Date, endDateTime: Date) {
        const fragments = this.#fragments.filter(f => {
            return f.startDateTime >= startDateTime && f.endDateTime <= endDateTime
        })

        fragments.forEach(f => {
            this.RemoveFragment(f)
        })
    }
}