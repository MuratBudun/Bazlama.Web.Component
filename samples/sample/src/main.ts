import "./baz-ui/baz-textbox/baz-textbox.ts"
import "./baz-ui/baz-icon/baz-icon.ts"
import "./baz-ui/baz-modal/baz-modal.ts"
import "./baz-ui/baz-router/baz-router-menu.ts"
import "./baz-ui/baz-router/baz-router-home-logo.ts"
import "./baz-ui/baz-router/baz-router-breadcrumb.ts"
import "./baz-ui/baz-theme/baz-theme.ts"
import "./baz-ui/baz-tab/baz-tab.ts"
import "./components/qmex-chat/qmex-chat.ts"

import "./baz-medaimtx/baz-timeline/baz-timeline.ts"
import TimelineTrack from "./baz-medaimtx/baz-timeline/tracks/TimelineTrack.ts"
import type BazTimeline from "./baz-medaimtx/baz-timeline/baz-timeline.ts"

import "./sample-components/baz-s01/baz-s01.ts"
import "./sample-components/baz-s02/baz-s02.ts"
import "./sample-components/baz-s03/baz-s03.ts"
import "./sample-components/baz-s04/baz-s04.ts"
import "./sample-components/baz-s05/baz-s05.ts"
import "./sample-components/baz-s06/baz-s06.ts"
import "./sample-components/baz-s07/baz-s07.ts"
import "./sample-components/baz-s08/baz-s08.ts"
import "./sample-components/baz-s09/baz-s09.ts"
import "./sample-components/baz-s10/baz-s10.ts"

import PageRouter from "./pages/pages.ts"

// Timeline demo helper functions
let demoTrackCounter = 5

window.addDemoTrack = (colorTheme: string) => {
    const timeline = document.querySelector('#demo-timeline') as BazTimeline
    if (!timeline) return
    
    const baseTime = new Date("2024-10-14T10:00:00")
    const startHour = 10 + Math.floor(Math.random() * 6)
    const duration = 1 + Math.floor(Math.random() * 3)
    
    const startTime = new Date(baseTime)
    startTime.setHours(startHour)
    
    const endTime = new Date(startTime)
    endTime.setHours(startHour + duration)
    
    const track = new TimelineTrack(
        timeline, 
        `Track ${demoTrackCounter++}`, 
        colorTheme as any,
        [TimelineTrack.CreateFragmentFromDateTime(startTime, endTime)]
    )
    
    timeline.TrackManager.AddTrack(track)
}

window.clearDemoTracks = () => {
    const timeline = document.querySelector('#demo-timeline') as BazTimeline
    if (!timeline) return
    
    const tracks = timeline.TrackManager.Tracks
    for (const trackName in tracks) {
        timeline.TrackManager.RemoveTrack(tracks[trackName])
    }
    demoTrackCounter = 1
}

// Declare global functions for TypeScript
declare global {
    interface Window {
        addDemoTrack: (colorTheme: string) => void
        clearDemoTracks: () => void
    }
}

PageRouter.initialize("#page-content")