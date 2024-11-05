export type TVisibleTimeSegments = {
    startFragmentedTime: TFragmentedTime
    visibleHours: TVisibleHours
    endFragmentedTime: TFragmentedTime
}

export type TFragmentedTime = {
    enable: boolean
    startDateTime?: Date
    endDateTime?: Date
    startPx: number
    endPx: number
}

export type TVisibleHours = {
    count: number
    startDateTime?: Date
    endDateTime?: Date
    startPx: number
    endPx: number
}