import { IAsyncQueueTask } from "./IAsyncQueueTask"

export interface IAsyncQueueRunningTask {
    processId: string
    task: IAsyncQueueTask
    timeout: number
    startTime: number
    endTime: number
    executionTime: number
    processTimeoutId: NodeJS.Timeout | null
    loadingMaskTimeoutId: NodeJS.Timeout | null
    abortController: AbortController
    failureMessage: string | null
    
    result: any
}