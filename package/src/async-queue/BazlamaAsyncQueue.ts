import BazGeneral from "../helper/BazGeneral";
import { AsyncQueueTaskEventsManager } from "./AsyncQueueTaskEventsManager";
import { IAsyncQueueRunningTask } from "./IAsyncQueueRunningTask";
import { IAsyncQueueStats } from "./IAsyncQueueStats";
import { IAsyncQueueTask, TAsyncQueueTaskHandler } from "./IAsyncQueueTask";
import { TAsyncQueueEvent } from "./TAsyncQueueTaskEventHandlers";

export default class BazlamaAsyncQueue {
    //#region [Private Members]
    private _queue: { task: IAsyncQueueTask; timeout: number }[] = []
    private _runningTasks: IAsyncQueueRunningTask[] = []
    private _isProcessing = false
    private _isRunning = false
    public get isRunning() {
        return this._isRunning
    }
    private stats: IAsyncQueueStats = {
        timestamp: 0,
        startedTasks: 0,
        successTasks: 0,
        runningTasks: 0,
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        timedOutTasks: 0,
        canceledTasks: 0,
        minExecutionTime: null,
        maxExecutionTime: null,
        averageExecutionTime: null,
    }
    //#endregion

    //#region [Public Members]
    private _defaultTimeout: number = 60 * 1000 * 3 // 3 minutes
    public get defaultTimeout() {
        return this._defaultTimeout
    }
    public set defaultTimeout(value: number) {
        this._defaultTimeout = value
    }

    private _loadingMaskDelay: number = 500 // 0.5 seconds
    public get loadingMaskDelay() {
        return this._loadingMaskDelay
    }
    public set loadingMaskDelay(value: number) {
        this._loadingMaskDelay = value
    }

    private _taskEventsManager: AsyncQueueTaskEventsManager = new AsyncQueueTaskEventsManager(this)
    public get taskEventsManager(): AsyncQueueTaskEventsManager {
        return this._taskEventsManager
    }    
    //#endregion

    constructor(defaultTimeout: number = 5000, loadingMaskDelay: number = 500) {
        this._defaultTimeout = defaultTimeout
        this._loadingMaskDelay = loadingMaskDelay
    }

    //#region Events ...
    private _onRunning: TAsyncQueueEvent[] = []
    public onRunning(listener: TAsyncQueueEvent) {
        this._onRunning.push(listener)
    }
    private async triggerRunning() {
        this._isRunning = true
        for (const listener of this._onRunning) {
            listener(this)
        }
    }

    private _onIdle: TAsyncQueueEvent[] = []
    public onIdle(listener: TAsyncQueueEvent) {
        this._onIdle.push(listener)
    }
    private async triggerIdle() {
        this._isRunning = false
        for (const listener of this._onIdle) {
            listener(this)
        }
    }

    public async triggerStart(runningTask: IAsyncQueueRunningTask) {
        runningTask.startTime = Date.now()
        this.stats.startedTasks++
        this.taskEventsManager.fireEvent("start", runningTask)
    }

    private async triggerSuccess(runningTask: IAsyncQueueRunningTask) {
        this.setFinishedRunningTask(runningTask)
        this.stats.successTasks++

        this.taskEventsManager.fireEvent("success", runningTask)

        this.removeRunningTaskByProcessId(runningTask.processId)
        this.updateStats()
    } 
    
    private async triggerComplete(runningTask: IAsyncQueueRunningTask) {
        this.setFinishedRunningTask(runningTask)
        this.stats.completedTasks++

        this.taskEventsManager.fireEvent("complete", runningTask)

        this.removeRunningTaskByProcessId(runningTask.processId)
        this.updateStats()
    }

    private async triggerFail(runningTask: IAsyncQueueRunningTask, failureMessage: string) {
        runningTask.failureMessage = failureMessage
        this.setFinishedRunningTask(runningTask)
        this.stats.failedTasks++

        this.taskEventsManager.fireEvent("fail", runningTask)

        this.removeRunningTaskByProcessId(runningTask.processId)
        this.updateStats()
    }

    private async triggerCancel(runningTask: IAsyncQueueRunningTask)
    {
        this.setFinishedRunningTask(runningTask)
        this.stats.canceledTasks++

        this.taskEventsManager.fireEvent("cancel", runningTask)

        this.removeRunningTaskByProcessId(runningTask.processId)
        this.updateStats()
    }

    private async triggerTimeout(runningTask: IAsyncQueueRunningTask)
    {
        this.setFinishedRunningTask(runningTask)
        this.stats.timedOutTasks++

        this.taskEventsManager.fireEvent("timeout", runningTask)

        this.removeRunningTaskByProcessId(runningTask.processId)
        this.updateStats()
    }

    private async triggerLoadingMask(runningTask: IAsyncQueueRunningTask)
    {
        this.taskEventsManager.fireEvent("loading", runningTask)
    }

    private updateExecutionTime(executionTime: number) {
        if (
            this.stats.minExecutionTime === null ||
            executionTime < this.stats.minExecutionTime
        ) {
            this.stats.minExecutionTime = executionTime
        }

        if (
            this.stats.maxExecutionTime === null ||
            executionTime > this.stats.maxExecutionTime
        ) {
            this.stats.maxExecutionTime = executionTime
        }

        if (this.stats.completedTasks > 0) {
            this.stats.averageExecutionTime =
                (this.stats.averageExecutionTime || 0) +
                (executionTime - (this.stats.averageExecutionTime || 0)) /
                    this.stats.completedTasks
        }
    }

