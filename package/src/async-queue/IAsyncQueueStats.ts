/*
    Bazlama Web Component Project
    Bazlama Async Queue Stats Interface
    2024-8-12
    Version 1.0
    muratbudun@gmail.com
*/

export interface IAsyncQueueStats {
    timestamp: number
    startedTasks: number
    successTasks: number
    runningTasks: number
    totalTasks: number
    completedTasks: number
    failedTasks: number
    timedOutTasks: number
    canceledTasks: number
    minExecutionTime: number | null
    maxExecutionTime: number | null
    averageExecutionTime: number | null
}