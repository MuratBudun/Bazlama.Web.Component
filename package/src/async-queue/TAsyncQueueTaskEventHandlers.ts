import BazlamaAsyncQueue from "./BazlamaAsyncQueue"
import { IAsyncQueueRunningTask } from "./IAsyncQueueRunningTask"

export type PartialRecord<K extends keyof any, T> = { [P in K]?: T }
export type TAsyncQueueTaskEventNames = "start" | "success" |  "complete" | "fail" | "timeout" | "cancel" | "loading" | "all"


export type TAsyncQueueTaskEventHandler = (eventName: TAsyncQueueTaskEventNames, runningTask: IAsyncQueueRunningTask) => Promise<void>
export type TAsyncQueueTaskEventHandlers = PartialRecord<TAsyncQueueTaskEventNames, TAsyncQueueTaskEventHandler>
export interface IAsyncQueueTaskEventListener {
    listenerId: string,
    listenerEventHandler: TAsyncQueueTaskEventHandler
}
export type TAsyncQueueEvent = (queue: BazlamaAsyncQueue) => Promise<void>