    private setFinishedRunningTask(runningTask: IAsyncQueueRunningTask) {
        if (!runningTask) return
        if (runningTask.processTimeoutId) {
            clearTimeout(runningTask.processTimeoutId)
        }
        if (runningTask.loadingMaskTimeoutId) {
            clearTimeout(runningTask.loadingMaskTimeoutId)
        }
        runningTask.endTime = Date.now()
        runningTask.executionTime = runningTask.endTime - runningTask.startTime
        this.updateExecutionTime(runningTask.executionTime)
    }

    private updateStats() {
        if (this.stats.totalTasks === this.stats.completedTasks) {
            this.triggerIdle()
        }   
    }
    //#endregion

    //#region [Public Methods]
    public enqueue(
        task: IAsyncQueueTask | TAsyncQueueTaskHandler,
        timeout?: number
    ) {
        if (!task)  return

        if (typeof task === "function") {
            task = { task }
        }
        this._queue.push({ task, timeout: timeout || this.defaultTimeout })
        this.stats.totalTasks++
        if (!this._isProcessing) {
            this.processQueue()
        }
    }

    public enqueueAll(tasks: IAsyncQueueTask[], timeout?: number) {
        for (const task of tasks) {
            this.enqueue(task, timeout)
        }
    }

    public getQueueLength() {
        return this._queue.length
    }


    public getRunningTask(processId: string): IAsyncQueueRunningTask | undefined {
        return this._runningTasks.find((task) => {
            return task.processId === processId
        })
    }
    public getRunningTaskByTaskId(id: string): IAsyncQueueRunningTask | undefined {
        return this._runningTasks.find((task) => {
            return task.task.id === id
        })
    }

    public getRunningTasks(): IAsyncQueueRunningTask[] {
        return this._runningTasks
    }
    
    public cancelRunningTask(runningTask: IAsyncQueueRunningTask) {
        runningTask.abortController.abort("canceled")
    }

    public cancelRunningTaskByTaskId(id: string) {
        const runningTask = this.getRunningTask(id)
        if (runningTask) {
            this.cancelRunningTask(runningTask)            
        }
    }

    public cancelRunningTaskByProcessId(processId: string) {
        const runningTask = this.getRunningTask(processId)
        if (runningTask) {
            this.cancelRunningTask(runningTask)
        }
    }

    public cancelAllRunningTasks() {
        for (const runningTask of this._runningTasks) {
            this.cancelRunningTask(runningTask)
        }
    }

    
    public getStatisticsWithTimestamp(): IAsyncQueueStats {
        return { ...this.stats, timestamp: Date.now() }
    }
    //#endregion

    //#region [Private Methods]

    private createRunningTask(task: IAsyncQueueTask, timeout: number): IAsyncQueueRunningTask {
        const newRunningTask: IAsyncQueueRunningTask = {
            processId: BazGeneral.createId("NAQ"),
            task,
            timeout,
            startTime: Date.now(),
            endTime: 0,
            executionTime: 0,
            processTimeoutId: null,
            loadingMaskTimeoutId: null,
            abortController: new AbortController(),
            failureMessage: null,
            result: null,
        }
        newRunningTask.processTimeoutId = setTimeout(() => {
            newRunningTask.abortController.abort("timeout") 
        }, timeout)

        newRunningTask.loadingMaskTimeoutId = setTimeout(() => {
            this.triggerLoadingMask(newRunningTask)
        }, this.loadingMaskDelay)

        this._runningTasks.push(newRunningTask)
        return newRunningTask
    }
 
    private removeRunningTaskByTaskId(id: string) {
        const index = this._runningTasks.findIndex((task) => task.task.id === id);
        if (index !== -1) {
            this._runningTasks.splice(index, 1);
        }
    }

    private removeRunningTaskByProcessId(processId: string) {
        const index = this._runningTasks.findIndex((task) => task.processId === processId);
        if (index !== -1) {
            this._runningTasks.splice(index, 1);
        }
    }

    private removeAllRunningTasks() {
        this._runningTasks = []
    }

    private async processQueue() {
        if (this._queue.length === 0) {
            this._isProcessing = false
            return
        }

        this._isProcessing = true
        if (!this.isRunning) {
            this.triggerRunning()
        }

        const { task, timeout } = this._queue.shift()!
        const runningTask = this.createRunningTask(task, timeout)

        task.task(runningTask.abortController, task.payload)
            .then((result) => {
                runningTask.result = result
                this.triggerSuccess(runningTask)
            })
            .catch((error: any) => {
                if (error.name === "AbortError") {
                    if (runningTask.abortController.signal.reason == "timeout") {
                        this.triggerTimeout(runningTask)
                        return
                    }
                    this.triggerCancel(runningTask)
                    return
                }
                this.triggerFail(runningTask, error)
                
            })
            .finally(() => {
                this.triggerComplete(runningTask)
            })   

        this.triggerStart(runningTask)
        this.processQueue()
    }
    //#endregion    
}
