import { TAsyncQueueTaskEventHandlers } from "./TAsyncQueueTaskEventHandlers"

export type TAsyncQueueTaskHandler = (
    controller: AbortController,
    payload?: any
) => Promise<any>

export interface IAsyncQueueTask {
    id?: string
    name?: string
    task: TAsyncQueueTaskHandler
    events?: TAsyncQueueTaskEventHandlers
    payload?: any
}